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
    const validationDate = '2026-09-01';
    const { seed: baselineSeed, report: baselineReport } = validateCommittedExports({
      exportsDir,
      today: validationDate,
    });
    assert.equal(baselineReport.ok, true, baselineReport.errors.join('\n'));
    assert.equal(
      baselineSeed.observations,
      readJson(join(exportsDir, 'meta.json')).observation_count,
      'export metadata must match the exact hydrated snapshot',
    );
    const baselineObservations = baselineSeed.observations;
    const floridaPost = readJson(join(
      exportsDir,
      'entity',
      'florida-judgment-rate.json',
    ));
    const latestCommittedDate = floridaPost.history.annual_rate
      .map((observation) => observation.effective_date)
      .sort()
      .at(-1);
    const nextQuarter = new Date(`${latestCommittedDate}T00:00:00Z`);
    nextQuarter.setUTCMonth(nextQuarter.getUTCMonth() + 3);
    const fixtureDate = nextQuarter.toISOString().slice(0, 10);
    assert.ok(fixtureDate > validationDate, `${fixtureDate} must remain a future-quarter fixture`);

    for (const slug of ['florida-judgment-rate', 'florida-prejudgment-rate']) {
      const path = join(exportsDir, 'entity', `${slug}.json`);
      const entity = readJson(path);
      const prior = entity.history.annual_rate
        .find((observation) => observation.effective_date === latestCommittedDate);
      assert.ok(prior, `${slug} must share the latest committed CFO quarter ${latestCommittedDate}`);
      entity.history.annual_rate.unshift({
        ...prior,
        value: 7.75,
        value_text: '7.75%',
        effective_date: fixtureDate,
        retrieved_at: `${validationDate}T12:00:00.000Z`,
        notes: `Verified future-quarter fixture for ${slug}.`,
      });
      if (slug === 'florida-judgment-rate') {
        entity.metadata.calculation.coverage_through = fixtureDate;
      }
      writeJson(path, entity);
    }

    const { seed, report } = validateCommittedExports({
      exportsDir,
      today: validationDate,
    });

    const expectedObservations = baselineObservations + 2;
    assert.equal(seed.observations, expectedObservations);
    assert.equal(report.ok, true, report.errors.join('\n'));
    assert.equal(report.totals.observations, expectedObservations);
  } finally {
    rmSync(exportsDir, { recursive: true, force: true });
  }
});
