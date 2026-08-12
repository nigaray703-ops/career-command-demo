# Historical Interview Milestone Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a user-editable `everInterviewed` milestone so the interview rate reflects applications that ever reached interview, while all dashboard status counts remain exclusive current-state counts.

**Architecture:** Normalize the milestone inside `jobTrackerLogic.js`, derive the historical interview rate from that normalized boolean, and keep current-state metrics based on `record.status`. Add one bilingual checkbox to the existing application form; the app forces it on for current Interview/Final statuses but leaves Active/Rejected/Offer editable. Demo and production continue sharing byte-identical HTML, app logic, business logic, and presentation CSS; their cloud adapters remain intentionally different.

**Tech Stack:** Static HTML, CSS, ES modules, Node.js assertion tests, Codex in-app browser, Supabase JSON record storage, GitHub Pages, Vercel CLI.

**Execution root:** Run commands from `/Users/nigarayaskar/Documents/求职追踪器/production-current` unless a step gives a different working directory. Its `demo-github` child is the GitHub Pages repository; the root files are the Vercel production source.

## Global Constraints

- Offer remains one current status; do not add Offer source values or Offer subtypes.
- “Interview” count shows only records whose current status is `面试`.
- “Offer” count shows only records whose current status is `Offer`.
- Status distribution remains a mutually exclusive current-status breakdown.
- Interview rate equals `everInterviewed === true` records divided by all applications.
- Saving current status `面试` or `终面` forces `everInterviewed: true`.
- Offer, 已拒, and 申请中 do not imply interview; the user may check or uncheck their milestone manually.
- A previously true milestone must survive a later status change unless the user explicitly unchecks it while the current status permits editing.
- Legacy 面试/终面 records migrate to true; legacy 申请中/已拒/Offer records migrate to false without guessing.
- Preserve all existing real records, fields, Supabase authentication, RLS, account isolation, import/export behavior, filters, sorting, grouping, A–Z, Candidate Home, Edit, Delete, and responsive layout.
- Test only fictional demo records; do not edit authenticated production records.
- Publish GitHub Pages and Vercel only after local logic, UI, persistence, bilingual, responsive, and source-equality verification passes.

---

### Task 0: Isolate the feature and preserve the original production source

**Files:**
- Read: `demo-github/.git`
- Read: `demo-github` tracked and untracked status
- Create outside repositories: `/private/tmp/jobtracker-ever-interviewed-original/`

**Interfaces:**
- Produces: branch `feature/ever-interviewed-metric` from the reviewed `main` commit.
- Produces: a pre-change copy of the four active Vercel presentation/business source files.
- Preserves: every pre-existing untracked path in `demo-github` without staging, moving, or deleting it.

- [ ] **Step 1: Confirm the reviewed starting point and record user-owned files**

```bash
test "$(git -C demo-github branch --show-current)" = "main"
git -C demo-github status --short --branch
git -C demo-github diff --check
git -C demo-github log -3 --oneline
```

Expected: `main` includes the approved design and implementation-plan commits. Record every untracked path before proceeding. Do not stage or delete any pre-existing untracked file or directory.

- [ ] **Step 2: Create the named feature branch**

```bash
git -C demo-github switch -c feature/ever-interviewed-metric
test "$(git -C demo-github branch --show-current)" = "feature/ever-interviewed-metric"
```

If the branch name already exists or switching reports a collision, stop and inspect it; do not reset, force, or overwrite it.

- [ ] **Step 3: Back up the active Vercel source before any modification**

```bash
mkdir -p /private/tmp/jobtracker-ever-interviewed-original
cp job-tracker.html /private/tmp/jobtracker-ever-interviewed-original/job-tracker.html
cp src/jobTrackerApp.js /private/tmp/jobtracker-ever-interviewed-original/jobTrackerApp.js
cp src/jobTrackerLogic.js /private/tmp/jobtracker-ever-interviewed-original/jobTrackerLogic.js
cp src/jobTrackerStyles.css /private/tmp/jobtracker-ever-interviewed-original/jobTrackerStyles.css
shasum -a 256 /private/tmp/jobtracker-ever-interviewed-original/job-tracker.html /private/tmp/jobtracker-ever-interviewed-original/jobTrackerApp.js /private/tmp/jobtracker-ever-interviewed-original/jobTrackerLogic.js /private/tmp/jobtracker-ever-interviewed-original/jobTrackerStyles.css
```

Record the four pre-change hashes in the final implementation report.

---

### Task 1: Add the normalized milestone and correct statistics

**Files:**
- Create: `demo-github/tests/everInterviewedMetric.test.mjs`
- Create: `tests/everInterviewedMetric.test.mjs`
- Modify: `demo-github/src/jobTrackerLogic.js`
- Modify: `src/jobTrackerLogic.js`
- Modify: `tests/jobTrackerLogic.test.mjs`

**Interfaces:**
- Produces: `isInterviewStageStatus(status: string): boolean`.
- Extends every normalized application with `everInterviewed: boolean`.
- Extends `calculateDashboardStats(records)` with `interviewCount` as current `面试` count and `everInterviewedCount` as historical milestone count.
- Preserves: all existing serialization, backup, restore, filter, sort, group, update, and delete interfaces.

- [ ] **Step 1: Write the shared failing milestone test in both sources**

Create both `demo-github/tests/everInterviewedMetric.test.mjs` and `tests/everInterviewedMetric.test.mjs` with this exact content:

```js
import assert from 'node:assert/strict';
import {
  calculateDashboardStats,
  createApplication,
  restoreApplications,
  serializeApplications,
  updateApplication,
} from '../src/jobTrackerLogic.js';

const interview = createApplication({ id: 'interview', status: '面试' });
const finalRound = createApplication({ id: 'final', status: '终面' });
const directOffer = createApplication({ id: 'direct-offer', status: 'Offer' });
const interviewedOffer = createApplication({ id: 'interviewed-offer', status: 'Offer', everInterviewed: true });
const rejectedAfterInterview = createApplication({ id: 'rejected', status: '已拒', everInterviewed: true });

assert.equal(interview.everInterviewed, true, 'current Interview must force the historical milestone');
assert.equal(finalRound.everInterviewed, true, 'current Final must force the historical milestone');
assert.equal(directOffer.everInterviewed, false, 'Offer must not imply an interview');
assert.equal(interviewedOffer.everInterviewed, true, 'Offer may be manually marked as interviewed');
assert.equal(
  createApplication({ status: '已拒', everInterviewed: 'true' }).everInterviewed,
  false,
  'legacy strings must not be guessed as a true milestone',
);

const directOfferOnly = calculateDashboardStats([directOffer]);
assert.equal(directOfferOnly.interviewRate, 0, 'a direct Offer must not increase interview rate');
assert.equal(directOfferOnly.statusCounts.Offer, 1, 'the direct Offer remains one current Offer');
assert.equal(directOfferOnly.interviewCount, 0, 'the current Interview count stays exclusive');

const records = [interview, finalRound, directOffer, interviewedOffer, rejectedAfterInterview];
const stats = calculateDashboardStats(records);
assert.equal(stats.statusCounts['面试'], 1, 'only the current Interview record counts as Interview');
assert.equal(stats.statusCounts.Offer, 2, 'both Offers count once as current Offers');
assert.equal(stats.interviewCount, 1, 'Interview count must equal the exact current status count');
assert.equal(stats.everInterviewedCount, 4, 'historical count includes Interview, Final, interviewed Offer, and rejected-after-interview');
assert.equal(stats.interviewRate, 80, 'historical interview rate uses the milestone over total applications');

const movedToRejected = updateApplication([interview], 'interview', { status: '已拒' })[0];
assert.equal(movedToRejected.everInterviewed, true, 'Interview to Rejected must preserve the milestone automatically');
assert.equal(calculateDashboardStats([movedToRejected]).interviewRate, 100);
assert.equal(calculateDashboardStats([movedToRejected]).interviewCount, 0);

const movedToOffer = updateApplication([interview], 'interview', { status: 'Offer' })[0];
assert.equal(movedToOffer.everInterviewed, true, 'Interview to Offer must preserve the milestone automatically');
assert.equal(calculateDashboardStats([movedToOffer]).statusCounts.Offer, 1);
assert.equal(calculateDashboardStats([movedToOffer]).interviewCount, 0);
assert.equal(calculateDashboardStats([movedToOffer]).interviewRate, 100);

const manuallyCorrected = updateApplication([movedToRejected], 'interview', { everInterviewed: false })[0];
assert.equal(manuallyCorrected.everInterviewed, false, 'an editable non-interview status may be manually corrected');

const restored = restoreApplications(serializeApplications([interviewedOffer]), []);
assert.equal(restored[0].everInterviewed, true, 'serialization and restore must preserve the milestone');

console.log('historical interview milestone tests passed');
```

- [ ] **Step 2: Run both new tests and verify RED**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedMetric.test.mjs
```

Expected: both fail because normalized records do not yet expose `everInterviewed` and direct Offer currently increases interview rate.

- [ ] **Step 3: Implement the milestone normalization in both logic files**

Add this exported helper after the constants in both `jobTrackerLogic.js` files:

```js
const INTERVIEW_STAGE_STATUSES = new Set(['面试', '终面']);

export function isInterviewStageStatus(status) {
  return INTERVIEW_STAGE_STATUSES.has(status);
}
```

Change `createApplication` so it normalizes status once and writes a strict boolean. Add:

```js
export function createApplication(input = {}) {
  const now = new Date().toISOString();
  const status = normalizeStatus(input.status);
  return {
```

Replace the current `status` property with these exact adjacent properties:

```js
status,
everInterviewed: isInterviewStageStatus(status) || input.everInterviewed === true,
```

Keep every other existing property in its current order, then retain the existing closing:

```js
  };
}
```

Do not interpret `'true'`, `'on'`, `1`, or other non-boolean values as historical evidence.

- [ ] **Step 4: Replace the statistics calculation in both logic files**

Use exact current-state and historical counts:

```js
const total = records.length;
const interviewCount = statusCounts['面试'] || 0;
const everInterviewedCount = records.reduce(
  (sum, record) => sum + (record.everInterviewed === true ? 1 : 0),
  0,
);
const rejected = statusCounts['已拒'] || 0;

return {
  total,
  statusCounts,
  applied: statusCounts['申请中'] || 0,
  rejected,
  interviewCount,
  everInterviewedCount,
  offer: statusCounts.Offer || 0,
  noResponse: 0,
  rejectionRate: total ? roundRate((rejected / total) * 100) : 0,
  interviewRate: total ? roundRate((everInterviewedCount / total) * 100) : 0,
};
```

- [ ] **Step 5: Update the existing production logic assertions**

In `tests/jobTrackerLogic.test.mjs`, replace the old aggregate-stage assertion with:

```js
assert.equal(stats.interviewCount, 1, 'interview count should use the exact current Interview status');
assert.equal(stats.everInterviewedCount, 2, 'legacy current Interview and Final records should infer the milestone');
assert.equal(stats.interviewRate, 50, 'interview rate should use historical interview milestones');
```

Add to the empty-state block:

```js
assert.equal(seedStats.everInterviewedCount, 0, 'empty fallback should have no historical interview milestones');
```

- [ ] **Step 6: Run logic tests and prove both sources match**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/jobTrackerLogic.test.mjs
cmp demo-github/src/jobTrackerLogic.js src/jobTrackerLogic.js
```

Expected: all tests pass and `cmp` exits `0`.

- [ ] **Step 7: Commit only the demo logic deliverable**

Run from the repository containing `demo-github`:

```bash
git -C demo-github add src/jobTrackerLogic.js tests/everInterviewedMetric.test.mjs
git -C demo-github commit -m "feat: track historical interview milestone"
```

The production root is not a Git repository; its source and tests remain local for Vercel validation.

---

### Task 2: Add the bilingual editable form control

**Files:**
- Create: `demo-github/tests/everInterviewedForm.test.mjs`
- Create: `tests/everInterviewedForm.test.mjs`
- Modify: `demo-github/index.html`
- Modify: `job-tracker.html`
- Modify: `demo-github/src/jobTrackerApp.js`
- Modify: `src/jobTrackerApp.js`
- Modify: `demo-github/src/jobTrackerStyles.css`
- Modify: `src/jobTrackerStyles.css`
- Modify: `demo-github/tests/halfScreenResponsive.test.mjs`
- Modify: `demo-github/tests/mobileFiveColumnLayout.test.mjs`
- Modify: `tests/halfScreenResponsive.test.mjs`
- Modify: `tests/mobileFiveColumnLayout.test.mjs`

**Interfaces:**
- Consumes: `isInterviewStageStatus(status)` and normalized `record.everInterviewed` from Task 1.
- Produces: checkbox `#everInterviewed`, `syncEverInterviewedField()`, bilingual labels/hints, and cache key `20260812-ever-interviewed`.
- Preserves: one Offer status and all existing form fields/actions.

- [ ] **Step 1: Add the same failing static UI contract to both sources**

Create both `demo-github/tests/everInterviewedForm.test.mjs` and `tests/everInterviewedForm.test.mjs` with this exact content:

```js
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
assert.match(html, /jobTrackerStyles\.css\?v=20260812-ever-interviewed/);
assert.match(html, /jobTrackerApp\.js\?v=20260812-ever-interviewed/);
assert.match(app, /jobTrackerLogic\.js\?v=20260812-ever-interviewed/);

console.log('historical interview form tests passed');
```

- [ ] **Step 2: Run the static UI contracts and verify RED**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedForm.test.mjs
```

Expected: fail on the missing checkbox, translations, synchronization function, and cache key.

- [ ] **Step 3: Add the checkbox markup to both HTML forms**

Insert immediately after the current-status field in both HTML files:

```html
<label class="interview-history-field">
  <span data-i18n="everInterviewed">曾进入面试</span>
  <span class="interview-history-control">
    <input name="everInterviewed" id="everInterviewed" type="checkbox" value="true" />
    <small data-i18n="everInterviewedHint">用于面试率；Offer、已拒和申请中可手动修改</small>
  </span>
</label>
```

Update both stylesheet and app-script URLs:

```html
<link rel="stylesheet" href="./src/jobTrackerStyles.css?v=20260812-ever-interviewed" />
<script type="module" src="./src/jobTrackerApp.js?v=20260812-ever-interviewed"></script>
```

- [ ] **Step 4: Add bilingual copy and cache-busted logic import to both app files**

Change the logic import specifier to:

```js
} from './jobTrackerLogic.js?v=20260812-ever-interviewed';
```

Import `isInterviewStageStatus` in the same import list. Add these exact translation values:

```js
// zh
everInterviewed: '曾进入面试',
everInterviewedHint: '用于面试率；Offer、已拒和申请中可手动修改',
interviewRateHint: '曾进入面试的申请比例',

// en
everInterviewed: 'Reached interview stage',
everInterviewedHint: 'Used for interview rate; editable for Active, Rejected, and Offer',
interviewRateHint: 'Share of applications that reached interview stage',
```

Do not change `interview`, `interviewHint`, `offer`, or `offerHint`; those remain current-status cards.

- [ ] **Step 5: Wire the form behavior in both app files**

Add to `els`:

```js
everInterviewed: document.querySelector('#everInterviewed'),
```

Add this event after the existing form/filter bindings:

```js
els.statusOptions.addEventListener('change', syncEverInterviewedField);
```

Replace the form-value assignment in `openForm` with checkbox-aware assignment, then synchronize:

```js
Object.entries(application).forEach(([key, value]) => {
  const field = els.form.elements[key];
  if (!field) return;
  if (field.type === 'checkbox') field.checked = value === true;
  else field.value = value;
});
syncEverInterviewedField();
```

Add the synchronization function:

```js
function syncEverInterviewedField() {
  const forced = isInterviewStageStatus(els.statusOptions.value);
  if (forced) els.everInterviewed.checked = true;
  els.everInterviewed.disabled = forced;
}
```

Change `saveForm` so a disabled forced checkbox is still saved correctly:

```js
const application = createApplication({
  ...data,
  everInterviewed: els.everInterviewed.checked,
});
```

- [ ] **Step 6: Style the checkbox without disturbing other inputs**

Add to both CSS files beside the existing form styles:

```css
.interview-history-field {
  align-content: start;
}

.interview-history-control {
  display: flex;
  align-items: center;
  gap: 9px;
  min-height: 40px;
  padding: 8px 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: white;
}

.application-form .interview-history-control input {
  width: 18px;
  height: 18px;
  min-height: 18px;
  padding: 0;
  flex: 0 0 auto;
}

.interview-history-control small {
  color: var(--muted);
  font-size: 11px;
  font-weight: 650;
  line-height: 1.3;
}

.interview-history-control:has(input:disabled) {
  background: #f8fafc;
}
```

- [ ] **Step 7: Update cache assertions in the existing responsive tests**

In all four `halfScreenResponsive.test.mjs` and `mobileFiveColumnLayout.test.mjs` files, replace the old stylesheet cache assertion with:

```js
assert.match(html, /jobTrackerStyles\.css\?v=20260812-ever-interviewed/);
```

- [ ] **Step 8: Run the full local suite and source-equality checks**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/jobTrackerLogic.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/candidateTranslationAndSpacing.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/mobileFiveColumnLayout.test.mjs
cmp demo-github/index.html job-tracker.html
cmp demo-github/src/jobTrackerApp.js src/jobTrackerApp.js
cmp demo-github/src/jobTrackerLogic.js src/jobTrackerLogic.js
cmp demo-github/src/jobTrackerStyles.css src/jobTrackerStyles.css
```

Expected: ten tests pass and all four `cmp` commands exit `0`.

- [ ] **Step 9: Commit only the demo UI deliverable**

```bash
git -C demo-github add index.html src/jobTrackerApp.js src/jobTrackerStyles.css tests/everInterviewedForm.test.mjs tests/halfScreenResponsive.test.mjs tests/mobileFiveColumnLayout.test.mjs
git -C demo-github commit -m "feat: add editable interview milestone control"
```

---

### Task 3: Verify historical and current-state behavior in the browser

**Files:**
- Create outside repositories: `/private/tmp/jobtracker-ever-interviewed-qa/`
- Modify only after an observed defect: the synchronized demo/production files and their covering tests.

**Interfaces:**
- Consumes: the normalized field, form behavior, bilingual text, demo fake cloud adapter, and dashboard statistics from Tasks 1–2.
- Produces: rendered evidence for migration, manual Offer editing, transition preservation, reload persistence, exclusive current counts, and historical interview rate.

- [ ] **Step 1: Confirm the original backup and prepare rendered-QA evidence**

```bash
test -f /private/tmp/jobtracker-ever-interviewed-original/job-tracker.html
test -f /private/tmp/jobtracker-ever-interviewed-original/jobTrackerApp.js
test -f /private/tmp/jobtracker-ever-interviewed-original/jobTrackerLogic.js
test -f /private/tmp/jobtracker-ever-interviewed-original/jobTrackerStyles.css
mkdir -p /private/tmp/jobtracker-ever-interviewed-qa
```

- [ ] **Step 2: Start the verified demo locally**

Run from `demo-github`:

```bash
python3 -m http.server 8012 --bind 127.0.0.1
```

Open `http://127.0.0.1:8012/` using `browser:control-in-app-browser`. Do not claim or reuse an ambient user tab.

- [ ] **Step 3: Reset fictional demo state and verify legacy inference**

Clear only the demo keys in the isolated browser profile, sign in with the fictional Demo User, and inspect the seeded records.

Expected initial dashboard for five demo records:

```text
Current Interview count: 1 (Summit Cloud)
Current Offer count: 1 (Kinetic Labs)
Historical interviewed records: 2 (Summit Interview + Nova Final)
Interview rate: 40%
Kinetic direct Offer checkbox: enabled and unchecked
Summit current Interview checkbox: checked and disabled
Nova current Final checkbox: checked and disabled
```

- [ ] **Step 4: Verify Offer stays one status and is manually editable**

At viewport `390 × 950`:

```text
Open Applications -> edit Kinetic Labs -> current status remains Offer
Confirm “曾进入面试” is enabled and unchecked
Check it -> Save -> Dashboard
Confirm Offer count stays 1, Interview count stays 1, interview rate becomes 60%
Reload -> edit Kinetic -> checkbox remains checked
Uncheck -> Save -> confirm Offer count stays 1 and interview rate returns to 40%
```

This proves Offer is not split or double-counted.

- [ ] **Step 5: Verify Interview to Rejected preserves history**

```text
Edit Summit Cloud -> change status from 面试 to 已拒
Confirm checkbox becomes enabled but remains checked
Save -> Dashboard
Confirm current Interview count becomes 0
Confirm current Rejected count increases by 1
Confirm interview rate remains 40% because Summit and Nova retain the milestone
Reload -> edit Summit -> checkbox remains checked
```

- [ ] **Step 6: Verify manual backfill and bilingual behavior**

```text
Edit Harbour Analytics (current 已拒) -> checkbox starts enabled and unchecked
Check -> Save -> interview rate increases from 40% to 60% without changing Rejected count
Switch language to English
Reopen Harbour -> label is “Reached interview stage”
Dashboard hint is “Share of applications that reached interview stage”
Uncheck Harbour and save -> interview rate returns to 40%
```

- [ ] **Step 7: Verify responsive presentation and non-mutation safeguards**

At `390 × 950`, `670 × 950`, and `1200 × 900` verify:

```text
Checkbox and hint stay fully visible
Dialog has no horizontal overflow
Current Interview and Offer cards remain separate
Dashboard and Applications remain separate views
Edit cancel leaves the record unchanged
Delete opens but Cancel preserves the record
Console warnings: 0
Console errors/page errors: 0
```

Save screenshots outside repositories:

```text
/private/tmp/jobtracker-ever-interviewed-qa/form-zh-390.png
/private/tmp/jobtracker-ever-interviewed-qa/form-en-670.png
/private/tmp/jobtracker-ever-interviewed-qa/dashboard-en-1200.png
```

- [ ] **Step 8: Re-run the complete suite after browser QA**

Run the complete maintained suite and source-equality checks:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/jobTrackerLogic.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/candidateTranslationAndSpacing.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/mobileFiveColumnLayout.test.mjs
cmp demo-github/index.html job-tracker.html
cmp demo-github/src/jobTrackerApp.js src/jobTrackerApp.js
cmp demo-github/src/jobTrackerLogic.js src/jobTrackerLogic.js
cmp demo-github/src/jobTrackerStyles.css src/jobTrackerStyles.css
```

If browser QA required a scoped fix, add a failing assertion first, patch both sources, repeat the browser symptom, and commit only the demo files with:

```bash
git -C demo-github add index.html src/jobTrackerApp.js src/jobTrackerLogic.js src/jobTrackerStyles.css tests
git -C demo-github commit -m "fix: preserve historical interview form behavior"
```

Do not create an empty commit when no fix was required.

---

### Task 4: Audit the complete site and classify improvements

**Files:**
- Create: `demo-github/docs/superpowers/audits/2026-08-12-career-command-center-audit.md`
- Modify only if a reproduced Critical/Important defect is directly caused by Tasks 1–2: synchronized source files plus a covering failing test.
- Preserve without staging or deleting: pre-existing untracked QA files and tests.

**Interfaces:**
- Consumes: the reviewed feature, all maintained tests, local rendered site, active HTML module graph, and the two synchronized deployment sources.
- Produces: a severity-ranked audit separating release blockers, scoped fixes, and optional future optimizations.

- [ ] **Step 1: Inventory maintained and untracked files separately**

Run:

```bash
git -C demo-github status --short --branch
git -C demo-github ls-files 'tests/*.test.mjs' 'src/*.js' 'src/*.css' 'index.html'
git -C demo-github ls-files --others --exclude-standard
rg -n '<script|<link rel="stylesheet' demo-github/index.html job-tracker.html
rg -n 'jobTrackerDemo' demo-github/index.html demo-github/src job-tracker.html src
wc -l demo-github/index.html demo-github/src/jobTrackerApp.js demo-github/src/jobTrackerLogic.js demo-github/src/jobTrackerStyles.css
```

Record these already observed items without deleting or staging them:

```text
demo-github/src/jobTrackerDemo.js is not referenced by the active HTML and duplicates older behavior.
Untracked tests/responsiveCardFidelity.test.mjs and tests/responsiveCardLayout.test.mjs describe an older card option and currently conflict with the selected continuous five-column layout.
jobTrackerApp.js and jobTrackerStyles.css are large, but broad modularization is outside this release unless a concrete defect requires it.
```

- [ ] **Step 2: Run only the maintained explicit suite**

Run these exact commands. Do not replace them with a `tests/*.test.mjs` glob because unrelated untracked legacy tests exist in the working tree:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/jobTrackerLogic.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/candidateTranslationAndSpacing.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/mobileFiveColumnLayout.test.mjs
cmp demo-github/index.html job-tracker.html
cmp demo-github/src/jobTrackerApp.js src/jobTrackerApp.js
cmp demo-github/src/jobTrackerLogic.js src/jobTrackerLogic.js
cmp demo-github/src/jobTrackerStyles.css src/jobTrackerStyles.css
```

Classify any maintained-test failure as Important or Critical. Classify stale untracked-test failures as maintenance debt unless they reproduce a current accepted-design defect.

- [ ] **Step 3: Audit rendered behavior at all responsive boundaries**

Using `browser:control-in-app-browser`, check both languages at:

```text
320 × 844
390 × 844
520 × 950
521 × 950
670 × 950
821 × 950
1200 × 900
```

At each applicable width verify:

```text
Home and Applications are separate
No document-level horizontal overflow
Required table cells and actions are reachable
Add/Edit dialog fits the viewport
“曾进入面试” control is visible, keyboard reachable when editable, and correctly disabled when the current status forces it
Dialog Cancel/Escape preserves records
Delete Cancel preserves records
Language switch updates visible text and accessible names
Console warnings/errors and page errors are zero
```

- [ ] **Step 4: Audit data integrity, accessibility, performance, and release hygiene**

Perform these focused checks:

```text
Data integrity: legacy record normalization, manual Offer true/false, transition preservation, import/export round trip, and cloud reload.
Accessibility: visible label, checkbox keyboard focus, disabled-state explanation, dialog title association, button accessible names, and color-independent state text.
Performance: first-load resource count and transferred sizes, duplicate active scripts, blocking errors, and unnecessary active-module downloads.
Security/privacy: no real records in demo/test artifacts, no credentials added to tracked files, Candidate Home keeps target=_blank plus rel=noreferrer, and Supabase/RLS files are unchanged.
Release hygiene: demo/production active HTML, app, logic, and CSS match byte-for-byte; cache keys cover every changed browser asset.
```

- [ ] **Step 5: Write the audit report with explicit severity and action**

Create `demo-github/docs/superpowers/audits/2026-08-12-career-command-center-audit.md` with this structure:

```markdown
# Career Command Center Release Audit — 2026-08-12

## Scope and evidence
## Verified behavior
## Critical findings
## Important findings
## Minor findings
## Optional future optimizations
## Preserved user files and data boundaries
## Release recommendation
```

Every finding must include evidence, impact, and one of:

```text
Fix before release
Fixed and reverified in this task
Defer — does not affect accepted behavior
Preserve — user-owned or intentionally inactive
```

- [ ] **Step 6: Fix only genuine release blockers in the touched feature**

For each Critical/Important blocker that is directly related to the milestone feature or its form:

```text
Add a failing focused test
Reproduce the browser symptom
Patch both demo and production sources
Run the covering test and the full maintained suite
Repeat the exact browser symptom
Update the audit report with fixed evidence
```

Do not delete the inactive demo script, old QA artifacts, or untracked tests. Do not perform broad app/CSS modularization in this release.

- [ ] **Step 7: Commit the audit and any reviewed scoped fix**

If no source fix was required:

```bash
git -C demo-github add docs/superpowers/audits/2026-08-12-career-command-center-audit.md
git -C demo-github commit -m "docs: audit interview milestone release"
```

If a scoped source fix was required, stage only the audit plus the synchronized demo source/tests and use:

```bash
git -C demo-github commit -m "fix: address interview milestone audit findings"
```

---

### Task 5: Publish and verify both sites

**Files:**
- No source edits expected.
- Read: `demo-github/.git`, `.vercel/project.json`, `.vercelignore`.

**Interfaces:**
- Consumes: reviewed demo commits and byte-identical Vercel presentation/business sources.
- Produces: GitHub Pages and Vercel production containing cache key `20260812-ever-interviewed` and verified milestone behavior assets.

- [ ] **Step 1: Run final pre-publish verification**

Run all ten maintained Node tests and four source-equality checks:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedMetric.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/everInterviewedForm.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/jobTrackerLogic.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/candidateTranslationAndSpacing.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/mobileFiveColumnLayout.test.mjs
cmp demo-github/index.html job-tracker.html
cmp demo-github/src/jobTrackerApp.js src/jobTrackerApp.js
cmp demo-github/src/jobTrackerLogic.js src/jobTrackerLogic.js
cmp demo-github/src/jobTrackerStyles.css src/jobTrackerStyles.css
```

Then run:

```bash
git -C demo-github diff --check
git -C demo-github status --short --branch
```

Expected: all tests pass, sources match, the feature branch is clean, and unrelated user files in the main checkout remain unstaged.

- [ ] **Step 2: Prove a fast-forward GitHub release and push once**

```bash
git -C demo-github fetch origin main
git -C demo-github log --oneline --left-right origin/main...HEAD
git -C demo-github merge-base --is-ancestor origin/main HEAD
git -C demo-github push origin HEAD:main
```

Expected: ancestry exits `0` and the push is a non-force fast-forward. If ancestry fails, stop; never force-push.

- [ ] **Step 3: Fast-forward the local main checkout without staging user files**

```bash
git -C /Users/nigarayaskar/Documents/求职追踪器/demo-github-current switch main
git -C /Users/nigarayaskar/Documents/求职追踪器/demo-github-current merge --ff-only feature/ever-interviewed-metric
git -C /Users/nigarayaskar/Documents/求职追踪器/demo-github-current status --short
```

Expected: local `main` reaches the release SHA and all pre-existing untracked paths remain present and unstaged.

- [ ] **Step 4: Wait for GitHub Pages success**

Resolve the release SHA and newest matching Pages run through the public GitHub API:

```bash
RELEASE_SHA=$(git -C demo-github rev-parse HEAD)
curl -fsSL 'https://api.github.com/repos/nigaray703-ops/career-command-demo/actions/runs?branch=main&per_page=20' -o /private/tmp/career-command-pages-runs.json
PAGES_RUN_ID=$(jq -r --arg sha "$RELEASE_SHA" '.workflow_runs[] | select(.name == "pages-build-deployment" and .head_sha == $sha) | .id' /private/tmp/career-command-pages-runs.json | head -1)
test -n "$PAGES_RUN_ID"
curl -fsSL "https://api.github.com/repos/nigaray703-ops/career-command-demo/actions/runs/$PAGES_RUN_ID" -o /private/tmp/career-command-pages-run.json
jq -r '.status, .conclusion, .html_url, .head_sha' /private/tmp/career-command-pages-run.json
```

If status is not yet `completed`, repeat only the final `curl` and `jq` check after a short interval. Wait until:

```text
status: completed
conclusion: success
```

Record the run ID and URL. Do not rely on an older successful run.

- [ ] **Step 5: Deploy the linked Vercel production project**

Verify `.vercel/project.json` contains:

```json
{"projectName":"career-command-center"}
```

Use the pinned temporary CLI already established for this workspace:

```bash
env PATH="/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin" /private/tmp/codex-vercel-mobile/node_modules/.bin/vercel deploy --prod --yes
```

Expected: a new deployment ID reaches `Ready`, target is `production`, and the alias includes `https://career-command-center-blue.vercel.app`.

- [ ] **Step 6: Verify live cache keys, code markers, and exact hashes**

```bash
curl -fsSL https://nigaray703-ops.github.io/career-command-demo/ | rg "20260812-ever-interviewed"
curl -fsSL "https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerApp.js?v=20260812-ever-interviewed" | rg "everInterviewed|曾进入面试|Reached interview stage"
curl -fsSL "https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerLogic.js?v=20260812-ever-interviewed" | rg "everInterviewedCount|isInterviewStageStatus"
curl -fsSL "https://career-command-center-blue.vercel.app/job-tracker.html?verify=20260812-ever-interviewed" | rg "20260812-ever-interviewed"
curl -fsSL "https://career-command-center-blue.vercel.app/src/jobTrackerApp.js?v=20260812-ever-interviewed" | rg "everInterviewed|曾进入面试|Reached interview stage"
curl -fsSL "https://career-command-center-blue.vercel.app/src/jobTrackerLogic.js?v=20260812-ever-interviewed" | rg "everInterviewedCount|isInterviewStageStatus"
curl -fsSL "https://nigaray703-ops.github.io/career-command-demo/?verify=20260812-ever-interviewed" -o /private/tmp/github-career-command-index.html
curl -fsSL "https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerApp.js?v=20260812-ever-interviewed" -o /private/tmp/github-career-command-app.js
curl -fsSL "https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerLogic.js?v=20260812-ever-interviewed" -o /private/tmp/github-career-command-logic.js
curl -fsSL "https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerStyles.css?v=20260812-ever-interviewed" -o /private/tmp/github-career-command-styles.css
curl -fsSL "https://career-command-center-blue.vercel.app/job-tracker.html?verify=20260812-ever-interviewed" -o /private/tmp/vercel-career-command.html
curl -fsSL "https://career-command-center-blue.vercel.app/src/jobTrackerApp.js?v=20260812-ever-interviewed" -o /private/tmp/vercel-career-command-app.js
curl -fsSL "https://career-command-center-blue.vercel.app/src/jobTrackerLogic.js?v=20260812-ever-interviewed" -o /private/tmp/vercel-career-command-logic.js
curl -fsSL "https://career-command-center-blue.vercel.app/src/jobTrackerStyles.css?v=20260812-ever-interviewed" -o /private/tmp/vercel-career-command-styles.css
cmp demo-github/index.html /private/tmp/github-career-command-index.html
cmp demo-github/src/jobTrackerApp.js /private/tmp/github-career-command-app.js
cmp demo-github/src/jobTrackerLogic.js /private/tmp/github-career-command-logic.js
cmp demo-github/src/jobTrackerStyles.css /private/tmp/github-career-command-styles.css
cmp job-tracker.html /private/tmp/vercel-career-command.html
cmp src/jobTrackerApp.js /private/tmp/vercel-career-command-app.js
cmp src/jobTrackerLogic.js /private/tmp/vercel-career-command-logic.js
cmp src/jobTrackerStyles.css /private/tmp/vercel-career-command-styles.css
shasum -a 256 demo-github/index.html demo-github/src/jobTrackerApp.js demo-github/src/jobTrackerLogic.js demo-github/src/jobTrackerStyles.css
shasum -a 256 /private/tmp/github-career-command-index.html /private/tmp/github-career-command-app.js /private/tmp/github-career-command-logic.js /private/tmp/github-career-command-styles.css
shasum -a 256 job-tracker.html src/jobTrackerApp.js src/jobTrackerLogic.js src/jobTrackerStyles.css
shasum -a 256 /private/tmp/vercel-career-command.html /private/tmp/vercel-career-command-app.js /private/tmp/vercel-career-command-logic.js /private/tmp/vercel-career-command-styles.css
```

All eight `cmp` commands must exit `0`. Record GitHub commit SHA, Pages workflow result, Vercel deployment ID/state/alias, cache key, and all HTML/app/logic/CSS hashes.

- [ ] **Step 7: Report the release truthfully**

Report:

```text
Current Interview count remains current-state only
Offer count remains one current status and is never double-counted
Interview rate uses the editable historical milestone
Legacy inference and manual old-record backfill behavior
Demo persistence/reload and bilingual browser results
GitHub Pages workflow URL/conclusion
Vercel deployment ID/Ready/alias
Local/live app and logic hashes
Authenticated production data was not edited or browser-tested
```
