// Localist calendars with an open JSON API: UNC's umbrella calendar and NC State's.

import { getJson, sleep } from '../lib/fetch.mjs';
import { makeEvent } from '../lib/normalize.mjs';

const PER_PAGE = 100;
const MAX_PAGES = 15;
const MAX_INSTANCES = 10;

export const SITES = [
  { key: 'localist', label: 'UNC Calendar', home: 'https://calendar.unc.edu', api: 'https://calendar.unc.edu/api/2/events' },
  { key: 'ncsu', label: 'NC State Calendar', home: 'https://calendar.ncsu.edu', api: 'https://calendar.ncsu.edu/api/2/events' },
];

export function mapItem(site, e) {
  if (!e || e.status === 'canceled' || e.private) return [];
  const instances = (e.event_instances || []).map((i) => i.event_instance).filter(Boolean);
  const pool = instances.length ? instances.slice(0, MAX_INSTANCES) : [null];
  const out = [];
  for (const inst of pool) {
    const ev = makeEvent({
      source: site.key,
      sourceId: inst?.id ? `${e.id}-${inst.id}` : String(e.id),
      title: e.title,
      description: e.description_text || e.description,
      start: inst?.start || e.first_date,
      end: inst?.end || null,
      allDay: Boolean(inst?.all_day),
      venue: e.location_name || e.location,
      virtual: e.experience === 'virtual',
      org: (e.departments || [])[0]?.name || (e.groups || [])[0]?.name || null,
      url: e.localist_url || e.url,
    });
    if (ev) out.push(ev);
  }
  return out;
}

export async function fetchSite(site, { days = 150 } = {}) {
  const events = [];
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await getJson(`${site.api}?days=${days}&pp=${PER_PAGE}&page=${page}`);
    const items = data.events || [];
    for (const w of items) events.push(...mapItem(site, w.event));
    if (items.length === 0 || page >= (data.page?.total ?? 1)) break;
    await sleep(250);
  }
  return events;
}
