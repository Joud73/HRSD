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

## Before Step 3 (owner's order change, 9 Nov)

- [x] `supabase/seed/demo_phase4.sql` (Step 4.1, pulled forward) written and run on staging: org B under_review, evaluator2, 189 evidenced items, 184 confirmed, 2 rejected with notes (track 1 indicator 2 item 1; track 3 first indicator item 1), 3 pending (track 1 indicator 1 items 1 to 3), no documents. Idempotent (asserts 3 pending).
- [x] `supabase/seed/programs.sql` (Step 4.2, pulled forward) written and run: DEMO-T1..T5, one per track, mapped to all its indicators (13/14/10/14/10), levels 0 to 2, placeholder URLs on example.org.
- [x] Browser pass of Step 2 review mode as evaluator2 on org B (1440 and 390): verdict controls (pending items show no selection), indicator 1 "4 من 7" with the pending dot, header "بانتظار التحقق 3", approve disabled with tooltip "3 بند بانتظار التحقق", return note pre-filled "المؤشر 2: …" / "المؤشر 28: …". No console/page/HTTP errors. Nothing needed fixing.
- `e2e/.env` on this machine does not contain `E2E_EVALUATOR1_EMAIL` / `E2E_EVALUATOR2_EMAIL` (the file may not have been saved); the passes used `evaluator2@tamkeen.local` inline with `E2E_PASSWORD`.

### Found: cascade delete of evidences fails since migration 11b
Deleting an assessment that has evidence fails: the cascade deletes the evidences, `propagate_evidence_change()` (AFTER DELETE on evidences) upserts an `item_responses` row for the assessment being deleted, and `assert_item_matches_cycle_tool()` raises "Item does not belong to the tool version of this assessment cycle". It breaks the second run of `demo_phase4.sql` and `demo_reset.sql` (org A has evidence), and any admin delete of an assessment with evidence.
- Fixed on 10 Nov by migration 12 (`20261109120000_fix_evidence_cascade_delete.sql`, see below); the seed workaround is removed.

## Step 3: documents, issuance, organization results

- [x] 3.1 DocumentView (shared, print-ready)
- [x] 3.2 Evaluator document editor
- [x] 3.3 Issuance (supervisor)
- [x] 3.4 Organization results page

### Decisions (Step 3)
- `DocumentView` renders the template structure as `.doc-page` A4 sheets (210mm wide, covers exactly 297mm): cover (AOL white logo, gold rule, title, organization, QR of `/results`, rights line), facts table, numbered sections, track and standard chips, "لا يوجد" for empty standards, back cover. Plan: three scores (dash when null), indicator register with level chips (0 danger, 1 warning, 2 accent, 4 success), task register grouped by a filled "{track} - {standard}" row, numbered within the standard, status from `task_status`. Accepts `number`/`issuedAt` overrides: issuance prints the number before the database stores it. Vertical stacks use block `space-y-*` (Chrome does not fragment tall flex columns in print; html2canvas slices cleanly).
- Report number (Arabic + Latin) is isolated with `<bdi>` wherever printed, and with U+2068/U+2069 inside `issued_on`.
- Platform logo: AOL (the repo has no HRSD logo asset). QR: `qrcode` package (added with `@types/qrcode`).
- Print: `DocumentScreen` mounts a print-only copy on `<body>` through a portal; `@media print` hides every other body child, `@page A4 margin 0`, one `.doc-page` per sheet, rows and list items not split, padding cloned on continuation sheets.
- `lib/pdf.ts` factored out of `Certificate` (`elementToPdf`, unchanged behaviour) plus `pagesToPdf`: each `.doc-page` captured at scale 2; a page taller than A4 is sliced at the last line boundary (`li`, `tr`, `p`, headings) that fits, continuations keep the page padding; JPEG 0.92.
- html2canvas fixes, both found in the issued PDFs and verified by rebuilding: (1) it measures font baselines with a 1×1 GIF placed in the live page, which Tailwind's preflight makes block-level, shifting every captured line down; `index.css` keeps that exact image inline. (2) RTL list markers land on the wrong side; bullets are explicit elements.
- Editor (`/evaluator/assessments/:id/documents/:kind`): sections per kind, tracks as `<details>` (first open, chevron), standards with their lines (textarea saved on blur, include switch, tag مولد آلياً / معدل / يدوي, remove for manual), inline "إضافة سطر" with حفظ. Live preview (zoom 0.6) sticky on lg, toggled below lg. Read only with a banner when the document is not a draft or the assessment is not under review.
- Supervisor results: documents in tabs (`DocumentScreen`, print and PDF download), "إصدار النتائج" + "إعادة للمدقق". Issuance dialog: number from `results_number`, progress (إعداد التقرير التعقيبي / إعداد خطة التحسين / إصدار), off-screen render with the number and today's date, both PDFs uploaded, `issue_results`; a stale number is fetched again and the PDFs rebuilt once.
- Organization: `/results` (redirects to `/dashboard` unless issued): facts تاريخ الإصدار and رقم التقرير, `ResultsOverview`, documents (عرض → `/results/documents/:kind`, تحميل PDF via signed URL), programs (title, matched indicators, external link; one-sentence empty state). History: issued cycles show the frozen `review_pct` without "تقديرية"; `Assessment` gains `issuedAt`.
- `RegisterIndicator` lives in `resultsService`; `useDocumentBundle` gives a document, its lines, and the register (frozen results once approved, live review columns while a draft).

### Checks (Step 3), staging, throwaway Playwright specs (deleted after)
Full flow run twice; the second run starts from a fresh `demo_phase4.sql` with every fix in (the first run's two PDFs were removed from the bucket before re-seeding):
1. evaluator2 confirms the 3 pending items → both documents appear, approve enabled; plan editor: first task edited (tag معدل), manual line added (tag يدوي). 192 task lines = 189 items without evidence + 2 rejected + 1 manual.
2. evaluator2 approves; dialog shows مؤكد 187, مرفوض 2, النتيجة الذاتية 50%, نتيجة المراجعة 49%.
3. supervisor: organizations list shows org B "معتمد", "النتائج" opens the results page; print preview (Chromium print emulation, A4): report 20 sheets, plan 25 sheets, rendered with pdf.js and checked (covers, facts, numbered sections, chips, task register with repeated header). Issue: number ت.م.TEST-0002|26.11.09, both PDFs uploaded, status issued.
4. org B: dashboard "صدرت نتائج التقييم وخطة التحسين."; `/results` with both documents, both PDFs download through signed URLs (200, application/pdf, report 20 pages 7.4 MB, plan 24 pages 6.1 MB), programs panel lists 4 DEMO programs (track 2 is all level 4, so none).
Every role: no console errors, page errors or HTTP 4xx/5xx. `tsc` 0 errors, lint 6 (baseline).

## Fixes (10 Nov): cascade delete and issued document integrity
Owner-provided migrations, `db push --dry-run` listed exactly these two, then pushed to staging:
- `20261109120000_fix_evidence_cascade_delete.sql`: `propagate_evidence_change()` returns early on DELETE when the assessment is gone.
- `20261110090000_phase4_document_integrity.sql`: the `documents` bucket accepts writes only to `{assessment}/feedback_report.pdf` or `{assessment}/improvement_plan.pdf`, and only while that assessment is approved; `issue_results()` requires those canonical paths and a 64-hex sha256. The app already uploads to `${id}/${kind}.pdf`, no code change.

Seeds: the evidence-first delete is removed from `demo_reset.sql` and `demo_phase4.sql`. Confirmed on staging: `reset-demo.mjs` (demo_reset.sql deletes org A's assessment with 182 evidences through the cascade), then `demo_phase4.sql` twice in a row (the second run cascades org B's 189 evidences): both runs end with org B under_review, 189 evidenced, 184 confirmed, 2 rejected, 3 pending, 0 documents.

### Checks: `review_checks.sql` on staging (25 PASS, 0 FAIL)
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
| 42 | supervisor | issue_results wrong / right number | error; issued, number set | error; issued, ت.م.TEST-0001\|26.11.10, issued_at true | PASS |
| 43 | org A | select documents, lines, results after issuance | 2 docs, 756 lines, 61 results, review_pct 0 | 2 docs, 756 lines, 61 results, review_pct 0 | PASS |
| 44 | evaluator2 | select org A documents and results | 0, 0 | 0, 0 | PASS |
| 45 | admin / org A | program on indicator 1 (level 1) recommended | 1 | 1 | PASS |
| 46 | anon | select programs; select assessment_documents | >= 1; permission denied | 6; denied | PASS |
| 47 | supervisor | update document lines | 0 rows or error | 0 rows | PASS |
| 48 | org A | issue_results | error | Only the final sign-off issues results | PASS |
| 49 | supervisor | issue_results with a PDF outside the assessment folder | error: invalid entry | error | PASS |
| 50 | supervisor | upload canonical / other name while approved | allowed; refused | allowed; refused | PASS |
| 51 | supervisor | upload a PDF for an issued assessment | refused | refused | PASS |

## Step 4: demo data, tests, rehearsal

- [x] 4.1 `demo_reset.sql` header: items_met equals the evidence count (182 for org A); the phase 3 "met without evidence" row is stored as not met. `demo_phase4.sql` (written before Step 3).
- [x] 4.2 `programs.sql` (written before Step 3; still the five DEMO-T programs until the owner's طموحي list arrives).
- [x] 4.3 `e2e/review.spec.ts`; `demo-path.spec.ts` updated to phase 4; both run together.
- [x] 4.4 `review_checks.sql` (25 PASS, table above under Fixes), `rls_checks.sql` (25 PASS), security advisors (0 ERROR).
- [x] 4.5 Staging reset to the demo start state; demo path below.

### Decisions (Step 4)
- `reset-demo.mjs` also deletes every object under `documents/{assessment}/` for org A's and org B's open-cycle assessments (Storage list + delete with the service key, never printed). Verified: the documents bucket is empty after the final reset (0 folders, 0 files).
- `review.spec.ts` sets its own starting state in `beforeAll`: `reset-demo.mjs` (so PDFs from an earlier run are removed), then `demo_phase4.sql` through the CLI, asserting 3 pending and 0 documents. Playwright runs files alphabetically, so `demo-path` (needs the reset state) runs first and `review` re-seeds after it.
- `demo-path.spec.ts` was still the phase 3 spec (checkboxes, "review period not started"). Updated: evidence is attached to an item without a tick (chip بدون شاهد → محقق), org A's next step reads "أكملت 182 من 378" (the evidence-less row no longer counts), evaluator2 sees "بدء المراجعة" enabled because review_start (1 Nov) has passed. Evaluator e-mails come from `E2E_EVALUATOR1_EMAIL` / `E2E_EVALUATOR2_EMAIL` (added to `e2e/.env.example`).
- `rls_checks.sql` cases 11 to 13 assume the review period has not started; since Step 1 set review_start = 1 Nov they failed on the date, not on a rule (11 "allowed", then 12 "allowed" once 11 was fixed). They now move the cycle's review_start to tomorrow and restore it after case 13, inside the rolled-back transaction (verified: staging still 2026-11-01). Case 20 needs org B as a draft (its stated prerequisite), so the file runs after `reset-demo.mjs` and before `demo_phase4.sql`.
- `e2e/.env` on this machine still lacks the two evaluator keys (file dated 28 Oct); the runs passed them inline. Add them to the file to run the specs as is.

### Checks: e2e on staging (`npx playwright test e2e/demo-path.spec.ts e2e/review.spec.ts`, after `reset-demo.mjs`)
Every test fails on console errors, page errors, failed requests or HTTP 4xx/5xx; screenshots in `e2e/screens/` and `e2e/screens/review/` (gitignored).
```
Running 10 tests using 1 worker
  ✓   1 [chromium] › e2e\demo-path.spec.ts:103:3 › phase 3 demo path › org A: dashboard, track 1 indicator 1, PDF and link evidence, refresh keeps state
  ✓   2 [chromium] › e2e\demo-path.spec.ts:139:3 › phase 3 demo path › admin: assign evaluator2 to org B, four roles, cycle scope tab
  ✓   3 [chromium] › e2e\demo-path.spec.ts:171:3 › phase 3 demo path › supervisor: both organizations, proxy entry writes on org B's draft
  ✓   4 [chromium] › e2e\demo-path.spec.ts:195:3 › phase 3 demo path › org B: sees the proxy entry, submits, under review, read only
  ✓   5 [chromium] › e2e\demo-path.spec.ts:226:3 › phase 3 demo path › evaluator2: org B submitted, organization card, review period open
  ✓   6 [chromium] › e2e\review.spec.ts:81:3 › phase 4 review path › evaluator2: approve waits for 3 verdicts, recording them generates both documents
  ✓   7 [chromium] › e2e\review.spec.ts:124:3 › phase 4 review path › evaluator2: edits a task line of the plan, then approves
  ✓   8 [chromium] › e2e\review.spec.ts:162:3 › phase 4 review path › supervisor: org B approved, issues the results with both PDFs
  ✓   9 [chromium] › e2e\review.spec.ts:194:3 › phase 4 review path › org B: dashboard, results page with both PDFs and programs, no other organization's results
  ✓  10 [chromium] › e2e\review.spec.ts:232:3 › phase 4 review path › evaluator1: cannot open org B's documents
  10 passed (2.9m)
```
review.spec covers: evaluator2 queue (org B قيد المراجعة), header بانتظار التحقق 3, approve disabled with tooltip "3 بند بانتظار التحقق", confirm items 1 and 2 and reject item 3 of track 1 indicator 1, pending 0, both document cards appear, approve enabled; plan editor: first task line edited, toast حُفظ السطر, tag معدل, preview updated, kept after reload; approve dialog مؤكد 186, مرفوض 3, both scores, status بانتظار الاعتماد النهائي; supervisor: org B معتمد, النتائج, plan tab shows the edited task, issue (number ت.م.TEST-0002|yy.mm.dd), "صدرت النتائج في …", database: 2 documents issued, 2 sha256, 2 canonical paths; org B: dashboard صدرت النتائج and "صدرت نتائج التقييم وخطة التحسين.", عرض النتائج → /results with the report number, 2 تحميل PDF (each signed URL 200 application/pdf), programs panel; org B on the supervisor results URL of org A's assessment is sent away (no org A data); evaluator1 on org B's plan editor: "التقييم غير موجود أو غير مسند إليك." and no document text.

### Checks: `rls_checks.sql` on staging (25 PASS, 0 FAIL)
| n | who | action | expected | actual | result |
|---|---|---|---|---|---|
| 1 | org A | select count(*) from items (open cycle tool) | 378 | 378 | PASS |
| 2 | org A | ensure_my_assessment() | draft | draft | PASS |
| 3 | org B | select assessments | A: 0, total: 1 (own) | A: 0, total: 1 | PASS |
| 4 | org A | update profiles set organization_id = B | error | organization_id, status, email and registration_number can only be changed by an administr | PASS |
| 5 | org A | update assessments set status = approved | 0 rows or error | 0 rows | PASS |
| 6 | org A | insert item_responses, transition submitted | submitted | submitted | PASS |
| 7 | org A | update item_responses after submit | 0 rows | 0 rows | PASS |
| 8 | evaluator2 | select assessments | A: 0, total: 1 (org B) | A: 0, total: 1 | PASS |
| 9 | evaluator1 | select count(*) from assessments | 1 | 1 | PASS |
| 10 | evaluator1 | transition approved from submitted | error: not allowed | Transition submitted -> approved is not allowed for this user at this time | PASS |
| 11 | evaluator1 | transition under_review before review_start | error: not allowed | Transition submitted -> under_review is not allowed for this user at this time | PASS |
| 12 | admin | transition under_review without note | error: requires a note | Administrative override requires a note | PASS |
| 13 | admin | transition under_review with note | under_review, 1 history row | under_review, 1 history row | PASS |
| 14 | evaluator1 | update item_responses set is_met = false | 0 rows | Evaluators cannot change the organization answer | PASS |
| 15 | evaluator1 | transition returned without note (review period) | error: note is required | A note is required when returning an assessment | PASS |
| 16 | org B | upload into org A's evidences folder | error | new row violates row-level security policy for table "objects" | PASS |
| 17 | org A | select assessment_status_history | own > 0, other 0 | own 2, other 0 | PASS |
| 18 | anon | select from items | error: permission denied | permission denied for table items | PASS |
| 20 | supervisor | insert item_responses on org B (draft) | allowed | allowed | PASS |
| 21 | supervisor | update assessment_reviews (reassign org B) | 0 rows or error | 0 rows | PASS |
| 22 | evaluator2 | insert item_responses on org B | error | new row violates row-level security policy for table "item_responses" | PASS |
| 23 | evaluator1 | select delegates | org A: 1, org B: 0 | org A: 1, org B: 0 | PASS |
| 24 | org A | select cycle_item_exclusions | 1 | 1 | PASS |
| 25 | evaluator2 (unassigned) | select count(*) from assessments | 0 | 0 | PASS |
| 26 | evaluator1 | transition returned with note (review period) | returned | returned | PASS |

### Checks: security advisors (`npx supabase db advisors --linked --type security`): 0 ERROR, 45 WARN
- 44 are "SECURITY DEFINER function executable by anon / authenticated" (22 functions × 2). 11 were already listed in phase 3; the 11 new ones come from the phase 4 migrations: auto_generate_documents, can_issue_results, document_editable_by_me, document_header, document_path_writable, generate_assessment_documents, issue_results, item_has_evidence, pending_verdicts, propagate_evidence_change, results_number. Each checks `auth.uid()` or a role helper inside (anon gets false, an empty result or an error), and the two trigger functions cannot be called outside a trigger.
- 1 is leaked-password protection disabled in Auth (unchanged since phase 3).
- Follow-up unchanged: a migration revoking EXECUTE from anon on these functions, and leaked-password protection on in the dashboard.

### Demo path (staging, start state: `node e2e/reset-demo.mjs`, then `demo_phase4.sql`, then `programs.sql`)
State after the final reset: org A draft at 48 % (182 evidenced), org B under review with evaluator2: 189 evidenced, 184 confirmed, 2 rejected, 3 pending, no documents; five DEMO programs; documents bucket empty.
1. **evaluator2** (`evaluator2@tamkeen.local`): التقييمات المسندة, org B "قيد المراجعة" with its submission date (3 days ago); open it. Header "بانتظار التحقق 3"; hover "اعتماد التقييم" (disabled): "3 بند بانتظار التحقق". مستندات النتائج: "تُنشأ المستندات تلقائياً عند اكتمال التحقق." Track التوجه, المؤشر 1: confirm items 1 and 2, reject item 3 (optionally add ملاحظة المدقق). Pending 0, both documents appear. خطة التحسين → تحرير: edit the first task, see معدل and the preview; back. "إعادة للمنظمة" shows the pre-filled note (cancel, do not send). "اعتماد التقييم": dialog with مؤكد 186, مرفوض 3, النتيجة الذاتية, نتيجة المراجعة → اعتماد.
2. **supervisor** (`supervisor.test@tamkeen.local`): المنظمات, org B "معتمد", النتائج: both documents in tabs (print preview available), "إصدار النتائج": number, progress (إعداد التقرير التعقيبي, إعداد خطة التحسين, إصدار النتائج), then "صدرت النتائج في …، رقم التقرير …"; تحميل PDF.
3. **org B** (`org.b@tamkeen.local`): dashboard journey at step 5, "صدرت نتائج التقييم وخطة التحسين.", عرض النتائج: results page (issue date, report number, results by track, both documents with عرض and تحميل PDF, البرامج المقترحة with 4 DEMO programs).
4. **admin** (`admin.test@tamkeen.local`): unchanged pages: assign the evaluator on org B's association page, cycle dates, نطاق التقييم في الدورة (also covered by demo-path.spec).
To run it again: `node e2e/reset-demo.mjs`, then `demo_phase4.sql`.

Reference files (gitignored) in `e2e/screens/phase4/`: final-report-p1.jpg, final-plan-p1.jpg, is-07-org-results.png, issued-report.pdf, issued-plan.pdf (from the Step 3 issuance).

## Not finished
- PDFs are 6 to 7 MB each (raster pages, JPEG 0.92 at scale 2). Fine for the demo; lower quality or scale if storage or download time matters.
- `demo_phase4.sql` alone does not remove the PDFs of an issued org B (the bucket is not cascaded): always run `reset-demo.mjs` first.
- `e2e/.env` needs `E2E_EVALUATOR1_EMAIL` and `E2E_EVALUATOR2_EMAIL`.
- Security advisors: revoke EXECUTE from anon on the 22 helper functions; turn on leaked-password protection.
