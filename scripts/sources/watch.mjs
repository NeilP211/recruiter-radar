// Company event pages added by hand in data/watch.json. Most company sites mark an event up with
// schema.org Event JSON-LD, so one parser covers them. Any field can be overridden in the watch
// entry, which matters for pages like Tesla's where startDate is the sign-up window, not the event.

import { readFile } from 'node:fs/promises';
import { getText, sleep } from '../lib/fetch.mjs';
import { makeEvent } from '../lib/normalize.mjs';

export const meta = { key: 'watch', label: 'Company pages', home: 'https://github.com/NeilP211/recruiter-radar/blob/main/data/watch.json' };

/** Every schema.org Event in the page's JSON-LD blocks, including inside @graph arrays. */
export function extractJsonLdEvents(html) {
  const out = [];
  const re = /<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    let data;
    try { data = JSON.parse(m[1].trim()); } catch { continue; }
    const stack = Array.isArray(data) ? [...data] : [data];
    while (stack.length) {
      const node = stack.shift();
      if (!node || typeof node !== 'object') continue;
      if (Array.isArray(node['@graph'])) stack.push(...node['@graph']);
      const type = [].concat(node['@type'] || []);
      if (type.some((t) => /Event$/.test(t))) out.push(node);
    }
  }
  return out;
}

export function mapJsonLd(entry, node, index = 0) {
  const loc = node.location || {};
  const virtual = /Online/i.test(node.eventAttendanceMode || '') || loc['@type'] === 'VirtualLocation';
  return makeEvent({
    source: meta.key,
    sourceId: `${entry.id || entry.url}#${index}`,
    title: entry.title || node.name,
    description: entry.description || node.description || '',
    start: entry.start || node.startDate,
    end: entry.end || node.endDate,
    venue: entry.venue || (virtual ? 'Virtual' : loc.name || null),
    virtual: entry.virtual ?? virtual,
    org: entry.org || node.organizer?.name || null,
    url: entry.url,
  });
}

export async function fetchEvents({ file = new URL('../../data/watch.json', import.meta.url) } = {}) {
  const entries = JSON.parse(await readFile(file, 'utf8'));
  const events = [];
  const failures = [];
  for (const entry of entries) {
    try {
      const html = await getText(entry.url, { retries: 1 });
      const nodes = extractJsonLdEvents(html);
      if (nodes.length === 0 && entry.title && entry.start) nodes.push({});
      nodes.forEach((n, i) => { const ev = mapJsonLd(entry, n, i); if (ev) events.push(ev); });
    } catch (err) {
      // A page that blocks scripts can still be listed from the hand-entered fields.
      if (entry.title && entry.start) {
        const ev = mapJsonLd(entry, {}, 0);
        if (ev) events.push(ev);
      } else {
        failures.push(`${entry.url}: ${err.message}`);
      }
    }
    await sleep(400);
  }
  if (failures.length && events.length === 0 && entries.length) {
    throw new Error(`no watch page could be read (${failures[0]})`);
  }
  return events;
}
