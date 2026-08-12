# Career Command Center Release Audit — 2026-08-12

## Scope and evidence

This audit covers the complete fictional Career Command Center demo in the isolated `feature/ever-interviewed-metric` worktree and the synchronized production source files. Rendered QA used a task-owned Browser-plugin tab at `http://127.0.0.1:8012/`; production authentication, records, and browser storage were not opened or inspected.

Evidence collected:

- Tracked and untracked inventories were recorded separately. The isolated worktree was clean before the audit. The main demo's untracked QA artifacts, plan, and two stale responsive-card tests were preserved.
- The explicit maintained suite passed all 12 commands. No test glob was used.
- All four demo/production comparisons exited `0`: HTML, app, logic, and CSS are byte-identical.
- Both languages were exercised at `320x844`, `390x844`, `520x950`, `521x950`, `670x950`, `821x950`, and `1200x900`.
- The rendered loop verified page identity, meaningful content, no framework overlay, separate Dashboard/Applications views, document overflow, table/action reachability, Add/Edit form fit, historical checkbox behavior, cancellation safeguards, translations, accessible names, reload state, and console health.
- A separate fictional logic check verified legacy normalization, manual Offer true/false, transition preservation, serialize/restore, strict boolean handling, backup round trip, and derived statistics.
- Browser resource inventory and exact local served-file sizes supplied performance evidence without inspecting production traffic.

Maintained suite output:

```text
historical interview milestone tests passed
historical interview form tests passed
historical interview form behavior tests passed
half-screen responsive tests passed
mobile five-column layout tests passed
historical interview milestone tests passed
historical interview form tests passed
historical interview form behavior tests passed
jobTrackerLogic tests passed
candidate translation and spacing tests passed
Vercel half-screen responsive tests passed
mobile five-column layout tests passed
```

Active module graph and size inventory:

- HTML loads one stylesheet, `jobTrackerStyles.css?v=20260812-ever-interviewed`, and one module entry, `jobTrackerApp.js?v=20260812-ever-interviewed`.
- The app imports `jobTrackerLogic.js?v=20260812-ever-interviewed` and unchanged `jobTrackerCloud.js`.
- `jobTrackerDemo.js` is not referenced by active HTML or the active module graph.
- `index.html`: 263 lines / 14,444 bytes; `jobTrackerApp.js`: 970 / 36,282; `jobTrackerLogic.js`: 236 / 7,784; `jobTrackerStyles.css`: 2,441 / 42,157.

## Verified behavior

All 14 language-width cells passed the historical-interview feature and reversible interaction checks:

| Language | Viewport | Document overflow | Table/actions | Add/Edit form | History control | Cancel/Escape/Delete cancel | Console |
| --- | --- | --- | --- | --- | --- | --- | --- |
| zh | `320x844` | none, `320/320` | five-column row; visible, non-overlapping actions | fits horizontally and vertically | labeled; Tab focus; forced/disabled and editable states pass | `5 -> 5` | 0 |
| en | `320x844` | none, `305/305` plus vertical scrollbar | five-column row; visible, non-overlapping actions | fits | translated label/names; state and focus pass | `5 -> 5` | 0 |
| zh | `390x844` | none, `390/390` | pass | fits | pass | `5 -> 5` | 0 |
| en | `390x844` | none, `375/375` plus vertical scrollbar | pass | fits | pass | `5 -> 5` | 0 |
| zh | `520x950` | none, `520/520` | pass | fits | pass | `5 -> 5` | 0 |
| en | `520x950` | none, `520/520` | pass | fits | pass | `5 -> 5` | 0 |
| zh | `521x950` | none, `521/521` | pass | fits | pass | `5 -> 5` | 0 |
| en | `521x950` | none, `506/506` plus vertical scrollbar | pass | fits | pass | `5 -> 5` | 0 |
| zh | `670x950` | none, `670/670` | pass | fits | pass | `5 -> 5` | 0 |
| en | `670x950` | none, `670/670` | pass | fits | pass | `5 -> 5` | 0 |
| zh | `821x950` | no document overflow | nine-column table is reachable through its local `overflow-x:auto` scroll; Edit/Delete succeeded | fits | pass | `5 -> 5` | 0 |
| en | `821x950` | no document overflow | same local-scroll reachability; Edit/Delete succeeded | fits | pass | `5 -> 5` | 0 |
| zh | `1200x900` | none, `1200/1200` | nine cells and actions visible | fits, `860/860` | pass | `5 -> 5` | 0 |
| en | `1200x900` | none, `1200/1200` | nine cells and actions visible | fits, `860/860` | pass | `5 -> 5` | 0 |

At every width, Dashboard and Applications were mutually exclusive, Candidate Home links retained `target="_blank" rel="noreferrer"`, and current Interview and Offer cards remained distinct. The checkbox label/helper remained present in both languages. Tab from Status focused the checkbox; Interview/Final forced it checked and disabled, while Active/Rejected/Offer made it editable. Add cancel, edited-form Escape/discard, and Delete cancel preserved all five fictional records.

After the full matrix, reload rendered `Loaded from cloud`, total `5`, current `Active 1 / Rejected 1 / Interview 1 / Offer 1`, and historical Interview Rate `40%`, with all dialogs closed. No real record was used.

Data integrity checks passed:

- Legacy current Interview normalizes historical interview to `true`.
- Direct Offer supports strict manual `false` and `true` independently of current Interview count.
- Interview-to-Rejected transition preserves historical interview.
- String `"true"` is not coerced to boolean true.
- Serialize/restore and backup restore round trips preserve status and milestone.
- A three-record fictional calculation produced current Interview `0`, historical milestones `2`, Offer `2`, and Interview Rate `66.7%`.

Accessibility checks passed for the historical control itself: bilingual visible label, keyboard focus, checked/disabled semantics, helper text included in the accessible name, translated control/region names, named buttons, and color-independent status text. Pre-existing gaps are listed below.

Performance/resource evidence:

- Signed-in inventory: 8 unique assets plus HTML — 3 scripts, 1 stylesheet, 3 images, and 1 manifest; no duplicate active URL and no active `jobTrackerDemo.js` download.
- Signed-out login inventory: 9 unique assets plus HTML; the additional asset is the login background.
- Signed-in local uncompressed bodies total 156,292 bytes. The 1,456,525-byte login background raises the signed-out total to 1,612,817 bytes.
- No blocking overlay, warning, console error, or page error was observed. Exact browser timing entries were unavailable from the safe page-evaluation surface, so no timing claim is made.

Privacy/security/release checks passed:

- Demo/test data is visibly fictional: `demo@example.com`, `example.com` candidate URLs, and `form-behavior-test@example.invalid`.
- A tracked-text secret-pattern scan found no credential value; the only hit was README prose about OAuth secrets.
- Feature commits do not modify cloud, authentication, Supabase, RLS, SQL, or environment files.
- Cache keys cover every changed browser asset: CSS, app, and the app's logic import use `20260812-ever-interviewed`; cloud is unchanged.
- Demo and production HTML/app/logic/CSS remain byte-identical.

## Critical findings

None. No data-loss, privacy, security, blank-page, crash, or feature release blocker was reproduced.

## Important findings

### I-1 — The `821px` desktop breakpoint clips desktop content

- Evidence: at English `821x950`, metric-card rectangles extended from `x=-33` to `x=837.2` inside an `821px` viewport. The rendered screenshot visibly placed the left card column behind the fixed sidebar, clipped the right column, and truncated the page title. Chinese topbar text at the same width had only `45px` client width for `322px` of text. The document itself reported no overflow because the content is clipped rather than exposed through a document scrollbar.
- Impact: users at the exact first desktop pixel can lose Dashboard labels/values and header context. The Applications table remains reachable through its own local horizontal scroll.
- Origin: pre-existing desktop-breakpoint/minimum-width behavior; Tasks 1–2 did not introduce the grid or breakpoint.
- Disposition: **Defer — does not affect accepted behavior.** It does not invalidate the historical checkbox/state logic, but should be corrected before claiming complete `821px` desktop support.

### I-2 — Header copy overlaps or is covered at several responsive widths

- Evidence: at exactly English `1200x900`, the tagline has `clientWidth=260` and `scrollWidth=520`; its latter half runs under the Language/Add controls. Fresh rendered evidence reproduces the Task 3 observation. English `320` and `390` also show intersecting tagline/action rectangles; `821` clips header copy in both languages.
- Impact: descriptive context becomes partially unreadable. Language and Add controls remain visible and operable; the historical-interview feature remains usable.
- Origin: pre-existing topbar sizing/no-wrap behavior, unrelated to Tasks 1–2.
- Disposition: **Defer — does not affect accepted behavior.** Fix as a dedicated responsive-header change with its own breakpoint regression tests.

### I-3 — Dialogs lack accessible names

- Evidence: `applicationDialog`, `unsavedDialog`, and `deleteDialog` have no `aria-label` or `aria-labelledby`. The accessibility snapshot exposes an unnamed `dialog:` even though each contains a visible heading; `#dialogTitle` exists but is not associated.
- Impact: screen-reader users may not receive the purpose/title when a modal opens.
- Origin: pre-existing dialog markup; the new checkbox is correctly labeled and does not cause this gap.
- Disposition: **Defer — does not affect accepted behavior.** Add explicit title association in a focused accessibility change covering all dialogs.

## Minor findings

### M-1 — Applications search has no explicit accessible name

- Evidence: the accessibility snapshot exposes an unnamed `searchbox`; its wrapping label contains only an `aria-hidden` search glyph, and the visible cue is a placeholder.
- Impact: assistive-technology users may not hear the search purpose consistently.
- Origin: pre-existing toolbar markup.
- Disposition: **Defer — does not affect accepted behavior.** Add a translated visible or screen-reader-only label in a focused accessibility patch.

## Optional future optimizations

### O-1 — Inactive legacy demo module

- Evidence: tracked `src/jobTrackerDemo.js` duplicates older application behavior but is absent from active HTML, app imports, and the browser's resource inventory.
- Impact: maintenance confusion only; it adds no runtime download.
- Disposition: **Preserve — user-owned or intentionally inactive.** Do not delete, move, or stage it in this release.

### O-2 — Stale untracked responsive-card tests

- Evidence: main-demo `tests/responsiveCardFidelity.test.mjs` and `tests/responsiveCardLayout.test.mjs` describe an older card option that conflicts with the accepted continuous five-column layout. They were excluded from the explicit maintained suite.
- Impact: globbing tests could report misleading failures; no released behavior is affected.
- Disposition: **Preserve — user-owned or intentionally inactive.** Keep untracked and do not run by glob.

### O-3 — Large app and stylesheet modules

- Evidence: `jobTrackerApp.js` is 970 lines / 36,282 bytes; `jobTrackerStyles.css` is 2,441 lines / 42,157 bytes.
- Impact: future changes may become harder to review, but no blocking runtime or maintainability failure was reproduced.
- Disposition: **Defer — does not affect accepted behavior.** Modularize only under a separate tested plan.

### O-4 — Login background dominates first-load bytes

- Evidence: `job-tracker-login-background.png` is 1,456,525 bytes, about 90% of the 1,612,817-byte signed-out local body total.
- Impact: slower signed-out loading on constrained networks; it is absent from the signed-in resource inventory.
- Disposition: **Defer — does not affect accepted behavior.** Resize/compress it in an asset-specific visual QA task.

## Preserved user files and data boundaries

- Main-demo untracked inventory remains untouched: `design-qa.pre-half-screen.md`, `docs/superpowers/plans/2026-07-28-half-screen-home-applications-plan.md`, six `qa-artifacts/*.png` files, and the two stale responsive-card tests.
- Inactive `src/jobTrackerDemo.js` remains tracked and unchanged.
- No old/inactive/untracked file was deleted, moved, staged, or modified.
- Only fictional demo UI data was viewed. All attempted field changes were discarded, every delete was canceled, and the final reload retained five records.
- No Upload Data, file chooser, import/reset flow, browser storage inspection, production authentication, production record, or production storage inspection contributed to the audit.

## Release recommendation

Approve the historical-interview milestone release. The 12 maintained tests pass, all synchronized source pairs are byte-identical, and all 14 bilingual responsive cells pass the feature, persistence-safety, overflow, reachability, form, translation, and console gates.

No Critical or Important defect caused by Tasks 1–2 was reproduced, so no source fix is warranted. Commit only this audit report. Track the pre-existing `821px` clipping, responsive header overlap (including the required `1200px` English reproduction), unnamed dialogs, unnamed searchbox, login-background size, and later modularization as separate follow-up work.
