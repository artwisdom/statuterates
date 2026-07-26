import { test } from 'node:test';
import assert from 'node:assert/strict';
import { copyFor } from './content.mjs';

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

  assert.match(newJersey.body, /5% on judgments up to \$20,000 and 7%/);
  assert.match(newJersey.body, /2027/);
  assert.match(utah.body, /4\.25%/);
  assert.match(utah.body, /14\.25%/);
  assert.doesNotMatch(text({ newJersey, utah }), /\{\{/);
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
