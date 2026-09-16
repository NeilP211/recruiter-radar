import { test } from 'node:test';
import assert from 'node:assert/strict';

import { matchCompanies } from '../scripts/lib/companies.mjs';

const CASES = [
  ['Tesla x University of North Carolina, Chapel Hill | Supercharging Your Resume', ['Tesla']],
  ['LIFT x UNC Chapel Hill: Connect with Cisco', ['Cisco']],
  ['Adobe Technical Pre-Sales Internship Webinar', ['Adobe']],
  ['AI Builders Conference with IBM BOB', ['IBM']],
  ['SAS Recruitment Discovery Day', ['SAS']],
  ['Snowflake recruiters on campus', ['Snowflake']],
  ['LinkedIn engineers panel', ['LinkedIn']],
  ['Meta recruiters', ['Meta']],
  ['Coffee chat with Jane Street and Two Sigma', ['Jane Street', 'Two Sigma']],

  // Everyday words, tools and products that are not an employer showing up.
  ['Fill out the Google Form and join via Zoom link', []],
  ['Complete the survey to win a $250 Amazon gift card', []],
  ['Intro to Adobe Photoshop workshop', []],
  ['Adobe Express for Design (for Students)', []],
  ['Introduction to SAS programming', []],
  ['Bloomberg Terminal training', []],
  ['Snowflake ornament craft night', []],
  ['Join LinkedIn to network', []],
  ['A meta-analysis workshop', []],
  ['Microsoft Excel for beginners', []],
  ['Phi Sigma Pi Recruitment Event', []],
  ['Uber Eats promo table', []],
  ['Block party on Franklin Street', []],
  ['Unity dinner hosted by the Multicultural Center', []],
  ['Ramp up your study habits', []],
];

for (const [text, expected] of CASES) {
  test(`${JSON.stringify(expected)} <- ${text}`, () => {
    assert.deepEqual(matchCompanies(text), expected);
  });
}
