import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const htmlName = import.meta.url.includes('/demo-github/') ? '../index.html' : '../job-tracker.html';
const html = readFileSync(new URL(htmlName, import.meta.url), 'utf8');
const app = readFileSync(new URL('../src/jobTrackerApp.js', import.meta.url), 'utf8');
const css = readFileSync(new URL('../src/jobTrackerStyles.css', import.meta.url), 'utf8');

assert.match(
  html,
  /class="interview-history-field"[\s\S]*name="everInterviewed"[\s\S]*id="everInterviewed"[\s\S]*type="checkbox"[\s\S]*value="true"/,
  'the form must expose one editable historical interview checkbox',
);
assert.match(app, /everInterviewed:\s*'曾进入面试'/);
assert.match(app, /everInterviewed:\s*'Reached interview stage'/);
assert.match(app, /interviewRateHint:\s*'曾进入面试的申请比例'/);
assert.match(app, /interviewRateHint:\s*'Share of applications that reached interview stage'/);
assert.match(app, /everInterviewed:\s*document\.querySelector\('#everInterviewed'\)/);
assert.match(app, /els\.statusOptions\.addEventListener\('change',\s*syncEverInterviewedField\)/);
assert.match(
  app,
  /function syncEverInterviewedField\(\)[\s\S]*isInterviewStageStatus\(els\.statusOptions\.value\)[\s\S]*els\.everInterviewed\.checked = true[\s\S]*els\.everInterviewed\.disabled = forced/,
);
assert.match(app, /everInterviewed:\s*els\.everInterviewed\.checked/);
assert.match(css, /\.interview-history-control\s*\{[^}]*display:\s*flex/s);
assert.match(css, /\.application-form \.interview-history-control input\s*\{[^}]*width:\s*18px/s);
assert.match(html, /jobTrackerStyles\.css\?v=20260816-alphabet-index-panel-align/);
assert.match(html, /jobTrackerApp\.js\?v=20260816-alphabet-index-panel-align/);
assert.match(app, /jobTrackerLogic\.js\?v=20260812-ever-interviewed/);

console.log('historical interview form tests passed');
