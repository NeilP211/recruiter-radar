import { SOURCE_LABELS } from '../lib/format.js';

/** Companies first, then the other reasons, as square tags. */
export function Tags({ event }) {
  const companies = event.companies || [];
  const rest = (event.reasons || []).filter((r) => !r.split(', ').every((p) => companies.includes(p)));
  if (!companies.length && !rest.length) return null;
  return (
    <ul className="tags" aria-label="Why this is listed">
      {companies.map((c) => <li key={`c-${c}`} className="tag tag-co">{c}</li>)}
      {rest.map((r) => <li key={`r-${r}`} className="tag">{r}</li>)}
    </ul>
  );
}

export function where(event) {
  const bits = [];
  if (event.virtual) bits.push('Virtual');
  if (event.venue && !(event.virtual && /^(online|virtual|zoom)\b/i.test(event.venue))) bits.push(event.venue);
  bits.push(event.campus === 'Company' ? 'Company event' : event.campus);
  return bits.join(' · ');
}

export const via = (event) => SOURCE_LABELS[event.source] || event.source;
