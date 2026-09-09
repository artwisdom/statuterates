import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';

const deployPath = new URL('../../.github/workflows/deploy.yml', import.meta.url);
const recoveryPath = new URL('../../.github/workflows/recover.yml', import.meta.url);
const refreshPath = new URL('../../.github/workflows/refresh.yml', import.meta.url);
const ciPath = new URL('../../.github/workflows/ci.yml', import.meta.url);
const siteHealthPath = new URL('../../.github/workflows/site-health.yml', import.meta.url);
const playwrightConfigPath = new URL('../../site/playwright.config.mjs', import.meta.url);
const workflowsPath = new URL('../../.github/workflows/', import.meta.url);
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
  const pipelineIndex = refresh.indexOf('name: Run pipeline (fetch -> validate -> export)');
  const verifyIndex = refresh.indexOf('name: Verify refreshed exports before handoff');
  const uploadIndex = refresh.indexOf('name: Upload only the validated exports');
  const commitIndex = refresh.indexOf('name: Commit refreshed data only when exports changed');

  assert.notEqual(pipelineIndex, -1);
  assert.notEqual(verifyIndex, -1);
  assert.notEqual(uploadIndex, -1);
  assert.notEqual(commitIndex, -1);
  assert.ok(pipelineIndex < verifyIndex && verifyIndex < uploadIndex && uploadIndex < commitIndex);
  const verifyStep = refresh.slice(verifyIndex, uploadIndex);
  assert.match(verifyStep, /working-directory:\s*pipeline/);
  assert.match(verifyStep, /npm test/);
  assert.match(verifyStep, /node run\.mjs build/);

  const checkoutIndex = refresh.indexOf('uses: actions/checkout@');
  const preCommit = refresh.slice(checkoutIndex, commitIndex);
  const commitStepEnd = refresh.indexOf('\n      - name:', commitIndex + 1);
  const commitStep = refresh.slice(commitIndex, commitStepEnd);
  assert.match(preCommit, /persist-credentials:\s*false/);
  assert.doesNotMatch(preCommit, /GH_TOKEN:/);
  assert.match(commitStep, /GH_TOKEN:\s*\$\{\{ github\.token \}\}/);
  assert.match(commitStep, /gh auth setup-git/);
  assert.match(commitStep, /git[^\n]*push origin HEAD:main/);

  const refreshJob = refresh.slice(refresh.indexOf('\n  refresh:'), refresh.indexOf('\n  commit:'));
  const commitJob = refresh.slice(refresh.indexOf('\n  commit:'), refresh.indexOf('\n  legal-review-check:'));
  assert.match(refresh, /^permissions:\s*\{\}\s*$/m);
  assert.match(refreshJob, /permissions:\s*\n\s+contents:\s*read/);
  assert.doesNotMatch(refreshJob, /contents:\s*write|issues:\s*write|GH_TOKEN:/);
  assert.match(refreshJob, /actions\/upload-artifact@[a-f0-9]{40}\s+# v7\.0\.1/);
  assert.match(commitJob, /permissions:\s*\n\s+contents:\s*write/);
  assert.match(commitJob, /actions\/download-artifact@[a-f0-9]{40}\s+# v8\.0\.1/);
  assert.match(commitJob, /path:\s*\$\{\{ runner\.temp \}\}\/validated-exports/);
  assert.doesNotMatch(commitJob, /^\s*path:\s*validated-exports\s*$/m);
  assert.match(commitJob, /Verify the data-only artifact boundary/);
  assert.doesNotMatch(commitJob, /npm ci|node run\.mjs all|working-directory:\s*pipeline/);
});

test('IndexNow runs only after the production deployment step', async () => {
  const deploy = await readFile(deployPath, 'utf8');
  const deploymentIndex = deploy.indexOf('uses: actions/deploy-pages@');
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
  const deploymentIndex = deploy.indexOf('uses: actions/deploy-pages@');
  const edgeCheckIndex = deploy.indexOf('name: Verify the public edge after deployment');
  const indexNowIndex = deploy.indexOf('name: Ping IndexNow');

  assert.notEqual(edgeCheckIndex, -1);
  assert.ok(deploymentIndex < edgeCheckIndex && edgeCheckIndex < indexNowIndex);
  assert.match(deploy, /run:\s*node machine\/check-public-edge\.mjs/);
  assert.match(deploy, /^\s*-\s*"machine\/(?:check-public-edge\.mjs|\*\*)"\s*$/m);
  assert.match(
    deploy,
    /DEPLOY_MARKER="statuterates:\$\{SOURCE_SHA\}:\$\{GITHUB_RUN_ID\}-\$\{GITHUB_RUN_ATTEMPT\}"/,
  );
  assert.match(deploy, /DEPLOY_MARKER:\s*\$\{\{ needs\.build\.outputs\.deploy_marker \}\}/);
  assert.match(deploy, /ref:\s*\$\{\{ needs\.build\.outputs\.source_sha \}\}/);
  assert.match(edgeCheck, /const releaseId = expectedMarker;/);
  assert.match(edgeCheck, /url\.searchParams\.set\('deploy', releaseId\)/);
});

test('weekly automation opens one deduplicated calculator legal-review reminder', async () => {
  const refresh = await readFile(refreshPath, 'utf8');

  assert.match(refresh, /^\s*issues:\s*write\b/m);
  assert.match(refresh, /node machine\/legal-review-reminder\.mjs/);
  assert.match(refresh, /gh issue list --state open/);
  assert.match(refresh, /gh issue create[\s\S]*--title "\$REVIEW_TITLE"/);
  const checkJob = refresh.slice(
    refresh.indexOf('\n  legal-review-check:'),
    refresh.indexOf('\n  legal-review-notify:'),
  );
  const notifyJob = refresh.slice(
    refresh.indexOf('\n  legal-review-notify:'),
    refresh.indexOf('\n  refresh-alert:'),
  );
  assert.match(checkJob, /contents:\s*read/);
  assert.doesNotMatch(checkJob, /issues:\s*write|GH_TOKEN:/);
  assert.match(notifyJob, /issues:\s*write/);
  assert.doesNotMatch(notifyJob, /actions\/checkout@|node machine\/legal-review-reminder/);
});

test('weekly automation validates all manual state sources and maintains one durable due issue', async () => {
  const refresh = await readFile(refreshPath, 'utf8');
  const checkJob = refresh.slice(
    refresh.indexOf('\n  legal-review-check:'),
    refresh.indexOf('\n  legal-review-notify:'),
  );
  const alertJob = refresh.slice(refresh.indexOf('\n  refresh-alert:'));
  const sourceAlert = alertJob.slice(
    alertJob.indexOf('name: Maintain one manual-source review alert'),
    alertJob.indexOf('name: Write failure diagnostics'),
  );

  assert.match(checkJob, /node machine\/source-review-registry\.mjs/);
  assert.match(checkJob, /source_review_due:\s*\$\{\{ steps\.source-review\.outputs\.due \}\}/);
  assert.match(checkJob, /source_review_overdue:\s*\$\{\{ steps\.source-review\.outputs\.overdue \}\}/);
  assert.match(checkJob, /contents:\s*read/);
  assert.doesNotMatch(checkJob, /issues:\s*write|GH_TOKEN:/);

  assert.match(alertJob, /permissions:\s*\n\s+issues:\s*write/);
  assert.match(alertJob, /SOURCE_REVIEW_LABEL:\s*"automation:manual-source-review"/);
  assert.match(sourceAlert, /gh issue list[\s\S]*--state all/);
  assert.match(sourceAlert, /gh issue reopen/);
  assert.match(sourceAlert, /gh issue edit/);
  assert.match(sourceAlert, /gh issue create/);
  assert.match(sourceAlert, /gh issue close/);
  assert.doesNotMatch(sourceAlert, /continue-on-error:\s*true/);
  assert.doesNotMatch(sourceAlert, /actions\/checkout@|npm ci|node machine\/source-review-registry/);
});

test('real-browser journeys gate pull requests and Pages publication without touching production', async () => {
  const [deploy, ci, refresh, playwrightConfig] = await Promise.all([
    readFile(deployPath, 'utf8'),
    readFile(ciPath, 'utf8'),
    readFile(refreshPath, 'utf8'),
    readFile(playwrightConfigPath, 'utf8'),
  ]);

  for (const [label, workflow] of [['deploy', deploy], ['CI', ci]]) {
    assert.match(workflow, /npx playwright install --with-deps chromium/, `${label} installs Chromium`);
    assert.match(workflow, /run:\s*npm run test:browser/, `${label} runs browser release journeys`);
    const browserIndex = workflow.indexOf('name: Run browser release journeys against the built artifact');
    const evidenceIndex = workflow.indexOf('name: Retain browser failure evidence');
    assert.notEqual(browserIndex, -1, `${label} browser gate is present`);
    assert.ok(browserIndex < evidenceIndex, `${label} retains failure evidence after the gate`);
    const browserStep = workflow.slice(browserIndex, evidenceIndex);
    assert.doesNotMatch(browserStep, /continue-on-error:\s*true/);
  }

  const buildIndex = deploy.indexOf('name: Build the site');
  const browserIndex = deploy.indexOf('name: Run browser release journeys against the built artifact');
  const pagesArtifactIndex = deploy.indexOf('uses: actions/upload-pages-artifact@');
  assert.ok(buildIndex < browserIndex && browserIndex < pagesArtifactIndex);
  assert.match(deploy, /node (?:machine\/)?source-review-registry\.mjs/);
  assert.doesNotMatch(refresh, /playwright install|npm run test:browser/);
  assert.match(ci, /ADSENSE_CLIENT:\s*ca-pub-0000000000000000/);
  assert.match(ci, /EXPECT_ADSENSE_CLIENT:\s*ca-pub-0000000000000000/);
  assert.match(playwrightConfig, /ASTRO_PREVIEW_BACKGROUND=0 npm run preview/);
});

test('manual production recovery is validate-first, identity-bound, and serialized with deploys', async () => {
  const [deploy, recovery] = await Promise.all([
    readFile(deployPath, 'utf8'),
    readFile(recoveryPath, 'utf8'),
  ]);
  const triggers = recovery.slice(recovery.indexOf('\non:'), recovery.indexOf('\npermissions:'));
  const validateJob = recovery.slice(recovery.indexOf('\n  validate:'), recovery.indexOf('\n  restore:'));
  const restoreJob = recovery.slice(recovery.indexOf('\n  restore:'), recovery.indexOf('\n  recovery-alert:'));
  const deployJob = deploy.slice(deploy.indexOf('\n  deploy:'), deploy.indexOf('\n  deploy-alert:'));

  assert.match(triggers, /workflow_dispatch:/);
  assert.doesNotMatch(triggers, /schedule:|push:|workflow_run:/);
  assert.match(recovery, /default:\s*validate-only/);
  assert.match(recovery, /RESTORE STATUTERATES PRODUCTION/);
  assert.match(recovery, /group:\s*deploy-site/);
  assert.match(deploy, /group:\s*deploy-site/);
  assert.match(recovery, /cancel-in-progress:\s*false/);
  assert.match(deploy, /cancel-in-progress:\s*false/);

  assert.match(deployJob, /actions:\s*read/);
  const retainedArtifactIndex = deployJob.indexOf('name: Download this run\'s retained Pages artifact');
  const retainedValidationIndex = deployJob.indexOf('name: Prove the retained artifact is recovery-eligible');
  const productionDeployIndex = deployJob.indexOf('uses: actions/deploy-pages@');
  assert.ok(
    retainedArtifactIndex !== -1
      && retainedArtifactIndex < retainedValidationIndex
      && retainedValidationIndex < productionDeployIndex,
  );
  assert.match(deployJob, /node machine\/validate-recovery-artifact\.mjs/);

  assert.match(validateJob, /actions:\s*read/);
  assert.match(validateJob, /contents:\s*read/);
  assert.doesNotMatch(validateJob, /pages:\s*write|id-token:\s*write/);
  assert.match(validateJob, /actions\/download-artifact@[a-f0-9]{40}/);
  assert.match(validateJob, /run-id:\s*\$\{\{ inputs\.deploy_run_id \}\}/);
  assert.match(validateJob, /node machine\/validate-recovery-artifact\.mjs/);
  assert.match(validateJob, /actions\/upload-artifact@[a-f0-9]{40}/);

  assert.match(restoreJob, /inputs\.mode == 'restore-production'/);
  assert.match(restoreJob, /pages:\s*write/);
  assert.match(restoreJob, /id-token:\s*write/);
  assert.match(restoreJob, /actions\/deploy-pages@[a-f0-9]{40}/);
  assert.match(restoreJob, /node machine\/check-public-edge\.mjs/);
  assert.doesNotMatch(recovery, /name:\s*Ping IndexNow/);
});

test('independent heartbeats are optional, HTTPS-only, non-blocking, and isolated from fetched code', async () => {
  const [health, refresh] = await Promise.all([
    readFile(siteHealthPath, 'utf8'),
    readFile(refreshPath, 'utf8'),
  ]);
  const healthHeartbeat = health.slice(health.indexOf('\n  health-heartbeat:'));
  const refreshHeartbeat = refresh.slice(refresh.indexOf('\n  refresh-heartbeat:'));

  assert.match(health, /SITE_URL:\s*https:\/\/statuterates\.com/);
  assert.match(health, /CHECKED_SITE:\s*https:\/\/statuterates\.com/);
  assert.doesNotMatch(health, /vars\.SITE_URL/);
  assert.match(healthHeartbeat, /UPTIMEROBOT_PRODUCTION_HEALTH_HEARTBEAT_URL/);
  assert.match(healthHeartbeat, /continue-on-error:\s*true/);
  assert.match(healthHeartbeat, /https:\/\/\*/);
  assert.match(healthHeartbeat, /needs:\s*check/);
  assert.match(healthHeartbeat, /needs\.check\.result == 'success'/);
  assert.match(healthHeartbeat, /permissions:\s*\{\}/);
  assert.doesNotMatch(healthHeartbeat, /actions\/checkout@|npm ci|node machine\/check-site-health|GH_TOKEN/);
  assert.match(refreshHeartbeat, /UPTIMEROBOT_REFRESH_HEARTBEAT_URL/);
  assert.match(refreshHeartbeat, /continue-on-error:\s*true/);
  assert.match(refreshHeartbeat, /permissions:\s*\{\}/);
  assert.match(refreshHeartbeat, /needs\.refresh\.result == 'success'/);
  assert.doesNotMatch(refreshHeartbeat, /actions\/checkout@|npm ci|node run\.mjs|GH_TOKEN/);
});

test('refresh failures maintain one durable alert and a later success closes it', async () => {
  const refresh = await readFile(refreshPath, 'utf8');
  const diagnosticsIndex = refresh.indexOf('name: Write failure diagnostics');
  const failureAlertIndex = refresh.indexOf('name: Open or update refresh failure alert');
  const successAlertIndex = refresh.indexOf('name: Close recovered refresh failure alert');
  const legalReviewIndex = refresh.indexOf('name: Check calculator legal-review windows');

  assert.notEqual(diagnosticsIndex, -1);
  assert.notEqual(failureAlertIndex, -1);
  assert.notEqual(successAlertIndex, -1);
  assert.notEqual(legalReviewIndex, -1);
  assert.ok(legalReviewIndex < diagnosticsIndex);
  assert.ok(diagnosticsIndex < failureAlertIndex && failureAlertIndex < successAlertIndex);

  const failureAlert = refresh.slice(failureAlertIndex, successAlertIndex);
  assert.match(failureAlert, /needs\.refresh\.result != 'success'/);
  assert.match(failureAlert, /continue-on-error:\s*true/);
  assert.match(refresh, /^\s*issues:\s*write\b/m);
  assert.match(refresh, /GH_REPO:\s*\$\{\{ github\.repository \}\}/);
  assert.match(refresh, /automation:refresh-data-failure/);
  assert.match(refresh, /actions\/runs\/\$\{\{ github\.run_id \}\}/);
  assert.match(failureAlert, /gh issue list[\s\S]*--state all/);
  assert.match(failureAlert, /gh issue reopen/);
  assert.match(failureAlert, /gh issue edit/);
  assert.match(failureAlert, /gh issue create/);
  assert.match(refresh, /ALERT_ASSIGNEE:\s*\$\{\{ github\.repository_owner \}\}/);
  assert.match(failureAlert, /--assignee "\$ALERT_ASSIGNEE"/);

  const successAlert = refresh.slice(successAlertIndex);
  assert.match(successAlert, /needs\.refresh\.result == 'success'/);
  assert.match(successAlert, /continue-on-error:\s*true/);
  assert.match(successAlert, /gh issue list[\s\S]*--state open/);
  assert.match(successAlert, /gh issue close/);

  const alertJob = refresh.slice(refresh.indexOf('\n  refresh-alert:'));
  assert.match(alertJob, /permissions:\s*\n\s+issues:\s*write/);
  assert.doesNotMatch(alertJob, /actions\/checkout@|npm ci|node run\.mjs all/);
});

test('automation uses current Node 24 GitHub Actions runtimes', async () => {
  const [deploy, refresh] = await Promise.all([
    readFile(deployPath, 'utf8'),
    readFile(refreshPath, 'utf8'),
  ]);

  for (const workflow of [deploy, refresh]) {
    assert.match(workflow, /actions\/checkout@[a-f0-9]{40}\s+# v7/);
    assert.match(workflow, /actions\/setup-node@[a-f0-9]{40}\s+# v7/);
    assert.match(workflow, /node-version:\s*["']?24["']?/);
    assert.doesNotMatch(workflow, /node-version:\s*["']?22\.12["']?/);
    assert.doesNotMatch(workflow, /actions\/(?:checkout|setup-node)@v[1-4]\b/);
  }
  assert.match(deploy, /actions\/upload-pages-artifact@[a-f0-9]{40}\s+# v5/);
  assert.match(deploy, /actions\/deploy-pages@[a-f0-9]{40}\s+# v5/);

  const workflowPermissions = deploy.slice(
    deploy.indexOf('\npermissions:') + 1,
    deploy.indexOf('\nconcurrency:'),
  );
  assert.match(workflowPermissions, /^permissions:\s*\n\s+contents:\s*read\s*$/m);
  assert.doesNotMatch(workflowPermissions, /(?:pages|id-token):\s*write/);

  const deployJob = deploy.slice(deploy.indexOf('\n  deploy:'));
  assert.match(deployJob, /permissions:\s*\n\s+actions:\s*read\s*\n\s+contents:\s*read\s*\n\s+pages:\s*write\s*\n\s+id-token:\s*write/);
});

test('every active GitHub Action is pinned to an immutable commit', async () => {
  const workflowNames = (await readdir(workflowsPath)).filter((name) => /\.ya?ml$/.test(name));
  assert.ok(workflowNames.length >= 5);

  for (const name of workflowNames) {
    const workflow = await readFile(new URL(name, workflowsPath), 'utf8');
    for (const match of workflow.matchAll(/^\s*(?:-\s*)?uses:\s*[^@\s]+@([^\s#]+)/gm)) {
      assert.match(match[1], /^[a-f0-9]{40}$/, `${name} contains a mutable action reference: ${match[0].trim()}`);
    }
    const checkoutCount = [...workflow.matchAll(/uses:\s*actions\/checkout@/g)].length;
    const nonPersistedCheckoutCount = [...workflow.matchAll(/persist-credentials:\s*false/g)].length;
    assert.equal(
      nonPersistedCheckoutCount,
      checkoutCount,
      `${name} must disable persisted credentials on every checkout`,
    );
    if (name === 'site-health.yml') {
      assert.match(workflow, /ALERT_ASSIGNEE:\s*\$\{\{ github\.repository_owner \}\}/);
      assert.match(workflow, /--assignee "\$ALERT_ASSIGNEE"/);
    }
  }
});
