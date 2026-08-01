import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../src/jobTrackerStyles.css', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

assert.match(
  css,
  /\/\* Shared phone and half-screen structure \*\/\s*@media \(max-width: 820px\)/,
  'phone and half-screen should share the accepted responsive structure',
);
assert.match(css, /\.metric-grid\s*\{[^}]*grid-template-columns:\s*repeat\(12,\s*minmax\(0,\s*1fr\)\)/s);
assert.match(css, /\.metric-card:nth-child\(-n \+ 3\)\s*\{[^}]*grid-column:\s*span 4/s);
assert.match(css, /\.metric-card:nth-child\(n \+ 4\)\s*\{[^}]*grid-column:\s*span 3/s);
assert.match(css, /\.dashboard-grid\s*\{[^}]*grid-template-columns:\s*1fr/s);
assert.match(
  css,
  /\.chart-layout\s*\{[^}]*grid-template-columns:\s*minmax\(180px,\s*0\.8fr\)\s*minmax\(0,\s*1\.2fr\)/s,
);
assert.match(css, /\.rate-stack\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s);
assert.match(css, /\.applications-view tbody\s*\{[^}]*gap:\s*0/s);
assert.match(css, /\.applications-view tbody tr\s*\{[^}]*border-radius:\s*0/s);
assert.match(css, /\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*grid-template-columns:/s);
assert.match(css, /\.applications-view \.alphabet-index\s*\{[^}]*right:\s*4px/s);
assert.match(html, /jobTrackerStyles\.css\?v=20260730-mobile-five-column-final-fix/);

console.log('half-screen responsive tests passed');
