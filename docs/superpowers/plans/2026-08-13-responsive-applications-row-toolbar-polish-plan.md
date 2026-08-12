# Responsive Applications Row and Toolbar Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faithfully implement approved layout A so half-screen application records have one continuous boundary and aligned two-line content, the mid-width header copy remains visible, and phone sort/group values are never clipped in Chinese or English.

**Architecture:** Keep the existing table DOM, renderer, state, and cloud modules unchanged. Add three narrowly scoped CSS contracts: record-level borders and vertical centering inside the existing `521px–1024px` comfortable layout, an `821px–1200px` topbar containment layer, and a two-column phone toolbar with a `360px` single-column safety fallback. Mirror the CSS, HTML cache key, and static regression tests between the fictional demo and the Vercel production source.

**Tech Stack:** Static HTML, CSS Grid/Flexbox, vanilla JavaScript, Node.js `assert` tests, Codex in-app Browser, GitHub Pages, Vercel CLI.

## Global Constraints

- `521px–1024px`: each application remains a two-line record with Company/Date/Status/Candidate Home on line one and Role/Actions on line two.
- Company and Role remain left-aligned; Date, Status, and Candidate Home remain centered; Actions remain right-aligned.
- A normal application record owns one continuous bottom separator. Its individual cells do not draw separate bottom borders.
- `821px–1200px`: title and explanatory copy stack inside one shrinkable block; Language and Add Application remain in a separate right-side action block.
- `361px–520px`: Search spans both toolbar columns; Status + Sort occupy row two; Direction + Group occupy row three.
- `320px–360px`: Search and all four selects use one column so full Chinese and English values remain readable.
- Preserve the phone five-column application table at `520px` and narrower, the comfortable two-line table at `521px–1024px`, and the nine-column table at `1025px` and wider.
- Do not change Dashboard, login, application form, data schema, metrics, cloud/auth code, saving, filtering, sorting, grouping, A–Z behavior, Candidate Home, edit, delete, import, or export behavior.
- Do not read, export, modify, upload, log, screenshot, or commit real application records. Browser QA uses only the demo's fictional records.
- Do not add the real companies, roles, user identity, email, or record count visible in the reported production screenshots to source, tests, docs, or commits.
- Demo and production active `index/job-tracker.html`, `jobTrackerApp.js`, `jobTrackerLogic.js`, and `jobTrackerStyles.css` must remain byte-identical after synchronization.
- Preserve every user-owned tracked or untracked file. Do not batch-delete any file or directory.

## File Responsibility Map

- `tests/responsiveApplicationsPolish.test.mjs`: owns the new static contracts for complete row boundaries, two-line vertical alignment, mid-width topbar containment, phone toolbar placement, narrow-phone fallback, and the new stylesheet cache key.
- `tests/responsiveApplicationsSpacing.test.mjs`: retains the previously approved breakpoint, width, and horizontal-alignment contracts; only its cache-key expectation changes.
- `tests/halfScreenResponsive.test.mjs`: retains the shared half-screen structure contracts; only its cache-key expectation changes.
- `tests/mobileFiveColumnLayout.test.mjs`: retains five-column phone and no-overflow contracts; only its cache-key expectation changes.
- `tests/everInterviewedForm.test.mjs`: retains form and historical-interview contracts; only its cache-key expectation changes.
- `src/jobTrackerStyles.css`: owns all three CSS fixes; no JavaScript behavior is added.
- `index.html` and `/Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html`: receive the identical cache key `20260813-responsive-applications-polish`.
- `/Users/nigarayaskar/Documents/求职追踪器/production-current/tests/*.test.mjs`: non-Git production mirrors of the changed tests.

---

### Task 1: Give each comfortable record one boundary and two aligned rows

**Files:**
- Create: `tests/responsiveApplicationsPolish.test.mjs`
- Create mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsPolish.test.mjs`
- Modify: `src/jobTrackerStyles.css`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css`

**Interfaces:**
- Consumes: the existing marker `/* Comfortable two-line Applications layout */` and the table DOM produced by `renderApplications()`.
- Produces: static contract `comfortableRows` for record-level borders, borderless cells, shared row sizing, and vertical centering. No DOM or JavaScript change is allowed.

- [ ] **Step 1: Create the failing demo regression test**

Create `tests/responsiveApplicationsPolish.test.mjs` with this exact initial content:

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
```

- [ ] **Step 2: Mirror the test and capture intended RED in both trees**

Use `apply_patch` to create the production copy byte-for-byte, then run:

```bash
TASK_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$TASK_NODE tests/responsiveApplicationsPolish.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsPolish.test.mjs
```

Expected: both commands fail on the first missing record-level rule. A parse error, missing file, or unrelated assertion is not acceptable RED evidence.

- [ ] **Step 3: Add the minimum comfortable-layout CSS**

Inside the existing `@media (min-width: 521px) and (max-width: 1024px)` block, after the existing row grid declaration, add:

```css
.applications-view tbody tr:not(.group-row) {
  grid-template-rows: minmax(48px, auto) minmax(48px, auto);
  align-items: stretch;
  border: 0;
  border-bottom: 1px solid rgba(37, 99, 235, 0.14);
  border-radius: 0;
  box-shadow: none;
  overflow: visible;
}

.applications-view tbody tr:not(.group-row):last-child {
  border-bottom: 0;
}

.applications-view tbody tr:not(.group-row) td {
  display: flex;
  align-items: center;
  min-width: 0;
  border-bottom: 0;
}

.applications-view tbody tr:not(.group-row) td:nth-child(3),
.applications-view tbody tr:not(.group-row) td:nth-child(4),
.applications-view tbody tr:not(.group-row) td:nth-child(8) {
  justify-content: center;
}

.applications-view td:nth-child(2),
.applications-view td:nth-child(9) {
  min-height: 48px;
  padding-block: 8px;
}
```

In the existing comfortable `td:nth-child(9)` rule, replace `padding-top: 3px` with:

```css
align-self: stretch;
padding-block: 8px;
```

Keep the existing `grid-area`, `justify-self`, width, and `.row-actions` rules. Do not target `.group-row`.

- [ ] **Step 4: Mirror CSS and reach GREEN**

Use `apply_patch` to make the production CSS byte-identical. Run both new tests again and then:

```bash
cmp src/jobTrackerStyles.css /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css
git diff --check
```

Expected: both tests pass, `cmp` exits `0`, and `git diff --check` has no output.

- [ ] **Step 5: Commit the self-contained row fix**

```bash
git add src/jobTrackerStyles.css tests/responsiveApplicationsPolish.test.mjs
git diff --cached --check
git commit -m "fix: unify comfortable application rows"
```

Do not add `.superpowers/`, production mirror files, or any real-data artifact.

---

### Task 2: Keep title copy visible from 821px through 1200px

**Files:**
- Modify: `tests/responsiveApplicationsPolish.test.mjs`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsPolish.test.mjs`
- Modify: `src/jobTrackerStyles.css`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css`

**Interfaces:**
- Consumes: base `.topbar`, `.topbar > div:first-child`, `.topbar p`, and `.topbar-actions` selectors.
- Produces: media block marker `/* Mid-width topbar containment */` spanning exactly `821px–1200px`.

- [ ] **Step 1: Extend the test and capture RED**

Insert after the comfortable block extraction:

```js
const midTopbar = extractMediaBlock(
  css,
  '/* Mid-width topbar containment */\n@media (min-width: 821px) and (max-width: 1200px)',
);
```

Add these assertions before the final `console.log`:

```js
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
```

Mirror with `apply_patch`, then run both polish tests. Expected: both fail because the exact marker is absent.

- [ ] **Step 2: Add the isolated mid-width rule**

Place this block after the shared `max-width: 820px` structure and before the comfortable applications block:

```css
/* Mid-width topbar containment */
@media (min-width: 821px) and (max-width: 1200px) {
  .topbar {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .topbar > div:first-child {
    display: grid;
    min-width: 0;
    align-items: start;
    gap: 4px;
  }

  .topbar p {
    white-space: normal;
    overflow-wrap: anywhere;
  }

  .topbar-actions {
    align-self: start;
    flex-wrap: nowrap;
  }
}
```

Do not change the `max-width: 820px` phone/half-screen topbar and do not change the `1201px+` base layout.

- [ ] **Step 3: Mirror, verify, and commit**

Run both polish tests, CSS `cmp`, and `git diff --check`. Then commit:

```bash
git add src/jobTrackerStyles.css tests/responsiveApplicationsPolish.test.mjs
git diff --cached --check
git commit -m "fix: contain responsive topbar copy"
```

---

### Task 3: Give phone sort and group controls enough width

**Files:**
- Modify: `tests/responsiveApplicationsPolish.test.mjs`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsPolish.test.mjs`
- Modify: `tests/responsiveApplicationsSpacing.test.mjs`
- Modify: `tests/halfScreenResponsive.test.mjs`
- Modify: `tests/mobileFiveColumnLayout.test.mjs`
- Modify: `tests/everInterviewedForm.test.mjs`
- Modify matching production test mirrors.
- Modify: `src/jobTrackerStyles.css`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css`
- Modify: `index.html`
- Modify mirror: `/Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html`

**Interfaces:**
- Consumes: toolbar DOM order `Search, Status, Sort, Direction, Group` and marker `/* Phone five-column compaction */`.
- Produces: two-column phone toolbar, `/* Narrow phone toolbar safety */` fallback, and cache key `20260813-responsive-applications-polish`.

- [ ] **Step 1: Extend the phone contract and capture RED**

After the existing media block extractions, add:

```js
const phone = extractMediaBlock(
  css,
  '/* Phone five-column compaction */\n@media (max-width: 520px)',
);
const narrowPhone = extractMediaBlock(
  css,
  '/* Narrow phone toolbar safety */\n@media (max-width: 360px)',
);
```

Before `console.log`, add:

```js
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
assert.match(html, /jobTrackerStyles\.css\?v=20260813-responsive-applications-polish/);
```

Mirror and run both polish tests. Expected: both fail because the phone grid still has three columns.

- [ ] **Step 2: Implement the two-column toolbar**

In `/* Phone five-column compaction */`, replace the current phone toolbar rule with:

```css
.applications-view .toolbar {
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 5px;
}

.applications-view .search-field {
  grid-column: 1 / -1;
}

.applications-view #statusFilter {
  width: 100%;
  max-width: none;
}
```

Retain the existing `.tool-select` containment, and replace its nested `select` rule with:

```css
.applications-view .tool-select select {
  flex: 1 1 0;
  min-width: 0;
  width: auto;
  max-width: none;
}
```

Append after the phone compaction block and before the desktop block:

```css
/* Narrow phone toolbar safety */
@media (max-width: 360px) {
  .applications-view .toolbar {
    grid-template-columns: minmax(0, 1fr);
  }

  .applications-view .search-field {
    grid-column: 1;
  }
}
```

DOM order automatically produces Search / Status+Sort / Direction+Group at `361px–520px`. Do not assign visual `order` values.

- [ ] **Step 3: Bump the cache key and update all exact assertions**

Using `apply_patch`, change only:

```html
jobTrackerStyles.css?v=20260813-applications-column-alignment
```

to:

```html
jobTrackerStyles.css?v=20260813-responsive-applications-polish
```

in demo `index.html` and production `job-tracker.html`. Make the same literal replacement in these four demo tests and their production mirrors:

```text
tests/everInterviewedForm.test.mjs
tests/halfScreenResponsive.test.mjs
tests/mobileFiveColumnLayout.test.mjs
tests/responsiveApplicationsSpacing.test.mjs
```

Do not change the application-script or logic-script cache keys.

- [ ] **Step 4: Reach GREEN and verify mirrors**

Run:

```bash
TASK_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$TASK_NODE tests/responsiveApplicationsPolish.test.mjs
$TASK_NODE tests/responsiveApplicationsSpacing.test.mjs
$TASK_NODE tests/halfScreenResponsive.test.mjs
$TASK_NODE tests/mobileFiveColumnLayout.test.mjs
$TASK_NODE tests/everInterviewedForm.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsPolish.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsSpacing.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/halfScreenResponsive.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/mobileFiveColumnLayout.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/everInterviewedForm.test.mjs
cmp index.html /Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html
cmp src/jobTrackerStyles.css /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css
git diff --check
```

Expected: ten tests pass, both `cmp` commands exit `0`, and diff check is clean.

- [ ] **Step 5: Commit the phone toolbar and cache refresh**

```bash
git add index.html src/jobTrackerStyles.css tests/everInterviewedForm.test.mjs tests/halfScreenResponsive.test.mjs tests/mobileFiveColumnLayout.test.mjs tests/responsiveApplicationsSpacing.test.mjs tests/responsiveApplicationsPolish.test.mjs
git diff --cached --check
git commit -m "fix: show complete phone toolbar values"
```

---

### Task 4: Verify complete behavior and rendered fidelity with fictional data

**Files:**
- Verify: all demo files changed in Tasks 1–3.
- Verify mirrors under `/Users/nigarayaskar/Documents/求职追踪器/production-current`.
- Store screenshots outside the repository: `/private/tmp/career-command-applications-polish-qa/`.

**Interfaces:**
- Consumes: synchronized sources and cache key from Task 3.
- Produces: test, source-parity, visual, interaction, console, and screenshot evidence suitable for release.

- [ ] **Step 1: Run the complete maintained suite explicitly**

```bash
TASK_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
$TASK_NODE tests/everInterviewedMetric.test.mjs
$TASK_NODE tests/everInterviewedForm.test.mjs
$TASK_NODE tests/everInterviewedFormBehavior.test.mjs
$TASK_NODE tests/halfScreenResponsive.test.mjs
$TASK_NODE tests/mobileFiveColumnLayout.test.mjs
$TASK_NODE tests/responsiveApplicationsSpacing.test.mjs
$TASK_NODE tests/responsiveApplicationsPolish.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/everInterviewedMetric.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/everInterviewedForm.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/everInterviewedFormBehavior.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/jobTrackerLogic.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/candidateTranslationAndSpacing.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/halfScreenResponsive.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/mobileFiveColumnLayout.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsSpacing.test.mjs
$TASK_NODE /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsPolish.test.mjs
```

Expected: all 16 commands pass and no command accesses a remote auth or cloud service.

- [ ] **Step 2: Verify active source parity and preserve user files**

```bash
cmp index.html /Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html
cmp src/jobTrackerApp.js /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerApp.js
cmp src/jobTrackerLogic.js /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerLogic.js
cmp src/jobTrackerStyles.css /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css
cmp tests/responsiveApplicationsPolish.test.mjs /Users/nigarayaskar/Documents/求职追踪器/production-current/tests/responsiveApplicationsPolish.test.mjs
git diff --check
git status --short
```

Expected: all `cmp` commands exit `0`; no tracked modification remains after task commits; `.superpowers/` stays untracked and untouched.

- [ ] **Step 3: Run the full Chinese and English Browser matrix**

Serve the fictional demo over localhost. Use the in-app Browser first and verify both languages at:

```text
320x844, 360x844, 390x844, 481x994, 520x950,
521x950, 670x950, 820x950, 821x950, 898x994,
1024x950, 1025x950, 1200x900, 1440x900
```

At every viewport evaluate this read-only measurement object:

```js
() => {
  const rect = (selector) => {
    const node = document.querySelector(selector);
    const value = node?.getBoundingClientRect();
    return value ? { left: value.left, right: value.right, top: value.top, bottom: value.bottom, width: value.width, height: value.height } : null;
  };
  const firstRow = document.querySelector('#applicationRows tr:not(.group-row)');
  const cells = firstRow ? [...firstRow.children] : [];
  const centers = cells.map((cell) => {
    const box = cell.getBoundingClientRect();
    return { x: box.left + box.width / 2, y: box.top + box.height / 2 };
  });
  return {
    innerWidth,
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    topCopy: rect('.topbar p'),
    topActions: rect('.topbar-actions'),
    firstRow: rect('#applicationRows tr:not(.group-row)'),
    roleCenterY: centers[1]?.y,
    actionsCenterY: centers[8]?.y,
    sortDirection: rect('#sortDirection'),
    groupBy: rect('#groupBy'),
    sortDirectionValue: document.querySelector('#sortDirection')?.selectedOptions[0]?.textContent,
    groupByValue: document.querySelector('#groupBy')?.selectedOptions[0]?.textContent,
  };
}
```

Required results:

```text
scrollWidth === clientWidth
topCopy.right <= topActions.left - 8 at 821px through 1200px
abs(roleCenterY - actionsCenterY) <= 2 at 521px through 1024px
sortDirection and groupBy remain inside clientWidth
selected Direction and Group text is complete in DOM and visibly rendered
```

Also inspect computed styles at `898px`: the first normal row owns its `border-bottom`; every child cell reports `border-bottom-width: 0px`.

- [ ] **Step 4: Verify interactions without committing mutations**

Using fictional demo records only:

1. Switch Chinese to English and back; confirm the Applications view stays active.
2. Change Status, Sort, Direction, and Group; confirm the visible order/grouping updates.
3. Click an enabled A–Z initial and then All.
4. Open Candidate Home and confirm `target="_blank"`; close the example.com tab.
5. Open Edit and cancel without saving.
6. Open Delete and cancel.
7. Confirm record count and seeded fictional records remain unchanged.
8. Read Browser console warnings/errors and require an empty result.

- [ ] **Step 5: Capture and visually inspect evidence**

Capture Chinese and English full-page screenshots at `481x994`, `898x994`, and `1200x900` into `/private/tmp/career-command-applications-polish-qa/`. Use `view_image` on the six saved screenshots and inspect:

```text
top explanatory copy visibility
complete row separators
first-line vertical centering
Role/Edit/Delete second-line centering
full Direction and Group values
no horizontal clipping or overlap
```

If any screenshot would still receive the user's reported design comment, return to the relevant RED test and CSS task. Do not publish a visually unresolved result.

---

### Task 5: Publish the verified release to GitHub Pages and Vercel

**Files:**
- Publish Git commit range from `origin/main` through the verified feature `HEAD`.
- Deploy directory: `/Users/nigarayaskar/Documents/求职追踪器/production-current`.
- Verify live files only; do not interact with production account data.

**Interfaces:**
- Consumes: clean, fully verified commits from Tasks 1–4.
- Produces: one fast-forward GitHub `main`, one successful exact-SHA Pages workflow, one Ready Vercel production deployment on the stable blue alias, and exact local/live file parity.

- [ ] **Step 1: Run a fresh pre-publish gate**

Repeat all 16 explicit tests, all five `cmp` checks from Task 4, `git diff --check`, and `git status --short`. Then run:

```bash
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
git log --oneline origin/main..HEAD
```

Expected: tests and cmps pass; feature tracked tree is clean; the ancestry command exits `0`; the log contains only the approved design and responsive-fix commits. Preserve every untracked path.

- [ ] **Step 2: Push once and fast-forward local main**

From the feature worktree, run exactly once:

```bash
git push origin HEAD:main
```

If rejected, stop and report the output; do not retry, force-push, rebase published history, or substitute another remote path.

After a successful push, from `/Users/nigarayaskar/Documents/求职追踪器/demo-github-current` run:

```bash
git merge --ff-only feature/ever-interviewed-metric
```

Confirm feature `HEAD`, local `main`, and `origin/main` are the same SHA. Do not stage or remove the main worktree's existing untracked files.

- [ ] **Step 3: Wait for the GitHub Pages run for the exact release SHA**

Set a task-specific SHA variable and poll the public GitHub Actions API with the bundled Node runtime:

```bash
RELEASE_SHA="$(git rev-parse HEAD)"
TASK_NODE=/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node
env RELEASE_SHA="$RELEASE_SHA" $TASK_NODE -e 'const target=process.env.RELEASE_SHA; for(let attempt=0;attempt<30;attempt+=1){const response=await fetch("https://api.github.com/repos/nigaray703-ops/career-command-demo/actions/runs?branch=main&per_page=30",{headers:{"User-Agent":"career-command-release-check"}}); if(!response.ok) throw new Error(`GitHub API ${response.status}`); const body=await response.json(); const run=body.workflow_runs.find((item)=>item.head_sha===target&&/pages/i.test(item.name)); if(run?.status==="completed"){console.log(JSON.stringify({id:run.id,status:run.status,conclusion:run.conclusion,html_url:run.html_url,head_sha:run.head_sha})); if(run.conclusion!=="success") process.exit(2); process.exit(0);} await new Promise((resolve)=>setTimeout(resolve,10000));} throw new Error("exact-SHA Pages run did not complete within the polling window");'
```

Expected: one completed/success Pages run whose `head_sha` exactly equals `RELEASE_SHA`.

- [ ] **Step 4: Deploy the production mirror once to Vercel**

Verify the existing linked project first:

```bash
env PATH="/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin" /private/tmp/codex-vercel-ever-interviewed/node_modules/.bin/vercel project inspect career-command-center
```

Then, from `/Users/nigarayaskar/Documents/求职追踪器/production-current`, run exactly once:

```bash
env PATH="/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin" /private/tmp/codex-vercel-ever-interviewed/node_modules/.bin/vercel deploy --prod --yes
```

Inspect the returned deployment URL and require `Ready`, environment `production`, project `career-command-center`, and stable alias `career-command-center-blue.vercel.app`. If deployment creation fails, stop and report; do not issue a second production deploy automatically.

- [ ] **Step 5: Prove all live active files match local bytes**

Download files to explicit temporary paths:

```bash
curl -fsSL -o /private/tmp/ccc-pages-index.html https://nigaray703-ops.github.io/career-command-demo/index.html
curl -fsSL -o /private/tmp/ccc-pages-app.js https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerApp.js
curl -fsSL -o /private/tmp/ccc-pages-logic.js https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerLogic.js
curl -fsSL -o /private/tmp/ccc-pages-styles.css https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerStyles.css
curl -fsSL -o /private/tmp/ccc-vercel-job-tracker.html https://career-command-center-blue.vercel.app/job-tracker.html
curl -fsSL -o /private/tmp/ccc-vercel-app.js https://career-command-center-blue.vercel.app/src/jobTrackerApp.js
curl -fsSL -o /private/tmp/ccc-vercel-logic.js https://career-command-center-blue.vercel.app/src/jobTrackerLogic.js
curl -fsSL -o /private/tmp/ccc-vercel-styles.css https://career-command-center-blue.vercel.app/src/jobTrackerStyles.css
cmp index.html /private/tmp/ccc-pages-index.html
cmp src/jobTrackerApp.js /private/tmp/ccc-pages-app.js
cmp src/jobTrackerLogic.js /private/tmp/ccc-pages-logic.js
cmp src/jobTrackerStyles.css /private/tmp/ccc-pages-styles.css
cmp /Users/nigarayaskar/Documents/求职追踪器/production-current/job-tracker.html /private/tmp/ccc-vercel-job-tracker.html
cmp /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerApp.js /private/tmp/ccc-vercel-app.js
cmp /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerLogic.js /private/tmp/ccc-vercel-logic.js
cmp /Users/nigarayaskar/Documents/求职追踪器/production-current/src/jobTrackerStyles.css /private/tmp/ccc-vercel-styles.css
rg -n "20260813-responsive-applications-polish" /private/tmp/ccc-pages-index.html /private/tmp/ccc-vercel-job-tracker.html
```

Expected: all eight live `cmp` commands exit `0` and both HTML files expose the new cache key.

- [ ] **Step 6: Final live visual smoke test and status**

Verify the public fictional GitHub demo at `481px` and `898px` in Chinese and English. Do not open the Vercel application in a browser context that may already be authenticated; use the exact-byte HTTP checks and Vercel deployment inspection from Steps 4–5 as the production delivery proof. Do not read, render, export, or modify authenticated production records.

Finally report:

```text
release SHA
GitHub push result
exact-SHA Pages run ID and URL
Vercel deployment ID/URL and stable alias
all eight live cmp results
the three fixed visual behaviors
that no real application data was read or modified
remaining concerns, or explicitly none
```
