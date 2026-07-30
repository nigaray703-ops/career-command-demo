import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/jobTrackerStyles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(css, /\/\* Shared phone and half-screen structure \*\/\s*@media \(max-width: 820px\)/);
assert.doesNotMatch(css, /@media \(min-width: 521px\) and \(max-width: 820px\)/);
assert.match(css, /\/\* Phone five-column compaction \*\/\s*@media \(max-width: 520px\)/);
assert.match(css, /\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s);
assert.match(css, /\.metric-card:nth-child\(-n \+ 3\)\s*\{[^}]*grid-column:\s*span 4/s);
assert.match(css, /\.metric-card:nth-child\(n \+ 4\)\s*\{[^}]*grid-column:\s*span 3/s);
assert.match(
  css,
  /\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s*minmax\(0,\s*0\.72fr\)\s*minmax\(0,\s*0\.5fr\)\s*minmax\(0,\s*0\.58fr\)\s*minmax\(0,\s*0\.9fr\)/s,
);
assert.match(css, /\.sidebar-account\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\)/s);
assert.match(css, /\.applications-view \.alphabet-index\s*\{[^}]*right:\s*2px/s);
assert.match(html, /jobTrackerStyles\.css\?v=20260730-mobile-five-column/);

console.log('mobile five-column layout tests passed');
