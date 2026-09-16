// iCalendar writer shared by the ingest script (the subscribable high.ics feed) and the site
// (per-event "Add to calendar" downloads). RFC 5545: CRLF line ends, escaped text, folded lines.

export function escapeText(value = '') {
  return String(value)
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/** 2026-09-16T21:00:00.000Z -> 20260916T210000Z */
export function toIcsDate(iso) {
  return new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

/** Fold at 73 characters so multi-byte text stays safely under the 75 octet limit. */
export function fold(line) {
  const parts = [];
  let rest = line;
  while (rest.length > 73) {
    parts.push(rest.slice(0, 73));
    rest = ` ${rest.slice(73)}`;
  }
  parts.push(rest);
  return parts.join('\r\n');
}

export function vevent(event, stamp = new Date().toISOString()) {
  const end = event.end || new Date(Date.parse(event.start) + 3600_000).toISOString();
  const where = [event.virtual ? 'Virtual' : null, event.venue].filter(Boolean).join(', ');
  const why = event.reasons?.length ? `Why it matters: ${event.reasons.join(', ')}\n\n` : '';
  const lines = [
    'BEGIN:VEVENT',
    `UID:${escapeText(event.id)}@recruiter-radar`,
    `DTSTAMP:${toIcsDate(stamp)}`,
    `DTSTART:${toIcsDate(event.start)}`,
    `DTEND:${toIcsDate(end)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(`${why}${event.description || ''}${event.url ? `\n\n${event.url}` : ''}`)}`,
    where ? `LOCATION:${escapeText(where)}` : null,
    event.url ? `URL:${event.url}` : null,
    'END:VEVENT',
  ].filter(Boolean);
  return lines.map(fold).join('\r\n');
}

export function buildCalendar(events, { name = 'Recruiter Radar', stamp } = {}) {
  return [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Recruiter Radar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(name)}`,
    'X-WR-TIMEZONE:America/New_York',
    ...events.map((e) => vevent(e, stamp)),
    'END:VCALENDAR',
    '',
  ].join('\r\n');
}
