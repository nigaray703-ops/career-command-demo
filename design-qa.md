# Half-Screen Home and Applications Design QA

## Scope

- Breakpoint under test: `521px–820px`.
- Phone boundary retained: `520px` and below.
- Desktop boundary retained: `821px` and above.
- No data model, record, translation, filter, sort, group, A–Z, Candidate Home, Edit, or Delete logic was changed.

## Selected sources

- Home option 2: `/Users/nigarayaskar/.codex/generated_images/019f9ca8-6521-76a1-8fb1-503f381bd3a2/call_NknWxspFmi4VFAci04I8hUOC.png`
- Applications option 1: `/Users/nigarayaskar/.codex/generated_images/019f9ca8-6521-76a1-8fb1-503f381bd3a2/call_zr93pTmNKhsYCqep96mD0eZJ.png`

## Implementation evidence

- Chinese home, 670px: `qa-artifacts/home-zh-670.png` (`670 × 1071`)
- English home, 670px: `qa-artifacts/home-en-670.png` (`670 × 1056`)
- Chinese applications, 670px: `qa-artifacts/applications-zh-670.png` (`670 × 950`)
- English applications, 670px: `qa-artifacts/applications-en-670.png` (`670 × 950`)
- Phone boundary: `qa-artifacts/boundary-home-zh-520.png`
- Desktop boundary: `qa-artifacts/boundary-home-zh-821.png`
- Home comparison: `qa-artifacts/home-option-2-comparison.png`
- Applications comparison: `qa-artifacts/applications-option-1-comparison.png`

## Automated checks

- `520px`: bounded media query inactive, one-column phone metrics retained, no horizontal overflow.
- `670px`: bounded media query active, selected half-screen layouts rendered, no horizontal overflow.
- `821px`: bounded media query inactive, 240px desktop sidebar and desktop table retained, no horizontal overflow.
- Chinese and English Candidate Home labels render as `打开` and `Open`.
- Status filtering, ascending/descending sorting, grouping, and A–Z filtering pass.
- Candidate Home opens the expected URL in a new tab.
- Edit opens and closes the application dialog.
- Delete opens and cancels the confirmation dialog without removing a record.
- Browser console errors: `0`.
- Page errors: `0`.
- Static responsive contract and job tracker logic regression tests pass.

## Visual findings and fixes

1. The first implementation used one tall metric card. The selected home source instead uses three cards on the first row and four on the second. Fixed with a 12-column half-screen-only grid: first three cards span four columns, final four cards span three.
2. The first continuous-list implementation retained repeated field labels inside every record. Replaced them with one compact list header to match the selected source and reduce vertical noise.
3. The first English list capture exposed overlapping Edit/Delete hit areas. Fixed by giving the action cell a single internal track and a full-width two-column action grid; both buttons now have independent clickable areas.
4. The implementation retains the existing account/sync information and real control text, so small content-height differences from the generated concept are intentional.
5. No remaining P0, P1, or P2 visual differences were found after the final side-by-side review.

final result: passed
