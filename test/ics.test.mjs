import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildCalendar, escapeText, fold, toIcsDate } from '../src/lib/ics.js';

test('dates convert to UTC basic format', () => {
  assert.equal(toIcsDate('2026-09-16T21:00:00.000Z'), '20260916T210000Z');
});

test('text escaping covers commas, semicolons, backslashes and newlines', () => {
  assert.equal(escapeText('a, b; c\\d\ne'), 'a\\, b\; c\\\\d\\ne');
});

test('long lines fold with CRLF and a leading space', () => {
  const folded = fold(`SUMMARY:${'x'.repeat(200)}`);
  const lines = folded.split('\r\n');
  assert.ok(lines.length > 2);
  assert.ok(lines.slice(1).every((l) => l.startsWith(' ')));
  assert.ok(lines.every((l) => l.length <= 74));
});

test('a calendar has one VEVENT per event with a default one hour end', () => {
  const cal = buildCalendar([
    { id: 'heellife:1', title: 'Tesla x UNC', start: '2026-09-16T21:00:00.000Z', virtual: true, url: 'https://heellife.unc.edu/event/1', reasons: ['Tesla'] },
    { id: 'unccs:2', title: 'HackNC 2026', start: '2026-10-10T04:00:00.000Z', end: '2026-10-11T20:00:00.000Z', venue: 'Fetzer Gym' },
  ], { stamp: '2026-09-16T12:00:00.000Z' });
  assert.equal((cal.match(/BEGIN:VEVENT/g) || []).length, 2);
  assert.match(cal, /DTEND:20260916T220000Z/);
  assert.match(cal, /LOCATION:Virtual/);
  assert.match(cal, /LOCATION:Fetzer Gym/);
  assert.ok(cal.startsWith('BEGIN:VCALENDAR\r\n'));
});
