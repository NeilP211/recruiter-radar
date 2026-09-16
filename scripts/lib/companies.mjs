// Employers worth flagging for an ML or SWE internship search.
//
// Matching is case-sensitive on purpose. Campus text is full of company names used as
// ordinary words or tool names: "Google Form", "Zoom link", "$250 Amazon gift card",
// "Adobe Photoshop workshop", "Harry Potter (HP) trivia". Each pattern below excludes the
// false positives that actually show up in UNC, Duke and NC State listings.
//
// `strict` names are everyday words or products first and employers second. They only
// count when written as the company (full legal name) or right next to a hiring word.

const HIRING = String.raw`(?:recruit\w*|engineer\w*|intern\w*|info(?:rmation)? session|hiring|careers?|x\s+(?:UNC|University|Carolina|Duke|NC State))`;

/** Company used next to a hiring word, or "at/with/from Company" in a hiring sentence. */
function nearHiring(name) {
  return new RegExp(String.raw`\b${name}\s+${HIRING}|\b(?:at|with|from|by|meet)\s+${name}\s+(?:recruit\w*|engineer\w*|team)`);
}

/** Tagged template: builds a RegExp from raw source so ${HIRING} can be spliced in. */
const rx = (strings, ...vals) => new RegExp(String.raw({ raw: strings.raw }, ...vals));

const C = (name, re, opts = {}) => ({ name, re, ...opts });

export const COMPANIES = [
  // Big tech and AI labs
  C('Google', /\bGoogle(?!\s+(?:Docs?|Forms?|Sheets?|Slides?|Drive|Meet|Calendar|Classroom|Scholar|Maps|Colab|Sites|Earth|Voice|Workspace|Cloud Skills Boost|account|form|doc))\b|\bGoogle DeepMind\b/),
  C('Meta', /\bMeta\b(?![-\s]*(?:[Aa]nalys[ie]s|[Dd]ata|[Qq]uest|[Cc]ogniti))|\bMeta Platforms\b/),
  C('Amazon', /\bAmazon(?!\s+(?:[Gg]ift|[Rr]ainforest|[Rr]iver|[Bb]asin|[Pp]rime [Vv]ideo|[Ww]ish ?[Ll]ist|[Ss]mile))\b|\bAWS\b(?!\s+(?:[Cc]redits|[Ee]ducate|[Aa]cademy|[Cc]ertif|[Ss]kill|[Bb]uilder))/),
  C('Apple', /\bApple(?!\s+(?:Music|Pay|Watch|TV|Store|Pencil|ID|[Cc]ider|[Pp]icking|[Pp]ie))\b/),
  C('Microsoft', /\bMicrosoft(?!\s+(?:Teams|Word|Excel|Office|PowerPoint|Forms|Outlook|365|Bookings|Stream|Copilot|Learn\b))\b/),
  C('Netflix', /\bNetflix\b(?!\s+(?:[Pp]arty|and chill|[Nn]ight))/),
  C('NVIDIA', /\bNVIDIA\b|\bNvidia\b/),
  C('OpenAI', /\bOpenAI\b/),
  C('Anthropic', /\bAnthropic\b/),
  C('xAI', /\bxAI\b/),
  C('Scale AI', /\bScale AI\b/),
  C('Databricks', /\bDatabricks\b/),
  C('Snowflake', rx`\bSnowflake\s+(?:Inc|Computing|${HIRING})|\bat Snowflake\b`),
  C('Palantir', /\bPalantir\b/),
  C('Hugging Face', /\bHugging Face\b/),
  C('Tesla', /\bTesla\b(?!\s+(?:[Cc]oil|[Mm]eter|[Uu]nits?))/),
  C('SpaceX', /\bSpaceX\b/),
  C('Waymo', /\bWaymo\b/),
  C('Anduril', /\bAnduril\b/),

  // Product and fintech
  C('Stripe', /\bStripe\b/),
  C('Figma', rx`\bFigma\s+(?:Inc|${HIRING})|\bat Figma\b`),
  C('Airbnb', /\bAirbnb\b/),
  C('Uber', /\bUber\b(?!\s+[Ee]ats)/),
  C('Lyft', /\bLyft\b/),
  C('DoorDash', /\bDoorDash\b/),
  C('Instacart', /\bInstacart\b/),
  C('Coinbase', /\bCoinbase\b/),
  C('Robinhood', rx`\bRobinhood\s+(?:Markets|${HIRING})|\bat Robinhood\b`),
  C('Block', /\bBlock,? Inc\b|\bCash App\b/),
  C('Affirm', nearHiring('Affirm'), { strict: true }),
  C('Plaid', nearHiring('Plaid'), { strict: true }),
  C('Ramp', nearHiring('Ramp'), { strict: true }),
  C('Rippling', nearHiring('Rippling'), { strict: true }),
  C('Notion', nearHiring('Notion'), { strict: true }),
  C('Canva', nearHiring('Canva'), { strict: true }),
  C('Atlassian', /\bAtlassian\b/),
  C('Salesforce', /\bSalesforce\b(?!\s+(?:Trailhead|[Cc]ertif))/),
  C('Adobe', /\bAdobe\b(?!\s+(?:Express|Photoshop|Illustrator|Acrobat|Creative Cloud|Premiere|InDesign|Lightroom|Firefly|Stock|Fonts|Sign|Spark|Audition|After Effects|XD))/),
  C('Oracle', rx`\bOracle\s+(?:Corporation|Cloud|${HIRING})|\bat Oracle\b`),
  C('Intuit', /\bIntuit\b/),
  C('PayPal', /\bPayPal\b/),
  C('eBay', /\beBay\b/),
  C('Pinterest', rx`\bPinterest\s+(?:${HIRING})|\bat Pinterest\b`),
  C('Snap', rx`\bSnap,? Inc\b|\bSnapchat\s+${HIRING}`),
  C('Reddit', rx`\bReddit\s+(?:Inc|${HIRING})|\bat Reddit\b`),
  C('Dropbox', rx`\bDropbox\s+(?:Inc|${HIRING})|\bat Dropbox\b`),
  C('Twilio', /\bTwilio\b/),
  C('Zoom', /\bZoom (?:Video|Communications)\b|\bZoom\s+(?:recruit\w*|engineer\w*|intern\w*|hiring)/, { strict: true }),
  C('Shopify', /\bShopify\b/),
  C('Spotify', rx`\bSpotify\s+(?:Technology|${HIRING})|\bat Spotify\b`),
  C('LinkedIn', nearHiring('LinkedIn'), { strict: true }),
  C('ServiceNow', /\bServiceNow\b/),
  C('Workday', nearHiring('Workday'), { strict: true }),
  C('Roblox', rx`\bRoblox\s+(?:Corporation|${HIRING})|\bat Roblox\b`),
  C('Unity', /\bUnity Technologies\b/),
  C('Epic Games', /\bEpic Games\b/),
  C('Epic Systems', /\bEpic Systems\b/),

  // Hardware and enterprise
  C('IBM', /\bIBM\b/),
  C('Intel', /\bIntel\b(?!\s+(?:[Bb]riefing|[Rr]eport))/),
  C('AMD', /\bAMD\b/),
  C('Qualcomm', /\bQualcomm\b/),
  C('Cisco', /\bCisco\b/),
  C('Broadcom', /\bBroadcom\b/),
  C('VMware', /\bVMware\b/),
  C('Micron', /\bMicron\b(?!\s+[Ss]cale)/),
  C('Texas Instruments', /\bTexas Instruments\b/),
  C('Dell', rx`\bDell Technologies\b|\bDell\s+${HIRING}|\bat Dell\b`),
  C('HP', /\bHewlett[- ]Packard\b|\bHPE\b|\bHP Inc\b/),
  C('Lenovo', /\bLenovo\b/),
  C('Red Hat', /\bRed Hat\b/),
  C('SAS', rx`\bSAS Institute\b|\bSAS\s+(?:${HIRING}|[Rr]ecruitment|[Dd]iscovery)|\bat SAS\b`),
  C('Siemens', /\bSiemens\b/),
  C('Honeywell', /\bHoneywell\b/),
  C('Wolfspeed', /\bWolfspeed\b/),
  C('NetApp', /\bNetApp\b/),
  C('Bandwidth', rx`\bBandwidth\s+(?:Inc|${HIRING})|\bat Bandwidth\b`),
  C('Pendo', /\bPendo\b/),
  C('RTX', /\bRTX\b|\bRaytheon\b|\bCollins Aerospace\b/),
  C('Lockheed Martin', /\bLockheed Martin\b/),
  C('Northrop Grumman', /\bNorthrop Grumman\b/),
  C('MITRE', /\bMITRE\b/),

  // Finance and quant with large engineering orgs
  C('Bloomberg', /\bBloomberg\b(?!\s+(?:[Tt]erminal|[Mm]arket [Cc]oncepts|BMC|School|Philanthropies|[Aa]merican [Hh]ealth))/),
  C('Fidelity', rx`\bFidelity Investments\b|\bFidelity\s+${HIRING}|\bat Fidelity\b`),
  C('Capital One', /\bCapital One\b/),
  C('JPMorgan', /\bJ\.?\s?P\.?\s?Morgan\b|\bJPMorganChase\b|\bJPMorgan\b/),
  C('Goldman Sachs', /\bGoldman Sachs\b/),
  C('Morgan Stanley', /\bMorgan Stanley\b/),
  C('Bank of America', /\bBank of America\b/),
  C('Truist', rx`\bTruist\s+(?:${HIRING})|\bat Truist\b`),
  C('Jane Street', /\bJane Street\b/),
  C('Citadel', rx`\bCitadel(?: Securities)?\s+(?:${HIRING})|\bCitadel Securities\b|\bat Citadel\b`),
  C('Two Sigma', /\bTwo Sigma\b/),
  C('Hudson River Trading', /\bHudson River Trading\b|\bHRT\b/),
  C('IMC Trading', /\bIMC Trading\b/),
  C('Optiver', /\bOptiver\b/),
  C('Susquehanna', rx`\bSusquehanna\b|\bSIG\s+(?:${HIRING})`),
  C('D. E. Shaw', /\bD\.\s?E\.\s?Shaw\b/),
];

/** Every employer named in the text, in list order, without duplicates. */
export function matchCompanies(text = '') {
  const out = [];
  for (const c of COMPANIES) {
    if (c.re.test(text) && !out.includes(c.name)) out.push(c.name);
  }
  return out;
}
