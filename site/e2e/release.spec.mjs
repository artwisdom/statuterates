import { expect, test } from '@playwright/test';

const pageErrors = new WeakMap();

test.beforeEach(async ({ page }) => {
  const errors = [];
  pageErrors.set(page, errors);
  page.on('pageerror', (error) => errors.push(error.message));

  // Release tests must be deterministic and must never call an ad network or an official source.
  // Requests to the local preview server continue; every other HTTP(S) request is blocked.
  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());
    if (url.hostname === '127.0.0.1' || url.hostname === 'localhost') {
      await route.continue();
      return;
    }
    await route.abort('blockedbyclient');
  });

  // Exercise the site's copy handlers without depending on host clipboard permissions.
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: {
        writeText: async (value) => { window.__statuteRatesCopiedText = String(value); },
        readText: async () => window.__statuteRatesCopiedText || '',
      },
    });
  });
});

test.afterEach(async ({ page }) => {
  expect(pageErrors.get(page) || [], 'the page raised an uncaught browser error').toEqual([]);
});

test('historical lookup honors Tennessee preselection, copy, and its downloadable CSV', async ({ page, request }) => {
  await page.goto('/calculators/historical-rate-lookup/?series=tennessee-judgment-rate');

  const series = page.getByLabel('Jurisdiction and rate series');
  await expect(series).toHaveValue('tennessee-judgment-rate');
  await expect(page.locator('[data-coverage]')).toContainText('Verified lookup coverage:');

  await page.getByLabel('Historical reference date').fill('2018-01-01');
  await page.getByRole('button', { name: 'Look up historical rate' }).click();

  const result = page.locator('[data-rate-lookup] [data-result]');
  await expect(result).toBeVisible();
  await expect(result.locator('[data-value]')).toHaveText('6.50%');
  await expect(result.locator('[data-effective]')).toHaveText('January 1, 2018');
  await expect(result.locator('[data-page-link]')).toHaveAttribute(
    'href',
    '/rates/tennessee-judgment-rate/',
  );

  await result.getByRole('button', { name: 'Copy result with citation' }).click();
  await expect(result.locator('[data-copy-status]')).toHaveText('Copied');
  await expect.poll(() => page.evaluate(() => window.__statuteRatesCopiedText)).toContain(
    'Tennessee post-judgment interest: 6.50% per year',
  );

  const csvLink = result.getByRole('link', { name: 'Download the recorded history (CSV)' });
  await expect(csvLink).toHaveAttribute(
    'href',
    '/api/v1/entity/tennessee-judgment-rate.csv',
  );
  const csvHref = await csvLink.getAttribute('href');
  await page.evaluate(() => {
    document.querySelector('[data-csv-link]').addEventListener('click', (event) => {
      event.preventDefault();
      window.__statuteRatesCsvClick = event.currentTarget.getAttribute('href');
    }, { once: true });
  });
  await csvLink.click();
  await expect.poll(() => page.evaluate(() => window.__statuteRatesCsvClick)).toBe(csvHref);
  const csvResponse = await request.get(new URL(csvHref, page.url()).href);
  expect(csvResponse.status()).toBe(200);
  const csv = await csvResponse.text();
  expect(csv).toContain('series,metric,effective_date,value_percent');
  expect(csv).toContain('tennessee-judgment-rate,annual_rate,2018-01-01,6.5');

  // The history tool must fail closed outside the verified source range rather than silently using
  // the oldest available rate.
  await page.getByLabel('Historical reference date').fill('2010-01-01');
  await page.getByRole('button', { name: 'Look up historical rate' }).click();
  await expect(page.locator('[data-rate-lookup] [data-error]')).toContainText(
    'Choose a date from 2012-07-01 through',
  );
  await expect(result).toBeHidden();
});

test('Florida calculator renders the audited schedule and copy/print actions', async ({ page }) => {
  await page.goto('/calculators/florida-judgment-interest/');

  await page.getByLabel('Unpaid money amount entered in the judgment ($)').fill('10000');
  await page.getByLabel('Clerk-entered judgment date').fill('2024-07-01');
  await page.getByLabel('Calculate through').fill('2025-12-31');
  await page.getByRole('button', { name: 'Calculate Florida interest' }).click();

  const result = page.locator('[data-florida-calculator] [data-result]');
  await expect(result).toBeVisible();
  await expect(result.locator('[data-interest]')).toHaveText('$1,413.58');
  await expect(result.locator('[data-total]')).toHaveText('$11,413.58');
  await expect(result.locator('[data-days]')).toHaveText('549');
  await expect(result.getByRole('row')).toHaveCount(3);

  await result.getByRole('button', { name: 'Copy result' }).click();
  await expect(result.locator('[data-copy-status]')).toHaveText('Result copied.');
  await expect.poll(() => page.evaluate(() => window.__statuteRatesCopiedText)).toContain(
    'Interest: $1,413.58',
  );

  await page.evaluate(() => {
    window.__statuteRatesPrintCalled = false;
    window.print = () => {
      window.__statuteRatesPrintCalled = true;
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await result.getByRole('button', { name: 'Print / save as PDF' }).click();
  await expect.poll(() => page.evaluate(() => window.__statuteRatesPrintCalled)).toBe(true);
});

test('federal calculator selects the preceding calendar-week rate', async ({ page }) => {
  await page.goto('/calculators/post-judgment-interest/');

  await page.getByLabel('Judgment amount ($)').fill('100000');
  await page.getByLabel('Date judgment was entered').fill('2025-01-08');
  await page.getByLabel('Calculate through (exclusive payment boundary)').fill('2026-01-08');
  await page.getByRole('button', { name: 'Calculate interest' }).click();

  const result = page.locator('#federal-post-judgment-calculator [data-calc-result]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('Interest: $4,170.00');
  await expect(result).toContainText('Total due: $104,170.00 over 365 days');
  await expect(result).toContainText('Rate applied: 4.17%');
  await expect(result).toContainText('source week beginning 2024-12-30');
});

test('IRS interest calculator applies the released quarterly rate path', async ({ page }) => {
  await page.goto('/calculators/irs-interest/');

  await page.getByLabel('Rate series').selectOption('underpayment');
  await page.getByLabel('Tax amount owed (or overpaid) ($)').fill('10000');
  await page.getByLabel('Start date (e.g. return due date)').fill('2025-01-01');
  await page.getByLabel('Calculated through (e.g. payment date)').fill('2026-01-01');
  await page.getByRole('button', { name: 'Calculate interest' }).click();

  const result = page.locator('[data-calc] [data-calc-result]');
  await expect(result).toBeVisible();
  await expect(result).toContainText('Interest: $725.01');
  await expect(result).toContainText('Total due: $10,725.01 over 365 days');
  await expect(result).toContainText('7% from 2025-01-01');
  await expect(result).toContainText('7% from 2025-10-01');
  await expect(result).toContainText('compounded daily');
});

test('IRS Form 1040 calculator exposes the modeled components and printable result', async ({ page }) => {
  await page.goto('/calculators/irs-penalty-and-interest/');

  await page.getByLabel('Unpaid tax at the original deadline ($)').fill('10000');
  await page.getByLabel('Original payment due date').fill('2025-04-15');
  await page.getByLabel('Filing deadline that applied').fill('2025-04-15');
  await page.getByLabel('Date filed (or assumed filing date)').fill('2025-06-20');
  await page.getByLabel('Calculate through').fill('2025-07-15');
  await page.getByRole('button', { name: 'Estimate IRS charges' }).click();

  const result = page.locator('[data-irs-penalty-calc] [data-result]');
  await expect(result).toBeVisible();
  await expect(result.locator('[data-modeled-total]')).toHaveText('$11,699.80');
  await expect(result.locator('[data-ftf]')).toHaveText('$1,350.00');
  await expect(result.locator('[data-ftp]')).toHaveText('$150.00');
  await expect(result.locator('[data-tax-interest]')).toHaveText('$176.04');
  await expect(result).toContainText('This is not an official IRS payoff.');

  await page.evaluate(() => {
    window.__statuteRatesPrintCalled = false;
    window.print = () => {
      window.__statuteRatesPrintCalled = true;
      window.dispatchEvent(new Event('afterprint'));
    };
  });
  await result.getByRole('button', { name: 'Print / save as PDF' }).click();
  await expect.poll(() => page.evaluate(() => window.__statuteRatesPrintCalled)).toBe(true);
});

test('primary navigation remains usable without horizontal overflow on a phone viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/about/');

  const navigation = page.getByRole('navigation', { name: 'Primary' });
  await expect(navigation).toBeVisible();
  for (const label of ['Rates', 'States', 'Calculators', 'Guides', 'Data & API', 'About']) {
    const link = navigation.getByRole('link', { name: label, exact: true });
    await expect(link).toBeVisible();
    const box = await link.boundingBox();
    expect(box, `${label} should have a rendered mobile hit target`).toBeTruthy();
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  expect(await navigation.evaluate((node) => node.scrollWidth <= node.clientWidth)).toBe(true);
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await navigation.getByRole('link', { name: 'Calculators', exact: true }).click();
  await expect(page).toHaveURL(/\/calculators\/$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(
    'Interest calculators and benchmarks',
  );
});

test('monetization stays enabled only on source-approved routes', async ({ page }) => {
  const loader = 'script[src^="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"]';
  const expectedClient = process.env.EXPECT_ADSENSE_CLIENT || '';
  const expectedSlot = process.env.EXPECT_ADSENSE_SLOT || '';

  await page.goto('/rates/tennessee-judgment-rate/');
  await expect(page.locator('body')).toHaveAttribute('data-monetization', 'eligible');
  const account = page.locator('meta[name="google-adsense-account"]');
  const adsConfigured = await account.count();
  await expect(page.locator(loader)).toHaveCount(adsConfigured ? 1 : 0);
  if (expectedClient) {
    await expect(account).toHaveAttribute('content', expectedClient);
    await expect(page.locator(loader)).toHaveCount(1);
  }
  if (expectedSlot) {
    await expect(page.getByRole('complementary', { name: 'Advertisement' })).toHaveCount(2);
    await expect(page.locator('ins.adsbygoogle').first()).toHaveAttribute('data-ad-slot', expectedSlot);
  }

  for (const route of [
    '/rates/indiana-judgment-rate/',
    '/calculators/',
    '/api/',
    '/privacy/',
  ]) {
    await page.goto(route);
    await expect(page.locator('body')).toHaveAttribute('data-monetization', 'disabled');
    await expect(page.locator(loader)).toHaveCount(0);
    await expect(page.getByRole('complementary', { name: 'Advertisement' })).toHaveCount(0);
  }
});
