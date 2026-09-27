import { test } from 'node:test';
import assert from 'node:assert/strict';
import { contentModifiedFor, copyFor } from './content.mjs';

function text(value) {
  return JSON.stringify(value);
}

test('monitored annual state copy follows a future observation automatically', () => {
  const copy = copyFor('alaska-judgment-rate', {
    observation: {
      value: 6.25,
      value_text: '6.25%',
      effective_date: '2027-01-01',
    },
    historyPoints: 31,
  });

  assert.match(copy.body, /2027/);
  assert.match(copy.body, /6\.25%/);
  assert.match(copy.postDetails.history, /31 annual selections/);
  assert.doesNotMatch(text(copy), /\{\{/);
});

test('dual-rate and formula copy derives every volatile branch from the observation', () => {
  const newJersey = copyFor('new-jersey-judgment-rate', {
    observation: {
      value: 5,
      value_text: '5% / 7%',
      effective_date: '2027-01-01',
    },
  });
  const utah = copyFor('utah-judgment-rate', {
    observation: {
      value: 6.25,
      value_text: '6.25%',
      effective_date: '2027-01-01',
    },
    historyPoints: 35,
  });

  assert.match(newJersey.body, /5% for a judgment not exceeding.*7% for a judgment exceeding/s);
  assert.match(newJersey.body, /2027/);
  assert.match(utah.body, /4\.25%/);
  assert.match(utah.body, /14\.25%/);
  assert.doesNotMatch(text({ newJersey, utah }), /\{\{/);
});

test('New York pages disclose verified branches, transition history, and calculator limits', () => {
  const general = copyFor('new-york-judgment-rate', {
    observation: { value: 9, value_text: '9%', effective_date: '1981-06-15' },
    historyPoints: 1,
  });
  const consumer = copyFor('new-york-consumer-debt-judgment-rate', {
    observation: { value: 2, value_text: '2%', effective_date: '2022-04-30' },
    historyPoints: 2,
  });

  assert.match(general.postDetails.scope, /9% headline/);
  assert.match(general.postDetails.history, /June 15, 1981/);
  assert.match(general.postDetails.compounding, /reference-only/);
  assert.match(consumer.postDetails.scope, /natural person/);
  assert.match(consumer.postDetails.history, /April 30, 2022/);
  assert.match(consumer.postDetails.compounding, /does not refund/);
  assert.doesNotMatch(text({ general, consumer }), /LLMs and older guides/);
});

test('California copy distinguishes statutory branches and capitalization events', () => {
  const copy = copyFor('california-judgment-rate', {
    observation: { value: 10, value_text: '10%', effective_date: '1983-01-01' },
    historyPoints: 1,
  });

  assert.match(copy.body, /natural persons/);
  assert.match(copy.postDetails.scope, /strictly below/);
  assert.match(copy.postDetails.compounding, /simple between capitalization events/);
  assert.match(copy.postDetails.history, /January 1, 1983/);
  assert.match(copy.postDetails.history, /nonsubstantive/);
});

test('all monitored composite-rate explanations follow future observations', () => {
  const cases = [
    ['georgia-prejudgment-rate', '8% / 10.5%', ['8%', '10.5%']],
    ['kansas-prejudgment-rate', '11% / 6.25%', ['11%', '6.25%']],
    ['minnesota-judgment-rate', '5% / 11%', ['5%', '11%']],
    ['minnesota-prejudgment-rate', '5% / 11%', ['5%', '11%']],
    ['montana-prejudgment-rate', '11% / 10.5%', ['11%', '10.5%']],
    ['oklahoma-prejudgment-rate', '4.5% / 7%', ['4.5%', '7%', '2027']],
    ['utah-prejudgment-rate', '11% / 9.25%', ['11%', '9.25%']],
  ];

  for (const [slug, valueText, expected] of cases) {
    const copy = copyFor(slug, {
      observation: {
        value: Number.parseFloat(valueText),
        value_text: valueText,
        effective_date: '2027-01-01',
      },
    });
    const rendered = text(copy);
    for (const value of expected) assert.match(rendered, new RegExp(value.replace('.', '\\.')));
    assert.doesNotMatch(rendered, /\{\{/);
  }
});

test('monitored single-rate state explanations follow future rate and year', () => {
  const cases = [
    ['kansas-judgment-rate', '8.25%'],
    ['montana-judgment-rate', '10.5%'],
    ['oklahoma-judgment-rate', '9.25%'],
  ];

  for (const [slug, valueText] of cases) {
    const copy = copyFor(slug, {
      observation: {
        value: Number.parseFloat(valueText),
        value_text: valueText,
        effective_date: '2027-01-01',
      },
    });
    const rendered = text(copy);
    assert.match(rendered, new RegExp(valueText.replace('.', '\\.')));
    if (slug === 'oklahoma-judgment-rate') assert.match(rendered, /2027/);
    assert.doesNotMatch(rendered, /\{\{/);
  }
});

test('repaired state pages keep complete structured legal explanations', () => {
  const cases = [
    ['idaho-judgment-rate', '8.875%', 41],
    ['indiana-judgment-rate', '8%', 1],
    ['louisiana-judgment-rate', '7.5%', 42],
    ['new-hampshire-judgment-rate', '5.7%', 1],
    ['north-dakota-judgment-rate', '10%', 21],
    ['west-virginia-judgment-rate', '6.25%', 20],
  ];
  for (const [slug, valueText, historyPoints] of cases) {
    const copy = copyFor(slug, {
      observation: { value_text: valueText, effective_date: '2026-01-01' },
      historyPoints,
    });
    assert.ok(copy.body.length > 200, slug);
    assert.ok(copy.postDetails?.scope && copy.postDetails?.accrual && copy.postDetails?.compounding && copy.postDetails?.history, slug);
    assert.doesNotMatch(text(copy), /…|\)\.\.|\)\.,/, slug);
  }
  assert.equal(copyFor('indiana-judgment-rate').monetizationReady, false);
  assert.equal(copyFor('louisiana-prejudgment-rate').kind, 'claim-dependent');
});

test('Tennessee copy follows the released official history without enabling payoff claims', () => {
  const copy = copyFor('tennessee-judgment-rate', {
    observation: { value: 8.75, value_text: '8.75%', effective_date: '2026-07-01' },
    historyPoints: 29,
  });

  assert.match(copy.body, /8\.75%/);
  assert.match(copy.postDetails.history, /29 official AOC half-year selections/);
  assert.match(copy.postDetails.history, /July 1, 2012/);
  assert.match(copy.postDetails.history, /rather than recomputed from the DFI weekly table/);
  assert.match(copy.postDetails.compounding, /payoff calculator remains withheld/);
  assert.doesNotMatch(text(copy), /only one observation|\{\{/);
  assert.equal(contentModifiedFor('tennessee-judgment-rate'), '2026-09-03');
});

test('confirmed Arkansas Arizona and Delaware transitions materialize from observations', () => {
  const cases = [
    ['arkansas-judgment-rate', '6%', '2026-09-17', /Federal Reserve primary-credit rate/, /5\.75%/],
    ['arkansas-prejudgment-rate', '6%', '2026-09-17', /when appropriate on the facts/, /5\.75%/],
    ['arizona-judgment-rate', '8%', '2026-09-21', /§44-1201\(B\)/, /7\.75%/],
    ['delaware-judgment-rate', '9%', '2026-09-17', /§2301\(a\)/, /8\.75%/],
    ['delaware-prejudgment-rate', '9%', '2026-09-17', /§2301\(d\)/, /8\.75%/],
  ];

  for (const [slug, valueText, effectiveDate, authority, staleValue] of cases) {
    const copy = copyFor(slug, {
      observation: {
        value: Number.parseFloat(valueText),
        value_text: valueText,
        effective_date: effectiveDate,
      },
    });
    const rendered = text(copy);
    assert.match(rendered, new RegExp(valueText.replace('.', '\\.')) , slug);
    assert.match(rendered, authority, slug);
    assert.doesNotMatch(rendered, staleValue, slug);
    assert.doesNotMatch(rendered, /\{\{/, slug);
  }

  const arizonaPrejudgment = copyFor('arizona-prejudgment-rate');
  assert.match(arizonaPrejudgment.body, /§44-1201\(A\).*subsection \(B\).*subsection \(C\).*subsection \(D\).*subsection \(F\)/s);
  assert.match(arizonaPrejudgment.applies, /§44-1201\(D\)/);
  assert.match(arizonaPrejudgment.formula, /Subsection \(F\).*subsection \(A\) or \(B\)/);
  assert.doesNotMatch(text(arizonaPrejudgment), /7\.75%/);
});

test('ambiguous Missouri Nevada prejudgment and New Hampshire values remain fail closed', () => {
  const missouriPost = copyFor('missouri-judgment-rate');
  const missouriPre = copyFor('missouri-prejudgment-rate');
  const nevadaPre = copyFor('nevada-prejudgment-rate', {
    observation: { value: 8.75, value_text: '8.75%', effective_date: '2026-07-01' },
  });
  const newHampshirePost = copyFor('new-hampshire-judgment-rate', {
    observation: { value: 5.7, value_text: '5.7%', effective_date: '2026-01-01' },
  });
  const newHampshirePre = copyFor('new-hampshire-prejudgment-rate', {
    observation: { value: 5.7, value_text: '5.7%', effective_date: '2026-01-01' },
  });

  assert.match(missouriPost.body, /non-tort.*9%/s);
  assert.match(missouriPost.body, /not publishing a current numeric rate.*tort branch/s);
  assert.match(missouriPre.formula, /numeric tort result remains unavailable/);
  assert.doesNotMatch(text({ missouriPost, missouriPre }), /8\.75%|8\.88%/);

  assert.match(nevadaPre.body, /not publishing a current numeric prejudgment value/);
  assert.match(nevadaPre.formula, /Do not substitute.*NRS 17\.130/s);
  assert.doesNotMatch(text(nevadaPre), /8\.75%/);

  assert.match(newHampshirePost.body, /withholding the current numeric value/);
  assert.match(newHampshirePre.body, /withholding the current numeric value/);
  assert.doesNotMatch(text({ newHampshirePost, newHampshirePre }), /5\.7%/);
});

test('September legal review copy preserves every confirmed branch correction', () => {
  const cases = [
    ['washington-prejudgment-rate', /medical debt is capped at 9%/],
    ['colorado-prejudgment-rate', /medical-debt claim can instead be capped at 3%/],
    ['illinois-prejudgment-rate', /separate authorities.*6%.*5%/s],
    ['indiana-prejudgment-rate', /court-selected simple rate from 6% to 10%/],
    ['pennsylvania-prejudgment-rate', /official 2026 Rule 238 rate is 7\.75%/],
    ['new-york-prejudgment-rate', /consumer-debt action against a natural person.*2%/s],
    ['north-carolina-prejudgment-rate', /consumer contract uses the lower of the contract and legal rates/],
    ['rhode-island-judgment-rate', /pecuniary damages plus the prejudgment interest/],
    ['rhode-island-prejudgment-rate', /medical or dental malpractice/],
    ['south-dakota-prejudgment-rate', /not a periodically resetting formula/],
    ['south-dakota-prejudgment-rate', /inverse condemnation.*4\.5%/],
    ['west-virginia-prejudgment-rate', /resets annually, not twice a year/],
    ['new-mexico-prejudgment-rate', /no more than 15%.*does not make 15% an unconditional default/s],
    ['tennessee-prejudgment-rate', /Ten percent is a ceiling, not an automatic default/],
    ['wyoming-judgment-rate', /child-support or maintenance judgments can carry no interest/],
    ['wyoming-prejudgment-rate', /not a universal prejudgment award/],
  ];

  for (const [slug, expected] of cases) {
    assert.match(text(copyFor(slug)), expected, slug);
  }
});

test('softened legal-rate pages do not claim a universal simple-interest rule', () => {
  const slugs = [
    'alabama-prejudgment-rate',
    'california-prejudgment-rate',
    'idaho-prejudgment-rate',
    'vermont-prejudgment-rate',
    'maryland-prejudgment-rate',
    'north-dakota-prejudgment-rate',
    'virginia-prejudgment-rate',
    'wyoming-prejudgment-rate',
  ];

  for (const slug of slugs) {
    assert.doesNotMatch(text(copyFor(slug)), /as simple interest|simple interest only|compound: "Simple"/i, slug);
  }
});

test('every page changed by the September legal copy repair advances lastmod once', () => {
  const slugs = [
    'alabama-prejudgment-rate',
    'arizona-judgment-rate',
    'arizona-prejudgment-rate',
    'arkansas-judgment-rate',
    'arkansas-prejudgment-rate',
    'california-prejudgment-rate',
    'colorado-prejudgment-rate',
    'delaware-judgment-rate',
    'delaware-prejudgment-rate',
    'idaho-prejudgment-rate',
    'illinois-prejudgment-rate',
    'indiana-prejudgment-rate',
    'maryland-prejudgment-rate',
    'missouri-judgment-rate',
    'missouri-prejudgment-rate',
    'nevada-prejudgment-rate',
    'new-hampshire-judgment-rate',
    'new-hampshire-prejudgment-rate',
    'new-mexico-prejudgment-rate',
    'new-york-prejudgment-rate',
    'north-carolina-judgment-rate',
    'north-carolina-prejudgment-rate',
    'north-dakota-prejudgment-rate',
    'pennsylvania-prejudgment-rate',
    'rhode-island-judgment-rate',
    'rhode-island-prejudgment-rate',
    'south-dakota-judgment-rate',
    'south-dakota-prejudgment-rate',
    'tennessee-prejudgment-rate',
    'vermont-prejudgment-rate',
    'virginia-prejudgment-rate',
    'washington-prejudgment-rate',
    'west-virginia-prejudgment-rate',
    'wyoming-judgment-rate',
    'wyoming-prejudgment-rate',
  ];

  for (const slug of slugs) assert.equal(contentModifiedFor(slug), '2026-09-27', slug);
});

test('prejudgment rule details never expose imported sentence fragments', () => {
  const cases = [
    ['alabama-prejudgment-rate', 'accrual', /Other claim types require their own authority/],
    ['california-prejudgment-rate', 'accrual', /never earlier than the filing date/],
    ['nevada-prejudgment-rate', 'compound', /source contract remains unresolved/],
    ['north-carolina-prejudgment-rate', 'applies', /G\.S\. 24-5\(b\)/],
    ['ohio-prejudgment-rate', 'applies', /good-faith-settlement findings/],
    ['virginia-prejudgment-rate', 'applies', /discretionary rather than automatic/],
    ['new-york-prejudgment-rate', 'accrual', /single reasonable intermediate date/],
  ];
  const broken = /…|^and fix\b|should have been paid"\), i\.e\.|\(sec\.$|AG Op\.$|\(G\.S\.$|Elec\. Constr\.$/i;

  for (const [slug, field, expected] of cases) {
    const copy = copyFor(slug);
    assert.match(copy[field], expected, slug);
    assert.doesNotMatch(copy[field], broken, slug);
  }
});

test('every prejudgment page has complete required rule fields after cleanup', async () => {
  const { readFile } = await import('node:fs/promises');
  const exportPayload = JSON.parse(await readFile(
    new URL('../../../data/exports/entities.json', import.meta.url),
    'utf8',
  ));

  for (const entity of exportPayload.entities || exportPayload) {
    const copy = copyFor(entity.slug);
    if (!copy.prejudgment) continue;
    for (const field of ['applies', 'accrual', 'compound']) {
      assert.ok(String(copy[field] || '').trim(), `${entity.slug}.${field}`);
      assert.doesNotMatch(String(copy[field]), /…/, `${entity.slug}.${field}`);
    }
  }
});

test('Michigan and New Jersey copy preserves branch mechanics and removes truncated legal prose', () => {
  const michigan = copyFor('michigan-judgment-rate', {
    observation: { value: 4.959, value_text: '4.959%', effective_date: '2026-07-01' },
    historyPoints: 80,
  });
  const michiganPre = copyFor('michigan-prejudgment-rate', {
    observation: { value: 4.959, value_text: '4.959%', effective_date: '2026-07-01' },
    historyPoints: 80,
  });
  const newJersey = copyFor('new-jersey-judgment-rate', {
    observation: { value: 4.5, value_text: '4.5% / 6.5%', effective_date: '2026-01-01' },
    historyPoints: 44,
  });
  const newJerseyPre = copyFor('new-jersey-prejudgment-rate', {
    observation: { value: 4.5, value_text: '4.5% / 6.5%', effective_date: '2026-01-01' },
    historyPoints: 40,
  });

  assert.match(michigan.postDetails.accrual, /future-damages component.*begins accruing at judgment/);
  assert.match(michigan.postDetails.history, /80 semiannual/);
  assert.match(michiganPre.accrual, /does not allow interest on future damages/);
  assert.match(newJersey.body, /whole-judgment categories/);
  assert.match(newJersey.postDetails.history, /43 base-rate entries/);
  assert.match(newJersey.postDetails.history, /September 1, 1996/);
  assert.match(newJerseyPre.applies, /future economic losses/);
  assert.doesNotMatch(text({ michigan, michiganPre, newJersey, newJerseyPre }), /…|marginal brackets?\s+apply/);
});

test('Nevada and Oklahoma copy exposes verified histories without implying a released calculator', () => {
  const nevada = copyFor('nevada-judgment-rate', {
    observation: { value: 8.75, value_text: '8.75%', effective_date: '2026-07-01' },
    historyPoints: 79,
  });
  const oklahoma = copyFor('oklahoma-judgment-rate', {
    observation: { value: 8.75, value_text: '8.75%', effective_date: '2026-01-01' },
    historyPoints: 41,
  });

  assert.match(nevada.body, /resets each January 1 and July 1/);
  assert.match(nevada.postDetails.scope, /NRS 97B\.150.*consumer-form debt/s);
  assert.match(nevada.postDetails.accrual, /future damages begin accruing only when judgment is entered/);
  assert.match(nevada.postDetails.compounding, /simple interest/);
  assert.match(nevada.postDetails.history, /79 dated six-month selections/);
  assert.match(nevada.postDetails.history, /January 1, 1987 row says Not Available/);

  assert.match(oklahoma.body, /compounds annually rather than using simple interest/);
  assert.match(oklahoma.postDetails.accrual, /earlier of the expressly stated rendition date or filing/);
  assert.match(oklahoma.postDetails.compounding, /judgment together with post-judgment interest previously accrued/);
  assert.match(oklahoma.postDetails.history, /41 post-judgment values/);
  assert.match(oklahoma.postDetails.history, /Three 2013 legal periods/);
  assert.doesNotMatch(text(oklahoma), /statute uses simple interest|is simple interest|as simple interest/i);

  assert.doesNotMatch(text({ nevada, oklahoma }), /…|\.\.\.|\{\{/);
  assert.equal(contentModifiedFor('nevada-judgment-rate'), '2026-08-22');
  assert.equal(contentModifiedFor('oklahoma-judgment-rate'), '2026-08-22');
});

test('Minnesota and Wisconsin explain complete official histories without implying a universal calculator', () => {
  const minnesota = copyFor('minnesota-judgment-rate', {
    observation: { value: 4, value_text: '4% / 10%', effective_date: '2026-01-01' },
    historyPoints: 39,
  });
  const wisconsin = copyFor('wisconsin-judgment-rate', {
    observation: { value: 7.75, value_text: '7.75%', effective_date: '2026-07-01' },
    historyPoints: 31,
  });

  assert.ok(minnesota.body.length > 300);
  assert.match(minnesota.body, /general percentage resets by calendar year/);
  assert.match(minnesota.postDetails.scope, /August 1, 2009/);
  assert.match(minnesota.postDetails.scope, /August 1, 2022/);
  assert.match(minnesota.postDetails.scope, /does not accrue on past, current, or future child-support judgments/);
  assert.match(minnesota.postDetails.scope, /does not apply to child-support judgments/);
  assert.doesNotMatch(minnesota.postDetails.scope, /unless the family court orders otherwise/);
  assert.match(minnesota.postDetails.accrual, /keeps the 10% rate in effect when.*entered until paid/);
  assert.match(minnesota.postDetails.compounding, /simple interest using a 365-day year/);
  assert.match(minnesota.postDetails.history, /39 official dated general-rate change points/);
  assert.match(minnesota.postDetails.history, /1990–1992 child-support cells blank/);
  assert.match(minnesota.postDetails.history, /not flattened into a numeric historical lookup/);
  assert.match(minnesota.postDetails.history, /18% cap/);

  assert.ok(wisconsin.body.length > 250);
  assert.match(wisconsin.body, /7\.75%/);
  assert.match(wisconsin.body, /July 1, 2026/);
  assert.match(wisconsin.postDetails.accrual, /remains fixed from entry until the judgment is paid/);
  assert.match(wisconsin.postDetails.scope, /§807\.01\(4\)/);
  assert.match(wisconsin.postDetails.history, /31 official half-year rows/);
  assert.match(wisconsin.postDetails.history, /December 2, 2011/);
  assert.match(wisconsin.postDetails.compounding, /does not enable a Wisconsin payoff calculator/);

  assert.doesNotMatch(text({ minnesota, wisconsin }), /…|\.\.\.|against the…|remains a future data-depth project/);
});
