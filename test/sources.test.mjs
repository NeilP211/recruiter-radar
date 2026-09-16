import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import * as tribe from '../scripts/sources/tribe.mjs';
import * as localist from '../scripts/sources/localist.mjs';
import * as duke from '../scripts/sources/duke.mjs';
import * as heellife from '../scripts/sources/heellife.mjs';
import * as watch from '../scripts/sources/watch.mjs';

const fixture = (name) => JSON.parse(readFileSync(new URL(`./fixtures/${name}`, import.meta.url), 'utf8'));

test('Career Hub events map with UTC times and a public link', () => {
  const [fair] = fixture('careerhub.json').events.map((e) => tribe.mapItem(tribe.SITES[0], e));
  assert.match(fair.title, /Tech Career Fair/);
  assert.equal(fair.start, '2026-09-16T21:30:00.000Z');
  assert.equal(fair.campus, 'UNC');
  assert.match(fair.url, /^https:\/\/careerhub\.unc\.edu\/event\//);
  assert.ok(fair.org);
});

test('UNC CS department events map, including all-day hackathons', () => {
  const events = fixture('unccs.json').events.map((e) => tribe.mapItem(tribe.SITES[1], e));
  const hack = events.find((e) => /HackNC/.test(e.title));
  assert.ok(hack);
  assert.equal(hack.source, 'unccs');
  assert.equal(hack.id.startsWith('unccs:'), true);
});

test('Duke feed maps and skips cancelled events', () => {
  const events = fixture('duke.json').events.map(duke.mapItem).filter(Boolean);
  assert.equal(events.length, 2, 'the CANCELLED screening is skipped');
  const openai = events.find((e) => e.title === 'OpenAI Day');
  assert.equal(openai.campus, 'Duke');
  assert.equal(openai.start, '2026-09-28T22:00:00.000Z');
  assert.ok(openai.url);
});

test('NC State Localist events map one entry per instance', () => {
  const events = fixture('ncsu.json').events.flatMap((w) => localist.mapItem(localist.SITES[1], w.event));
  assert.ok(events.length >= 2);
  assert.ok(events.every((e) => e.campus === 'NC State' && e.url.startsWith('https://calendar.ncsu.edu/')));
});

test('Heel Life maps the real Tesla listings', () => {
  const events = fixture('heellife.json').value.map(heellife.mapItem).filter(Boolean);
  const tesla = events.find((e) => /Supercharging/.test(e.title));
  assert.equal(tesla.url, 'https://heellife.unc.edu/event/12737755');
  assert.equal(tesla.virtual, true);
  assert.equal(tesla.org, 'UNC Career Center');
});

test('JSON-LD events are found at the top level and inside @graph', () => {
  const html = `
    <script type="application/ld+json">{"@context":"https://schema.org","@type":"Event","name":"Tesla x University of North Carolina, Chapel Hill | Supercharging Your Resume","startDate":"2026-07-28T00:00:00+00:00","eventAttendanceMode":"https://schema.org/OnlineEventAttendanceMode","location":{"@type":"VirtualLocation"}}</script>
    <script type="application/ld+json">{"@graph":[{"@type":"Organization","name":"X"},{"@type":"BusinessEvent","name":"Info Session","startDate":"2026-10-01T22:00:00Z"}]}</script>
    <script type="application/ld+json">not json</script>`;
  const nodes = watch.extractJsonLdEvents(html);
  assert.equal(nodes.length, 2);
  const ev = watch.mapJsonLd({ url: 'https://www.tesla.com/event/ncch-resume', start: '2026-09-16T21:00:00Z' }, nodes[0]);
  assert.equal(ev.start, '2026-09-16T21:00:00.000Z', 'a hand-entered start overrides the sign-up window');
  assert.equal(ev.virtual, true);
  assert.equal(ev.campus, 'Company');
});
