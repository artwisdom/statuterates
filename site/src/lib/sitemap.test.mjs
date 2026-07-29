import test from 'node:test';
import assert from 'node:assert/strict';

import { isIsoCalendarDate, significantPageDate, SITE_LAUNCH_DATE } from './sitemap.mjs';

test('sitemap dates must be real ISO calendar dates', () => {
  assert.equal(isIsoCalendarDate('2026-07-28'), true);
  assert.equal(isIsoCalendarDate('2026-02-29'), false);
  assert.equal(isIsoCalendarDate('2026-13-01'), false);
  assert.equal(isIsoCalendarDate('not-a-date'), false);
});

test('sitemap lastmod never predates the website launch', () => {
  const lastmod = significantPageDate({
    currentObservation: {
      effective_date: '1989-01-01',
      retrieved_at: '2026-07-08T00:00:00Z',
    },
    publishedObservation: {
      effective_date: '1989-01-01',
      retrieved_at: '2026-07-08T00:00:00Z',
    },
    buildDate: '2026-07-26',
  });

  assert.equal(lastmod, SITE_LAUNCH_DATE);
});

test('sitemap lastmod follows real data retrieval and editorial improvements', () => {
  assert.equal(significantPageDate({
    currentObservation: {
      effective_date: '2026-07-01',
      retrieved_at: '2026-07-09T12:00:00Z',
    },
    publishedObservation: {
      effective_date: '2026-10-01',
      retrieved_at: '2026-07-20T12:00:00Z',
    },
    contentModified: '2026-07-26',
    buildDate: '2026-07-26',
  }), '2026-07-26');
});

test('a preannounced future effective date does not manufacture freshness', () => {
  assert.equal(significantPageDate({
    currentObservation: {
      effective_date: '2026-07-01',
      retrieved_at: '2026-07-09T12:00:00Z',
    },
    publishedObservation: {
      effective_date: '2026-10-01',
      retrieved_at: '2026-07-20T12:00:00Z',
    },
    buildDate: '2026-07-26',
  }), '2026-07-20');
});

test('future recorded changes are ignored instead of manufacturing daily freshness', () => {
  assert.equal(significantPageDate({
    currentObservation: {
      effective_date: '2026-07-01',
      retrieved_at: '2026-07-09T12:00:00Z',
    },
    contentModified: '2027-01-01',
    buildDate: '2026-07-26',
  }), '2026-07-09');
});

test('invalid source dates fall back to the latest real page date', () => {
  assert.equal(significantPageDate({
    currentObservation: {
      effective_date: '2026-13-01',
      retrieved_at: 'not-a-date',
    },
    buildDate: '2026-07-26',
  }), SITE_LAUNCH_DATE);
});
