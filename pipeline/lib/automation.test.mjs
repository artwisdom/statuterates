import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const deployPath = new URL('../../.github/workflows/deploy.yml', import.meta.url);
const refreshPath = new URL('../../.github/workflows/refresh.yml', import.meta.url);
const edgeCheckPath = new URL('../../machine/check-public-edge.mjs', import.meta.url);

test('a successful scheduled refresh has an explicit deployment handoff', async () => {
  const deploy = await readFile(deployPath, 'utf8');

  assert.match(deploy, /^\s*workflow_run:\s*$/m);
  assert.match(deploy, /^\s*workflows:\s*\["refresh-data"\]\s*$/m);
  assert.match(deploy, /^\s*types:\s*\[completed\]\s*$/m);
  assert.match(deploy, /github\.event\.workflow_run\.conclusion == 'success'/);
  assert.match(deploy, /^\s*ref:\s*main\s*$/m);
});

test('shared calculation changes trigger deployment and run the shared test suite', async () => {
  const deploy = await readFile(deployPath, 'utf8');

  assert.match(deploy, /^\s*-\s*"shared\/\*\*"\s*$/m);
  assert.match(
    deploy,
    /name:\s*Run shared calculation tests[\s\S]*working-directory:\s*shared[\s\S]*run:\s*node --test/,
  );
});

test('refresh records whether exports changed without relying on a suppressed push trigger', async () => {
  const refresh = await readFile(refreshPath, 'utf8');

  assert.match(refresh, /^\s*id:\s*commit\s*$/m);
  assert.match(refresh, /steps\.commit\.outputs\.changed/);
  assert.doesNotMatch(refresh, /deploy workflow runs on push to data\/exports/i);
});

test('refresh validates newly generated exports before the bot can commit them', async () => {
  const refresh = await readFile(refreshPath, 'utf8');
  const pipelineIndex = refresh.indexOf('name: Run pipeline (fetch → validate → export)');
  const verifyIndex = refresh.indexOf('name: Verify refreshed exports before commit');
  const commitIndex = refresh.indexOf('name: Commit refreshed data (only if exports changed)');

  assert.notEqual(pipelineIndex, -1);
  assert.notEqual(verifyIndex, -1);
  assert.notEqual(commitIndex, -1);
  assert.ok(pipelineIndex < verifyIndex && verifyIndex < commitIndex);
  const verifyStep = refresh.slice(verifyIndex, commitIndex);
  assert.match(verifyStep, /working-directory:\s*pipeline/);
  assert.match(verifyStep, /npm test/);
  assert.match(verifyStep, /node run\.mjs build/);
});

test('IndexNow runs only after the production deployment step', async () => {
  const deploy = await readFile(deployPath, 'utf8');
  const deploymentIndex = deploy.indexOf('uses: actions/deploy-pages@v5');
  const indexNowIndex = deploy.indexOf('name: Ping IndexNow');

  assert.notEqual(deploymentIndex, -1);
  assert.notEqual(indexNowIndex, -1);
  assert.ok(indexNowIndex > deploymentIndex);
  assert.match(deploy, /sitemap\.xml\?deploy=/);
  const key = deploy.match(/^\s*KEY=([a-f0-9]{32,128})\s*$/m)?.[1];
  assert.ok(key, 'workflow must contain a valid IndexNow key');
  const keyFile = new URL(`../../site/public/${key}.txt`, import.meta.url);
  assert.equal((await readFile(keyFile, 'utf8')).trim(), key);
});

test('the deployed custom domain is verified before search engines are notified', async () => {
  const [deploy, edgeCheck] = await Promise.all([
    readFile(deployPath, 'utf8'),
    readFile(edgeCheckPath, 'utf8'),
  ]);
  const deploymentIndex = deploy.indexOf('uses: actions/deploy-pages@v5');
  const edgeCheckIndex = deploy.indexOf('name: Verify the public edge after deployment');
  const indexNowIndex = deploy.indexOf('name: Ping IndexNow');

  assert.notEqual(edgeCheckIndex, -1);
  assert.ok(deploymentIndex < edgeCheckIndex && edgeCheckIndex < indexNowIndex);
  assert.match(deploy, /run:\s*node machine\/check-public-edge\.mjs/);
  assert.match(deploy, /^\s*-\s*"machine\/check-public-edge\.mjs"\s*$/m);
  assert.match(deploy, /DEPLOY_MARKER:\s*\$\{\{ format\('\{0\}-\{1\}', github\.run_id, github\.run_attempt\) \}\}/);
  assert.match(edgeCheck, /const releaseId = expectedMarker;/);
  assert.match(edgeCheck, /url\.searchParams\.set\('deploy', releaseId\)/);
});

test('weekly automation opens one deduplicated calculator legal-review reminder', async () => {
  const refresh = await readFile(refreshPath, 'utf8');

  assert.match(refresh, /^\s*issues:\s*write\b/m);
  assert.match(refresh, /node machine\/legal-review-reminder\.mjs/);
  assert.match(refresh, /gh issue list --state open/);
  assert.match(refresh, /gh issue create --title/);
});

test('automation uses current Node 24 GitHub Actions runtimes', async () => {
  const [deploy, refresh] = await Promise.all([
    readFile(deployPath, 'utf8'),
    readFile(refreshPath, 'utf8'),
  ]);

  for (const workflow of [deploy, refresh]) {
    assert.match(workflow, /actions\/checkout@v7/);
    assert.match(workflow, /actions\/setup-node@v7/);
    assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v[1-4]\b/);
  }
  assert.match(deploy, /actions\/upload-pages-artifact@v5/);
  assert.match(deploy, /actions\/deploy-pages@v5/);
});
