import test from 'node:test';
import assert from 'node:assert/strict';

import { STATE_SOURCES, buildIowa, buildStateFixed } from '../fetchers/us-states.mjs';
import { classifyStateSource, validateStateCalculationMetadata } from './state-rules.mjs';

test('source tiers distinguish official, judicial, and third-party legal references', () => {
  assert.equal(classifyStateSource({
    publisher: 'Arkansas General Assembly (official enacted act)',
    home_url: 'https://www.arkleg.state.ar.us/Home/FTPDocument',
  }), 'official_primary');
  assert.equal(classifyStateSource({
    publisher: 'Tennessee Courts (official judicial source)',
    home_url: 'https://www.tncourts.gov/opinion.pdf',
  }), 'official_secondary');
  assert.equal(classifyStateSource({
    publisher: 'Justia',
    home_url: 'https://law.justia.com/codes/mississippi/',
  }), 'third_party_secondary');
  assert.equal(classifyStateSource({
    publisher: 'Georgia — ga.elaws.us',
    home_url: 'http://ga.elaws.us/law/section7-4-2',
  }), 'third_party_secondary');
  assert.equal(classifyStateSource({
    publisher: 'Georgia General Assembly-authorized Code portal (LexisNexis)',
    home_url: 'https://www.lexisnexis.com/hottopics/gacode',
  }), 'official_secondary');
  assert.equal(classifyStateSource({
    publisher: 'Mississippi Legislature-authorized Code portal (LexisNexis)',
    home_url: 'https://www.lexisnexis.com/hottopics/mscode/',
  }), 'official_secondary');
  assert.equal(classifyStateSource({
    publisher: 'North Carolina General Assembly (official)',
    home_url: 'https://www.ncleg.gov/EnactedLegislation/Statutes/HTML/BySection/Chapter_24/GS_24-5.html',
  }), 'official_secondary');
});

test('only the audited Florida scope is calculator-ready and observations use actual source-check time', () => {
  const sourceById = new Map(STATE_SOURCES.map((source) => [source.id, source]));
  const { entities, observations } = buildStateFixed();
  const entityBySlug = new Map(entities.map((entity) => [entity.slug, entity]));
  const ready = new Set(['florida-judgment-rate']);

  assert.ok(entities.length >= 100);
  assert.ok(observations.length >= entities.length + 500);
  for (const observation of observations) {
    const entity = entityBySlug.get(observation.entitySlug);
    const source = sourceById.get(observation.source_id);

    assert.equal(
      entity.metadata.calculation.status,
      ready.has(observation.entitySlug) ? 'ready' : 'reference_only',
      observation.entitySlug,
    );
    assert.deepEqual(validateStateCalculationMetadata(entity.metadata).errors, [], observation.entitySlug);
    assert.equal(observation.retrieved_at, source.retrieved_at, observation.entitySlug);
    assert.equal(observation.notes.includes('…'), false, observation.entitySlug);
  }
});

test('Texas exposes official monthly history and a structured but safely withheld rule model', () => {
  const { entities, observations } = buildStateFixed();
  const texas = entities.find((entity) => entity.slug === 'texas-judgment-rate');
  const history = observations.filter((observation) => observation.entitySlug === texas.slug);

  assert.equal(history.length, 515);
  assert.equal(history[0].effective_date, '1983-09-01');
  assert.equal(history.at(-1).effective_date, '2026-07-01');
  assert.equal(history.at(-1).value_numeric, 6.75);
  assert.equal(texas.metadata.calculation.status, 'reference_only');
  assert.equal(texas.metadata.calculation.rate_behavior, 'fixed_at_entry');
  assert.equal(texas.metadata.calculation.compounding, 'annual');
  assert.equal(texas.metadata.calculation.current_period_monitored, true);
  assert.equal(texas.metadata.calculation.renderer_supported, false);
});

test('Alaska exposes the shared official annual pre/post schedule and monitors the court PDF', () => {
  const { entities, observations } = buildStateFixed();
  const history = (slug) => observations.filter((observation) => observation.entitySlug === slug);
  const post = history('alaska-judgment-rate');
  const pre = history('alaska-prejudgment-rate');
  const entityBySlug = new Map(entities.map((entity) => [entity.slug, entity]));

  assert.equal(post.length, 30);
  assert.equal(pre.length, 30);
  assert.equal(post[0].effective_date, '1997-08-07');
  assert.equal(post[0].value_text, '8%');
  assert.equal(post.at(-1).effective_date, '2026-01-01');
  assert.equal(post.at(-1).value_text, '6.75%');
  assert.deepEqual(
    pre.map((row) => [row.effective_date, row.value_text]),
    post.map((row) => [row.effective_date, row.value_text])
  );
  assert.equal(entityBySlug.get('alaska-judgment-rate').metadata.calculation.current_period_monitored, true);
  assert.equal(entityBySlug.get('alaska-prejudgment-rate').metadata.calculation.status, 'reference_only');
  assert.equal(entityBySlug.get('alaska-judgment-rate').metadata.calculation.renderer_supported, false);
});

test('Nebraska exposes the official 1987-present history and a safely withheld rule model', () => {
  const { entities, observations } = buildStateFixed();
  const nebraska = entities.find((entity) => entity.slug === 'nebraska-judgment-rate');
  const history = observations.filter((observation) => observation.entitySlug === nebraska.slug);

  assert.equal(history.length, 275);
  assert.equal(history[0].effective_date, '1987-01-01');
  assert.equal(history[0].value_text, '6.770%');
  assert.equal(history.at(-1).effective_date, '2026-07-16');
  assert.equal(history.at(-1).value_text, '5.970%');
  assert.equal(nebraska.metadata.calculation.status, 'reference_only');
  assert.equal(nebraska.metadata.calculation.rate_behavior, 'fixed_at_entry');
  assert.equal(nebraska.metadata.calculation.current_period_monitored, true);
  assert.equal(nebraska.metadata.calculation.renderer_supported, false);
});

test('Utah exposes the official 1993-present annual history and monitored branch formulas', () => {
  const { entities, observations } = buildStateFixed();
  const utah = entities.find((entity) => entity.slug === 'utah-judgment-rate');
  const history = observations.filter((observation) => observation.entitySlug === utah.slug);
  const source = STATE_SOURCES.find((candidate) => candidate.id === 'ut-jud');

  assert.equal(history.length, 34);
  assert.equal(history[0].effective_date, '1993-01-01');
  assert.equal(history.find((row) => row.effective_date === '2000-01-01').value_text, '7.670%');
  assert.equal(history.at(-1).effective_date, '2026-01-01');
  assert.equal(history.at(-1).value_text, '5.51%');
  assert.equal(source.publisher, 'Utah State Courts (official)');
  assert.equal(utah.metadata.calculation.status, 'reference_only');
  assert.equal(utah.metadata.calculation.rate_behavior, 'fixed_at_entry');
  assert.equal(utah.metadata.calculation.current_period_monitored, true);
  assert.equal(utah.metadata.calculation.renderer_supported, false);
});

test('Florida exposes every official CFO period since 1981 and monitors new quarters', () => {
  const { entities, observations } = buildStateFixed();
  const florida = entities.find((entity) => entity.slug === 'florida-judgment-rate');
  const history = observations.filter((observation) => observation.entitySlug === florida.slug);
  const prejudgment = observations.filter(
    (observation) => observation.entitySlug === 'florida-prejudgment-rate',
  );
  const source = STATE_SOURCES.find((candidate) => candidate.id === 'fl-cfo');

  assert.equal(history.length, 78);
  assert.equal(history[0].effective_date, '1981-10-01');
  assert.equal(history[0].value_text, '12%');
  assert.equal(history.find((row) => row.effective_date === '2025-07-01').value_text, '8.90%');
  assert.equal(history.at(-1).effective_date, '2026-07-01');
  assert.equal(history.at(-1).value_text, '8.06%');
  assert.equal(source.publisher, 'Florida Department of Financial Services, Chief Financial Officer (official)');
  assert.equal(florida.metadata.calculation.status, 'ready');
  assert.equal(florida.metadata.calculation.valid_from, '2011-07-01');
  assert.equal(florida.metadata.calculation.coverage_through, '2026-07-01');
  assert.equal(florida.metadata.calculation.renderer_id, 'florida-postjudgment-v1');
  assert.equal(florida.metadata.calculation.payments_supported, false);
  assert.equal(florida.metadata.calculation.current_period_monitored, true);
  assert.equal(florida.metadata.calculation.renderer_supported, true);
  assert.deepEqual(
    prejudgment.map((row) => [row.effective_date, row.value_text]),
    history.map((row) => [row.effective_date, row.value_text]),
  );
  assert.ok(prejudgment.every((row) => row.source_id === 'fl-prejud'));
  assert.ok(prejudgment.every((row) => row.confidence === 'high'));
});

test('Florida calculator coverage follows a newly verified CFO quarter automatically', () => {
  const { entities, observations } = buildStateFixed({
    floridaCfoPoints: [{
      effective_date: '2026-10-01',
      value: 7.95,
      value_text: '7.95%',
      source_url: 'https://www.myfloridacfo.com/division/aa/audits-reports/judgment-interest-rates',
    }],
    floridaRetrievedAt: '2026-09-25T12:00:00Z',
  });
  const florida = entities.find((entity) => entity.slug === 'florida-judgment-rate');
  const history = observations.filter((observation) => observation.entitySlug === florida.slug);
  const prejudgment = observations.filter(
    (observation) => observation.entitySlug === 'florida-prejudgment-rate',
  );

  assert.equal(florida.metadata.calculation.coverage_through, '2026-10-01');
  assert.equal(history.at(-1).effective_date, '2026-10-01');
  assert.equal(history.at(-1).value_text, '7.95%');
  assert.equal(prejudgment.at(-1).effective_date, '2026-10-01');
  assert.equal(prejudgment.at(-1).value_text, '7.95%');
});

test('Florida calculator readiness expires safely and requires the statute monitor', () => {
  const { entities } = buildStateFixed();
  const florida = entities.find((entity) => entity.slug === 'florida-judgment-rate');

  assert.match(
    validateStateCalculationMetadata(florida.metadata, { today: '2027-01-27' }).errors.join('; '),
    /review expired 2027-01-26/,
  );

  const unmonitored = structuredClone(florida.metadata);
  unmonitored.calculation.statute_contract_monitored = false;
  assert.match(
    validateStateCalculationMetadata(unmonitored, { today: '2026-07-26' }).errors.join('; '),
    /monitor its governing statute contract/,
  );
});

test('Kentucky and Maine replace review-date placeholders with official histories', () => {
  const { entities, observations } = buildStateFixed({
    today: '2026-07-19',
    daily: [
      { date: '2025-12-22', value: 3.53 },
      { date: '2025-12-23', value: 3.52 },
      { date: '2025-12-24', value: 3.50 },
      { date: '2025-12-26', value: 3.49 },
    ],
  });
  const entityBySlug = new Map(entities.map((entity) => [entity.slug, entity]));
  const history = (slug) => observations.filter((observation) => observation.entitySlug === slug);

  assert.deepEqual(history('kentucky-judgment-rate').map((row) => row.effective_date), ['1982-07-15', '2017-06-29']);
  assert.equal(history('kentucky-prejudgment-rate')[0].effective_date, '2018-07-14');
  assert.equal(history('kentucky-prejudgment-rate')[0].value_text, 'up to 8%');
  assert.equal(history('maine-judgment-rate').length, 24);
  assert.equal(history('maine-prejudgment-rate').length, 24);
  assert.equal(history('maine-judgment-rate').at(-1).value_text, '9.51%');
  assert.equal(history('maine-prejudgment-rate').at(-1).value_text, '6.51%');
  assert.equal(history('maine-prejudgment-rate').some((row) => row.effective_date === '2026-07-09'), false);
  assert.equal(entityBySlug.get('kentucky-judgment-rate').metadata.calculation.renderer_supported, false);
  assert.equal(entityBySlug.get('maine-judgment-rate').metadata.calculation.future_period_formula_monitored, true);
});

test('Georgia uses exact Federal Reserve prime change points and authorized code portals', () => {
  const { entities, observations } = buildStateFixed();
  const history = (slug) => observations.filter((observation) => observation.entitySlug === slug);
  const post = history('georgia-judgment-rate');
  const pre = history('georgia-prejudgment-rate');
  const sourceById = new Map(STATE_SOURCES.map((source) => [source.id, source]));

  assert.equal(post.length, 59);
  assert.equal(pre.length, 59);
  assert.equal(post[0].effective_date, '2003-07-01');
  assert.equal(post[0].value_text, '7.00%');
  assert.equal(post.at(-1).effective_date, '2025-12-11');
  assert.equal(post.at(-1).value_text, '9.75%');
  assert.equal(pre.at(-1).value_text, '7% / 9.75%');
  assert.equal(post.some((row) => row.effective_date === '2026-07-08'), false);
  assert.equal(pre.some((row) => row.effective_date === '2026-07-09'), false);
  assert.equal(classifyStateSource(sourceById.get('ga-code')), 'official_secondary');
  assert.equal(classifyStateSource(sourceById.get('ga-prejud')), 'official_secondary');
  assert.equal(entities.find((entity) => entity.slug === 'georgia-judgment-rate').metadata.calculation.current_benchmark_monitored, true);
});

test('Mississippi publishes a case-specific rule instead of a false universal 8% rate', () => {
  const { entities, observations } = buildStateFixed();
  const entity = entities.find((candidate) => candidate.slug === 'mississippi-prejudgment-rate');
  const history = observations.filter((observation) => observation.entitySlug === entity.slug);

  assert.equal(history.length, 1);
  assert.equal(history[0].effective_date, '1989-07-01');
  assert.equal(history[0].value_numeric, null);
  assert.equal(history[0].value_text, 'contract rate / court-set');
  assert.equal(history[0].method, 'court-or-contract-rate');
  assert.equal(entity.metadata.kind, 'case-specific');
  assert.equal(entity.metadata.calculation.status, 'reference_only');
  assert.equal(classifyStateSource(STATE_SOURCES.find((source) => source.id === 'ms-prejud')), 'official_secondary');
});

test('Iowa uses the official monthly court selections and remains calculator-withheld', () => {
  const { entities, observations } = buildIowa();
  const iowa = entities.find((entity) => entity.slug === 'iowa-judgment-rate');
  const history = observations.filter((observation) => observation.entitySlug === iowa.slug);

  assert.equal(history.length, 303);
  assert.equal(history[0].effective_date, '2001-03-05');
  assert.equal(history.at(-1).effective_date, '2026-08-10');
  assert.equal(history.at(-1).value_text, '6.06%');
  assert.equal(history.at(-1).confidence, 'high');
  assert.equal(history.at(-1).source_id, 'ia-jud');
  assert.doesNotMatch(history.at(-1).method, /weekly/);
  assert.equal(iowa.metadata.calculation.status, 'reference_only');
  assert.equal(iowa.metadata.calculation.rate_schedule, 'monthly_state_court_administration_notice');
  assert.equal(iowa.metadata.calculation.current_value_status, 'official_judicial_branch_table');
  assert.equal(iowa.metadata.calculation.renderer_supported, false);
  assert.deepEqual(validateStateCalculationMetadata(iowa.metadata).errors, []);
});

test('third-party state sources are never described as official', () => {
  for (const source of STATE_SOURCES.filter((candidate) => classifyStateSource(candidate) === 'third_party_secondary')) {
    assert.doesNotMatch(source.robots_status, /\bofficial\b/i, source.id);
  }
});
