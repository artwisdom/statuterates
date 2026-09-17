import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { parse } from 'yaml';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function committedLockDirectories() {
  const files = execFileSync('git', ['ls-files', '-z'], {
    cwd: ROOT,
    encoding: 'utf8',
  }).split('\0').filter(Boolean);

  return files
    .filter((path) => path === 'package-lock.json' || path.endsWith('/package-lock.json'))
    .map((path) => {
      const directory = dirname(path);
      return directory === '.' ? '/' : `/${directory}`;
    })
    .sort();
}

test('every committed npm lockfile has one weekly Dependabot maintenance entry', () => {
  const config = parse(readFileSync(resolve(ROOT, '.github/dependabot.yml'), 'utf8'));
  const npmUpdates = (config.updates || []).filter((update) => update['package-ecosystem'] === 'npm');

  for (const directory of committedLockDirectories()) {
    const matches = npmUpdates.filter((update) => update.directory === directory);
    assert.equal(matches.length, 1, `${directory} must have exactly one npm Dependabot entry`);

    const [update] = matches;
    assert.equal(update.schedule?.interval, 'weekly', `${directory} must use weekly maintenance`);
    assert.equal(
      update['versioning-strategy'],
      'increase-if-necessary',
      `${directory} must preserve compatible lockfile updates`,
    );
    assert.ok(update['open-pull-requests-limit'] > 0, `${directory} must cap open dependency pull requests`);
    assert.match(update['commit-message']?.prefix || '', /^deps\(.+\)$/u, `${directory} needs a dependency commit prefix`);

    const groupedTypes = Object.values(update.groups || {})
      .flatMap((group) => group['update-types'] || [])
      .sort();
    assert.deepEqual(groupedTypes, ['minor', 'patch'], `${directory} must group only non-major maintenance`);
  }
});

test('deployment verifies documentation truth before uploading the Pages artifact', () => {
  const workflow = parse(readFileSync(resolve(ROOT, '.github/workflows/deploy.yml'), 'utf8'));
  const steps = workflow.jobs?.build?.steps || [];
  const documentationGate = steps.findIndex((step) => step.run === 'node machine/check-doc-truth.mjs');
  const artifactUpload = steps.findIndex((step) => String(step.uses || '').startsWith('actions/upload-pages-artifact@'));

  assert.ok(documentationGate >= 0, 'deploy build must run the documentation truth gate');
  assert.ok(artifactUpload >= 0, 'deploy build must upload a Pages artifact');
  assert.ok(documentationGate < artifactUpload, 'documentation truth must pass before artifact upload');
});
