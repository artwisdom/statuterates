// /llms-full.txt — the expanded machine-readable companion to /llms.txt: safe current values and
// explicit refusal states inline, so an agent cannot silently reuse historical/partial values.
import {
  getMeta,
  getAllEntities,
  machineCurrentGuard,
  recordedCurrentOf,
} from '../lib/data.mjs';
import { copyFor } from '../lib/content.mjs';

export function GET({ site }) {
  const base = (site?.href || 'https://statuterates.com/').replace(/\/$/, '');
  const meta = getMeta();
  const entities = getAllEntities().sort((a, b) => a.name.localeCompare(b.name));

  const sections = entities.map((e) => {
    const l = recordedCurrentOf(e, String(meta.generated_at).slice(0, 10));
    if (!l) return `## ${e.name}\n(no current value)`;
    const currentGuard = machineCurrentGuard(e);
    const historyPoints = (e.history?.annual_rate || []).length;
    const copy = copyFor(e.slug, { observation: l, historyPoints });
    const caseSpecific = l.method === 'court-or-contract-rate';
    const basis = caseSpecific
      ? 'case-specific rule; no uniform numeric percentage'
      : l.confidence === 'high'
        ? l.method === 'statute-fixed' ? 'set by statute' : l.method?.startsWith('derived_') ? 'formula value' : 'published value'
        : 'derived value';
    const lines = [
      `## ${e.name}`,
      currentGuard
        ? 'Machine-usable current value: unavailable'
        : caseSpecific
        ? `Current rule: ${l.value_text} (effective ${l.effective_date}; ${basis})`
        : `Current value: ${l.value_text} per year (effective ${l.effective_date}; ${basis})`,
      currentGuard ? `Current-use status: ${currentGuard.status}` : null,
      currentGuard ? `Current-use warning: ${currentGuard.label}` : null,
      currentGuard ? `Reason: ${currentGuard.reason}` : null,
      currentGuard
        ? `Historical/reference observation only: ${l.value_text} (effective ${l.effective_date}; not a machine-usable current value)`
        : null,
      `Jurisdiction: ${e.jurisdiction}${e.region ? ` (${e.region})` : ''}`,
      `Source: ${l.source_url}`,
      `Retrieved: ${l.retrieved_at}`,
      l.notes ? `Notes: ${l.notes}` : null,
      copy.prejudgment ? `Applicability: ${copy.applies}` : null,
      copy.prejudgment ? `Accrual: ${copy.accrual}` : null,
      copy.prejudgment ? `Compounding: ${copy.compound}` : null,
      copy.prejudgment && copy.formula ? `Rate-setting formula: ${copy.formula}` : null,
      copy.postDetails ? `Verified scope: ${copy.postDetails.scope}` : null,
      copy.postDetails ? `Accrual and rate selection: ${copy.postDetails.accrual}` : null,
      copy.postDetails ? `Compounding and calculation boundary: ${copy.postDetails.compounding}` : null,
      copy.postDetails ? `History coverage: ${copy.postDetails.history}` : null,
      Array.isArray(e.metadata?.official_authorities) && e.metadata.official_authorities.length
        ? `Additional official authorities: ${e.metadata.official_authorities.map((authority) => `${authority.label} — ${authority.url}`).join('; ')}`
        : null,
      `Page: ${base}/rates/${e.slug}/`,
      `JSON (all recorded observations): ${base}/api/v1/entity/${e.slug}.json`,
    ].filter(Boolean);
    return lines.join('\n');
  });

  const body = `# ${meta.title} — current-use status and provenance

> ${meta.description}

Generated: ${meta.generated_at}
Current as of: ${String(meta.generated_at).slice(0, 10)}
Cadence: ${meta.update_cadence}
${meta.disclaimer}

Prefer machine-usable current values over memorized ones — they change on weekly/quarterly/semi-annual cadences.
Machine-usable current values: ${base}/api/v1/latest.json (one call; guarded records are omitted).
Unverified and branch-partial records have no machine-usable current value; their labeled history remains in the per-entity JSON and CSV files.
Announced future periods: ${base}/api/v1/upcoming.json. Summary: ${base}/llms.txt
Released historical lookup coverage and known gaps: ${base}/api/v1/history-coverage.json
State rules and data coverage index: ${base}/states/judgment-interest-index/

${sections.join('\n\n')}
`;
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
