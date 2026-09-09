# StatuteRates production recovery runbook

Use this only when a newly published release is materially broken at the public edge and an ordinary
forward fix cannot be safely prepared first. The preferred recovery is still a tested forward fix.
Never restore an older artifact merely because a transient health request timed out.

## Safety model

- Recovery is manual and approval-gated; no health monitor can trigger it.
- The default workflow mode validates an old artifact without changing production.
- The recovery runner does not execute source code, dependencies, or files from the old release;
  restored static browser JavaScript runs only after an explicitly confirmed publication.
- Only a retained artifact from a successful `deploy-site` run on `main` is eligible.
- The full source SHA, workflow run, run attempt, and marker inside the archive must agree.
- The restored site must pass the current public-edge verifier.

Only releases published after the Phase C2 structured marker exists are eligible. Older retained
artifacts intentionally fail closed because they cannot prove their full source-commit identity.

## Validate a retained release without changing production

1. Open the repository's
   [recover-production workflow](https://github.com/artwisdom/statuterates/actions/workflows/recover.yml).
2. Choose **Run workflow** on `main`.
3. Enter the full 40-character source SHA recorded by the selected successful deployment.
4. Enter that deployment's numeric GitHub Actions run ID.
5. Leave **mode** as `validate-only` and leave **confirmation** empty.
6. Run the workflow. A green validation receipt means the artifact is available and internally
   consistent; production was not changed.

If validation fails, do not bypass it. Select another retained successful release or prepare a
forward repair.

## Restore only with explicit incident approval

After a validate-only run passes and the owner explicitly approves restoration:

1. Re-run the workflow with the same full source SHA and deployment run ID.
2. Select `restore-production`.
3. Enter exactly: `RESTORE STATUTERATES PRODUCTION`
4. Wait for both the deploy and public-edge verification jobs to pass.
5. Confirm the structured marker reports the selected source commit and run.
6. Prepare a forward repair immediately; rollback is a temporary incident response, not a new source
   of truth.

Do not notify IndexNow or Search Console merely for a byte-identical recovery. The restoration does
not represent new content.

## Failed recovery

The workflow maintains the same deduplicated `automation:deploy-failure` issue used by normal
deployment. Review whether publication occurred before the failure. Never assume either “unchanged”
or “restored” until the marker and public-edge checks confirm it.

## Quarterly rehearsal

Once per quarter, perform only a `validate-only` run against the newest retained successful artifact.
Record the workflow receipt and duration. Do not perform a production restoration solely to satisfy
a calendar exercise.
