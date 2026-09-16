// heellife.unc.edu (Campus Labs Engage). Every UNC student org posts here, and so does the UNC
// Career Center for employer sessions like "Tesla x UNC". Same public API HeelSeek uses.

import { getJson, sleep } from '../lib/fetch.mjs';
import { makeEvent } from '../lib/normalize.mjs';

const BASE = 'https://heellife.unc.edu/api/discovery/event/search';
const PAGE_SIZE = 250;
const MAX_PAGES = 20;

export const meta = { key: 'heellife', label: 'Heel Life', home: 'https://heellife.unc.edu/events' };

export function mapItem(it) {
  if (it.visibility && it.visibility !== 'Public') return null;
  return makeEvent({
    source: meta.key,
    sourceId: String(it.id),
    title: it.name,
    description: it.description,
    start: it.startsOn,
    end: it.endsOn,
    venue: it.location,
    virtual: /^online$/i.test(it.location || ''),
    org: it.organizationName,
    url: `https://heellife.unc.edu/event/${it.id}`,
  });
}

export async function fetchEvents({ since = new Date().toISOString() } = {}) {
  const events = [];
  let skip = 0;
  for (let page = 0; page < MAX_PAGES; page++) {
    const params = new URLSearchParams({
      endsAfter: since, orderByField: 'endsOn', orderByDirection: 'ascending',
      status: 'Approved', take: String(PAGE_SIZE), skip: String(skip),
    });
    const data = await getJson(`${BASE}?${params}`);
    const items = data.value || [];
    if (items.length === 0) break;
    for (const it of items) {
      const ev = mapItem(it);
      if (ev) events.push(ev);
    }
    skip += items.length;
    if (skip >= (data['@odata.count'] ?? items.length)) break;
    await sleep(250);
  }
  return events;
}
