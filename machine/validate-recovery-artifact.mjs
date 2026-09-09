#!/usr/bin/env node

import { readFile, lstat } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

import { parseReleaseMarker } from './check-site-health.mjs';

const TAR_BLOCK_BYTES = 512;
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_ENTRY_BYTES = 25 * 1024 * 1024;
const MAX_ENTRIES = 10_000;
const REQUIRED_FILES = [
  'index.html',
  '404.html',
  'deploy-marker.txt',
  'robots.txt',
  'sitemap.xml',
  'ads.txt',
  'llms.txt',
  'api/v1/meta.json',
];

function readString(block, start, length) {
  const field = block.subarray(start, start + length);
  const end = field.indexOf(0);
  return field.subarray(0, end === -1 ? field.length : end).toString('utf8');
}

function readOctal(block, start, length, label) {
  const value = readString(block, start, length).trim();
  if (!/^[0-7]+$/.test(value)) throw new Error(`${label} is not a supported octal tar field`);
  const parsed = Number.parseInt(value, 8);
  if (!Number.isSafeInteger(parsed) || parsed < 0) throw new Error(`${label} is outside the safe range`);
  return parsed;
}

function isZeroBlock(block) {
  return block.every((value) => value === 0);
}

function requireHeaderChecksum(block, name) {
  const expected = readOctal(block, 148, 8, `${name || 'tar entry'} checksum`);
  let actual = 0;
  for (let index = 0; index < TAR_BLOCK_BYTES; index += 1) {
    actual += index >= 148 && index < 156 ? 0x20 : block[index];
  }
  if (actual !== expected) throw new Error(`${name || 'tar entry'} has an invalid tar checksum`);
}

function safeEntryName(block) {
  const name = readString(block, 0, 100);
  const prefix = readString(block, 345, 155);
  const original = prefix ? `${prefix}/${name}` : name;
  if (!original || original.includes('\\') || original.startsWith('/')) {
    throw new Error(`Recovery archive contains an unsafe path: ${JSON.stringify(original)}`);
  }
  let normalized = original;
  while (normalized.startsWith('./')) normalized = normalized.slice(2);
  const segments = normalized.split('/').filter(Boolean);
  if (segments.includes('..') || segments.some((segment) => segment.startsWith('.'))) {
    throw new Error(`Recovery archive contains an unsafe path: ${JSON.stringify(original)}`);
  }
  return normalized.replace(/\/$/, '');
}

function normalizeExpectedIdentity({ expectedSourceSha, expectedRunId, expectedRunAttempt }) {
  const sourceSha = String(expectedSourceSha || '').trim();
  const runId = String(expectedRunId || '').trim();
  const runAttempt = String(expectedRunAttempt || '').trim();
  if (!/^[0-9a-f]{40}$/.test(sourceSha)) throw new Error('EXPECTED_SOURCE_SHA must be a full lowercase commit SHA');
  if (!/^[1-9][0-9]*$/.test(runId)) throw new Error('EXPECTED_RUN_ID must be a positive integer');
  if (!/^[1-9][0-9]*$/.test(runAttempt)) throw new Error('EXPECTED_RUN_ATTEMPT must be a positive integer');
  return { sourceSha, runId, runAttempt: Number(runAttempt) };
}

export async function validateRecoveryArtifact(archivePath, expectedIdentity) {
  const identity = normalizeExpectedIdentity(expectedIdentity);
  const stats = await lstat(archivePath);
  if (!stats.isFile() || stats.isSymbolicLink()) throw new Error('Recovery artifact.tar must be a regular file');
  if (stats.size <= TAR_BLOCK_BYTES * 2 || stats.size > MAX_ARCHIVE_BYTES) {
    throw new Error(`Recovery artifact.tar has an unsafe size: ${stats.size} bytes`);
  }
  if (stats.size % TAR_BLOCK_BYTES !== 0) throw new Error('Recovery artifact.tar is not block aligned');

  const archive = await readFile(archivePath);
  const entries = new Map();
  let offset = 0;
  let sawTrailer = false;

  while (offset + TAR_BLOCK_BYTES <= archive.length) {
    const header = archive.subarray(offset, offset + TAR_BLOCK_BYTES);
    if (isZeroBlock(header)) {
      const next = archive.subarray(offset + TAR_BLOCK_BYTES, offset + (TAR_BLOCK_BYTES * 2));
      if (next.length !== TAR_BLOCK_BYTES || !isZeroBlock(next)) {
        throw new Error('Recovery artifact.tar has an incomplete trailer');
      }
      if (!archive.subarray(offset).every((value) => value === 0)) {
        throw new Error('Recovery artifact.tar contains data after its trailer');
      }
      sawTrailer = true;
      break;
    }

    const originalName = readString(header, 0, 100);
    requireHeaderChecksum(header, originalName);
    const name = safeEntryName(header);
    const type = String.fromCharCode(header[156] || 0);
    if (type !== '\0' && type !== '0' && type !== '5') {
      throw new Error(`${name || originalName} uses forbidden tar entry type ${JSON.stringify(type)}`);
    }
    const size = readOctal(header, 124, 12, `${name || originalName} size`);
    if (size > MAX_ENTRY_BYTES) throw new Error(`${name || originalName} is unexpectedly large`);
    if (type === '5' && size !== 0) throw new Error(`${name || originalName} is a directory with data`);

    const dataStart = offset + TAR_BLOCK_BYTES;
    const dataEnd = dataStart + size;
    if (dataEnd > archive.length) throw new Error(`${name || originalName} extends beyond the archive`);
    if (name) {
      if (entries.has(name)) throw new Error(`Recovery archive contains duplicate entry ${name}`);
      entries.set(name, {
        type,
        data: type === '5' ? null : archive.subarray(dataStart, dataEnd),
      });
      if (entries.size > MAX_ENTRIES) throw new Error('Recovery archive contains too many entries');
    }
    offset = dataStart + (Math.ceil(size / TAR_BLOCK_BYTES) * TAR_BLOCK_BYTES);
  }

  if (!sawTrailer) throw new Error('Recovery artifact.tar is missing its end trailer');
  for (const required of REQUIRED_FILES) {
    const entry = entries.get(required);
    if (!entry || entry.type === '5') throw new Error(`Recovery archive is missing required file ${required}`);
  }

  const markerText = entries.get('deploy-marker.txt').data.toString('utf8');
  const release = parseReleaseMarker(markerText);
  if (release.sourceSha !== identity.sourceSha) {
    throw new Error(`Recovery marker source SHA ${release.sourceSha} does not match ${identity.sourceSha}`);
  }
  if (release.runId !== identity.runId || release.runAttempt !== identity.runAttempt) {
    throw new Error(
      `Recovery marker run ${release.runId}-${release.runAttempt} does not match `
      + `${identity.runId}-${identity.runAttempt}`,
    );
  }

  return {
    ...release,
    archiveBytes: archive.length,
    entryCount: entries.size,
  };
}

async function main() {
  const archivePath = process.argv[2];
  if (!archivePath || process.argv.length !== 3) {
    throw new Error('Usage: node machine/validate-recovery-artifact.mjs <artifact.tar>');
  }
  const result = await validateRecoveryArtifact(archivePath, {
    expectedSourceSha: process.env.EXPECTED_SOURCE_SHA,
    expectedRunId: process.env.EXPECTED_RUN_ID,
    expectedRunAttempt: process.env.EXPECTED_RUN_ATTEMPT,
  });
  process.stdout.write(`${result.marker}\n`);
  process.stderr.write(
    `Recovery artifact OK: ${result.sourceSha}, ${result.entryCount} entries, ${result.archiveBytes} bytes.\n`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(`Recovery artifact validation FAILED: ${error.message}`);
    process.exitCode = 1;
  });
}
