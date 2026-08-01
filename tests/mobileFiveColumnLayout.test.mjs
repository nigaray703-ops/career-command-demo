import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/jobTrackerStyles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function extractMediaBlock(source, query) {
  const mediaStart = source.indexOf(query);
  assert.notEqual(mediaStart, -1, `missing ${query}`);

  const openingBrace = source.indexOf('{', mediaStart);
  let depth = 0;

  for (let index = openingBrace; index < source.length; index += 1) {
    if (source[index] === '{') depth += 1;
    if (source[index] === '}') depth -= 1;
    if (depth === 0) return source.slice(openingBrace + 1, index);
  }

  assert.fail(`unclosed ${query}`);
}

const sharedResponsiveCss = extractMediaBlock(
  css,
  '/* Shared phone and half-screen structure */\n@media (max-width: 820px)',
);
const phoneCompactionCss = extractMediaBlock(
  css,
  '/* Phone five-column compaction */\n@media (max-width: 520px)',
);

assert.match(css, /\/\* Shared phone and half-screen structure \*\/\s*@media \(max-width: 820px\)/);
assert.doesNotMatch(css, /@media \(min-width: 521px\) and \(max-width: 820px\)/);
assert.match(css, /\/\* Phone five-column compaction \*\/\s*@media \(max-width: 520px\)/);
assert.match(
  sharedResponsiveCss,
  /body\s*\{[^}]*min-width:\s*0/s,
  'responsive body must shrink below its nominal viewport when a vertical scrollbar reserves space',
);
assert.match(css, /\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s);
assert.match(css, /\.metric-card:nth-child\(-n \+ 3\)\s*\{[^}]*grid-column:\s*span 4/s);
assert.match(css, /\.metric-card:nth-child\(n \+ 4\)\s*\{[^}]*grid-column:\s*span 3/s);
assert.match(
  css,
  /\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s*minmax\(0,\s*0\.72fr\)\s*minmax\(0,\s*0\.5fr\)\s*minmax\(0,\s*0\.58fr\)\s*minmax\(0,\s*0\.9fr\)/s,
);
assert.match(
  sharedResponsiveCss,
  /\.applications-view thead tr\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.4fr\)\s*minmax\(0,\s*0\.8fr\)\s*minmax\(0,\s*0\.6fr\)\s*minmax\(0,\s*0\.65fr\)\s*minmax\(0,\s*1fr\)/s,
  'the 521px Applications header must use zero-minimum fractional tracks',
);
assert.match(
  sharedResponsiveCss,
  /\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.4fr\)\s*minmax\(0,\s*0\.8fr\)\s*minmax\(0,\s*0\.6fr\)\s*minmax\(0,\s*0\.65fr\)\s*minmax\(0,\s*1fr\)/s,
  'the 521px Applications rows must use zero-minimum fractional tracks',
);
assert.match(
  sharedResponsiveCss,
  /\.applications-view thead th\s*\{[^}]*min-width:\s*0[^}]*width:\s*auto[^}]*white-space:\s*normal[^}]*overflow-wrap:\s*anywhere/s,
  'the 521px Applications headers must wrap inside their fractional tracks',
);
assert.match(
  sharedResponsiveCss,
  /\.applications-view thead th:nth-child\(n\)\s*\{[^}]*width:\s*auto[^}]*white-space:\s*normal[^}]*overflow-wrap:\s*anywhere[^}]*word-break:\s*normal/s,
  'responsive header overrides must beat the desktop nth-child widths and nowrap rules',
);
assert.match(
  sharedResponsiveCss,
  /\.applications-view td\s*\{[^}]*min-width:\s*0[^}]*white-space:\s*normal[^}]*overflow-wrap:\s*anywhere/s,
  'the 521px Applications cell content must wrap inside its fractional track',
);
assert.match(
  sharedResponsiveCss,
  /\.applications-view tbody tr:not\(\.group-row\) td:nth-child\(4\)\s*\{[^}]*white-space:\s*normal[^}]*overflow-wrap:\s*anywhere[^}]*word-break:\s*normal/s,
  'responsive dates must override the desktop nowrap rule',
);
assert.match(
  sharedResponsiveCss,
  /\.applications-view \.row-actions button\s*\{[^}]*min-width:\s*0[^}]*padding-inline:\s*2px[^}]*white-space:\s*normal/s,
  'the 521px Edit and Delete buttons must not overlap',
);
assert.match(
  sharedResponsiveCss,
  /\.sidebar-account \.sidebar-actions\s*\{[^}]*grid-template-columns:\s*repeat\(3,\s*minmax\(0,\s*1fr\)\)/s,
  'the 521px account actions must not add one pixel of document overflow',
);
assert.match(
  phoneCompactionCss,
  /\.applications-view \.tool-select\s*\{[^}]*min-width:\s*0[^}]*max-width:\s*none[^}]*width:\s*100%/s,
  'phone toolbar grid items must shrink inside the client width',
);
assert.match(
  phoneCompactionCss,
  /\.applications-view \.tool-select select\s*\{[^}]*min-width:\s*0[^}]*width:\s*100%/s,
  'English phone toolbar selects must shrink inside their grid tracks',
);
assert.match(css, /\.sidebar-account\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
assert.match(css, /\.applications-view \.alphabet-index\s*\{[^}]*right:\s*2px/s);
assert.match(html, /jobTrackerStyles\.css\?v=20260730-mobile-five-column-final-fix/);

console.log('mobile five-column layout tests passed');
