#!/usr/bin/env node

import { appendFileSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dueCalculatorRuleReviews } from '../pipeline/lib/legal-review.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const entityDir = join(__dirname, '..', 'data', 'exports', 'entity');
const entities = readdirSync(entityDir)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(join(entityDir, file), 'utf8')));
const due = dueCalculatorRuleReviews(entities);
const title = '[StatuteRates] Calculator legal-rule review due';
const body = due.length
  ? [
      'The automated safety window for these published calculators is ending:',
      '',
      ...due.map((item) => (
        `- ${item.name} (\`${item.slug}\`): ${item.expiry} — ` +
        `${item.days_remaining === null ? item.reason : `${item.days_remaining} days remaining`}`
      )),
      '',
      'Follow `docs/MAINTENANCE_RUNBOOK.md` → “Calculator legal-rule review” before changing the expiry date.',
      'The pipeline will fail closed after expiry so an unreviewed legal contract cannot remain calculator-ready.',
    ].join('\n')
  : '';

if (process.env.GITHUB_OUTPUT) {
  const delimiter = `STATUTERATES_REVIEW_${Date.now()}`;
  appendFileSync(process.env.GITHUB_OUTPUT, `due=${due.length ? 'true' : 'false'}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `title=${title}\n`);
  appendFileSync(process.env.GITHUB_OUTPUT, `body<<${delimiter}\n${body}\n${delimiter}\n`);
} else {
  console.log(JSON.stringify({ due, title, body }, null, 2));
}

