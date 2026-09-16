import { monthShort, dayNum, weekdayShort, timeLabel, relativeDay, SOURCE_LABELS } from '../lib/format.js';
import { downloadIcs } from '../lib/download.js';

export function Reasons({ event }) {
  const companies = new Set(event.companies || []);
  const chips = [];
  for (const c of event.companies || []) chips.push({ label: c, company: true });
  for (const r of event.reasons || []) {
    if (r.split(', ').every((part) => companies.has(part))) continue;
    chips.push({ label: r, company: false });
  }
  if (!chips.length) return null;
  return (
    <ul className="reasons" aria-label="Why this is listed">
      {chips.map((c) => <li key={c.label} className={c.company ? 'chip chip-company' : 'chip'}>{c.label}</li>)}
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

export default function EventCard({ event }) {
  const soon = relativeDay(event.start);
  const urgent = soon === 'Today' || soon === 'Tomorrow';
  return (
    <article className="card">
      <div className="datebox">
        <span className="mon">{monthShort(event.start)}</span>
        <span className="day">{dayNum(event.start)}</span>
        <span className="wd">{weekdayShort(event.start)}</span>
      </div>
      <div className="card-body">
        <p className={urgent ? 'when when-urgent' : 'when'}>
          <span>{soon}</span> <span className="dot" aria-hidden="true">/</span> {timeLabel(event)}
        </p>
        <h3>{event.url ? <a href={event.url} target="_blank" rel="noopener noreferrer">{event.title}</a> : event.title}</h3>
        <p className="meta">
          {event.org && <span>{event.org}</span>}
          <span>{where(event)}</span>
        </p>
        <Reasons event={event} />
        <div className="actions">
          {event.url && <a className="btn btn-primary" href={event.url} target="_blank" rel="noopener noreferrer">Details and sign up</a>}
          <button type="button" className="btn" onClick={() => downloadIcs(event)}>Add to calendar</button>
          <span className="via">via {SOURCE_LABELS[event.source] || event.source}</span>
        </div>
      </div>
    </article>
  );
}
