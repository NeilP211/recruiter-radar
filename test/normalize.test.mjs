import { test } from 'node:test';
import assert from 'node:assert/strict';

import { makeEvent, dedupe, sameEvent, titleTokens } from '../scripts/lib/normalize.mjs';

const ev = (source, id, title, start, extra = {}) =>
  makeEvent({ source, sourceId: id, title, start, description: extra.description ?? '', ...extra });

test('makeEvent rejects events with no start or no title', () => {
  assert.equal(makeEvent({ source: 'heellife', sourceId: '1', title: 'x', start: 'nope' }), null);
  assert.equal(makeEvent({ source: 'heellife', sourceId: '1', title: '   ', start: '2026-09-16T21:00:00Z' }), null);
});

test('makeEvent assigns campus by source and spots virtual events', () => {
  const e = ev('duke', '9', 'Tech talk', '2026-09-16T21:00:00Z', { venue: 'Zoom' });
  assert.equal(e.campus, 'Duke');
  assert.equal(e.virtual, true);
  assert.equal(ev('ncsu', '1', 'x', '2026-09-16T21:00:00Z').campus, 'NC State');
});

test('makeEvent drops an end time that comes before the start', () => {
  const e = ev('heellife', '1', 'x', '2026-09-16T21:00:00Z', { end: '2026-09-16T20:00:00Z' });
  assert.equal(e.end, null);
});

test('the same career fair under three titles collapses to one listing', () => {
  const start = '2026-09-16T14:00:00Z';
  const out = dedupe([
    ev('heellife', '1', 'Fall Jobs & Internships Career Fair 2026', start),
    ev('localist', '2', 'UNC Career Center Fall Jobs and Internships Career Fair', start),
    ev('careerhub', '3', 'UNC Career Center Fall Jobs & Internships Career Fair 2026', start),
  ]);
  assert.equal(out.length, 1);
  assert.equal(out[0].source, 'careerhub', 'the Career Hub runs the fair, so its copy wins');
  assert.deepEqual(out[0].alsoListed.sort(), ['heellife', 'localist']);
});

test('the CS department and Career Hub titles for one fair are matched', () => {
  const a = ev('unccs', '1', 'UNC CS Tech Career Fair (In-Person)', '2026-09-16T21:30:00Z');
  const b = ev('careerhub', '2', 'UNC Computer Science Fall 2026 Tech Career Fair (Night Two: In-Person)', '2026-09-16T21:30:00Z');
  assert.equal(sameEvent(a, b), true);
});

test('an all-day hackathon listing matches the club listing that has a start time', () => {
  const a = ev('unccs', '1', 'HackNC 2026', '2026-10-10T04:00:00Z', { allDay: true });
  const b = ev('heellife', '2', 'HackNC', '2026-10-10T13:00:00Z');
  assert.equal(sameEvent(a, b), true);
});

test('an acronym title matches the full name on the same day', () => {
  const a = ev('unccs', '1', 'Carolina Data Challenge 2026', '2026-09-26T04:00:00Z', { allDay: true });
  const b = ev('heellife', '2', 'CDC 2026', '2026-09-26T14:00:00Z');
  assert.equal(sameEvent(a, b), true);
});

test('different events on the same evening stay separate', () => {
  const a = ev('unccs', '1', 'UNC CS Career Panel: What is an AI Engineer?', '2026-09-23T22:00:00Z');
  const b = ev('careerhub', '2', 'UNC CS Career Panel: Jobs in ML and AI', '2026-09-23T22:00:00Z');
  const c = ev('heellife', '3', 'App Team Interest Meeting', '2026-09-23T22:00:00Z');
  assert.equal(sameEvent(a, c), false);
  assert.equal(dedupe([a, c]).length, 2);
  assert.ok(titleTokens(b.title).has('computer'));
});

test('the same title on different days is two events (a two-day fair)', () => {
  const a = ev('heellife', '1', 'Fall Jobs & Internships Career Fair 2026', '2026-09-16T14:00:00Z');
  const b = ev('heellife', '2', 'Fall Jobs & Internships Career Fair 2026', '2026-09-17T14:00:00Z');
  assert.equal(dedupe([a, b]).length, 2);
});
