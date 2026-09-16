// WordPress sites running The Events Calendar expose a public REST route. Two of them matter here:
// the UNC Career Hub (career fairs and Handshake employer events mirrored in public) and the UNC
// Computer Science department (career panels, HackNC, mock interviews).

import { getJson, sleep } from '../lib/fetch.mjs';
import { makeEvent } from '../lib/normalize.mjs';

const PER_PAGE = 50;
const MAX_PAGES = 10;

export const SITES = [
  {
    key: 'careerhub',
    label: 'UNC Career Hub',
    home: 'https://careerhub.unc.edu/events/',
    api: 'https://careerhub.unc.edu/wp-json/tribe/events/v1/events',
    org: 'UNC Career Center',
  },
  {
    key: 'unccs',
    label: 'UNC Computer Science',
    home: 'https://cs.unc.edu/events/',
    api: 'https://cs.unc.edu/wp-json/tribe/events/v1/events',
    org: 'UNC Computer Science',
  },
];

export function mapItem(site, e) {
  if (e.hide_from_listings) return null;
  const venue = e.venue && !Array.isArray(e.venue) ? e.venue : {};
  const organizer = Array.isArray(e.organizer) && e.organizer[0]?.organizer;
  return makeEvent({
    source: site.key,
    sourceId: String(e.id),
    title: e.title,
    description: e.description || e.excerpt,
    // utc_* fields are unambiguous; the local ones carry no offset.
    start: e.utc_start_date ? `${e.utc_start_date.replace(' ', 'T')}Z` : e.start_date,
    end: e.utc_end_date ? `${e.utc_end_date.replace(' ', 'T')}Z` : e.end_date,
    allDay: Boolean(e.all_day),
    venue: venue.venue || null,
    virtual: Boolean(e.is_virtual),
    org: organizer || site.org,
    url: e.url,
  });
}

export async function fetchSite(site, { since = new Date() } = {}) {
  const events = [];
  const startDate = new Date(since).toISOString().slice(0, 10);
  for (let page = 1; page <= MAX_PAGES; page++) {
    const data = await getJson(`${site.api}?per_page=${PER_PAGE}&page=${page}&start_date=${startDate}&status=publish`);
    const items = data.events || [];
    for (const e of items) {
      const ev = mapItem(site, e);
      if (ev) events.push(ev);
    }
    if (items.length === 0 || page >= (data.total_pages ?? 1)) break;
    await sleep(300);
  }
  return events;
}
