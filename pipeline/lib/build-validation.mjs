// Validate the exact committed export snapshot used by the static API and website.
//
// This deliberately uses an isolated in-memory database and does not rebuild curated histories
// from source-code baselines. Rebuilding first could hide or remove a newly committed live-source
// extension before the deploy gate had validated it.

import { openDb } from './db.mjs';
import { seedFromExports } from './seed-exports.mjs';
import { validate } from './validate.mjs';

export function validateCommittedExports({ exportsDir, today } = {}) {
  const db = openDb({ path: ':memory:' });
  try {
    const seed = seedFromExports(db, exportsDir ? { exportsDir } : undefined);
    const report = validate(db, today ? { today } : undefined);
    return { seed, report };
  } finally {
    db.close();
  }
}
