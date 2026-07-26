import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  cpSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { validateCommittedExports } from './build-validation.mjs';
import { DEFAULT_EXPORTS_DIR } from './seed-exports.mjs';

function readJson(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

function writeJson(path, value) {
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

test('deploy validation preserves and validates a committed future Florida quarter', () => {
  const exportsDir = mkdtempSync(join(tmpdir(), 'statuterates-build-validation-'));
  try {
    cpSync(DEFAULT_EXPORTS_DIR, exportsDir, { recursive: true });
    for (const slug of ['florida-judgment-rate', 'florida-prejudgment-rate']) {
      const path = join(exportsDir, 'entity', `${slug}.json`);
      const entity = readJson(path);
      const prior = entity.history.annual_rate[0];
      entity.history.annual_rate.unshift({
        ...prior,
        value: 7.75,
        value_text: '7.75%',
        effective_date: '2026-10-01',
        retrieved_at: '2026-09-15T12:00:00.000Z',
        notes: `Verified future-quarter fixture for ${slug}.`,
      });
      if (slug === 'florida-judgment-rate') {
        entity.metadata.calculation.coverage_through = '2026-10-01';
      }
      writeJson(path, entity);
    }

    const { seed, report } = validateCommittedExports({
      exportsDir,
      today: '2026-09-01',
    });

    assert.equal(seed.observations, 4_949);
    assert.equal(report.ok, true, report.errors.join('\n'));
    assert.equal(report.totals.observations, 4_949);
  } finally {
    rmSync(exportsDir, { recursive: true, force: true });
  }
});
