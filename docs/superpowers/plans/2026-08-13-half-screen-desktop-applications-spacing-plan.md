# Computer Half-Screen and Desktop Applications Spacing Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the approved B layout so Applications uses a readable two-line record layout from `521px` through `1024px`, then uses a better-spaced nine-column desktop table from `1025px` upward; align every visible information column except Company, Role, and Actions to its header center without changing phone layout, data, or behavior.

**Architecture:** Keep the existing table DOM and JavaScript renderer as the single source of application rows. Add one scoped CSS override for `521px–1024px` after the current shared responsive block, preserve the existing `max-width: 520px` phone compaction as the last narrow-screen layer, and add one scoped desktop spacing layer for `min-width: 1025px`. Mirror only the HTML cache key, CSS, and new static contract test between the fake-data demo and the Vercel production source.

**Tech Stack:** Static HTML, CSS Grid, vanilla JavaScript, Node.js `assert` tests, Codex in-app Browser, GitHub Pages, Vercel.

## Global Constraints

- `521px–1024px`: use the approved B comfortable two-line Applications layout.
- `1025px` and wider: preserve all nine desktop columns and improve outer and cell spacing.
- `520px` and narrower: preserve the current phone five-column layout.
- At `521px+`, Company and Role remain left-aligned and Actions retain the approved layout. Center the headers and contents for the other visible information columns: Date, Status, and Candidate Home in the comfortable layout; columns 3–8 in the nine-column desktop layout.
- Do not change the Dashboard, login screen, form, data model, Supabase/cloud code, record saving, filtering, sorting, grouping, A–Z index, edit, delete, import, or export behavior.
- Chinese and English must use the same DOM and layout rules.
- Do not read, modify, upload, or publish real application records; browser QA uses only the demo's fictional records.
- Preserve all user-owned untracked files and do not batch-delete any file or directory.
- Demo and production `index/job-tracker.html`, `jobTrackerApp.js`, `jobTrackerLogic.js`, and `jobTrackerStyles.css` must remain byte-identical in their active counterparts after synchronization.

---

### Task 1: Encode the approved responsive contract as a failing test

**Files:**
- Create: `tests/responsiveApplicationsSpacing.test.mjs`
- Create mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsSpacing.test.mjs`
- Read: `src/jobTrackerStyles.css`
- Read: `index.html` or `/Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html`

**Interfaces:**
- Consumes: the existing CSS comment markers `/* Shared phone and half-screen structure */` and `/* Phone five-column compaction */`.
- Produces: a static regression contract for the two-line media block, desktop spacing block, phone preservation, and cache key `20260813-comfortable-applications-spacing`.

- [ ] **Step 1: Write the failing static contract test in the demo**

Create `tests/responsiveApplicationsSpacing.test.mjs` with the complete test below:

```js
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
  /\.applications-view thead tr\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.45fr\)\s*minmax\(110px,\s*0\.82fr\)\s*minmax\(90px,\s*0\.72fr\)\s*minmax\(110px,\s*0\.7fr\)[^}]*grid-template-areas:\s*"identity date status candidate"/s,
);
assert.match(
  comfortable,
  /\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*grid-template-areas:\s*"company date status candidate"\s*"role actions actions actions"/s,
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
  /\.applications-view\.active\s*\{[^}]*padding-right:\s*30px/s,
);
assert.match(
  desktop,
  /\.applications-view \.panel\s*\{[^}]*padding-inline:\s*14px/s,
);
assert.match(
  desktop,
  /\.applications-view table\s*\{[^}]*min-width:\s*1000px/s,
);
assert.match(
  phone,
  /\.applications-view thead tr,\s*\.applications-view tbody tr:not\(\.group-row\)\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1\.35fr\)\s*minmax\(0,\s*0\.72fr\)\s*minmax\(0,\s*0\.5fr\)\s*minmax\(0,\s*0\.58fr\)\s*minmax\(0,\s*0\.9fr\)/s,
  'The approved phone five-column layout must stay intact',
);
assert.match(html, /jobTrackerStyles\.css\?v=20260813-comfortable-applications-spacing/);

console.log('responsive Applications spacing tests passed');
```

- [ ] **Step 2: Copy the exact test to production using `apply_patch` and verify both fail for the intended missing contract**

Run:

```bash
TASK_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$TASK_NODE tests/responsiveApplicationsSpacing.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsSpacing.test.mjs
```

Expected: both commands fail at `missing /* Comfortable two-line Applications layout */` because production CSS has not yet been changed. A syntax error or missing-file error is not an acceptable RED result.

- [ ] **Step 3: Confirm the only new tracked demo file is the test**

Run:

```bash
git status --short
git diff --check
```

Expected: the new demo test is present, the production mirror is outside this Git repository, and no existing source file has changed.

---

### Task 2: Implement the B two-line layout and desktop spacing

**Files:**
- Modify: `src/jobTrackerStyles.css:1749-2441`
- Modify: `index.html:14`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html:14`
- Test: `tests/responsiveApplicationsSpacing.test.mjs`
- Test mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsSpacing.test.mjs`

**Interfaces:**
- Consumes: the current nine-cell application row rendered by `renderApplications()` with company `td:nth-child(1)`, role `2`, status `3`, applied date `4`, candidate home `8`, and actions `9`.
- Produces: CSS-only responsive placement; the HTML table and JavaScript record renderer remain unchanged.

- [ ] **Step 1: Add the minimum `521px–1024px` override after the shared `max-width: 820px` block and before phone compaction**

Add this structure to `src/jobTrackerStyles.css`:

```css
/* Comfortable two-line Applications layout */
@media (min-width: 521px) and (max-width: 1024px) {
  .applications-view .table-wrap {
    overflow: visible;
    border: 1px solid rgba(37, 99, 235, 0.14);
    border-radius: 12px;
    background: #ffffff;
  }

  .applications-view table,
  .applications-view thead,
  .applications-view tbody {
    display: block;
    width: 100%;
    min-width: 0;
  }

  .applications-view thead tr,
  .applications-view tbody tr:not(.group-row) {
    display: grid;
    grid-template-columns:
      minmax(0, 1.45fr)
      minmax(110px, 0.82fr)
      minmax(90px, 0.72fr)
      minmax(110px, 0.7fr);
    width: 100%;
  }

  .applications-view thead tr {
    grid-template-areas: "identity date status candidate";
  }

  .applications-view tbody tr:not(.group-row) {
    grid-template-areas:
      "company date status candidate"
      "role actions actions actions";
  }

  .applications-view thead th:nth-child(1) { grid-area: identity; }
  .applications-view thead th:nth-child(3) { grid-area: status; }
  .applications-view thead th:nth-child(4) { grid-area: date; }
  .applications-view thead th:nth-child(8) { grid-area: candidate; }
  .applications-view thead th:nth-child(2),
  .applications-view thead th:nth-child(5),
  .applications-view thead th:nth-child(6),
  .applications-view thead th:nth-child(7),
  .applications-view thead th:nth-child(9) { display: none; }

  .applications-view td:nth-child(1) { grid-area: company; }
  .applications-view td:nth-child(2) { grid-area: role; }
  .applications-view td:nth-child(3) { grid-area: status; }
  .applications-view td:nth-child(4) { grid-area: date; }
  .applications-view td:nth-child(8) { grid-area: candidate; }
  .applications-view td:nth-child(9) {
    grid-area: actions;
    justify-self: end;
    width: min(100%, 220px);
    padding-top: 3px;
  }

  .applications-view td:nth-child(5),
  .applications-view td:nth-child(6),
  .applications-view td:nth-child(7) { display: none; }

  .applications-view .row-actions {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px;
  }
}
```

Retain the existing wrapping, status badge, button-border, A–Z, toolbar, and group-row rules unless the RED test or rendered evidence proves a scoped override is required. Do not change JavaScript.

- [ ] **Step 2: Add the desktop spacing layer after phone compaction**

Add:

```css
/* Desktop Applications spacing */
@media (min-width: 1025px) {
  .applications-view.active {
    padding-right: 30px;
  }

  .applications-view .panel {
    padding-inline: 14px;
  }

  .applications-view table {
    min-width: 1000px;
  }

  .applications-view td,
  .applications-view th {
    padding-inline: 8px;
  }
}
```

The right padding remains larger than the left workspace edge because it is the A–Z rail safety space. Do not move or hide the rail.

- [ ] **Step 3: Bump only the stylesheet cache key in demo HTML**

Change:

```html
<link rel="stylesheet" href="./src/jobTrackerStyles.css?v=20260812-ever-interviewed" />
```

to:

```html
<link rel="stylesheet" href="./src/jobTrackerStyles.css?v=20260813-comfortable-applications-spacing" />
```

Do not change the application script key `20260812-ever-interviewed-preserve-fields`.

- [ ] **Step 4: Run the new demo test and make only the minimum specificity corrections until GREEN**

Run:

```bash
TASK_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$TASK_NODE tests/responsiveApplicationsSpacing.test.mjs
```

Expected: `responsive Applications spacing tests passed`.

- [ ] **Step 5: Mirror the CSS and HTML cache key byte-for-byte to production using `apply_patch`**

Apply the same CSS blocks to `/Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css` and the same stylesheet key to `/Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html`.

Run:

```bash
cmp src/jobTrackerStyles.css /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css
cmp index.html /Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html
```

Expected: both commands exit `0`.

- [ ] **Step 6: Run the new production test and the maintained responsive regression suite**

Run:

```bash
TASK_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsSpacing.test.mjs
$TASK_NODE tests/halfScreenResponsive.test.mjs
$TASK_NODE tests/mobileFiveColumnLayout.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/halfScreenResponsive.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/mobileFiveColumnLayout.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/candidateTranslationAndSpacing.test.mjs
```

Expected: all six commands pass. Update obsolete assertions only when they encode the replaced `820px/1040px` contract; keep every phone, translation, and candidate-home assertion.

- [ ] **Step 7: Commit the implementation and demo regression test**

Run:

```bash
git add index.html src/jobTrackerStyles.css tests/responsiveApplicationsSpacing.test.mjs tests/halfScreenResponsive.test.mjs tests/mobileFiveColumnLayout.test.mjs
git diff --cached --check
git commit -m "fix: improve responsive applications spacing"
```

---

### Task 2A: Align non-identity information columns to their headers

**Files:**
- Modify: `tests/responsiveApplicationsSpacing.test.mjs`
- Modify: `src/jobTrackerStyles.css`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsSpacing.test.mjs`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css`

**Interfaces:**
- Consumes: the approved comfortable grid areas `identity date status candidate` and the existing nine desktop columns.
- Produces: CSS-only horizontal alignment. Company, Role, Actions, phone layout, DOM, JavaScript, and data remain unchanged.

- [ ] **Step 1: Extend the static contract test and capture RED**

Add assertions requiring:

```js
assert.match(
  comfortable,
  /\.applications-view thead th:nth-child\(3\),[\s\S]*\.applications-view td:nth-child\(8\)\s*\{[^}]*text-align:\s*center/s,
  'Comfortable Date, Status, and Candidate Home headers and cells must be centered',
);
assert.match(
  desktop,
  /\.applications-view td:nth-child\(n\s*\+\s*3\):nth-child\(-n\s*\+\s*8\),[\s\S]*\.applications-view th:nth-child\(n\s*\+\s*3\):nth-child\(-n\s*\+\s*8\)\s*\{[^}]*text-align:\s*center/s,
  'Desktop columns 3 through 8 must center headers and contents',
);
```

Also assert that the new alignment selectors exist only inside the `521px–1024px` and `1025px+` media blocks; do not weaken the existing phone contract.

Run both demo and production copies with the bundled Node runtime. Expected: both fail because the new alignment contract is missing; syntax or file errors are not acceptable RED evidence.

- [ ] **Step 2: Apply the minimum scoped CSS and reach GREEN**

Inside the comfortable media block, add one grouped rule that centers the visible non-identity headers and cells:

```css
.applications-view thead th:nth-child(3),
.applications-view thead th:nth-child(4),
.applications-view thead th:nth-child(8),
.applications-view td:nth-child(3),
.applications-view td:nth-child(4),
.applications-view td:nth-child(8) {
  text-align: center;
}
```

Inside the desktop media block, add one bounded `nth-child` rule:

```css
.applications-view td:nth-child(n + 3):nth-child(-n + 8),
.applications-view th:nth-child(n + 3):nth-child(-n + 8) {
  text-align: center;
}
```

Do not add Company, Role, or Actions to either selector. Do not modify the phone media block. If rendered evidence shows an inline child is not visually centered, add the narrowest child-specific rule only after reproducing it in a failing test.

- [ ] **Step 3: Mirror, verify, and commit**

Use `apply_patch` for both source trees. Run demo and production alignment tests, the complete maintained test list, all four demo/production source `cmp` checks, and `git diff --check`. Then visually verify the center lines in Chinese and English at `521`, `670`, `821`, `1024`, `1025`, `1200`, and `1440` widths; recheck `520` to prove the phone layout is unchanged.

Commit only the intended demo CSS, test, and documentation changes. Preserve all user-owned untracked paths and do not publish until the final QA task passes.

Only include maintained demo files that actually changed. Do not add `.superpowers/brainstorm/`.

---

### Task 3: Verify the full application and rendered responsive behavior

**Files:**
- Verify: `index.html`
- Verify: `src/jobTrackerApp.js`
- Verify: `src/jobTrackerLogic.js`
- Verify: `src/jobTrackerStyles.css`
- Verify mirrors under `/Users/nigarayaskar/Documents/求职追踪器/production-current`
- Store screenshots outside repository: `/private/tmp/career-command-spacing-qa/`

**Interfaces:**
- Consumes: the synchronized demo and production sources from Task 2.
- Produces: automated, byte-comparison, console, interaction, and screenshot evidence suitable for release.

- [ ] **Step 1: Run the complete maintained test suite explicitly**

Run the following demo tests:

```bash
TASK_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$TASK_NODE tests/everInterviewedMetric.test.mjs
$TASK_NODE tests/everInterviewedForm.test.mjs
$TASK_NODE tests/everInterviewedFormBehavior.test.mjs
$TASK_NODE tests/halfScreenResponsive.test.mjs
$TASK_NODE tests/mobileFiveColumnLayout.test.mjs
$TASK_NODE tests/responsiveApplicationsSpacing.test.mjs
```

Run the following production tests:

```bash
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/everInterviewedMetric.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/everInterviewedForm.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/everInterviewedFormBehavior.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/jobTrackerLogic.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/candidateTranslationAndSpacing.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/halfScreenResponsive.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/mobileFiveColumnLayout.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsSpacing.test.mjs
```

Expected: all 14 explicit tests pass with no warning/error output.

- [ ] **Step 2: Verify active demo/production source parity and clean diffs**

Run:

```bash
cmp index.html /Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html
cmp src/jobTrackerApp.js /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerApp.js
cmp src/jobTrackerLogic.js /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerLogic.js
cmp src/jobTrackerStyles.css /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css
git diff --check
git status --short
```

Expected: all `cmp` commands exit `0`; the feature worktree has no tracked modification after commits; `.superpowers/brainstorm/` may remain untracked and must not be committed or deleted in bulk.

- [ ] **Step 3: Run the Browser responsive matrix with fictional demo data**

Use the in-app Browser against a local HTTP server and inspect Chinese and English at:

```text
520x950, 521x950, 670x950, 821x950,
1024x950, 1025x950, 1200x900, 1440x900
```

At each width assert:

```text
document.documentElement.scrollWidth === document.documentElement.clientWidth
```

At `521–1024px`, assert four visible header cells, hidden Actions header, actions on the second record line, and non-overlapping Edit/Delete buttons. At `1025px+`, assert nine visible headers, a table-scoped horizontal scrollbar when required, and no page-level clipping. At `520px`, assert the existing five-column phone structure remains.

- [ ] **Step 4: Exercise the target interaction loop in both languages**

Perform:

```text
Applications -> switch language -> status filter -> sort -> group -> A–Z ->
Candidate Home opens safely -> Edit opens then Cancel -> Delete opens then Cancel
```

Expected: the fictional record count and records remain unchanged; the active view remains Applications; console `error` and `warn` logs are empty.

- [ ] **Step 5: Capture final evidence outside the repository**

Save at least:

```text
/private/tmp/career-command-spacing-qa/applications-en-670.png
/private/tmp/career-command-spacing-qa/applications-zh-821.png
/private/tmp/career-command-spacing-qa/applications-en-1200.png
```

Visually inspect each image for wrapping, overlap, uneven outer spacing, clipped rail, and unexpected desktop/phone rules before approving release.

---

### Task 4: Review and publish the validated layout

**Files:**
- Review commit range from `205c6eb` through the implementation HEAD.
- Publish the demo repository `feature/ever-interviewed-metric` HEAD to `origin/main` only after all gates pass.
- Deploy `/Users/nigarayaskar/Documents/求职追踪器/production-current` to the existing Vercel project `career-command-center`.

**Interfaces:**
- Consumes: green Task 3 evidence and byte-identical demo/production sources.
- Produces: GitHub Pages and Vercel deployments whose four active files exactly match local files.

- [ ] **Step 1: Perform a focused final review**

Review the change for:

```text
Critical: data/auth/cloud behavior changed, phone layout broken, page overflow
Important: wrong breakpoint, English overlap, hidden information, inaccessible actions
Minor: inconsistent spacing or visual polish
```

Fix Critical or Important issues with a fresh failing test before release. Re-run Task 3 after any source fix.

- [ ] **Step 2: Run pre-publish gates and confirm the exact commit**

Run:

```bash
git status --short --branch
git diff --check
git rev-parse HEAD
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
```

Expected: no tracked changes, only known untracked brainstorming state if present, and the release HEAD descends from `origin/main`.

- [ ] **Step 3: Push the validated HEAD to GitHub `main` once and fast-forward local `main`**

Run only after the user-approved release gate:

```bash
git push origin HEAD:main
```

Then fast-forward the main worktree non-destructively. Preserve every existing untracked file and do not run reset, clean, recursive removal, or forced deletion.

- [ ] **Step 4: Wait for the exact-SHA GitHub Pages run**

Verify the Pages workflow reports `completed/success` and its `head_sha` equals the release HEAD. Record the run URL.

- [ ] **Step 5: Deploy the production source to the existing Vercel project**

Use the isolated verified Vercel CLI and run exactly one production deployment from:

```text
/Users/nigarayaskar/Documents/求职追踪器/production-current
```

Verify the deployment is `READY`, environment is `production`, and stable alias remains:

```text
https://career-command-center-blue.vercel.app
```

- [ ] **Step 6: Compare all eight live files with local final files**

Fetch with a release-SHA cache buster and run byte comparisons for:

```text
GitHub Pages: index.html, jobTrackerApp.js, jobTrackerLogic.js, jobTrackerStyles.css
Vercel: job-tracker.html, jobTrackerApp.js, jobTrackerLogic.js, jobTrackerStyles.css
```

Expected: all eight `cmp` commands exit `0`; both HTML files contain `20260813-comfortable-applications-spacing`; remote `main`, GitHub Pages, Vercel, local demo, and local production all correspond to the same release.
