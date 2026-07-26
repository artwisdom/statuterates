import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deployPath = new URL('../../.github/workflows/deploy.yml', import.meta.url);
const refreshPath = new URL('../../.github/workflows/refresh.yml', import.meta.url);

test('a successful scheduled refresh has an explicit deployment handoff', async () => {
  const deploy = await readFile(deployPath, 'utf8');

  assert.match(deploy, /^\s*workflow_run:\s*$/m);
  assert.match(deploy, /^\s*workflows:\s*\["refresh-data"\]\s*$/m);
  assert.match(deploy, /^\s*types:\s*\[completed\]\s*$/m);
  assert.match(deploy, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(deploy, /^\s*ref:\s*main\s*$/m);
});

test('refresh records whether exports changed without relying on a suppressed push trigger', async () => {
  const refresh = await readFile(refreshPath, 'utf8');

  assert.match(refresh, /^\s*id:\s*commit\s*$/m);
  assert.match(refresh, /steps\.commit\.outputs\.changed/);
  assert.doesNotMatch(refresh, /deploy workflow runs on push to data\/exports/i);
});
