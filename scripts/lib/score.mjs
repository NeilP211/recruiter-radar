// Decides whether an event is worth an ML or SWE job seeker's evening.
//
// Output: { tier: 'high' | 'medium' | 'drop', score, kind, companies, reasons }.
//   high   - a direct path toward a job: an employer recruiting, a resume drop, a career fair.
//   medium - worth a look: hackathons, CS career panels, mock interviews, tech talks by companies.
//   drop   - everything else, which is most of any campus calendar.
//
// The rules are deliberately plain so every tier can be explained on the card. Real events from
// 2026 are pinned in test/score.test.mjs; change a weight and those tests say what moved.

import { matchCompanies } from './companies.mjs';

export const HIGH = 8;
export const MEDIUM = 4;

// Hard stops, checked against the title and host only. Descriptions are too chatty: the UNC career
// fair's own blurb invites "employers and graduate programs", which is not a degree info session.
const NEGATIVE = [
  [/\bMBA\b/, 'MBA'],
  [/\bpre-?(?:med|law|dental|vet|pharm|health|PA|nursing)\b/i, 'pre-professional'],
  [/\blaw school\b|\bJ\.D\.|\bLSAT\b/i, 'law'],
  [/\bnursing\b|\bPharmD\b|\bdental\b|\bveterinar/i, 'health professions'],
  [/\bsororit|\bfraternit|\bpanhellenic\b|\brush week\b/i, 'Greek life'],
  [/\bstudent-athletes?\b/i, 'athletes only'],
  // Employers sometimes run separate sessions for business roles and say so in the title.
  [/\bnon-?tech(?:nical)?\b/i, 'non-technical roles'],
  [/\bpart-time jobs?\b/i, 'part-time jobs'],
  [/\bteach for america\b|\bpeace corps\b/i, 'service programs'],
  [/\badmissions office\b|\bopen house for (?:prospective|admitted)\b|\bprospective students\b/i, 'admissions'],
  // Degree programs recruiting applicants are not employers recruiting interns.
  [/\bMaster'?s?(?: of|'? programs?| degree)\b|\b[BM]\.\s?[AS]\.? in\b|\bB[AS] in\b|\bPh\.?D\.? (?:in|program)\b|\b(?:graduate|undergraduate|degree|certificate|major|minor) (?:programs?|degrees?|information sessions?|info sessions?|admissions|open house)\b|\bprospective students?\b|\bre-orientation\b/i, 'degree admissions'],
  [/\bstudy abroad\b|\bsummer study\b|\bstudy in [A-Z]/i, 'study abroad'],
  [/\bcandidate (?:review|forum|presentation)\b|\bsearch committee\b/i, 'faculty hiring'],
  [/\brecital\b|\bexhibition\b|\bchoir\b|\borchestra\b|\bworship\b|\bbible\b/i, 'not career'],
];

// Graduate-only programming is real but rarely open to an undergrad.
const GRAD_ONLY = /\bmaster'?s (?:students?|programs?|career)|\bPhD students\b|\bgraduate students only\b|\bMSCS\b|\bpostdoc/i;

const RECRUIT_STRONG = /\brecruiters?\b|\brecruiting (?:team|event|session)s?\b|\binfo(?:rmation)? sessions?\b|\bresumes? (?:drop|submission|review|roast|workshop|book|critique)s?\b|\bsubmit (?:your )?resumes?\b|\bdirect consideration\b|\bcoffee chats?\b|\bmeet the (?:recruiters?|team|engineers?|employers?)\b|\bhiring (?:managers?|event|now)\b|\bon-?campus interviews?\b|\bsuperday\b|\bemployer (?:spotlight|showcase|panel)\b|\brecruitment, application\b/i;
const CAREER_FAIR = /\b(?:career|job|internship|tech) (?:fair|expo)\b(?![^\n]*\b(?:readiness|prep|preparation|workshop)\b)/i;
const INTERNSHIP = /\binternships?\b|\bco-?op\b|\bnew grad\b|\bfull-time roles?\b/i;
const PANEL = /\bcareer panel\b|\bpanel\b|\bnetworking\b|\broundtable\b|\balumni (?:panel|night|mixer)\b|\breferrals?\b/i;
const HACKATHON = /\bhackathon\b|\bhack(?:nc|duke|pack)\b|\bpearl hacks\b|\bdata challenge\b|\bdatathon\b|\bcodeathon\b|\bcapture the flag\b/i;
const INTERVIEW_PREP = /\bmock (?:technical )?interview\w*|\btechnical interview\w*|\bleetcode\b|\bcoding interview\w*|\binterview prep\b|\bsystem design\b/i;
const TALK = /\bseminar\b|\bcolloquium\b|\btech talk\b|\blecture\b|\bworkshop\b|\bspeaker\b|\bconference\b|\bsymposium\b/i;
const TECH = /\bsoftware\b|\bSWE\b|\bmachine learning\b|\bML\b|\bAI\b|\bartificial intelligence\b|\bLLMs?\b|\bdeep learning\b|\bdata scien\w*|\bcomputer science\b|\bcomputing\b|\bcoding\b|\bprogramming\b|\bdevelopers?\b|\bengineer\w*|\bcybersecurity\b|\bcloud\b|\brobotics\b|\bquant\w*|\banalytics\b|\btech(?:nology|nical)?\b/;
const TECH_CI = /\bsoftware\b|\bmachine learning\b|\bartificial intelligence\b|\bdeep learning\b|\bdata scien\w*|\bcomputer science\b|\bcomputing\b|\bcoding\b|\bprogramming\b|\bdevelopers?\b|\bengineer\w*|\bcybersecurity\b|\brobotics\b|\banalytics\b|\btech(?:nology|nical)?\b/i;
const CS_ORG = /\bcomputer science\b|\bUNC CS\b|\bApp Team\b|\bHackNC\b|\bPearl Hacks\b|\bCS\s?\+\s?Social Good\b|\bBlack in Technology\b|\bWomen in Computer|\bWiCS\b|\bEngineering at Carolina\b|\bEngineering@Carolina\b|\bNational Society of Black Engineers\b|\bNSBE\b|\bSociety of Women Engineers\b|\bIEEE\b|\bACM\b|\bCarolina Data\b|\bSchool of Data\b|\bDuke (?:Computer Science|CS)\b|\bNC State (?:Computer Science|CSC)\b|\bElectrical (?:and|&) Computer Engineering\b/i;
const JOB_WORDS = /\bhiring\b|\brecruit\w*|\bwebinar\b|\bapply (?:now|today|by|for|to)\b|\bjob applications?\b|\bconnect with\b|\bx\s+(?:UNC|University|Carolina|Duke|NC State)\b|\bjobs\b|\binterview\w*/i;
const TECH_TERMS = new RegExp(`${TECH.source}|${TECH_CI.source}`, 'gi');
const UNC_SOURCES = new Set(['heellife', 'careerhub', 'unccs', 'localist']);

/** Tech counts from the title or host, or from a description that mentions tech more than once. */
function techInTitle(title, org) {
  return TECH.test(title) || TECH_CI.test(title) || TECH.test(org) || TECH_CI.test(org);
}

function techAnchor(title, org, description) {
  if (techInTitle(title, org)) return true;
  const distinct = new Set((description.match(TECH_TERMS) || []).map((t) => t.toLowerCase()));
  return distinct.size >= 2;
}

const COMPANY_HOSTED = /\b[A-Z][\w.&-]*(?:\s[A-Z][\w.&-]*)?\s+[xX]\s+(?:UNC|University of North Carolina|Carolina|Duke|NC State)\b/;

function hit(re, text) {
  const m = re.exec(text);
  return m ? m[0].toLowerCase().replace(/\s+/g, ' ').trim() : null;
}

/**
 * Score one event. `event` needs title, description and org; `source` helps (the CS department's
 * own calendar counts as a CS host). Pure function, no I/O.
 */
export function scoreEvent(event) {
  const title = event.title || '';
  const body = `${title}\n${event.description || ''}`;
  const all = `${body}\n${event.org || ''}`;
  const reasons = [];

  const titleOrg = `${title}\n${event.org || ''}`;
  for (const [re, label] of NEGATIVE) {
    if (re.test(titleOrg)) {
      return { tier: 'drop', score: -10, kind: 'other', companies: [], reasons: [label] };
    }
  }

  const org = event.org || '';
  const description = event.description || '';
  const recruit = hit(RECRUIT_STRONG, all);
  // A company named in the title is the event's subject. One named only in the description is
  // usually a sponsor or a panelist's employer, so it only counts next to a recruiting signal.
  const titleCompanies = matchCompanies(title);
  const companies = titleCompanies.length ? titleCompanies : recruit ? matchCompanies(body) : [];
  // Fairs are named in the title. Descriptions say "get ready for the career fair" all the time.
  const titleFair = hit(CAREER_FAIR, title);
  const tech = techAnchor(title, org, description);
  const fair = titleFair && (UNC_SOURCES.has(event.source) || tech) ? titleFair : null;
  const internship = hit(INTERNSHIP, all);
  const panel = hit(PANEL, title) || hit(PANEL, body);
  const hackathon = hit(HACKATHON, title) || hit(HACKATHON, org);
  const prep = hit(INTERVIEW_PREP, all);
  const talk = hit(TALK, title);
  const csHost = event.source === 'unccs' || CS_ORG.test(`${title}\n${org}`);
  // Read job words from the event text only: the host "UNC Career Center" says "career" about
  // everything it posts, including an IBM AI conference that is not a hiring event.
  const jobWords = JOB_WORDS.test(body) || COMPANY_HOSTED.test(title);
  const gradOnly = GRAD_ONLY.test(all);

  let score = 0;
  if (companies.length) {
    reasons.push(companies.slice(0, 3).join(', '));
    const jobSignal = Boolean(recruit || fair || internship || jobWords);
    score = jobSignal ? HIGH : tech ? MEDIUM + 1 : 1;
    if (recruit) score += 2;
  } else {
    if (fair) score += 6;
    if (recruit) score += 4;
    if (internship) score += 2;
    if (panel) score += 2;
    if (hackathon) score += 3;
    if (prep) score += 3;
    if (talk) score += 1;
    if (tech) score += 2;
    if (csHost) score += 2;
    // Without a tech anchor, a CS host or a career fair this is some other field's event.
    if (!tech && !csHost && !fair) score = Math.min(score, MEDIUM - 1);
    // A seminar or panel whose only tech is in its blurb is some other department's event.
    if (!techInTitle(title, org) && !csHost && !fair && !recruit && !hackathon && !prep) {
      score = Math.min(score, MEDIUM - 1);
    }
    // High means a direct path to a job: an employer, a recruiter, or a fair. A hackathon or a
    // mock interview night is worth going to but does not earn a phone push.
    if (!fair && !recruit) score = Math.min(score, HIGH - 1);
  }
  if (gradOnly) {
    score -= 2;
    reasons.push('grad students');
  }

  if (recruit) reasons.push(recruit);
  if (fair) reasons.push('career fair');
  if (internship && !fair) reasons.push(internship);
  if (hackathon) reasons.push('hackathon');
  if (prep) reasons.push('interview prep');
  if (!companies.length && panel && !fair) reasons.push(panel);
  if (!reasons.length && csHost) reasons.push('CS host');
  if (!reasons.length && tech) reasons.push('tech topic');

  const tier = score >= HIGH ? 'high' : score >= MEDIUM ? 'medium' : 'drop';
  const kind = fair ? 'fair'
    : hackathon ? 'hackathon'
    : (companies.length && (recruit || internship || jobWords)) || recruit || internship ? 'recruiting'
    : 'talk';

  return { tier, score, kind, companies, reasons: [...new Set(reasons)].slice(0, 4) };
}
