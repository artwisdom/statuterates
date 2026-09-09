import assert from 'node:assert/strict';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import { validateRecoveryArtifact } from './validate-recovery-artifact.mjs';

const SOURCE_SHA = '0123456789abcdef0123456789abcdef01234567';
const RUN_ID = '123456789';
const RUN_ATTEMPT = '2';
const MARKER = `statuterates:${SOURCE_SHA}:${RUN_ID}-${RUN_ATTEMPT}\n`;
const REQUIRED = {
  'index.html': '<!doctype html><title>StatuteRates</title>',
  '404.html': '<!doctype html><title>Not found</title>',
  'deploy-marker.txt': MARKER,
  'robots.txt': 'User-agent: *\nAllow: /\n',
  'sitemap.xml': '<?xml version="1.0"?><urlset></urlset>',
  'ads.txt': 'google.com, pub-1234567890, DIRECT, f08c47fec0942fa0\n',
  'llms.txt': 'StatuteRates\n',
  'api/v1/meta.json': '{"api_version":"v1"}\n',
};

function writeField(header, start, length, value) {
  const bytes = Buffer.from(value);
  if (bytes.length > length) throw new Error(`Fixture field is too long: ${value}`);
  bytes.copy(header, start);
}

function tarHeader(name, body, type = '0') {
  const header = Buffer.alloc(512);
  writeField(header, 0, 100, name);
  writeField(header, 100, 8, '0000644\0');
  writeField(header, 108, 8, '0000000\0');
  writeField(header, 116, 8, '0000000\0');
  writeField(header, 124, 12, `${body.length.toString(8).padStart(11, '0')}\0`);
  writeField(header, 136, 12, '00000000000\0');
  header.fill(0x20, 148, 156);
  writeField(header, 156, 1, type);
  writeField(header, 257, 6, 'ustar\0');
  writeField(header, 263, 2, '00');
  const checksum = header.reduce((sum, value) => sum + value, 0);
  writeField(header, 148, 8, `${checksum.toString(8).padStart(6, '0')}\0 `);
  return header;
}

function makeTar(entries) {
  const blocks = [];
  for (const [name, entry] of Object.entries(entries)) {
    const descriptor = typeof entry === 'string' ? { body: entry, type: '0' } : entry;
    const body = Buffer.from(descriptor.body || '');
    blocks.push(tarHeader(name, body, descriptor.type || '0'), body);
    const padding = (512 - (body.length % 512)) % 512;
    if (padding) blocks.push(Buffer.alloc(padding));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

async function withArchive(entries, callback) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'statuterates-recovery-'));
  const archivePath = path.join(directory, 'artifact.tar');
  await writeFile(archivePath, makeTar(entries));
  try {
    return await callback(archivePath);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
}

function expected(overrides = {}) {
  return {
    expectedSourceSha: SOURCE_SHA,
    expectedRunId: RUN_ID,
    expectedRunAttempt: RUN_ATTEMPT,
    ...overrides,
  };
}

test('accepts a safe Pages archive whose structured marker matches the selected run', async () => {
  await withArchive(REQUIRED, async (archivePath) => {
    const result = await validateRecoveryArtifact(archivePath, expected());
    assert.equal(result.marker, MARKER.trim());
    assert.equal(result.sourceSha, SOURCE_SHA);
    assert.equal(result.runId, RUN_ID);
    assert.equal(result.runAttempt, 2);
    assert.equal(result.entryCount, Object.keys(REQUIRED).length);
  });
});

test('rejects an artifact whose marker names a different source commit or run', async () => {
  await withArchive(REQUIRED, async (archivePath) => {
    await assert.rejects(
      validateRecoveryArtifact(archivePath, expected({
        expectedSourceSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      })),
      /does not match/,
    );
    await assert.rejects(
      validateRecoveryArtifact(archivePath, expected({ expectedRunAttempt: '3' })),
      /does not match/,
    );
  });
});

test('rejects path traversal and symbolic links without extracting the archive', async () => {
  await withArchive({ ...REQUIRED, '../escape.txt': 'bad' }, async (archivePath) => {
    await assert.rejects(validateRecoveryArtifact(archivePath, expected()), /unsafe path/);
  });
  await withArchive({ ...REQUIRED, 'unsafe-link': { body: '', type: '2' } }, async (archivePath) => {
    await assert.rejects(validateRecoveryArtifact(archivePath, expected()), /forbidden tar entry type/);
  });
});

test('rejects incomplete Pages archives and malformed structured markers', async () => {
  const { 'api/v1/meta.json': ignored, ...missingMeta } = REQUIRED;
  await withArchive(missingMeta, async (archivePath) => {
    await assert.rejects(validateRecoveryArtifact(archivePath, expected()), /missing required file/);
  });
  await withArchive({ ...REQUIRED, 'deploy-marker.txt': '123456789-2\n' }, async (archivePath) => {
    await assert.rejects(validateRecoveryArtifact(archivePath, expected()), /deploy-marker\.txt is malformed/);
  });
});

test('rejects a corrupted tar header before trusting any payload', async () => {
  const archive = makeTar(REQUIRED);
  archive[20] ^= 0xff;
  const directory = await mkdtemp(path.join(os.tmpdir(), 'statuterates-recovery-'));
  const archivePath = path.join(directory, 'artifact.tar');
  await writeFile(archivePath, archive);
  try {
    await assert.rejects(validateRecoveryArtifact(archivePath, expected()), /invalid tar checksum/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
