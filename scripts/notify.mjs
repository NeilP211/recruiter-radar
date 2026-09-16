#!/usr/bin/env node
// Sends a phone push for each newly appeared high-value event, through ntfy.sh.
// Runs in the deploy job after the site is live, so a failed deploy never swallows or repeats a
// push. The topic name is the only secret: anyone who knows it can read the pushes.

import { readFile } from 'node:fs/promises';
import { SITE_URL } from './ingest.mjs';

const MAX_SINGLE = 5;

export function whenLabel(event) {
  const d = new Date(event.start);
  const day = d.toLocaleDateString('en-US', { timeZone: 'America/New_York', weekday: 'short', month: 'short', day: 'numeric' });
  if (event.allDay) return day;
  const time = d.toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour: 'numeric', minute: '2-digit' });
  return `${day}, ${time}`;
}

function whereLabel(event) {
  if (event.virtual) return 'Virtual';
  return [event.venue, event.campus].filter(Boolean).join(', ');
}

/** One push per event, or a single summary when a batch of events lands at once. */
export function buildMessages(events, topic) {
  if (!events.length) return [];
  if (events.length > MAX_SINGLE) {
    const lines = events.slice(0, 8).map((e) => `${whenLabel(e)}: ${e.title}`);
    if (events.length > 8) lines.push(`and ${events.length - 8} more`);
    return [{
      topic,
      title: `${events.length} new high-value events`,
      message: lines.join('\n'),
      click: SITE_URL,
      tags: ['briefcase'],
      priority: 4,
    }];
  }
  return events.map((e) => ({
    topic,
    title: e.title.slice(0, 120),
    message: [whenLabel(e), whereLabel(e), e.reasons?.length ? `Why: ${e.reasons.join(', ')}` : null]
      .filter(Boolean).join('\n'),
    click: e.url || SITE_URL,
    actions: [{ action: 'view', label: 'All events', url: SITE_URL }],
    tags: ['briefcase'],
    priority: e.companies?.length ? 5 : 4,
  }));
}

export const TEST_MESSAGE = {
  title: 'Recruiter Radar alerts are on',
  message: 'A push like this arrives when a new high-value event shows up. Tap to open the list.',
  click: SITE_URL,
  tags: ['white_check_mark'],
  priority: 3,
};

async function main() {
  const file = process.argv[2] ?? 'notify.json';
  const topic = process.env.NTFY_TOPIC;
  if (process.argv.includes('--test')) {
    if (!topic) throw new Error('NTFY_TOPIC is not set');
    const res = await fetch('https://ntfy.sh/', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ topic, ...TEST_MESSAGE }) });
    console.log(`test push: HTTP ${res.status}`);
    if (!res.ok) process.exitCode = 1;
    return;
  }
  const events = JSON.parse(await readFile(file, 'utf8'));
  if (!events.length) {
    console.log('no new high-value events');
    return;
  }
  if (!topic) {
    console.log(`${events.length} new high-value events, but NTFY_TOPIC is not set; skipping push`);
    return;
  }
  const messages = buildMessages(events, topic);
  for (const msg of messages) {
    if (process.env.DRY_RUN) {
      console.log(JSON.stringify({ ...msg, topic: '(hidden)' }));
      continue;
    }
    const res = await fetch('https://ntfy.sh/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(msg),
    });
    console.log(`push "${msg.title}": HTTP ${res.status}`);
    if (!res.ok) process.exitCode = 1;
  }
}

if (process.argv[1] && process.argv[1].endsWith('notify.mjs')) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
