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
const desktop = extractMediaBlock(
  css,
  '/* Desktop Applications spacing */\n@media (min-width: 1025px)',
);
const phone = extractMediaBlock(
  css,
  '/* Phone five-column compaction */\n@media (max-width: 520px)',
);

assert.match(
  comfortable,
  /\.workspace:has\(\.applications-view\.active\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  'Only an active Applications workspace should replace the min-content implicit grid track',
);
assert.match(
  comfortable,
  /\.applications-view thead tr\s*\{[^}]*display:\s*grid[^}]*grid-template-columns:\s*minmax\(0,\s*1\.45fr\)\s*minmax\(110px,\s*0\.82fr\)\s*minmax\(90px,\s*0\.72fr\)\s*minmax\(110px,\s*0\.7fr\)[^}]*grid-template-areas:\s*"identity date status candidate"/s,
);
assert.match(
  comfortable,
  /\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*display:\s*grid[^}]*grid-template-areas:\s*"company date status candidate"\s*"role actions actions actions"/s,
);
assert.match(
  comfortable,
  /\.applications-view tbody tr\.group-row,\s*\.applications-view tbody tr\.group-row td\s*\{[^}]*display:\s*block[^}]*width:\s*100%/s,
  'Grouped sections must remain full-width when tbody becomes block-level',
);
assert.match(
  comfortable,
  /\.applications-view thead th:nth-child\(1\),\s*\.applications-view thead th:nth-child\(3\),\s*\.applications-view thead th:nth-child\(4\),\s*\.applications-view thead th:nth-child\(8\),\s*\.applications-view td:nth-child\(1\),\s*\.applications-view td:nth-child\(2\),\s*\.applications-view td:nth-child\(3\),\s*\.applications-view td:nth-child\(4\),\s*\.applications-view td:nth-child\(8\)\s*\{[^}]*width:\s*auto/s,
  'Visible comfortable-layout cells must override the global percentage widths',
);
assert.match(
  comfortable,
  /\.applications-view thead th:nth-child\(9\)\s*\{[^}]*display:\s*none/s,
  'Actions must leave the narrow header row and move to the record second line',
);
assert.match(
  comfortable,
  /\.applications-view td:nth-child\(9\)\s*\{[^}]*grid-area:\s*actions[^}]*justify-self:\s*end[^}]*width:\s*min\(100%,\s*220px\)/s,
);
assert.match(
  desktop,
  /\.applications-view td:nth-child\(n\s*\+\s*3\):nth-child\(-n\s*\+\s*8\),[\s\S]*\.applications-view th:nth-child\(n\s*\+\s*3\):nth-child\(-n\s*\+\s*8\)\s*\{[^}]*text-align:\s*center/s,
  'Desktop columns 3 through 8 must center headers and contents',
);
assert.match(
  comfortable,
  /\.applications-view thead th:nth-child\(3\),[\s\S]*\.applications-view td:nth-child\(8\)\s*\{[^}]*text-align:\s*center/s,
  'Comfortable Date, Status, and Candidate Home headers and cells must be centered',
);
assert.match(
  comfortable,
  /\.applications-view tbody tr:not\(\.group-row\) td:nth-child\(8\)\s*>\s*\*\s*\{[^}]*justify-self:\s*center/s,
  'The Candidate Home child must override the shared start alignment in the comfortable layout',
);
assert.doesNotMatch(
  phone,
  /\.applications-view thead th:nth-child\(3\),[\s\S]*\.applications-view td:nth-child\(8\)\s*\{[^}]*text-align:\s*center/s,
  'The comfortable alignment rule must not leak into phone compaction',
);
assert.doesNotMatch(
  phone,
  /\.applications-view tbody tr:not\(\.group-row\) td:nth-child\(8\)\s*>\s*\*\s*\{[^}]*justify-self:\s*center/s,
  'The Candidate Home child centering rule must not leak into phone compaction',
);
assert.doesNotMatch(
  phone,
  /\.applications-view td:nth-child\(n\s*\+\s*3\):nth-child\(-n\s*\+\s*8\),[\s\S]*\.applications-view th:nth-child\(n\s*\+\s*3\):nth-child\(-n\s*\+\s*8\)\s*\{[^}]*text-align:\s*center/s,
  'The desktop alignment rule must not leak into phone compaction',
);
assert.match(
  desktop,
  /\.workspace:has\(\.applications-view\.active\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s,
  'The desktop boundary must contain the active Applications workspace grid track',
);
assert.match(
  desktop,
  /\.applications-view\.active\s*\{[^}]*padding-right:\s*30px/s,
);
assert.match(
  desktop,
  /\.applications-view \.panel\s*\{[^}]*padding-inline:\s*14px/s,
);
assert.match(
  desktop,
  /\.applications-view table\s*\{[^}]*min-width:\s*0/s,
  'The desktop table must release the fixed width floor so all nine columns fit inside the visible wrap',
);
assert.match(
  phone,
  /\.applications-view thead tr,\s*\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s*minmax\(0,\s*0\.72fr\)\s*minmax\(0,\s*0\.5fr\)\s*minmax\(0,\s*0\.58fr\)\s*minmax\(0,\s*0\.9fr\)/s,
  'The approved phone five-column layout must stay intact',
);
assert.match(html, /jobTrackerStyles\.css\?v=20260813-responsive-applications-final-fix/);

console.log('responsive Applications spacing tests passed');
