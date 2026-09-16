# Recruiter Radar: design

Date: 2026-09-16. Approved by Neil in chat ("sure go ahead build it").

## Problem

High-value recruiting events for CS students (a Tesla recruiter visit with resume submission, a
company info session, a tech career fair) are scattered across Heel Life, the UNC Career Hub,
cs.unc.edu, the UNC calendar, club Instagram posts and a Mailchimp newsletter. Neil missed a Tesla
resume session in February 2026 and nearly missed the September 2026 one. HeelSeek already
aggregates every UNC event, but it is not filtered for what matters to an ML or SWE job search.

## Goal

A site that lists only CS, ML and SWE career events worth attending, refreshed automatically, with a
phone push when a new high-value event appears.

## Approach

HeelSeek-style static pipeline (approach A). A scheduled GitHub Actions job pulls every source,
scores each event with deterministic rules, publishes a static site to GitHub Pages and pushes
newly appeared high-value events through ntfy. No API keys. The scorer is isolated so a Claude
classification pass (approach B) can be added later without touching adapters or the UI.

## Sources (v1)

| Key | Source | Access |
| --- | --- | --- |
| heellife | Heel Life (UNC clubs, UNC Career Center employer events) | Campus Labs Engage JSON |
| careerhub | UNC Career Hub (career fairs, Handshake employer events) | The Events Calendar REST |
| unccs | cs.unc.edu events (career panels, HackNC, mock interviews) | The Events Calendar REST |
| localist | calendar.unc.edu | Localist JSON |
| duke | calendar.duke.edu | Bedework JSON feed |
| ncsu | calendar.ncsu.edu | Localist JSON |
| watch | Hand-maintained company event pages (`data/watch.json`) | schema.org Event JSON-LD |

Investigated and left out of v1:
- UNC CS careers Mailchimp newsletter: no public campaign archive.
- Handshake: requires a login. Its employer events are mirrored to the Career Hub anyway.
- tesla.com: event pages carry JSON-LD, but the host returns 403 to non-browser clients and its
  public events API only lists store workshops, not university recruiting sessions.
- Google Build Your Future: client-rendered, no data in the HTML.

## Scoring

Rule-based, in `scripts/lib/score.mjs`. Every event gets `tier` (high, medium, or dropped), a numeric
`score` and human-readable `reasons`.

- A recognised tech employer plus a job signal (recruiter, info session, resume submission or review,
  internship, hiring, career, webinar, "Company x UNC") is high on its own.
- Without a company, points add up: career fair, recruiter or resume signals, internship, panels and
  networking, hackathons, mock interviews, a technical topic, a CS or engineering organisation.
- Hard negatives drop an event: MBA, law, pre-health, Greek life recruitment, student-athlete fairs,
  part-time job fairs, arts programming.
- Graduate-only events (master's, PhD) are penalised.
- Company names that are also common words (Zoom, LinkedIn, Block, Unity, Snap, Ramp, Workday, Canva,
  Notion) only count when written next to a hiring context or with their full company name.

Thresholds: high at 8 or more, medium at 4 or more. Real events from 2026 are fixtures in
`test/score.test.mjs` so the thresholds cannot drift silently.

## Data flow

1. `scripts/ingest.mjs` fetches the previous live payload from the deployed site (for carry-forward,
   the missed-events archive and notification diffing), runs every adapter in isolation, dedupes,
   scores, drops everything below medium and writes `public/data/events.json` and
   `public/data/high.ics`.
2. It also writes `notify.json`: high-tier events whose id was not high-tier in the previous live
   payload. With no previous payload (first run) the list is empty, so nothing floods.
3. The deploy job publishes Pages, then `scripts/notify.mjs` sends the pushes. Pushing after a
   successful deploy means a failed deploy cannot swallow or repeat an alert. More than five new
   events collapse into one summary push.

## Resilience (carried over from HeelSeek)

- One failing adapter never empties the site; failures are recorded per source.
- A source that falls to zero or loses most of its events is marked failed.
- Failed sources are carried forward from the last good payload for up to 45 days.
- Past high-value events move into an `archive` (kept 365 days) so the site can show what was missed.

## Site

React and Vite, same stack as HeelSeek. High value first, then "Worth a look". Filters for campus
(UNC, Duke, NC State, Virtual) and type (Recruiting, Career fair, Hackathon, Talks and workshops),
plus search. Each card shows the date, host, venue, the reasons it scored, a details link and an
add-to-calendar download. Footer: subscribable calendar feed, ntfy setup, per-source health.

## Secrets

`NTFY_TOPIC` repository secret only. Without it the notify step logs and exits cleanly.

## Testing

`node --test`: scoring fixtures from real 2026 events, company-name ambiguity, each adapter's mapping
against saved API fixtures, notification diffing, ICS output and the resilience guards. CI runs the
suite before every ingest and deploy.
