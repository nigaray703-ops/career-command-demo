import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/jobTrackerStyles.css', import.meta.url), 'utf8');
const indexUrl = new URL('../index.html', import.meta.url);
const productionUrl = new URL('../job-tracker.html', import.meta.url);
const html = readFileSync(existsSync(indexUrl) ? indexUrl : productionUrl, 'utf8');

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

console.log('responsive Applications polish tests passed');
