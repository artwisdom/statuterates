// Curated official histories for two state-court schedules whose public pages expose durable tables.
// These are reference histories, not payoff rules: Michigan complaint-vintage branches and New
// Jersey's historical monetary limits remain outside automated calculation.

export const MICHIGAN_TREASURY_HISTORY_URL =
  'https://www.michigan.gov/taxes/interest-rates-for-money-judgments';
export const NEW_JERSEY_RATE_HISTORY_URL =
  'https://www.njcourts.gov/sites/default/files/courts/civil/postprejudgmentrates.pdf';

// [effective date, official five-year Treasury benchmark, general MCL 600.6013 rate]
const MICHIGAN_TUPLES = Object.freeze([
  ['1987-01-01', 6.660, 7.660], ['1987-07-01', 7.500, 8.500],
  ['1988-01-01', 8.390, 9.390], ['1988-07-01', 8.210, 9.210],
  ['1989-01-01', 9.005, 10.005], ['1989-07-01', 9.105, 10.105],
  ['1990-01-01', 8.015, 9.015], ['1990-07-01', 8.535, 9.535],
  ['1991-01-01', 8.260, 9.260], ['1991-07-01', 7.715, 8.715],
  ['1992-01-01', 7.002, 8.002], ['1992-07-01', 6.680, 7.680],
  ['1993-01-01', 5.797, 6.797], ['1993-07-01', 5.313, 6.313],
  ['1994-01-01', 5.025, 6.025], ['1994-07-01', 6.128, 7.128],
  ['1995-01-01', 7.380, 8.380], ['1995-07-01', 6.813, 7.813],
  ['1996-01-01', 5.953, 6.953], ['1996-07-01', 6.162, 7.162],
  ['1997-01-01', 6.340, 7.340], ['1997-07-01', 6.497, 7.497],
  ['1998-01-01', 5.920, 6.920], ['1998-07-01', 5.601, 6.601],
  ['1999-01-01', 4.834, 5.834], ['1999-07-01', 5.067, 6.067],
  ['2000-01-01', 5.756, 6.756], ['2000-07-01', 6.473, 7.473],
  ['2001-01-01', 5.965, 6.965], ['2001-07-01', 4.782, 5.782],
  ['2002-01-01', 4.140, 5.140], ['2002-07-01', 4.360, 5.360],
  ['2003-01-01', 3.189, 4.189], ['2003-07-01', 2.603, 3.603],
  ['2004-01-01', 3.295, 4.295], ['2004-07-01', 3.357, 4.357],
  ['2005-01-01', 3.529, 4.529], ['2005-07-01', 3.845, 4.845],
  ['2006-01-01', 4.221, 5.221], ['2006-07-01', 4.815, 5.815],
  ['2007-01-01', 4.701, 5.701], ['2007-07-01', 4.741, 5.741],
  ['2008-01-01', 4.033, 5.033], ['2008-07-01', 3.063, 4.063],
  ['2009-01-01', 2.695, 3.695], ['2009-07-01', 2.101, 3.101],
  ['2010-01-01', 2.480, 3.480], ['2010-07-01', 2.339, 3.339],
  ['2011-01-01', 1.553, 2.553], ['2011-07-01', 2.007, 3.007],
  ['2012-01-01', 1.083, 2.083], ['2012-07-01', 0.871, 1.871],
  ['2013-01-01', 0.687, 1.687], ['2013-07-01', 0.944, 1.944],
  ['2014-01-01', 1.452, 2.452], ['2014-07-01', 1.622, 2.622],
  ['2015-01-01', 1.678, 2.678], ['2015-07-01', 1.468, 2.468],
  ['2016-01-01', 1.571, 2.571], ['2016-07-01', 1.337, 2.337],
  ['2017-01-01', 1.426, 2.426], ['2017-07-01', 1.902, 2.902],
  ['2018-01-01', 1.984, 2.984], ['2018-07-01', 2.687, 3.687],
  ['2019-01-01', 2.848, 3.848], ['2019-07-01', 2.235, 3.235],
  ['2020-01-01', 1.617, 2.617], ['2020-07-01', 0.699, 1.699],
  ['2021-01-01', 0.330, 1.330], ['2021-07-01', 0.739, 1.739],
  ['2022-01-01', 1.045, 2.045], ['2022-07-01', 2.458, 3.458],
  ['2023-01-01', 3.743, 4.743], ['2023-07-01', 3.762, 4.762],
  ['2024-01-01', 4.392, 5.392], ['2024-07-01', 4.359, 5.359],
  ['2025-01-01', 4.016, 5.016], ['2025-07-01', 4.083, 5.083],
  ['2026-01-01', 3.725, 4.725], ['2026-07-01', 3.959, 4.959],
]);

// [effective date, Rule 4:42-11 base rate]
const NEW_JERSEY_TUPLES = Object.freeze([
  ['1975-04-01', 8], ['1981-09-14', 12], ['1986-01-02', 9.5],
  ['1987-01-01', 7.5], ['1988-01-01', 6], ['1989-01-01', 7],
  ['1990-01-01', 8], ['1991-01-01', 8.5], ['1992-01-01', 7.5],
  ['1993-01-01', 5.5], ['1994-01-01', 3.5], ['1995-01-01', 3.5],
  ['1996-01-01', 5.5], ['1997-01-01', 5.5], ['1998-01-01', 5.5],
  ['1999-01-01', 5.5], ['2000-01-01', 5], ['2001-01-01', 5.5],
  ['2002-01-01', 6], ['2003-01-01', 3], ['2004-01-01', 2],
  ['2005-01-01', 1], ['2006-01-01', 2], ['2007-01-01', 4],
  ['2008-01-01', 5.5], ['2009-01-01', 4], ['2010-01-01', 1.5],
  ['2011-01-01', 0.5], ['2012-01-01', 0.5], ['2013-01-01', 0.25],
  ['2014-01-01', 0.25], ['2015-01-01', 0.25], ['2016-01-01', 0.25],
  ['2017-01-01', 0.5], ['2018-01-01', 0.5], ['2019-01-01', 1.5],
  ['2020-01-01', 2.5], ['2021-01-01', 1.5], ['2022-01-01', 0.25],
  ['2023-01-01', 0.25], ['2024-01-01', 3.5], ['2025-01-01', 5.5],
  ['2026-01-01', 4.5],
]);

const cleanPercent = (value) => `${value.toFixed(3).replace(/\.?0+$/, '')}%`;

export function buildMichiganOfficialHistory() {
  const rows = MICHIGAN_TUPLES.map(([effective_date, index_value, value]) => {
    if (Math.abs(value - (index_value + 1)) > 1e-9) {
      throw new Error(`Michigan history formula mismatch at ${effective_date}`);
    }
    return {
      effective_date,
      index_value,
      value,
      value_text: `${value.toFixed(3)}%`,
      source_url: MICHIGAN_TREASURY_HISTORY_URL,
    };
  });
  if (rows.length !== 80 || rows[0].effective_date !== '1987-01-01'
      || rows.at(-1).effective_date !== '2026-07-01') {
    throw new Error('Michigan official history boundary or count changed');
  }
  return rows;
}

function newJerseyRows({ prejudgment = false } = {}) {
  const rows = NEW_JERSEY_TUPLES
    .filter(([effectiveDate]) => !prejudgment || effectiveDate >= '1988-01-01')
    .flatMap(([effective_date, value]) => {
      const baseRow = {
        effective_date,
        value,
        value_text: effective_date >= '1997-01-01'
          ? `${cleanPercent(value)} / ${cleanPercent(value + 2)}`
          : cleanPercent(value),
        source_url: NEW_JERSEY_RATE_HISTORY_URL,
      };
      if (effective_date !== '1996-01-01') return [baseRow];
      return [
        baseRow,
        {
          ...baseRow,
          effective_date: '1996-09-01',
          value_text: `${cleanPercent(value)} / ${cleanPercent(value + 2)}`,
        },
      ];
    });
  return rows;
}

export function buildNewJerseyPostJudgmentHistory() {
  const rows = newJerseyRows();
  if (rows.length !== 44 || rows[0].effective_date !== '1975-04-01'
      || rows.at(-1).effective_date !== '2026-01-01') {
    throw new Error('New Jersey postjudgment history boundary or count changed');
  }
  return rows;
}

export function buildNewJerseyPrejudgmentHistory() {
  const rows = newJerseyRows({ prejudgment: true });
  if (rows.length !== 40 || rows[0].effective_date !== '1988-01-01'
      || rows.at(-1).effective_date !== '2026-01-01') {
    throw new Error('New Jersey prejudgment history boundary or count changed');
  }
  return rows;
}
