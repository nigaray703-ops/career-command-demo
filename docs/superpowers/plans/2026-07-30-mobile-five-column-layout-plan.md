# Mobile Five-Column Layout Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the phone dashboard and applications pages use the confirmed half-screen structure, with the selected five-column compact application list, while keeping the two pages separate.

**Architecture:** Convert the current `521px–820px` layout layer into a shared `max-width: 820px` structure, then append a `max-width: 520px` compaction layer that changes only sizes and fractional column widths. Implement and verify the change in both the GitHub demo source and the linked Vercel production source without touching data or authentication code.

**Tech Stack:** Static HTML, CSS Grid, ES modules, Node.js assertion tests, Browser plugin/Playwright, GitHub Pages, Vercel CLI.

## Global Constraints

- Phone Home and Applications remain separate pages switched by the existing navigation.
- The phone applications page uses option B: five compact columns.
- Preserve all Supabase, authentication, RLS, account isolation, real records, fields, and business logic.
- Preserve translations, filters, sorting, grouping, A–Z, Candidate Home, Edit, Delete, import, export, and sync behavior.
- `821px` and wider desktop behavior must not change.
- `521px–820px` must retain the already accepted half-screen design.
- Support viewports down to `320px` without document-level horizontal overflow.
- Do not hide company, role, date, Candidate Home, status, or actions.
- Synchronize and publish both GitHub Pages demo and Vercel production only after local validation passes.

---

### Task 1: Lock the shared mobile/half-screen contract with failing tests

**Files:**
- Create: `demo-github/tests/mobileFiveColumnLayout.test.mjs`
- Create: `tests/mobileFiveColumnLayout.test.mjs`
- Test: both new test files

**Interfaces:**
- Consumes: `src/jobTrackerStyles.css` and the page HTML as text.
- Produces: a regression contract for shared `max-width: 820px`, the final phone compaction layer, five-column phone rows, and the new stylesheet cache key.

- [ ] **Step 1: Add the demo failing test**

Create `demo-github/tests/mobileFiveColumnLayout.test.mjs`:

```js
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
```

- [ ] **Step 2: Add the production-source failing test**

Create `tests/mobileFiveColumnLayout.test.mjs` with the same assertions, changing only:

```js
const html = readFileSync(new URL('../job-tracker.html', import.meta.url), 'utf8');
```

- [ ] **Step 3: Run both tests and verify the expected RED state**

Run:

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/mobileFiveColumnLayout.test.mjs
```

Expected: both fail on the missing `Shared phone and half-screen structure` marker and old bounded media query.

- [ ] **Step 4: Commit only the demo test**

```bash
git -C demo-github add tests/mobileFiveColumnLayout.test.mjs
git -C demo-github commit -m "test: define phone five-column layout contract"
```

The production root is not a Git repository; its test remains local and is excluded from Vercel by `.vercelignore`.

---

### Task 2: Implement the shared structure and phone compaction in both sources

**Files:**
- Modify: `demo-github/index.html`
- Modify: `demo-github/src/jobTrackerStyles.css`
- Modify: `demo-github/tests/halfScreenResponsive.test.mjs`
- Modify: `job-tracker.html`
- Modify: `src/jobTrackerStyles.css`
- Modify: `tests/halfScreenResponsive.test.mjs`
- Test: both `mobileFiveColumnLayout.test.mjs` files

**Interfaces:**
- Consumes: existing dashboard and table DOM; no JavaScript interface changes.
- Produces: identical CSS in demo and production, plus matching cache-busted stylesheet links.

- [ ] **Step 1: Back up the production presentation files**

```bash
mkdir -p /private/tmp/jobtracker-mobile-five-column-backup
cp job-tracker.html /private/tmp/jobtracker-mobile-five-column-backup/job-tracker.html
cp src/jobTrackerStyles.css /private/tmp/jobtracker-mobile-five-column-backup/jobTrackerStyles.css
```

- [ ] **Step 2: Update both stylesheet cache keys**

Change the demo and production stylesheet URLs to:

```html
<link rel="stylesheet" href="./src/jobTrackerStyles.css?v=20260730-mobile-five-column" />
```

- [ ] **Step 3: Make the accepted half-screen structure shared**

In both CSS files, replace:

```css
@media (min-width: 521px) and (max-width: 820px) {
```

with:

```css
/* Shared phone and half-screen structure */
@media (max-width: 820px) {
```

Do not change any declaration inside that shared block in this step.

- [ ] **Step 4: Append the phone compaction layer to both CSS files**

Append after the shared block:

```css
/* Phone five-column compaction */
@media (max-width: 520px) {
  .sidebar {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    padding: 9px 10px;
    gap: 7px 9px;
  }

  .brand {
    font-size: 12px;
  }

  body.is-lang-en .brand {
    font-size: 11px;
  }

  .side-nav {
    gap: 4px;
  }

  .nav-item {
    min-width: 0;
    padding: 7px 4px;
    font-size: 10px;
    text-align: center;
  }

  .sidebar-account {
    grid-template-columns: minmax(0, 1fr);
    gap: 6px;
    padding: 8px;
  }

  .sidebar-account .sidebar-actions {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 4px;
  }

  .sidebar-actions .ghost-button {
    min-height: 30px;
    padding-inline: 3px;
    font-size: 8px;
  }

  .workspace {
    padding: 9px 10px 16px;
    gap: 10px;
  }

  .topbar {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 7px;
  }

  .topbar h1 {
    font-size: 19px;
  }

  body.is-lang-en .topbar h1 {
    font-size: 18px;
  }

  .topbar p {
    font-size: 10px;
  }

  .topbar-actions {
    display: flex;
    gap: 5px;
  }

  .language-switch {
    min-width: 0;
    padding-inline: 7px;
  }

  .topbar-actions .primary-button {
    min-height: 36px;
    padding-inline: 9px;
    font-size: 10px;
  }

  .view.active {
    gap: 10px;
  }

  .metric-grid {
    gap: 5px;
  }

  .metric-card {
    min-height: 86px;
    padding: 8px;
    gap: 5px;
  }

  .metric-card span,
  .metric-card small {
    font-size: 8px;
  }

  .metric-card strong {
    font-size: 19px;
  }

  body.is-lang-en .metric-card span,
  body.is-lang-en .metric-card small {
    font-size: 7px;
  }

  body.is-lang-en .metric-card strong {
    font-size: 18px;
  }

  .chart-panel,
  .rate-panel {
    padding: 10px;
  }

  .panel-head {
    margin-bottom: 8px;
  }

  .chart-layout {
    grid-template-columns: minmax(82px, 0.72fr) minmax(0, 1.28fr);
    gap: 8px;
  }

  .donut {
    width: 82px;
  }

  .donut span {
    font-size: 18px;
  }

  .status-bars {
    gap: 5px;
  }

  .bar-label {
    font-size: 9px;
  }

  .rate-stack {
    gap: 5px;
    margin-top: 8px;
  }

  .rate-card {
    min-height: 78px;
    padding: 8px;
    gap: 7px;
  }

  .rate-card strong {
    font-size: 19px;
  }

  .applications-view.active {
    padding-right: 22px;
  }

  .applications-view .panel {
    padding: 8px;
  }

  .applications-view .toolbar {
    grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.7fr) minmax(0, 0.7fr);
    gap: 5px;
  }

  .applications-view .search-field,
  .applications-view .tool-select,
  .applications-view #statusFilter {
    min-height: 34px;
    font-size: 9px;
  }

  .applications-view thead tr,
  .applications-view tbody tr:not(.group-row) {
    grid-template-columns:
      minmax(0, 1.35fr)
      minmax(0, 0.72fr)
      minmax(0, 0.5fr)
      minmax(0, 0.58fr)
      minmax(0, 0.9fr);
  }

  .applications-view thead th {
    min-width: 0;
    padding: 6px 3px;
    font-size: 7px;
    overflow-wrap: anywhere;
  }

  .applications-view td {
    min-width: 0;
    padding: 7px 3px;
    font-size: 9px;
    overflow-wrap: anywhere;
  }

  .applications-view td:nth-child(1) {
    padding-bottom: 2px;
  }

  .applications-view td:nth-child(2) {
    padding-top: 2px;
  }

  .applications-view .company-cell {
    font-size: 10px;
  }

  .applications-view .role-cell {
    font-size: 8px !important;
  }

  .applications-view .status-badge {
    min-height: 20px;
    max-width: 100%;
    padding-inline: 4px;
    font-size: 7px;
    white-space: normal;
    text-align: center;
  }

  .applications-view .table-link {
    font-size: 8px;
  }

  .applications-view .row-actions {
    gap: 2px;
  }

  .applications-view .row-actions button {
    min-width: 0;
    min-height: 28px;
    padding-inline: 1px;
    font-size: 7px;
    white-space: normal;
  }

  .applications-view .alphabet-index {
    right: 2px;
    width: 20px;
    padding-inline: 1px;
  }

  .applications-view .alphabet-index button {
    width: 16px;
    min-height: 15px;
    font-size: 7px;
  }
}
```

- [ ] **Step 5: Run static and logic tests**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/candidateTranslationAndSpacing.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/jobTrackerLogic.test.mjs
```

Before running, update the first breakpoint assertion in both existing half-screen tests from:

```js
assert.match(
  css,
  /@media \(min-width: 521px\) and \(max-width: 820px\)/,
  'half-screen rules should use an explicit 521px–820px boundary',
);
```

or its production-message equivalent to:

```js
assert.match(
  css,
  /\/\* Shared phone and half-screen structure \*\/\s*@media \(max-width: 820px\)/,
  'phone and half-screen should share the accepted responsive structure',
);
```

Also update their cache-key assertions from:

```js
assert.match(html, /jobTrackerStyles\.css\?v=20260728-half-screen/);
```

to:

```js
assert.match(html, /jobTrackerStyles\.css\?v=20260730-mobile-five-column/);
```

Expected: all tests pass while retaining the existing dashboard/list assertions.

- [ ] **Step 6: Prove both presentation sources match**

```bash
cmp demo-github/src/jobTrackerStyles.css src/jobTrackerStyles.css
rg -n "20260730-mobile-five-column" demo-github/index.html job-tracker.html
```

Expected: `cmp` exits `0`; both HTML files show the new cache key.

- [ ] **Step 7: Commit the demo implementation**

```bash
git -C demo-github add index.html src/jobTrackerStyles.css tests/halfScreenResponsive.test.mjs tests/mobileFiveColumnLayout.test.mjs
git -C demo-github commit -m "feat: match phone layout to half-screen design"
```

---

### Task 3: Run rendered responsive and interaction QA

**Files:**
- Modify only if a QA finding requires a scoped fix: both CSS files and relevant tests.
- Create outside repositories: `/private/tmp/jobtracker-mobile-five-column-qa.mjs`
- Save screenshots outside repositories: `/private/tmp/jobtracker-mobile-five-column-qa/`

**Interfaces:**
- Consumes: local demo server and existing fake-data cloud module.
- Produces: viewport, visual, interaction, and console evidence before publishing.

- [ ] **Step 1: Define the target flow**

Use this exact statement in QA notes:

```text
The flow under test is: phone Home loads with the half-screen structure -> Applications navigation opens a separate five-column list -> filters and row actions remain usable without horizontal overflow.
```

- [ ] **Step 2: Start the demo locally**

```bash
python3 -m http.server 8011 --bind 127.0.0.1
```

Run from `demo-github`.

- [ ] **Step 3: Use the Browser plugin first**

Follow `browser:control-in-app-browser` and validate `http://127.0.0.1:8011/` at:

```text
320 × 844
390 × 844
520 × 950
521 × 950
670 × 950
821 × 950
```

For each width verify:

```js
document.documentElement.scrollWidth === window.innerWidth
```

At `390px`, capture separate Home and Applications screenshots in Chinese and English. Verify Home and Applications are never simultaneously `.active`.

If Browser plugin control fails, record its exact failure and use the already approved Playwright fallback script at `/private/tmp/jobtracker-mobile-five-column-qa.mjs`; do not treat static CSS inspection as rendered QA.

- [ ] **Step 4: Verify required interactions**

At `390px`:

```text
Dashboard -> Applications navigation
Chinese -> English
Status filter -> matching rows
Sort direction -> first company changes
Group -> group rows appear
Candidate Home -> expected new tab
Edit -> application dialog opens
Delete -> confirmation opens and Cancel preserves record
A–Z "A" -> Aurora Studio is first/only visible initial
```

Check console errors and page errors; expected count is `0`.

- [ ] **Step 5: Fix only observed layout defects**

Allowed fixes are limited to the final phone compaction block. After every CSS adjustment:

```bash
cmp demo-github/src/jobTrackerStyles.css src/jobTrackerStyles.css
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/mobileFiveColumnLayout.test.mjs
```

- [ ] **Step 6: Commit any QA-driven CSS correction**

If Task 3 required tracked demo changes:

```bash
git -C demo-github add src/jobTrackerStyles.css tests/mobileFiveColumnLayout.test.mjs
git -C demo-github commit -m "fix: prevent phone five-column overflow"
```

If no tracked changes were required, do not create an empty commit.

---

### Task 4: Publish both sites and verify production

**Files:**
- No source edits expected.
- Read: `demo-github/.git`, `.vercel/project.json`, `.vercelignore`

**Interfaces:**
- Consumes: green demo `main` and verified production source.
- Produces: updated GitHub Pages and Vercel production deployments.

- [ ] **Step 1: Resolve authenticated temporary publishing tools**

Install the pinned temporary GitHub CLI without writing to either project:

```bash
mkdir -p /private/tmp/codex-gh-mobile
curl -fL https://github.com/cli/cli/releases/download/v2.96.0/gh_2.96.0_macOS_arm64.zip -o /private/tmp/codex-gh-mobile/gh.zip
ditto -x -k /private/tmp/codex-gh-mobile/gh.zip /private/tmp/codex-gh-mobile
/private/tmp/codex-gh-mobile/gh_2.96.0_macOS_arm64/bin/gh auth status
/private/tmp/codex-gh-mobile/gh_2.96.0_macOS_arm64/bin/gh auth setup-git
```

Install the pinned temporary Vercel CLI using the bundled Node runtime:

```bash
mkdir -p /private/tmp/codex-vercel-mobile
env PATH="/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin" /Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/npm install --prefix /private/tmp/codex-vercel-mobile vercel@58.0.0
env PATH="/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin" /private/tmp/codex-vercel-mobile/node_modules/.bin/vercel whoami
```

If either authentication check fails, stop at that exact boundary and request the corresponding login; do not claim publication.

- [ ] **Step 2: Re-run the complete pre-publish verification**

```bash
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node demo-github/tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/mobileFiveColumnLayout.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/halfScreenResponsive.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/candidateTranslationAndSpacing.test.mjs
/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node tests/jobTrackerLogic.test.mjs
cmp demo-github/src/jobTrackerStyles.css src/jobTrackerStyles.css
git -C demo-github diff --check
```

- [ ] **Step 3: Push GitHub demo main**

```bash
git -C demo-github fetch origin main
git -C demo-github log --oneline --left-right origin/main...main
git -C demo-github push origin main
```

Expected: a fast-forward push only.

- [ ] **Step 4: Wait for GitHub Pages**

Use the pinned GitHub CLI and resolve the newest Pages run ID non-interactively:

```bash
/private/tmp/codex-gh-mobile/gh_2.96.0_macOS_arm64/bin/gh run list --repo nigaray703-ops/career-command-demo --branch main --workflow pages-build-deployment --limit 1
PAGES_RUN_ID=$(/private/tmp/codex-gh-mobile/gh_2.96.0_macOS_arm64/bin/gh run list --repo nigaray703-ops/career-command-demo --branch main --workflow pages-build-deployment --limit 1 --json databaseId --jq '.[0].databaseId')
test -n "$PAGES_RUN_ID"
/private/tmp/codex-gh-mobile/gh_2.96.0_macOS_arm64/bin/gh run watch "$PAGES_RUN_ID" --repo nigaray703-ops/career-command-demo --exit-status
```

Expected: `pages-build-deployment` completes successfully.

- [ ] **Step 5: Deploy the linked Vercel production project**

Verify `.vercel/project.json` contains:

```json
{"projectName":"career-command-center"}
```

Then run:

```bash
env PATH="/Users/nigarayaskar/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:/usr/bin:/bin" /private/tmp/codex-vercel-mobile/node_modules/.bin/vercel deploy --prod --yes
```

Expected: production reaches `READY` and aliases to:

```text
https://career-command-center-blue.vercel.app
```

- [ ] **Step 6: Verify both live sites**

Check:

```bash
curl -fsSL https://nigaray703-ops.github.io/career-command-demo/ | rg "20260730-mobile-five-column"
curl -fsSL "https://nigaray703-ops.github.io/career-command-demo/src/jobTrackerStyles.css?v=20260730-mobile-five-column" | rg "Phone five-column compaction"
curl -fsSL "https://career-command-center-blue.vercel.app/job-tracker.html?verify=20260730-mobile" | rg "20260730-mobile-five-column"
curl -fsSL "https://career-command-center-blue.vercel.app/src/jobTrackerStyles.css?v=20260730-mobile-five-column" | rg "Phone five-column compaction"
```

Compare local and Vercel production CSS hashes:

```bash
shasum src/jobTrackerStyles.css
curl -fsSL "https://career-command-center-blue.vercel.app/src/jobTrackerStyles.css?v=20260730-mobile-five-column" | shasum
```

Expected: hashes match.

- [ ] **Step 7: Report exact evidence**

Report:

```text
GitHub commit SHA
GitHub Pages workflow URL and conclusion
Vercel deployment ID and READY state
GitHub Pages URL
Vercel production URL
320/390/520/521/670/821 viewport results
Chinese/English and interaction results
Any remaining untested browser or authenticated-data state
```
