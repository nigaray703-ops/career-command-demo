import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/jobTrackerStyles.css', import.meta.url), 'utf8');
const indexUrl = new URL('../index.html', import.meta.url);
const productionUrl = new URL('../job-tracker.html', import.meta.url);
const html = readFileSync(existsSync(productionUrl) ? productionUrl : indexUrl, 'utf8');

function extractMediaBlock(source, marker) {
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, `missing ${marker}`);
  const openingBrace = source.indexOf('{', start);
  let depth = 0;
  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }
  assert.fail(`unclosed ${marker}`);
}

const comfortable = extractMediaBlock(
  css,
  '/* Comfortable two-line Applications layout */\n@media (min-width: 521px) and (max-width: 1024px)',
);
const midTopbar = extractMediaBlock(
  css,
  '/* Mid-width topbar containment */\n@media (min-width: 821px) and (max-width: 1200px)',
);
const sharedResponsive = extractMediaBlock(
  css,
  '/* Shared phone and half-screen structure */\n@media (max-width: 820px)',
);
const phone = extractMediaBlock(
  css,
  '/* Phone five-column compaction */\n@media (max-width: 520px)',
);
const narrowPhone = extractMediaBlock(
  css,
  '/* Narrow phone toolbar safety */\n@media (max-width: 360px)',
);

assert.match(
  comfortable,
  /\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*grid-template-rows:\s*minmax\(48px,\s*auto\)\s*minmax\(48px,\s*auto\)[^}]*border:\s*0[^}]*border-bottom:\s*1px solid rgba\(37,\s*99,\s*235,\s*0\.14\)/s,
  'a comfortable application must own one continuous record separator',
);
assert.match(
  comfortable,
  /\.applications-view tbody tr:not\(\.group-row\) td\s*\{[^}]*display:\s*flex[^}]*align-items:\s*center[^}]*border-bottom:\s*0/s,
  'comfortable cells must not draw broken per-cell borders',
);
assert.match(
  comfortable,
  /\.applications-view tbody tr:not\(\.group-row\) td:nth-child\(3\),[\s\S]*td:nth-child\(8\)\s*\{[^}]*justify-content:\s*center/s,
  'Date, Status, and Candidate Home must be centered inside the first record row',
);
assert.match(
  comfortable,
  /\.applications-view td:nth-child\(2\),\s*\.applications-view td:nth-child\(9\)\s*\{[^}]*min-height:\s*48px[^}]*padding-block:\s*8px/s,
  'Role and Actions must share the same second-row height and vertical padding',
);
assert.match(
  comfortable,
  /\.applications-view td:nth-child\(9\)\s*\{[^}]*grid-area:\s*actions[^}]*align-self:\s*stretch[^}]*padding-block:\s*8px/s,
  'Actions must fill and center within the complete second grid row',
);
assert.match(
  comfortable,
  /\.applications-view tbody tr:not\(\.group-row\):last-child\s*\{[^}]*border-bottom:\s*0/s,
  'the final record must rely on the table frame instead of doubling its separator',
);
assert.doesNotMatch(
  comfortable,
  /\.applications-view tbody tr\.group-row[^}]*border-bottom:\s*1px solid rgba\(37,\s*99,\s*235,\s*0\.14\)/s,
  'group headers must not inherit the normal record separator',
);
assert.match(
  midTopbar,
  /\.topbar\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)\s*auto[^}]*align-items:\s*start/s,
  'the mid-width topbar must isolate copy from actions',
);
assert.match(
  midTopbar,
  /\.topbar > div:first-child\s*\{[^}]*display:\s*grid[^}]*min-width:\s*0[^}]*align-items:\s*start[^}]*gap:\s*4px/s,
  'title and explanatory copy must stack in a shrinkable block',
);
assert.match(
  midTopbar,
  /\.topbar p\s*\{[^}]*white-space:\s*normal[^}]*overflow-wrap:\s*anywhere/s,
  'long Chinese and English topbar copy must wrap inside its own column',
);
assert.match(
  midTopbar,
  /\.topbar-actions\s*\{[^}]*align-self:\s*start[^}]*flex-wrap:\s*nowrap/s,
  'language and add controls must remain a separate stable action group',
);
assert.match(
  sharedResponsive,
  /\.applications-view \.alphabet-index\s*\{[^}]*top:\s*auto[^}]*bottom:\s*10px[^}]*max-height:\s*min\(44vh,\s*460px\)[^}]*transform:\s*none/s,
  'the phone and half-screen alphabet rail must stay below top actions instead of crossing their vertical space',
);
assert.match(
  midTopbar,
  /body\.is-lang-en \.applications-view #sortBy\s*\{[^}]*min-width:\s*120px[^}]*max-width:\s*120px/s,
  'the English mid-width Sort select must reserve native-arrow space after Company A-Z',
);
assert.match(
  midTopbar,
  /body\.is-lang-en \.applications-view \.tool-select:has\(#sortBy\)\s*\{[^}]*min-width:\s*176px[^}]*max-width:\s*176px/s,
  'the English 821–1200px Sort wrapper must stay wide enough at both 898px and 1200px',
);
assert.match(
  midTopbar,
  /body\.is-lang-en \.applications-view \.compact-select\s*\{[^}]*min-width:\s*164px[^}]*max-width:\s*164px/s,
  'the English mid-width Direction control must reserve space for its complete selected value',
);
assert.match(
  midTopbar,
  /body\.is-lang-en \.applications-view #sortDirection\s*\{[^}]*min-width:\s*100px[^}]*max-width:\s*100px/s,
  'the English mid-width Direction select must include native-arrow space after Ascending',
);
assert.match(
  phone,
  /\.applications-view \.toolbar\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s,
  'the phone toolbar must use two readable columns',
);
assert.match(
  phone,
  /\.applications-view \.search-field\s*\{[^}]*grid-column:\s*1\s*\/\s*-1/s,
  'Search must own the complete first phone toolbar row',
);
assert.match(
  phone,
  /\.applications-view #statusFilter\s*\{[^}]*width:\s*100%[^}]*max-width:\s*none/s,
  'Status must fill its second-row grid cell',
);
assert.match(
  phone,
  /\.applications-view \.tool-select select\s*\{[^}]*flex:\s*1 1 0[^}]*width:\s*auto[^}]*max-width:\s*none/s,
  'selected Direction and Group values must receive remaining control width',
);
assert.match(
  narrowPhone,
  /\.applications-view \.toolbar\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  'the narrowest phone toolbar must stack into one column',
);
assert.match(
  narrowPhone,
  /\.applications-view \.search-field\s*\{[^}]*grid-column:\s*1/s,
  'the single-column fallback must not retain a two-column span',
);
assert.match(html, /jobTrackerStyles\.css\?v=20260813-responsive-applications-final-fix/);

console.log('responsive Applications polish tests passed');
