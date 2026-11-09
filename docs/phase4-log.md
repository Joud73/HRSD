# Phase 4 log

Brief: `docs/phase4-brief.md`. Branch: `feat/review-results` (from `feat/org-journey` at 227aec8).

## Step 1: staging, types, data layer

- [x] 1.1 PR `feat/org-journey` → `staging` merged on GitHub by the owner (merge commit b7ff015, PR #1). `gh` is not installed on this machine, so the PR was opened and merged in the browser. Branch `feat/review-results` created; the uncommitted Phase 4 files (migrations, checks, `documents.ts`, brief) came with the working tree.
- [x] 1.2 `supabase db push --dry-run` listed exactly `20261109100000_phase4_status_issued.sql` and `20261109100100_phase4_review_and_results.sql`; pushed both. `review_start = 2026-11-01` on the open cycle (الدورة التجريبية 2026, id 8b3bb9d4-…; submission_end 2026-11-12, approval_end 2026-12-01).
- [x] 1.3 Types regenerated (+850 / -8 lines; the 8 removed lines are diff alignment inside `profiles`, which keeps every column). Every name listed in the brief is present.
- [x] 1.4 Both check files run on staging (tables below). Both roll back; afterwards staging holds 0 `assessment_results`.
- [x] 1.5 Types fallout.
- [x] 1.6 Services and hooks.

### Decisions (Step 1)
- **Review columns follow the migration, not the brief's list.** `v_track_scores` has `items_review_counted`, `items_review_pending`, `avg_review_level`, `avg_review_score_pct` (no rejected count, no `review_score_pct`). `v_assessment_progress` has `items_review_counted/pending/rejected`, `review_score_pct`, `avg_review_level` (no `avg_review_score_pct`). `TrackScore.reviewScorePct` maps `avg_review_score_pct`, mirroring `scorePct` = `avg_score_pct`.
- `issued` added to `StatusKey` (label صدرت النتائج, success tone), to `LEGACY`, `assessmentStatusKey`, and to the admin status order lists (`StatusChart`, `AdminAssociations`, `AdminReviewerDetail`) so issued assessments do not disappear from admin counts.
- `journeyStep`: approved → 4, issued → 5 (was approved → 5).
- `mapError` in `assessmentService` is exported and reused by `resultsService`. New mappings: pending verdicts (count through `formatNumber`), verdict without evidence, note required (both variants, one existing message), stale number, documents not approved, and the role refusals (`Only the assigned evaluator`, `Only the final sign-off`, `Evaluators cannot change`) → `err_not_allowed` instead of the self-assessment "not editable" message.
- Error strings come from `documents.ts` (already there); added `err_line_empty` (اكتب نص السطر.) for the database's "A document line needs text". `documentsCopy` re-exported from `@/lib/copy`.
- `setVerdict` and `updateLine`/`removeManualLine` use `.select()` and treat 0 rows as refused (row-level security returns no error on a filtered update). The evidence trigger guarantees a response row exists for any item with evidence.
- `addManualLine` appends at max(sort_order)+1 within its document and section.
- Hooks: `useSaveItemNote` and `useSetVerdict` share one optimistic response-mutation helper. `useSetVerdict` also invalidates `["documents", id]` (the last verdict generates them). Transitions, `useReturnToEvaluator` and `useIssueResults` invalidate assessment, documents, results, scope, evaluator reviews and organizations.
- **Interim until Step 2.1:** `ItemRow` keeps its checkbox as a read-only mirror of the derived `is_met` (disabled). The note goes through `saveItemNote`. Step 2.1 removes the checkbox.

### Checks: `review_checks.sql` on staging (22 PASS)

| n | who | action | expected | actual | result |
|---|---|---|---|---|---|
| 27 | org A | insert item_responses is_met = true, no evidence | is_met false | false | PASS |
| 28 | org A | insert evidence on item | is_met true | true | PASS |
| 29 | org A | delete last evidence | is_met false | false | PASS |
| 30 | org A | evidence on 2 items, submit | 2 met, submitted | 2 met, submitted | PASS |
| 31 | evaluator1 | transition under_review | under_review | under_review | PASS |
| 32 | evaluator1 | verdict on item without evidence | error | A verdict needs at least one evidence on the item | PASS |
| 33 | evaluator1 | approve with 2 pending verdicts | error: await a verdict | 2 item(s) still await a verdict | PASS |
| 34 | evaluator1 | last verdict recorded | 2 docs, 1 strength, 377 opportunities, 377 tasks | 2 docs, 1 strength, 377 opportunities, 377 tasks | PASS |
| 35 | evaluator1 | edit line text; change source | edited true; source error | edited true; error | PASS |
| 36 | evaluator1 | insert line with source auto | source forced to manual | manual | PASS |
| 37 | org A | select assessment_documents (draft) | 0 | 0 | PASS |
| 38 | eval1 / org A | return, org adds evidence on verified item, resubmit | verified null, submitted, 1 pending | null, submitted, 1 pending | PASS |
| 39 | evaluator1 | approve | approved, 61 results, 1 review_counted, docs approved, header review_pct 0 | approved, 61 results, 1 review_counted, docs approved, header 0 | PASS |
| 40 | supervisor | return to evaluator without / with note | error; under_review, 0 results, docs draft | error; under_review, 0 results, docs draft | PASS |
| 41 | evaluator1 | approve again | approved | approved | PASS |
| 42 | supervisor | issue_results wrong / right number | error; issued, number set | error; issued, ت.م.TEST-0001\|26.11.09, issued_at true | PASS |
| 43 | org A | select documents, lines, results after issuance | 2 docs, 756 lines, 61 results, review_pct 0 | 2 docs, 756 lines, 61 results, review_pct 0 | PASS |
| 44 | evaluator2 | select org A documents and results | 0, 0 | 0, 0 | PASS |
| 45 | admin / org A | program on indicator 1 (level 1) recommended | 1 | 1 | PASS |
| 46 | anon | select programs; select assessment_documents | >= 1; permission denied | 1; denied | PASS |
| 47 | supervisor | update document lines | 0 rows or error | 0 rows | PASS |
| 48 | org A | issue_results | error | Only the final sign-off issues results | PASS |

### Checks: `scoring_checks.sql` on staging (all as commented)

`supabase db query -f` returns only the last result set, so each select also ran in its own copy of the file (same setup, rolled back). The checked-in file is unchanged.

Indicators (expected (1,7,7,7,100,4,مكتمل), (2,6,3,3,50,1,بحاجة لتحسين كبير), (3,6,0,0,0,0,غير مكتمل)):

| indicator | items_total | items_met | items_counted | score_pct | level | level_label |
|---|---|---|---|---|---|---|
| 1 | 7 | 7 | 7 | 100 | 4 | مكتمل |
| 2 | 6 | 3 | 3 | 50 | 1 | بحاجة لتحسين كبير |
| 3 | 6 | 0 | 0 | 0 | 0 | غير مكتمل |

Tracks (expected track 1: 13 indicators, 2 started, 1 complete, avg_level 0.38):

| track | indicators_total | started | complete | items_met | items_counted | avg_level | progress_pct |
|---|---|---|---|---|---|---|---|
| 1 | 13 | 2 | 1 | 10 | 10 | 0.38 | 13 |
| 2 | 14 | 0 | 0 | 0 | 0 | 0.00 | 0 |
| 3 | 10 | 0 | 0 | 0 | 0 | 0.00 | 0 |
| 4 | 14 | 0 | 0 | 0 | 0 | 0.00 | 0 |
| 5 | 10 | 0 | 0 | 0 | 0 | 0.00 | 0 |

Progress (expected items_total 378, items_met 10, items_counted 10, progress_pct 3, score_pct 3):

| items_total | items_met | with_evidence | items_counted | progress_pct | score_pct | avg_level | started | complete |
|---|---|---|---|---|---|---|---|---|
| 378 | 10 | 10 | 10 | 3 | 3 | 0.08 | 2 | 1 |

Exclusion check (expected (1, 6, 6, 100, 4)): (1, 6, 6, 100, 4).

### Typecheck and lint after Step 1
`tsc --noEmit -p tsconfig.app.json`: 0 errors. `npm run lint`: 6 problems (baseline).

## Step 2: evidence rule, verification, sign-off

- [x] 2.1 Organization and supervisor proxy
- [x] 2.2 Evaluator verification
- [x] 2.3 Evaluator review page
- [x] 2.4 Supervisor sign-off (return to evaluator; issuance comes with Step 3.3)

### Design plan (frontend-design skill)
Tokens only; status colours carry status alone: the chip محقق (success) / بدون شاهد (neutral), the verdict pill تأكيد (success) / رفض (danger), the pending dot (warning). No new cards: verdict control and evaluator note sit inside the existing item row. Two numbers per screen at most where they mean different things.
Removed as redundant: "البنود المرفق لها شواهد" in the organization's track progress (now always equal to البنود المحققة), and in review mode the sticky result footer (the indicator header carries both results, per the brief).

### Decisions (Step 2)
- `ItemRow`: no checkbox. Text, then one end slot: the state chip (organization) or, in review mode, the verdict `SegmentedControl` for items with evidence and the chip "لا يوجد شاهد، لا يُحتسب" otherwise. The organization's note shows read only to the evaluator. Evaluator note: text button "ملاحظة المدقق", saved on blur through `setVerdict` with the current verdict.
- `SegmentedControl` gained `disabled`, a per-option `activeClassName`, and a keyboard entry when nothing is selected (a pending verdict had no focusable option). Its pill's layout id is the label, so each verdict control carries the item number in its label.
- Verdicts enabled only when `under_review` and today in `[reviewStart, approvalEnd]`; otherwise the review panel says why.
- Review mode progress panel: بنود بشواهد, مؤكدة, مرفوضة, بانتظار التحقق, both overall percentages; the bar is judged / evidenced.
- Deleting the only evidence of an item adds "سيُلغى احتساب البند." to the existing confirmation.
- Submit dialog: البنود المحققة, المؤشرات المكتملة, النتيجة التقديرية; empty guard on `itemsCounted === 0` (message reworded to "دون إرفاق شاهد لأي بند").
- Copy still describing ticking was reworded: page description, journey step 1, dashboard "محدداً" → "محققاً", the "كيف تُحتسب النتيجة؟" first line. Journey steps 4 and 5 now describe the two-step sign-off and issuance.
- `NextAction`/`UnderReview`: `issued` links to `/results` (the page arrives in Step 3.4).
- Evaluator: return note pre-filled from rejected items, one line per indicator in tool order (notes joined with "، ", duplicates removed, "شاهد مرفوض" when a rejection has no note). Approve is a disabled button with tooltip while pending > 0 (or while the count loads). Button "إعادة للاستكمال" renamed "إعادة للمنظمة" per the brief.
- Documents section on the review page shows once the review started: the "تُنشأ المستندات تلقائياً…" sentence until documents exist, then the two cards (link to the Step 3.2 editor route; "معاينة" once not drafts) and the regenerate button with confirmation (under_review only).
- `ReviewsTable`: queue sort in `reviewUtils.sortReviews` (submitted oldest first, then the rest); the evaluator dashboard shows the head of that queue. Score column = review result for under_review/approved/issued, dash otherwise.
- `OrganizationCard` moved to `components/results/` (shared). New shared `ResultsOverview` (overall review vs self, tracks table with indicator squares by review level, legend from the frozen labels) and `DocumentCards`; strings in new `strings/results.ts`.
- Supervisor organizations: seven filter values (not started, in progress, submitted, under review, returned, approved, issued); the row action becomes "النتائج" for approved and issued. Dashboard: KPIs "بانتظار الإصدار" and "صدرت النتائج" (5 columns).
- `SupervisorResults` in Step 2 shows documents as cards; the read-only `DocumentView` and "إصدار النتائج" are added in Step 3.

### Checks (Step 2)
- `tsc`: 0 errors. Lint: 6 (baseline). Helpers moved out of component files (`reviewUtils.ts`, `documentUtils.ts`) to keep fast-refresh warnings at baseline.
- Throwaway Playwright smoke (deleted after) on staging, read only, failing on console/page/HTTP errors: org A dashboard and track 1 at 1440 and 390 (no checkbox, rule line present, chips), supervisor dashboard (new KPIs) and organizations: 2 passed. Fixed from the screenshots: chip stretched full width at 390; leftover ticking copy.
- Playwright Chromium was not installed on this machine; installed with `npx playwright install chromium`.

## Not finished
- Review mode (verdicts, approval gate, documents, supervisor results with frozen data) has not run in the browser: staging has no assessment under review and no evaluator account in `e2e/.env`. `demo_phase4.sql` and `e2e/review.spec.ts` (Step 4) cover it; Step 4 also needs `E2E_EVALUATOR2_EMAIL` (and evaluator1) in `e2e/.env`.
