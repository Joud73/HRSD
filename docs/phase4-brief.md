# Phase 4 brief: review, approval and results (BR-07, BR-08, BR-09, BR-10, BR-12)

Read CLAUDE.md and `docs/phase3-brief.md` ("What already exists", conventions) first. This brief wins where it conflicts. Work on branch `feat/review-results` created from `feat/org-journey`. Never push to `main`. Commit at the end of every step with the message given. Typecheck (`npx tsc --noEmit -p tsconfig.app.json`) and `npm run lint` must not gain problems (baseline: 6). Keep a log at `docs/phase4-log.md`: ticked steps, decisions, checks, what you could not finish and why. If your context is compacted, re-read this brief and the log and continue from the first unticked step.

Conventions unchanged: Arabic copy in `src/lib/strings/*.ts`, formal, short, active, no em dashes, Western digits through `formatNumber()`, logical RTL utilities, services → React Query hooks → pages, errors mapped to Arabic `ServiceError`. Scores come from the views, never from a client formula.

## Decisions this phase implements (approved by the owner on 9 Nov)

1. **An item is met only through its evidence.** There is no checkbox. Adding the first evidence marks the item met; removing the last one unmarks it. The database derives `is_met` (migration 11) and refuses verdicts on items without evidence. `progress_pct` now equals `score_pct`.
2. **Final result = items the evaluator confirmed.** Per item with evidence the assigned evaluator records `verified` true or false and an optional `evaluator_note`. Items without evidence need no verdict. A verdict resets to pending when the organization changes that item's evidence after a return.
3. **Two-step sign-off.** `under_review` → `approved` is the evaluator's approval (gate: zero pending verdicts; results frozen into `assessment_results`; both documents move to `approved`). `approved` → `issued` is the final sign-off by whoever `can_issue_results()` allows (today the supervisor, admin too), through `issue_results()`, which also records the two PDFs. The final sign-off may send it back: `approved` → `under_review` with a note. The organization sees results and documents only when `issued`.
4. **Documents are generated, then reviewed.** The moment the last pending verdict is recorded, the database builds التقرير التعقيبي (titled تقرير الإشراف الفني) and خطة التحسين from the tool texts (`strength_text`, `opportunity_text`, `improvement_action`). The evaluator edits lines, excludes lines, adds manual lines, or regenerates. Approval locks them. Issuance numbers them `ت.م.{رقم التسجيل}|{yy.mm.dd}`.
5. **Evaluator item notes stay internal** (evaluator, supervisor, admin). The organization sees the return note and the issued documents.
6. **Review may start before the submission period ends.** Staging cycle: set `review_start = 2026-11-01`.
7. **طموحي in this phase = the data contract and the results panel.** `programs` + `program_indicators` tables and `v_program_recommendations` (default rule; the readiness tool replaces it). The catalog site is a separate brief.

Status lifecycle: `draft → submitted → under_review → (returned → submitted) → approved → issued`. Journey steps on the organization dashboard: draft/returned 1, submitted/under_review 3, approved 4 (اعتماد النتائج), issued 5 (خطة التحسين).

## Step 1: staging, types, data layer

1. Open a PR `feat/org-journey` → `staging` and merge it, so the staging URL shows Phase 3. Then `git checkout -b feat/review-results`.
2. `npx supabase db push` (linked: `tamkeen - staging`). Two new files apply in order: `20261109100000_phase4_status_issued.sql`, `20261109100100_phase4_review_and_results.sql`. Then in the SQL editor: `update assessment_cycles set review_start = '2026-11-01' where status = 'open';` (allowed now).
3. `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`. New: `assessment_status` has `issued`; tables `assessment_results`, `assessment_documents`, `assessment_document_lines`, `programs`, `program_indicators`; views `v_assessment_results_tracks`, `v_assessment_results_overall`, `v_program_recommendations`; the four scoring views gain `items_review_counted`, `items_review_pending`, `items_review_rejected`, `review_score_pct`, `review_level`, `review_level_label` (indicator), `avg_review_level`, `avg_review_score_pct` (track and progress); functions `pending_verdicts`, `generate_assessment_documents`, `results_number`, `issue_results`, `can_issue_results`, `item_has_evidence`.
4. Run `supabase/checks/review_checks.sql` and `supabase/checks/scoring_checks.sql` on staging (`npx supabase db query --linked -f ...`); paste both result tables into the log. Expected: 22 PASS; scoring values as commented in the file.
5. Fix the types fallout: `AssessmentStatus` now includes `issued`; `emptyCounts()` in `evaluatorService.ts`; `StatusKey` gains `issued` (`copy.status_issued` = صدرت النتائج, class `bg-success/10 text-success`, dot success) and `toStatusKey` / `reviewStatusKey` map `issued`; `journeyStep` in `indicatorUtils.ts`: approved → 4, issued → 5.
6. Services:
   - `assessmentService.ts`: replace `setItemMet` with `saveItemNote(assessmentId, itemId, orgNote)` (upsert `org_note` only; never send `is_met`). `IndicatorScore`, `TrackScore`, `AssessmentProgress` gain the review fields. New: `setVerdict(assessmentId, itemId, verified: boolean | null, evaluatorNote?)` (update `item_responses`), `getPendingVerdicts(assessmentId)` (rpc), `listResponses` also returns `verified` and `evaluatorNote`. `ReviewTransition` gains `"issued"` is NOT added; add `returnToEvaluator(assessmentId, note)` = transition to `under_review` from `approved`. Error mapping: `await a verdict` → "لا يمكن الاعتماد قبل التحقق من جميع البنود ({n})", `needs at least one evidence` → "لا يمكن تسجيل حكم على بند دون شاهد", `note is required` (both variants) → the existing note message, `stale` → "تغيّر رقم التقرير، أعد الإصدار", `Both documents must be approved` → "لا بد من اعتماد المستندين أولاً".
   - New `services/resultsService.ts`: `getFrozenResults(assessmentId)` (indicators, `v_assessment_results_tracks`, `v_assessment_results_overall`), `listDocuments(assessmentId)`, `listDocumentLines(documentId)`, `updateLine(lineId, { text?, included?, sortOrder? })`, `addManualLine(documentId, { section, trackId, standardId, text })`, `removeManualLine(lineId)`, `regenerateDocuments(assessmentId)` (rpc), `getResultsNumber(assessmentId)` (rpc), `uploadDocumentPdf(assessmentId, kind, blob)` (bucket `documents`, path `${assessmentId}/${kind}.pdf`, upsert true) returning `{ path, sha256 }` (sha256 through `crypto.subtle.digest`), `issueResults(assessmentId, number, pdfs)` (rpc), `getDocumentPdfUrl(doc)` (signed URL, 10 minutes), `listRecommendedPrograms(assessmentId)`.
   - Hooks in `useAssessment.ts` and new `useResults.ts`, keys under `["assessment", id, ...]`, `["results", id]`, `["documents", id]`; every mutation invalidates the assessment key so scores and pending counts refresh.

Commit: `feat(db): phase 4 review, results and documents on staging, data layer`.

## Step 2: evidence rule for the organization, verification for the evaluator, sign-off for the supervisor

### 2.1 Organization and supervisor proxy (AssessmentWorkspace)
- `ItemRow`: remove the `Checkbox`. The row is: position and text, one state chip at the end ("محقق" success when `evidences.length > 0`, "بدون شاهد" neutral otherwise), the evidence list, the "إضافة شاهد" menu, the note button. Row background `bg-primary/5` when met. Delete `item_met_without_evidence` and every "محدد دون شاهد" path. The rule line under the indicator title becomes: "يُحتسب البند عند إرفاق شاهد له. حذف آخر شاهد يلغي احتسابه.".
- Note saving calls `saveItemNote`. Deleting the last evidence shows the existing confirmation with one extra sentence: "سيُلغى احتساب البند.".
- `SubmitAssessment`: delete the warning section for items met without evidence (the state no longer exists). Keep the empty guard (`itemsCounted === 0`) and the summary: البنود المحققة, المؤشرات المكتملة, النتيجة التقديرية.
- Dashboard: `NextAction` kinds use `itemsCounted` (not `itemsMet`); `SummaryPanel` drops the warning link to items without evidence; `TracksPanel` bars use `items_counted / items_total`. Where the UI showed "نسبة الإنجاز" and "النتيجة التقديرية" as two different numbers, keep both panels (the ring is a count, the result carries the level band); they coincide now and that is expected.
- `NextAction` new kinds: `approved` → sentence "اعتمد المدقق التقييم، وتصدر النتائج بعد الاعتماد النهائي." with a disabled button; `issued` → "صدرت نتائج التقييم وخطة التحسين." with the primary button "عرض النتائج" → `/results`. `UnderReview` page handles `approved` and `issued` the same way.

### 2.2 Evaluator verification (review mode of AssessmentWorkspace)
- In review mode every item with evidence gets a verdict control at the end of the row: a `SegmentedControl` with تأكيد / رفض (value from `verified`; a third empty state when null), and a note field "ملاحظة المدقق" behind a text button (saved on blur through `setVerdict`). Items without evidence show the chip "لا يوجد شاهد، لا يُحتسب" and no control. Controls are enabled only while `status === "under_review"` and today is inside `[reviewStart, approvalEnd]`; otherwise read only.
- Indicator header in review mode: "{confirmed} مؤكد · {rejected} مرفوض · {pending} بانتظار" from `v_indicator_scores`, and two results side by side: "النتيجة الذاتية {score_pct}%" and "نتيجة المراجعة {review_score_pct}% · {review_level_label}". `IndicatorNav` counts in review mode: `items_review_counted / items_total`, with a small warning dot on indicators with `items_review_pending > 0`.
- The progress panel in review mode shows the assessment totals: بنود بشواهد, مؤكدة, مرفوضة, بانتظار التحقق, plus both overall percentages.

### 2.3 Evaluator review page (EvaluatorReview)
- Header meta adds "بانتظار التحقق: {pending}".
- Action bar: `submitted` → "بدء المراجعة". `under_review` → "اعتماد التقييم" (disabled while `pending > 0`, tooltip "{n} بند بانتظار التحقق"), "إعادة للمنظمة" (dialog note pre-filled from rejected items: one line per indicator "المؤشر {n}: {evaluator notes or 'شاهد مرفوض'}", editable), and, once documents exist, a section "مستندات النتائج" with two cards (التقرير التعقيبي, خطة التحسين) each linking to the editor, a "تحديث المستندات من نتائج التحقق" button (calls `regenerateDocuments`; confirm text: "تُعاد كتابة السطور غير المعدلة. تبقى سطورك المعدلة والمضافة.") and the sentence "تُنشأ المستندات تلقائياً عند اكتمال التحقق.". `approved` → "بانتظار الاعتماد النهائي من المشرف الفني." with the documents read only. `issued` → "صدرت النتائج في {date}، رقم التقرير {number}" with PDF links.
- Approve dialog content: مؤكد / مرفوض / النتيجة الذاتية / نتيجة المراجعة, then "يُجمّد الاحتساب وتُرفع المستندات للاعتماد النهائي. لا تُعدَّل الأحكام بعد ذلك.".
- `ReviewsTable`: default sort `submitted_at` ascending for `submitted`, then the rest; a chip "أعيد إرساله" when `returned_at` is not null and status is `submitted` or `under_review` (`listMyReviews` selects `returned_at`). Columns: replace "النتيجة التقديرية" with "نتيجة المراجعة" showing `review_score_pct` when status is under_review or later, otherwise a dash. Dashboard KPIs add "معتمدة" count already; add "صدرت" to the status filter.

### 2.4 Supervisor sign-off
- `SupervisorOrganizations`: status column shows the six statuses; row action for `approved` and `issued`: "النتائج" → `/supervisor/assessments/:assessmentId/results`.
- New page `SupervisorResults`: organization header (reuse `OrganizationCard`), frozen results (overall self vs review, tracks table from `v_assessment_results_tracks`, indicator squares by `review_label`), both documents rendered read only through `DocumentView` (Step 3), and the action bar: "إصدار النتائج" (Step 3.3) and "إعادة للمدقق" (dialog, note required → `returnToEvaluator`). When `issued`: number, date, PDF links, no actions.
- `SupervisorDashboard`: KPI "بانتظار الإصدار" (approved count) and "صدرت النتائج".

Commit: `feat(review): evidence-only items, item verification, approval gate, supervisor sign-off`.

## Step 3: documents, issuance, organization results

### 3.1 DocumentView (shared, print-ready)
`components/documents/DocumentView.tsx` renders one document from `{ document, lines, results, header }` in the template structure. Fixed texts, labels and error strings are already in `src/lib/strings/documents.ts` (transcribed from جواهر's templates; re-export it from `@/lib/copy` and add nothing hardcoded). Each `.doc-page` is an A4 block with `break-after: page` in print.

التقرير التعقيبي (title تقرير الإشراف الفني):
1. Cover: platform logo, title, organization name, a QR code of the results URL (`qrcode` package or an inline SVG generator), footer "جميع الحقوق محفوظة © {year} وزارة الموارد البشرية والتنمية الاجتماعية".
2. بيانات المنظمة table: مركز التنمية, اسم المنظمة, رقم التسجيل, تاريخ التقييم الذاتي, تاريخ إصدار التقرير (issued_at or "مسودة"), رقم التقرير (number or "يُحدد عند الإصدار").
3. Sections: 1 مقدمة (fixed text with the organization name), 2 أهمية الكفاءة الفنية, 3 مقياس تقييم الأداء الفني (fixed, ending with the sentence about the version being issued pending approval), 4 مجالات القوة, 5 فرص التحسين. Sections 4 and 5 group included lines by track then standard (chips "{track}" "{standard}" like the template), bullets per line; a standard with no lines prints "لا يوجد".
4. Back cover.

خطة التحسين:
1. Cover (same pattern, title خطة التحسين).
2. بيانات المنظمة: مركز التنمية, اسم المنظمة, رقم التسجيل, تاريخ تقييم المنظمة, رقم الخطة.
3. 1 مقدمة: fixed paragraph plus the three numbers from `header`: درجة التقييم الذاتي {self_pct}%, درجة المراجعة {review_pct}%, متوسط المنظمات المشاركة {cycle_avg_review_pct}% (dash when null).
4. 2 سجل المؤشرات: every indicator from `assessment_results` (draft stage: from `v_indicator_scores`) with chips track and standard, the indicator text, and the review label chip coloured by level (0 danger, 1 warning, 2 accent, 4 success).
5. 3 سجل مهام التحسين: grouped by track then standard (a filled header row "{track} - {standard}"), numbered within the standard, text, status "لم تبدأ".
6. Back cover.

Screen view: the same component inside the app shell with a toolbar (طباعة, تحميل PDF when issued). Print stylesheet hides the shell. Check the result at 1440 and in print preview before moving on.

### 3.2 Evaluator document editor
Route `/evaluator/assessments/:assessmentId/documents/:kind`. Left (start) column: the editable line list grouped by track and standard; each line: textarea (saved on blur through `updateLine`), include switch, tag (مولد آلياً / معدل / يدوي), remove for manual lines, and per standard a button "إضافة سطر". End column: live `DocumentView` preview (collapsible under lg). Read only when the document status is not `draft` or the assessment is not `under_review`, with a banner explaining why. Breadcrumbs back to the review page.

### 3.3 Issuance (supervisor)
"إصدار النتائج" on `SupervisorResults`: dialog shows the number from `getResultsNumber` and the sentence "تُقفل المستندات وتظهر النتائج للمنظمة. لا يمكن التراجع."; confirm → render both `DocumentView`s off-screen, `html2canvas` + `jsPDF` page by page (the Certificate page already does this; factor `lib/pdf.ts` out of it), upload both PDFs, then `issueResults(assessmentId, number, [{kind, path, sha256}, ...])`. Show progress ("إعداد التقرير التعقيبي", "إعداد خطة التحسين", "إصدار") and handle the stale-number error by re-fetching the number and retrying once. On success toast and refresh.

### 3.4 Organization results page
Route `/results` (organization shell). Redirects to `/dashboard` unless the current assessment is `issued`. Content: identity band with "صدرت النتائج في {date}" and the report number; overall review result as a percentage (no overall level label, as decided in Phase 3) next to the self-assessment percentage; tracks table self vs review with indicator squares coloured by `review_label`; "المستندات" with two cards (عرض, تحميل PDF via signed URL); "البرامج المقترحة" from `listRecommendedPrograms` (program title, matched indicators count, "الانتقال إلى البرنامج" link) with the empty state "تُقترح البرامج وفق قواعد مؤشر الجاهزية المعتمدة." when none. Dashboard `ResultsSections` history: issued cycles show the frozen `review_pct` without "تقديرية".

Commit: `feat(results): generated documents, evaluator editor, issuance with PDFs, organization results`.

## Step 4: demo data, tests, rehearsal

1. `supabase/seed/demo_reset.sql`: unchanged logic; note in its header that `items_met` now equals the evidence count (182 for org A). Add `supabase/seed/demo_phase4.sql` (staging only, idempotent): org B submitted with evidence on all items of tracks 1 and 2 and half of track 3, assigned to evaluator2, status `under_review`, verdicts recorded on everything except 3 items of track 1 indicator 1 (pending), two rejected items with notes. This is the state the demo starts from.
2. `supabase/seed/programs.sql`: the owner's طموحي program list when available; until then five clearly named demo programs (one per track, code `DEMO-T{n}`) mapped to that track's indicators, level range 0 to 2.
3. e2e (`e2e/review.spec.ts`, same harness as `demo-path.spec.ts`): evaluator2 opens org B, approve disabled with the pending count, records the 3 verdicts, documents appear, edits one task line, approves; supervisor opens results, issues (PDFs uploaded, status issued); org B dashboard shows "صدرت النتائج", `/results` shows both PDFs and the programs panel; org B cannot open another organization's results; evaluator1 cannot open org B's documents (404 state). Every test fails on console errors, page errors or HTTP 4xx/5xx as before.
4. Run `review_checks.sql` again after the UI work and paste the table into the log; `npx supabase db advisors --linked --type security` must show 0 ERROR.
5. `node e2e/reset-demo.mjs` then `demo_phase4.sql`, and write the demo path into the log:
   1. evaluator2: queue (org B "مرسل للمراجعة", submission date), open, header "3 بنود بانتظار التحقق", approve disabled, confirm 2 items and reject 1 with a note, documents appear, open خطة التحسين editor, edit a task, back, approve (dialog with both scores).
   2. supervisor: organizations list shows org B "معتمد", open results, both documents, "إصدار النتائج", PDFs generated, status "صدرت النتائج".
   3. org B: dashboard step 5, "عرض النتائج", results page, download the PDF, programs panel.
   4. Admin: unchanged pages still work (assignment, deadline, cycle scope).

Commit: `test: phase 4 rehearsal, review checks, demo data`. Then `git push origin feat/review-results` and open a PR to `staging`.
