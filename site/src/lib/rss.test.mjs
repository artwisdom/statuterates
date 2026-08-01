import test from 'node:test';
import assert from 'node:assert/strict';

import { recordedChangesFor } from './changes.mjs';
import { renderRateChangesRss } from './rss.mjs';

const entity = {
  slug: 'example-rate',
  name: 'Example & Test Rate',
  jurisdiction: 'US',
  history: {
    annual_rate: [
      { effective_date: '2026-10-01', value_text: '8%', confidence: 'high', method: 'published' },
      { effective_date: '2026-07-01', value_text: '7%', confidence: 'high', method: 'published' },
      { effective_date: '2026-07-01', value_text: '7%', confidence: 'high', method: 'published' },
      { effective_date: '2026-04-01', value_text: '6%', confidence: 'medium', method: 'derived_formula' },
    ],
  },
};

test('recorded changes exclude future values and duplicate effective dates', () => {
  const changes = recordedChangesFor(entity, '2026-07-31');
  assert.deepEqual(changes.map((change) => change.effective_date), ['2026-07-01', '2026-04-01']);
  assert.ok(changes.every((change) => change.slug === entity.slug));
});

test('RSS output escapes text and uses stable series/date identifiers', () => {
  const changes = recordedChangesFor(entity, '2026-07-31');
  const xml = renderRateChangesRss({
    base: 'https://statuterates.com/',
    channelTitle: 'Example & updates',
    channelPath: '/rates/example-rate/',
    selfPath: '/rates/example-rate.xml',
    description: 'Recorded <changes>',
    generatedAt: '2026-07-31T12:00:00Z',
    changes,
  });

  assert.match(xml, /Example &amp; updates/);
  assert.match(xml, /Recorded &lt;changes&gt;/);
  assert.match(xml, /<guid isPermaLink="false">example-rate@2026-07-01<\/guid>/);
  assert.equal((xml.match(/<item>/g) || []).length, 2);
  assert.doesNotMatch(xml, /2026-10-01/);
});
