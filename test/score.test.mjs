import { test } from 'node:test';
import assert from 'node:assert/strict';

import { scoreEvent, HIGH, MEDIUM } from '../scripts/lib/score.mjs';

const E = (title, description = '', org = '', source = 'heellife') => ({ title, description, org, source });

// Real listings from UNC, Duke and NC State calendars in 2026. Each one is here because a rule
// was written or changed for it; if a weight moves, this table says which event moved with it.
const CASES = [
  // The two Tesla sessions this project exists for.
  ['high', E('Tesla x University of North Carolina, Chapel Hill | Supercharging Your Resume',
    'Join Tesla recruiters and hiring managers for a workshop that will offer tips on how to make your resume stand out amongst the competition for internship and full-time opportunities.',
    'UNC Career Center')],
  ['high', E('Tesla Resume Workshop',
    "Before we meet with a Tesla Recruiter on 2/12 and submit our resumes, we are hosting this workshop to ensure everyone's resumes are in good shape.",
    'Engineering at Carolina')],
  ['high', E('Recruitment, Application, & Resume Review Session',
    'Join UNC NSBE and Engineering at Carolina, in collaboration with Tesla, for a Recruitment, Application & Resume Review Session. Get insider tips on applying to internships and full-time roles at Tesla, learn how to get your resume seen by recruiters.',
    'National Society of Black Engineers')],

  // Employers and fairs.
  ['high', E('LIFT x UNC Chapel Hill: Connect with Cisco', '', 'UNC Career Center')],
  ['high', E('Adobe Technical Pre-Sales Internship Webinar', '', 'UNC Career Center')],
  ['high', E('Capital One - Tips and Tricks to Multi-Stage Interview Processes', 'Master the multi-stage interview marathon, from initial recruiter screens to technical deep dives.')],
  ['high', E('UNC CS Career Panel: Ask the Engineer. Meet the Recruiter.', '', '', 'unccs')],
  ['high', E('UNC Computer Science Fall 2026 Tech Career Fair (Night Two: In-Person)', '', '', 'careerhub')],
  ['high', E('UNC Career Center Fall Jobs & Internships Career Fair 2026',
    'Looking for an internship, a job, graduate school, or exploring career paths? Meet top employers and graduate programs.', '', 'careerhub')],

  // Worth a look, but not a phone push.
  ['medium', E('AI Builders Conference with IBM BOB',
    'Discover how AI is transforming software development and build the technical and career-ready skills needed to succeed.', 'UNC Career Center')],
  ['medium', E('UNC CS Career Panel: What is an AI Engineer?', '', '', 'unccs')],
  ['medium', E('HackNC 2026', 'Make an awesome project in just 24 hours, with sponsor networking.', '', 'unccs')],
  ['medium', E('Mock Technical Interviewing Night with UNC CS Alumni', '', '', 'unccs')],
  ['medium', E('Engineering at Carolina Interest Meeting', '', 'Engineering at Carolina')],
  ['medium', E('Career Pathways in Tech', 'Hear from alumni about internships in tech.', 'UNC Career Center')],

  // Dropped: other fields, admissions, Greek life, noise.
  ['drop', E('Phi Sigma Pi Recruitment Event- Trivia Night', '', 'Phi Sigma Pi National Gender-Inclusive Honor Fraternity')],
  ['drop', E('Jenkins MBA Admissions Office Hours at 321 Coffee', '', '', 'ncsu')],
  ['drop', E('UNC-CH Fall 2026 Student-Athlete Career Fair', '', '', 'careerhub')],
  ['drop', E('UNC Career Center Part-Time Jobs Career Fair 2026', '', '', 'careerhub')],
  ['drop', E('B.S. in Data Science Info Session', 'Learn about the data science major and machine learning courses.')],
  ['drop', E('Society-Centered AI Graduate Information Session', '', '', 'duke')],
  ['drop', E('Master of Science in Analytics Online Information Session', '', '', 'ncsu')],
  ['drop', E("Information and Library Science Master's Programs Info Session")],
  ['drop', E('Info Session: Study Abroad in Perugia, Italy - Summer 2027', '', '', 'ncsu')],
  ['drop', E("Engineering Master's Career Drop-In Hours", '', 'Pratt School of Engineering', 'duke')],
  ['drop', E('The Link Group - Fall 2026 Info Session', '', 'UNC Career Center')],
  ['drop', E('Compass Lexecon Analyst and Summer Internship Roles', '', 'UNC Career Center')],
  ['drop', E('Ag, Sciences and Natural Resources Career Expo', '', '', 'ncsu')],
  ['drop', E('Career Expo Readiness Virtual Workshop', 'Prepare for the engineering career expo.', '', 'ncsu')],
  ['drop', E('GenAI Life Hacks', 'Tips for everyday life.')],
  ['drop', E('Duke SPACE Initiative Seminar - Cassandra Klos', 'Networking with engineers and scientists in aerospace technology.', '', 'duke')],
  ['drop', E('Full Self-Driving (Supervised) Workshop at Tesla Raleigh', 'Experience Full Self-Driving (Supervised) for yourself.', '', 'watch')],
  ['drop', E('Hunt Library After Dark', 'Games and snacks, sponsored by Lenovo and the College of Engineering technology services.', '', 'ncsu')],
  ['drop', E('Fall Opera Scenes', '', 'Department of Music')],
];

for (const [tier, event] of CASES) {
  test(`${tier}: ${event.title}`, () => {
    const got = scoreEvent(event);
    assert.equal(got.tier, tier, `score ${got.score}, reasons ${JSON.stringify(got.reasons)}`);
  });
}

test('tier thresholds line up with the score', () => {
  for (const [, event] of CASES) {
    const { tier, score } = scoreEvent(event);
    if (tier === 'high') assert.ok(score >= HIGH);
    if (tier === 'medium') assert.ok(score >= MEDIUM && score < HIGH);
  }
});

test('reasons name the company and the recruiting signal', () => {
  const got = scoreEvent(CASES[0][1]);
  assert.deepEqual(got.companies, ['Tesla']);
  assert.ok(got.reasons.includes('Tesla'));
  assert.ok(got.reasons.includes('recruiters'));
  assert.equal(got.kind, 'recruiting');
});

test('a hackathon never earns a phone push on its own', () => {
  const got = scoreEvent(E('HackNC 2026', 'Build software projects in 24 hours, with talks and sponsor networking.', 'HackNC', 'unccs'));
  assert.equal(got.kind, 'hackathon');
  assert.notEqual(got.tier, 'high');
});

test('a company named only in the description needs a recruiting signal', () => {
  assert.equal(scoreEvent(E('Library Game Night', 'Snacks provided by Google.')).tier, 'drop');
  assert.equal(scoreEvent(E('Resume Review Night', 'Google recruiters will review resumes.', 'App Team')).tier, 'high');
});

test('the host saying "career" does not make an event a hiring event', () => {
  const got = scoreEvent(E('AI Builders Conference with IBM BOB', 'Build AI skills.', 'UNC Career Center'));
  assert.notEqual(got.tier, 'high');
});
