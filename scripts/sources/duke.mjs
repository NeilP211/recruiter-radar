// calendar.duke.edu publishes its whole calendar as one JSON document (a Bedework feed).
// Duke career and engineering events are usually open to Triangle students, and tech employers
// run sessions there that never reach UNC.

import { getJson } from '../lib/fetch.mjs';
import { makeEvent } from '../lib/normalize.mjs';

export const meta = { key: 'duke', label: 'Duke Calendar', home: 'https://calendar.duke.edu' };

export function mapItem(e) {
  if (!e || (e.status && e.status !== 'CONFIRMED')) return null;
  const address = e.location?.address || null;
  return makeEvent({
    source: meta.key,
    sourceId: String(e.id),
    title: e.summary,
    description: e.description,
    start: e.start_timestamp,
    end: e.end_timestamp,
    allDay: Boolean(e.allday),
    venue: address,
    virtual: /\bonline\b|\bzoom\b|\bvirtual\b/i.test(address || ''),
    org: e.sponsor || null,
    url: e.event_url || e.link,
  });
}

export async function fetchEvents({ days = 150, now = new Date() } = {}) {
  const data = await getJson(`${meta.home}/events/index.json?future_days=${days}&feed_type=simple`, { timeout: 60_000 });
  const floor = now.getTime() - 12 * 3600_000;
  return (data.events || [])
    .map(mapItem)
    // The feed includes long-running exhibits that started months ago.
    .filter((e) => e && Date.parse(e.start) >= floor);
}
