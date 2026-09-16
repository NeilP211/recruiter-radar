# Recruiter Radar

Recruiter visits, resume drops and tech career fairs at UNC, Duke and NC State, in one list,
with a phone alert when a new one appears.

**Live: https://neilp211.github.io/recruiter-radar/**

## Why

In February 2026 Engineering at Carolina and UNC NSBE ran a Tesla recruiting session where students
handed their resumes straight to a recruiter. It was announced in a club Instagram post, a CS
careers newsletter and a Heel Life listing for the prep workshop the week before. It was easy to
miss, and it was missed. Seven months later Tesla came back for a virtual resume workshop, and
that one was nearly missed too.

These events are not hidden. They are scattered across calendars that each carry a few thousand
listings, almost none of which matter to someone looking for an ML or SWE internship.
[HeelSeek](https://github.com/NeilP211/heelseek) solved the scattering for UNC as a whole. This
solves the filtering.

## What it pulls

| Source | How | Listings |
| --- | --- | --- |
| UNC Computer Science | The Events Calendar REST API | ~10 |
| UNC Career Hub (career fairs, Handshake employer events) | The Events Calendar REST API | ~10 |
| Heel Life (clubs, UNC Career Center employer sessions) | Campus Labs Engage JSON API | ~950 |
| UNC Calendar | Localist JSON API | ~330 |
| Duke Calendar | Bedework JSON feed | ~1,250 |
| NC State Calendar | Localist JSON API | ~880 |
| Company event pages you add | schema.org Event JSON-LD | as listed |

About 3,400 listings in, usually 15 to 30 out. Every source is public, so the only secret is the
alert topic name.

Left out on purpose, with the reason:
- **Handshake** needs a login. Its employer events are mirrored to the Career Hub, which is pulled.
- **The UNC CS careers newsletter** is Mailchimp with no public archive.
- **tesla.com** returns 403 to scripts and its events API lists only store demos. Tesla's UNC
  sessions reach Heel Life through the Career Center anyway.

## How events are scored

`scripts/lib/score.mjs` gives every event a tier and the reasons shown on its card.

- **High value** (listed first, triggers a phone alert): a tech employer plus a hiring signal
  (recruiters, info session, resume review or submission, internship, "Company x UNC"), a recruiter
  panel, or a career fair.
- **Worth a look**: hackathons, CS career panels, mock technical interviews, company tech talks,
  CS and engineering club meetings.
- **Dropped**: everything else, plus hard stops for degree admissions sessions, study abroad, MBA,
  law and pre-health, Greek life recruitment, athlete-only and part-time job fairs.

Company names are matched case-sensitively with exclusions for the ways campus listings use them as
ordinary words: "Google Form", "Zoom link", "$250 Amazon gift card", "Adobe Photoshop workshop".
Names that are mostly everyday words (Block, Unity, Ramp, Notion, LinkedIn) only count next to a
hiring word.

Real 2026 listings are pinned in `test/score.test.mjs`, including both Tesla sessions, so a rule
change shows exactly which events moved.

## Alerts

Each run compares its high-value events with the payload already live on the site. Anything newly
high goes out as a push through [ntfy](https://ntfy.sh) after the deploy succeeds. The first run
ever sends nothing, and more than five new events at once collapse into one summary.

1. Install the ntfy app.
2. Subscribe to the topic stored in the repo secret `NTFY_TOPIC`.

There is also a subscribable calendar of high-value events at
`https://neilp211.github.io/recruiter-radar/data/high.ics`.

## Adding a company event page

Put the URL in `data/watch.json`. If the page blocks scripts or its structured data is wrong, add
the fields by hand and they win:

```json
[
  { "url": "https://www.tesla.com/event/ncch-resume", "title": "Tesla x UNC resume workshop", "start": "2026-09-16T21:00:00Z", "virtual": true, "org": "Tesla" }
]
```

## Resilience

Carried over from HeelSeek: one failing source never empties the site, a source that suddenly loses
most of its listings is marked failed instead of believed, and failed sources are served from the
last good payload for up to 45 days. Past high-value events move into a Missed archive for a year,
so the site slowly learns what comes around each semester.

## Run it

```bash
npm install
npm test          # 96 tests
npm run ingest    # writes public/data/events.json, high.ics and notify.json
npm run dev
```

GitHub Actions runs tests, ingest, build, deploy and alerts every three hours
(`.github/workflows/refresh.yml`).
