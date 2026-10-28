# Phase 3 log

Baseline for every step: `npx tsc --noEmit -p tsconfig.app.json` passes; `npm run lint` reports 10 problems (7 errors, 3 warnings), all pre-existing (button, sonner, textarea, AuthContext, useAdminData, useEvaluatorAssignments, tailwind.config). A step passes when tsc passes and lint stays at these 10.

## Step 1: database on staging, types, baseline commit

- [x] 1.1 Baseline commit `22a73d6` on `chore/environments`; branch `feat/org-journey` created from it.
- [x] 1.2 `db push` to `tamkeen - staging` (qjwbdgstdqhflozblmeb). The dry run listed four migrations and all four applied: `20261020090000_organization_profile`, `20261028100000_role_supervisor`, `20261028100100_phase3_org_journey`, `20261028120000_mom1_decisions`. Pre-check: 2 organizations, none without `registration_number`. After the push: `social_dev_centers` 39, `sub_classifications` 18, `level_labels` 4.
- [x] 1.3 The open cycle `الدورة التجريبية 2026` (tool `md5('cts-v0.2.1')`) had submission 2026-10-19 to 2026-11-05. Its dates are now: submission 2026-10-18 to 2026-11-12, review 2026-11-12 to 2026-11-26, approval 2026-11-26 to 2026-12-01.
- [x] 1.4 Test accounts:
  - `supervisor.test@tamkeen.local` was created through the Auth admin API, confirmed, with a generated password given to the owner outside the repo.
  - `seed/test_accounts.sql` ran. Six users are linked: admin, evaluator1, evaluator2, org.a → org A, org.b → org B, supervisor.
  - The scoring checks ran inside a transaction and were rolled back. Afterwards staging has 0 evidences and 0 exclusions; 1 `item_responses` row existed before the run.
  - Because `db query` returns only the last result set, a copy of the checks saved each result set to a temp table and returned them together. The scenario and the queries are unchanged.
- [x] 1.5 Types regenerated with `gen types --linked`. Views appear under `Views` (`v_item_scores`, `v_indicator_scores`, `v_track_scores`, `v_assessment_progress`), `app_role` includes `supervisor`, and the new objects are present: `level_labels`, `cycle_item_exclusions`, `assessments.submission_due`, `ensure_assessment_for`. Only formatting lines were removed.
- [x] 1.6 Secrets (set after Step 2): `SITE_URL` = `https://tamkeen-git-staging-jouds-projects-5d6dfce8.vercel.app`, `ALLOWED_ORIGINS` = that URL plus `http://localhost:8080`. The owner adds `<SITE_URL>/set-password` to Auth Redirect URLs.

### Scoring check results (staging, 2026-10-28)

Indicators (expected: (1, 7, 7, 7, 100, 4, مكتمل), (2, 6, 6, 3, 50, 1, بحاجة لتحسين كبير), (3, 6, 0, 0, 0, 0, غير مكتمل)):

| indicator | items_total | items_met | items_counted | score_pct | level | level_label |
|---|---|---|---|---|---|---|
| 1 | 7 | 7 | 7 | 100 | 4 | مكتمل |
| 2 | 6 | 6 | 3 | 50 | 1 | بحاجة لتحسين كبير |
| 3 | 6 | 0 | 0 | 0 | 0 | غير مكتمل |

Tracks (expected track 1: 13 indicators, 2 started, 1 complete, avg_level 0.38):

| track | indicators_total | started | complete | items_met | items_counted | avg_level | progress_pct |
|---|---|---|---|---|---|---|---|
| 1 | 13 | 2 | 1 | 13 | 10 | 0.38 | 17 |
| 2 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| 3 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |
| 4 | 14 | 0 | 0 | 0 | 0 | 0 | 0 |
| 5 | 10 | 0 | 0 | 0 | 0 | 0 | 0 |

Assessment (expected: items_total 378, items_met 13, items_counted 10, progress_pct 3, score_pct 3):

| items_total | items_met | items_with_evidence | items_counted | progress_pct | score_pct | avg_level | indicators_started | indicators_complete |
|---|---|---|---|---|---|---|---|---|
| 378 | 13 | 10 | 10 | 3 | 3 | 0.08 | 2 | 1 |

Exclusion of item 1 (expected (1, 6, 6, 100, 4)): (1, 6, 6, 100, 4).

All values match.

## Step 2: data layer

- [x] `src/services/assessmentService.ts`: every function in the brief, plus `validateEvidenceFile` (exported so the upload button can reject a file before uploading) and the `EVIDENCE_MAX_BYTES` / `EVIDENCE_MIME_TYPES` constants. `getAssessment(scope)` returns `deadline = submission_due ?? submission_end`. `isEditable` compares dates in Asia/Riyadh.
- [x] `src/hooks/useAssessment.ts`: `useAssessment(scope)`, `useAssessmentHistory`, the read hooks, and the five mutations. All mutations share `mutationKey ["assessment", id]`, so a page can show "جارٍ الحفظ" with `useIsMutating`.
- [x] Error strings: 14 `err_*` keys in `src/lib/strings/assessment.ts`.
- Checked on staging through PostgREST with the service key (read only): the embedded filter `assessment_cycles.status=eq.open` returns org A's row, and `v_assessment_progress` returns 378 items.

## Step 3: organization pages on the database

- [x] 3.1 Route `/assessment/:trackNumber` (1 to 5, anything else redirects to `/dashboard`). `/technical-indicators/:courseSlug` redirects (altawajuh→1, alfariq→2, alsharakat→3, albaramij→4, altaathir→5). The page is `AssessmentWorkspace` with a `scope` prop, ready for Step 4.
  - Deleted: `indicatorsData.ts`, `TaskDialog`, `ImprovementPlanPanel`, `NotesPanel`, and `TechnicalEvaluationIndicators.tsx` (all its localStorage code).
  - `TRACK_SLUG` and `readEvidence` are removed from `Dashboard.tsx`.
  - Kept and adapted: `IndicatorNav` (tool tree and view counts), `EvidencePanel` (per-item files and links), the two-pane layout, and the motion rules.
- [x] 3.2 Self-assessment page:
  - Header: track name, standard and indicator counts, cycle, effective deadline with days left (warning under 7 days), status badge, and the "جارٍ الحفظ" / "تم الحفظ hh:mm" stamp.
  - Indicator list shows `items_counted / items_total`, with its state from `is_started` / `is_complete`.
  - Each item has a checkbox saved immediately (optimistic), a note saved on blur, its evidences (open through a signed URL, delete), "إرفاق ملف" and "إضافة رابط". The rule line appears once per indicator.
  - The result block shows `level_label`, `score_pct` and the band label from `levelBands`. `calculateIndicatorResult` and `RESULT` are gone.
  - Banners: returned (with `return_note`, inputs enabled), submitted, approved, period closed, period not yet open.
  - "إرسال التقييم للمراجعة" is in the header, disabled with a tooltip when not editable.
- [x] 3.3 Submit dialog:
  - Shows items met, items with evidence and indicators complete from `v_assessment_progress`.
  - Warns, without blocking, about started indicators where `items_met > items_counted`, naming each indicator and its count of items without evidence.
  - Ends with the freeze sentence. Confirming submits, then toasts and navigates to `/under-review`.
  - `/under-review` reads the real assessment (status, cycle, `submitted_at`) and handles returned (note, "استكمال التقييم"), approved, draft, and no assessment.
- [x] 3.4 Dashboard:
  - Journey stepper at the top.
  - Status row: status, cycle, deadline with days left, and the estimated score (`score_pct`, `avg_level`, "تقديرية حتى اعتماد المراجعة").
  - The 4 KPIs from `v_assessment_progress` plus the evidence count.
  - Track rows from `v_track_scores`.
  - Submit and continue buttons; the no-cycle empty state hides both.
  - "النتائج حسب الدورة" from `useAssessmentHistory()`.

### Step 3 decisions

- Indicator and standard numbers are the tool numbers (global, e.g. المؤشر 14). An item's label is its position inside the indicator (البند 1..n), because item numbers in the tool are global (indicator 2 holds items 8 to 13).
- Journey step from status: draft and returned → 1 (التقييم الذاتي), submitted and under_review → 3 (المراجعة والتدقيق), approved → 5 (خطة التحسين). Step 2 (إرسال للمراجعة) is the transition itself, so it is never the current step.
- Results by cycle need a label for the overall score, and the views only label indicators. The panel finds the `level_bands` band that contains `score_pct`, then that level's `level_labels` label. This is a lookup of database rows, the same one `v_indicator_scores` does, not a client formula. To support it, `toolService.getApprovedTool()` now also returns `levelLabels`.
- A complete track shows a green "مكتمل" badge. `StatusBadge` and `ProgressRow` take an optional label override for this; there is still no sixth status.
- Each track row's bar is `items_met / items_total`, rounded exactly as the view's `progress_pct`.
- Deleting an evidence happens right away with a toast, without a confirmation dialog.
- The workspace drops indicators and standards left with no active items once exclusions are applied, matching the views, which have no rows for them.

### Step 3 not verified in a browser

- No organization test password is available to me, so the pages were checked by typecheck, lint, dev-server compilation, and staging grants and policies only: `current_org_id`, `ensure_*` and `transition_assessment` are executable by `authenticated`, and `assessment_cycles` and `level_labels` are readable. Step 7 covers the click-through.

## Fixes after Step 3

- [x] Result block: the band label is gone. It now shows the band's range, "النطاق: 1 إلى 60%" (a one-value band reads "النطاق: 0%" or "النطاق: 100%"). The only result label on screen is `level_label` from the view.
- [x] Deleting an evidence asks for confirmation in an AlertDialog: "حذف الشاهد؟", "لا يمكن التراجع عن الحذف.", "حذف" (danger), "إلغاء".
- [x] The submit dialog blocks an empty assessment: when `itemsMet = 0`, confirm is disabled and the dialog says "لا يمكن إرسال تقييم دون تحديد أي بند.". This is a UI guard only; `transition_assessment` still accepts an empty submission. Partial submissions keep the warning.
- [x] `supabase/seed/demo_reset.sql` (staging only, as postgres, one transaction, idempotent). It recreates org A's draft, reassigns evaluator1, and fills tracks 1 to 3. Items are selected by track and indicator number (no hardcoded ids), and excluded items are skipped.

### Demo reset on staging (2026-10-28)

Org A: status `draft`; 183 responses, all with `updated_by` = org.a; 182 link evidences; evaluator1 assigned. Indicator 1: 0 of 7, 0 %, غير مكتمل.

| track | indicators | started | complete | items_total | items_met | items_counted | avg_level | avg_score_pct | progress_pct |
|---|---|---|---|---|---|---|---|---|---|
| 1 | 13 | 12 | 12 | 75 | 68 | 68 | 3.69 | 92 | 91 |
| 2 | 14 | 14 | 14 | 87 | 87 | 87 | 4.00 | 100 | 100 |
| 3 | 10 | 10 | 0 | 56 | 28 | 27 | 1.00 | 48 | 50 |
| 4 | 14 | 0 | 0 | 94 | 0 | 0 | 0.00 | 0 | 0 |
| 5 | 10 | 0 | 0 | 66 | 0 | 0 | 0.00 | 0 | 0 |

Total 378 items: 183 met = 68 + 87 + 28; 182 counted. Track 1 reaches 13 of 13 complete and level 4 once indicator 1 is filled live. Step 7.3's "tracks 1 and 2 complete, level 4" therefore holds for track 1 only after the live demo step.

## Step 4: the four roles active

- [x] Role and shell:
  - `roles.ts`: `supervisor` added to `AppRole`, its default route is `/supervisor`, and `fetchUserRole` accepts it.
  - `navigation.ts`: supervisor sidebar with لوحة المتابعة (`/supervisor`) and المنظمات (`/supervisor/organizations`). `AppShell` gets the supervisor home and a profile menu (`/supervisor/profile`, the shared `AccountProfile`).
  - `copy.shell_context.supervisor` = بوابة المشرف الفني, `shell_user.supervisor` = المشرف الفني.
- [x] `SupervisorDashboard`: KPIs from `getReportSummary()` (organizations, evaluators, assessments in the open cycle) and assessments by status (`StatusChart`, with not started).
- [x] `SupervisorOrganizations`: read-only table from `listOrganizations()`, with status, `progress_pct` bar, effective deadline and assigned evaluator, plus search and status filters. Each row has the action "إدخال التقييم نيابة عن المنظمة".
  - `listOrganizations()` now also returns `progressPct` (from `v_assessment_progress`), `submissionDue` and `deadline`.
- [x] Proxy entry: `/supervisor/organizations/:orgId/assessment/:trackNumber` mounts `AssessmentWorkspace` with `{ kind: "org", orgId }`. It shows a persistent banner "أنت تُدخل التقييم نيابة عن: {اسم المنظمة}" with links to the 5 tracks. Submitting returns to the organizations list.
- [x] Admin, in `AdminAssociationDetail` (overview tab), the panel "مسار التقييم في الدورة الحالية" (`AssessmentJourneyPanel`):
  - Select of active evaluators → `useAssignEvaluator`. It calls `ensureAssessmentFor` when the organization has no assessment, then `assignEvaluator()` (upsert on `assessment_reviews`, conflict `assessment_id`) in `evaluatorService.ts`.
  - Date field "تمديد مهلة التقييم الذاتي" → `setSubmissionDue()` in `assessmentService.ts`. It refuses a date before the cycle's `submission_start`, and opens the assessment when missing. The panel shows the effective deadline and "ممدد لهذه المنظمة"; "اعتماد موعد الدورة" clears the extension.
  - Viewing the page never opens an assessment: `useAssessment(scope, { ensure: false })`.
- [x] `AdminUsers`: role options مدير النظام / المشرف الفني / مدقق / منظمة (`roles_map`; organization now reads منظمة). `create-user` accepts `supervisor`, and is deployed to staging (`--use-api`, with `_shared/cors.ts`). Preflight from `http://localhost:8080` and the Vercel URL returns 204; any other origin gets 403.
- [x] `AdminRoles`: four roles, each with its pages from `navigation.ts`, and the "planned" note removed. Responsibilities follow "Roles in Release 1": admin (assignment, deadlines, cycle scope), المشرف الفني (follows all organizations, proxy entry, edits evidences, submits; cannot assign or record verdicts), organization (the delegate).
- `useAdminData` users list: role labels now come from `adminCopy.roles_map` instead of its own hardcoded map, which lacked the supervisor.

### Step 4 checks on staging

Signed in as `supervisor.test@tamkeen.local` through the Auth API, read only: `user_roles` gives `supervisor`; both organizations are readable; org A's assessment with its evaluator is readable; `v_assessment_progress` gives org A at 48 %; `evaluator_profiles` is readable; the evaluator count is 3. Writes (proxy entry for org B) are left to Step 7.6.

### Step 4 decisions

- The proxy page links the five tracks in its banner, because the supervisor has no organization dashboard to move between tracks.
- A supervisor row shows "لم يبدأ" for a draft at 0 % progress, matching the organization dashboard's rule for a draft with nothing marked.
- Not done: `approve-organization` is still the old deployed version (see flags).

## Before Step 6

- [x] `approve-organization` deployed to staging (`--use-api`). Preflight from `http://localhost:8080` and the Vercel URL returns 204 with the matching allow-origin, another origin gets 403, and a POST without a token gets 401.

## Step 6: HRSD data fields (done before Step 5, at the owner's request)

- [x] One source for the labels and their order: `src/lib/strings/fields.ts` (`fieldsCopy`): نوع الكيان; بيانات المنظمة (12 fields, المدينة أو المحافظة, المركز أو الحي, عدد العاملين بالمنظمة); بيانات المفوض (رقم الهوية، الاسم، الجوال، البريد الإلكتروني); بيانات المقيم (the same four plus جهة العمل). The old per-page labels in `auth.ts` and `admin.ts` were removed.
- [x] Shared fields: `components/shared/ProfileFields.tsx` (`OrganizationFields`, `DelegateFields`, `EvaluatorFields`) and `profileForm.ts` (form values, conversion, validation). Choosing a center prefills المنطقة from `social_dev_centers.region` with the hint "عُبئت من مركز التنمية الاجتماعية، ويمكن تعديلها."; typing in المنطقة clears the hint.
- [x] Lookups: sub-classifications by `sort_order`, centers by `code` (was by name).
- [x] `Register`: step 1 in the HRSD order (نوع الكيان first, then رقم التسجيل, تاريخ التسجيل, اسم المنظمة, ...); step 3 is now "بيانات المفوض" in the order رقم الهوية, الاسم, الجوال, البريد الإلكتروني. The login email stays its own step: it is the account, not an HRSD field.
- [x] `AdminAssociationDetail`: overview facts and both edit dialogs use the shared fields and order. Section titles "بيانات المنظمة" and "بيانات المفوض".
- [x] `AdminOrganizationRequests` detail: every request field is shown (a dash when empty), in two sections, before the approve and reject buttons. The dialog scrolls. Approval already copies all fields (checked in `approve-organization`).
- [x] `Settings` (organization): was a static mock with hardcoded cities and no save. Now reads the signed-in organization (`getMyOrganization`, `current_org_id`) and saves through `updateOrganization` / `saveDelegate`. نوع الكيان, رقم التسجيل and تاريخ التسجيل are read only with "يعدّلها مدير النظام فقط." (the trigger enforces it too). The delegate's ID is read only once recorded.
- [x] `AdminReviewers`: new "إضافة مدقق" dialog with the five evaluator fields. It invites the account through `create-user` (role evaluator) and then saves `evaluator_profiles`. `AdminReviewerDetail`: facts and edit dialog in the HRSD order.
- [x] `EvaluatorProfile`: a "بيانات المقيم" section under the account card. The evaluator edits الجوال, البريد الإلكتروني and جهة العمل (`updateMyContact`, a plain update because evaluators have no insert policy); رقم الهوية and الاسم are read only.
- Em dashes used as empty values in the touched files are now "-".

### Step 6 decisions

- Organization name stays editable by the organization in Settings: the database protects only رقم التسجيل, نوع الكيان and تاريخ التسجيل.
- An evaluator added from `AdminUsers` still gets no profile row; the reviewers page is the place to add evaluators with their HRSD data. The evaluator's profile page says so when the row is missing.
- If `create-user` succeeds and the profile save fails, the account exists without data; the administrator completes it from the evaluator's page.

## Step 5: per-cycle item selection

- [x] `cycleService.ts`: `listExclusions(cycleId)`, `excludeItem(cycleId, itemId | itemId[], reason)` (one insert for a whole node), `includeItem(cycleId, itemId | itemId[])` (one delete). Trigger errors map to Arabic: cycle not draft or open, item from another tool version.
- [x] `useCycles.ts`: `useCycleExclusions` (with reasons) and `useCycleScopeMutations` (exclude, include). Success refreshes `["cycles"]` (so the assessment form's `useExcludedItems` too), `["assessment"]` (scores and progress) and `["organizations"]`.
- [x] `AdminEvaluationYearDetail`: an existing cycle now has two tabs, "بيانات الدورة" (the form as before) and "نطاق التقييم في الدورة" (`components/admin/setup/CycleScope.tsx`). A new cycle shows the form only.
- [x] `CycleScope`: the approved tool in `RubricTree` with a tri-state checkbox on every track, standard, indicator and item. Checked = included. Unchecking opens "استبعاد من الدورة" with the item count, an optional reason and, when the cycle is open, a note that recorded answers stay but no longer count. Checking (or clicking a partly checked node) includes everything under it at once. Excluded items are struck through with "مستبعد" or "مستبعد: {السبب}". Live count "البنود الفعّالة في الدورة: N من 378". Closed or archived cycle: checkboxes disabled and the note "لا يُعدَّل نطاق التقييم إلا والدورة مسودة أو مفتوحة.".
- [x] `RubricTree` takes an optional `selection` prop (control per node, item note, muted items). `AdminRubric` does not pass it and stays read only.
- [x] `ui/checkbox`: the indeterminate state shows a dash (it showed a tick before).

### Step 5 check on staging (as the admin through RLS, rolled back)

Org A, track 1, indicator 2 before: 6 active items, 6 counted, 100 %, مكتمل. Excluding its first two items in one insert stamped `excluded_by` on both; the indicator then showed 4/4. One delete brought the exclusions back to 0. An insert as org A was refused (42501).

### Step 5 decisions

- The tab uses the approved tool. If a cycle points at another tool version, the tab says so instead of showing a tree that does not match.
- Excluding in an open cycle is allowed (the brief says draft or open). Answers already recorded on an excluded item stay in the database, and the views leave them out.

## Step 7: verification and rehearsal on staging

- [x] 7.1 `tsc` passes, `npm run lint` 10 problems (the baseline), `npm run build` passes (chunk size warning only, as before).
- [x] Automated browser run: `e2e/demo-path.spec.ts` (Playwright 1.64, Chromium) against `http://localhost:8080` and staging. Config in `playwright.config.ts`. Accounts from `e2e/.env` (gitignored; template `e2e/.env.example`). Each test fails on a console error, page error, failed request or HTTP 4xx/5xx. Screenshots in `e2e/screens/` (gitignored). Result: 4 passed, none of those problems.
  - Org A: dashboard shows the journey stepper, الموعد النهائي and 48 %; track 1 indicator 1 goes from غير مكتمل to بحاجة لتحسين كبير after two items are ticked with a link each (2 من 7, 29 %); a reload keeps both ticks and the label. (Covers 7.2 with links; the PDF upload path was checked by hand in Step 3.)
  - Org B: one item ticked with a link, submitted, lands on `/under-review` ("التقييم قيد التدقيق"); `/assessment/1` is then read only (banner, disabled checkboxes, no evidence buttons). (7.4 on org B, so org A stays ready for the live demo.)
  - Supervisor: lands on `/supervisor`, sees both organizations, opens org B in proxy mode: banner "أنت تُدخل التقييم نيابة عن: منظمة الاختبار ب", read only because org B is submitted. (7.6 writing on org B's behalf was verified as a draft in Step 4 checks; here it is the read-only case.)
  - Admin: org B page shows "مسار التقييم في الدورة الحالية" and "بيانات المنظمة"; the roles page lists the four roles; the cycle tab "نطاق التقييم في الدورة" loads with "البنود الفعّالة في الدورة: 378 من 378" and enabled checkboxes. (7.7 exclusion effect on the denominator verified through RLS in Step 5: 6/6 to 4/4.)
- [x] 7.3 and 7.5: the demo data comes from `supabase/seed/demo_reset.sql`; isolation is enforced by RLS (org B's run never shows org A's 48 %).
- [x] Test passwords: one generated password set on admin.test, org.a, org.b, evaluator1 and evaluator2 through the Auth admin API (owner's choice), stored only in `e2e/.env`. The supervisor keeps its own.
- [x] Reset after the run: `node e2e/reset-demo.mjs` removes the uploaded evidence files of org A and B (Storage API), then runs `demo_reset.sql`, which now also resets org B to an empty draft (keeping its evaluator). Result: org A draft, 48 %, 183 met, 182 evidences, track 1 indicator 1 at 0/7 غير مكتمل; org B draft with 0 responses; 0 exclusions.
- Found before the run: both organizations had been submitted by their own accounts at about 17:00 Riyadh time (manual testing), each with one uploaded file. The reset above cleared them, files included.

### Demo path, Thursday 13:00

Before the meeting: `node e2e/reset-demo.mjs` (about 20 seconds).

1. Sign in as `org.a@tamkeen.local`. Dashboard: the journey stepper at step 1, deadline 12 نوفمبر 2026 with the countdown, KPIs (48 % progress), tracks 1 and 2 nearly complete and complete, history by cycle.
2. Open track 1 (مسار التوجه). Indicator 1 shows 0 من 7 and غير مكتمل.
3. Tick item 1, attach a PDF; tick item 2, add a link. The result changes to بحاجة لتحسين كبير (29 %, range 1 to 60 %). Tick a third item without evidence to show the warning "محدد دون شاهد، لا يُحتسب".
4. "إرسال التقييم للمراجعة": the dialog lists the indicators with items met without evidence; confirm. The under-review page shows the real status; the track is read only.
5. Sign in as `supervisor.test@tamkeen.local`: follow-up dashboard, then المنظمات (both organizations, status, progress, deadline, evaluator). Open org B with "إدخال التقييم نيابة عن المنظمة", tick one item with a link: the banner names org B.
6. Sign in as `admin.test@tamkeen.local`: on org B's page, assign evaluator2 and extend the deadline (مسار التقييم في الدورة الحالية). Then سنوات التقييم → الدورة التجريبية 2026 → "نطاق التقييم في الدورة": untick one item, give a reason; the count drops to 377 من 378. Tick it back after the demo (or rerun the reset).

## Fixes A to E (after the rehearsal)

### A. Evaluator portal on the real data

Cause of the owner's finding: the evaluator pages read the legacy `evaluator_assignments` and `evaluation_criteria` tables, and "إعادة للاستكمال" updated `evaluator_assignments`, so the organization's assessment never changed.

- [x] Migration 10 `20261028180000_evaluator_reads_org.sql`: "delegates: evaluator reads assessed" (the assigned evaluator reads the organization's delegate). Pushed to staging; the dry run listed only this file.
- [x] `evaluatorService.listMyReviews()`: `assessment_reviews` of the signed-in evaluator, with the assessment (status, submitted_at), the organization (name, registration number), the cycle (name, review start) and `v_assessment_progress` (progress_pct, score_pct). Hook `useMyReviews` (`["evaluator", "reviews"]`).
- [x] `EvaluatorDashboard` (KPIs المسندة، بانتظار المراجعة، قيد المراجعة، معادة للاستكمال، معتمدة; latest five) and `EvaluatorAssignments` (status filter) use only `listMyReviews`, through one shared `components/evaluator/ReviewsTable`. Score column: score_pct plus the band's label.
- [x] `/evaluator/assessments/:assessmentId` (`EvaluatorReview`): organization name as title with status, cycle, submission date and progress; action bar; organization card (name, registration number, entity type, registration date, sub-classification, development center, region and city, employees; delegate name, mobile, email); answers in five track tabs through `AssessmentWorkspace` with the new scope `{ kind: "assessment", id }` (read only, no page header, banner or submit; every evidence opens).
- [x] Actions through `transition_assessment` only: "بدء المراجعة" (submitted), "اعتماد التقييم" and "إعادة للاستكمال" (under_review; the return dialog requires a note). Before `review_start` the buttons are disabled with "تبدأ فترة المراجعة في {date}"; after `approval_end` with "انتهت فترة المراجعة والاعتماد.". Errors map to Arabic (note required, cycle not open, not allowed now). `AssessmentCycle` gained `reviewStart`, `reviewEnd`, `approvalEnd`. No item-level verdicts.
- [x] New status key `under_review` (قيد المراجعة), used only on the evaluator side through `reviewStatusKey()`; organizations keep seeing "مرسل للمراجعة".
- [x] Deleted: `EvaluationDetails.tsx`, `useEvaluatorAssignments.ts`; `/evaluator/assignment/:id` redirects to `/evaluator/assignments`. The admin dashboard and `RecentEvaluations` moved to `getReportSummary` and `listOrganizations`; `useAdminAssociations` and `useAdminDashboardStats` deleted; the legacy assign and reassign dialogs on the reviewers page removed (assignment is on the organization page). `grep` for the five legacy tables in `src` returns nothing outside the generated `integrations/supabase/types.ts` (the tables still exist in the database).
- [x] `demo_reset.sql` also fills both test organizations' HRSD fields and one delegate each (test values), so the organization card is complete.
- Lint went from 10 to 6 problems: four of the baseline problems were in the deleted legacy code.
- Checked through the API as evaluator1 and evaluator2: each sees exactly one assessment (its own), with the organization, progress and responses.

### B. No average level, fractions with من

- [x] `avgLevel` is gone from the types (`AssessmentHistoryRow`, `TrackScore`, `AssessmentProgress`) and from every select; `TrackScore.scorePct` carries the view's `avg_score_pct`. The dashboard's "متوسط المستوى" fact and string are deleted.
- [x] A score is shown as score_pct plus the label of its band: `scoreLevel(pct, levelBands, levelLabels)` in `indicatorUtils`, read from the database, never hardcoded. Used by the dashboard and the evaluator tables.
- [x] Fractions read "68 من 75": track progress facts, the indicator list, `ProgressRow`, the certificate score. New `copy.of`.

### C. Organization dashboard redesign

Design plan (frontend-design skill, written before code):

1. Tokens: primary #0D3F29 for the identity band and primary actions; accent gold only on the current journey step (and the days number under 7 days); success, warning, danger, neutral only for levels and status; surface for the page, card white.
2. Type: h1 40/48 (organization name, white), h2 28/36 for the two big numbers (days left, estimated score), h3 20/28 panel titles, body 16/26, small 14/20; at most two sizes per panel.
3. The element that carries the page: the next-action panel (one sentence, one primary button), overlapping the band by 32px.
4. Wireframe 1440px (RTL, start = right):
   | band: [name h1 / رقم التسجيل · الدورة]                      [12 / يوماً متبقياً / الموعد النهائي] |
   | band: (1)✓——(2)◎——(3)○——(4)○——(5)○  with one caption each                                        |
   |   [next action: sentence ........................ [secondary] [primary]]  (-32px into band)     |
   |   [summary: إنجاز التقييم ring + facts | النتيجة التقديرية 48% + chip + note + warning]          |
   |   [tracks: legend; 5 rows: name, من, bar, badge, action; indicator squares]                    |
   |   [كيف تُحتسب النتيجة؟ (closed)]   [النتائج حسب الدورة table]                                   |
5. 390px: band stacks (name, then days), stepper becomes a vertical list; summary columns stack with a horizontal rule; track rows wrap with squares on their own line.
6. Cards only where content is a unit (next action, summary, tracks, history); the explainer is a plain disclosure; no KPI card grid.
7. Rules carry meaning: the vertical rule splits progress from result; row dividers in the tracks list.
8. Motion once per mount, reduced motion respected: count-up, ring and bars fill 600ms with the existing ease, squares fade in with a 15ms stagger, next-action crossfade on state change, current step ring scales in.
9. Copy: buttons name the result (ابدأ التقييم، متابعة التقييم: {المسار}، إرسال التقييم للمراجعة، استكمال التقييم); fractions "x من y"; missing data shows a dash.
10. Generic-default review: no identical KPI cards, no gradient, no hover lift, one gold use, no all-caps or numbered markers beyond the real five-step sequence.

Built (`components/dashboard/`):
- [x] `IdentityBand`: organization name (h1), "رقم التسجيل {n} · {cycle}", days left (count-up once, gold under 7 days, "انتهت فترة التقييم الذاتي" after), "الموعد النهائي {date}", and `JourneyStepper tone="inverse"` with one caption per step (done solid with check, current gold ring scaling in once, upcoming at 40 %; vertical list under md).
- [x] `NextAction`: one sentence and one primary action per state (start, in progress with the remaining tracks and an outline submit, all ticked, returned with the note, in review since {date}, approved with "عرض النتيجة" disabled, no cycle; also period not open yet and period closed). Crossfades on state change.
- [x] `SummaryPanel`: إنجاز التقييم (ring of progress_pct, "{met} من {total} محدداً", indicators complete and evidences) and النتيجة التقديرية (score_pct, band label chip, note, and the warning link to the first indicator with items met without evidence), split by a rule.
- [x] `TracksPanel`: legend from `level_labels`; per track the items "x من y", a bar, status, action (ابدأ / تابع / عرض المسار) and one 14px square per indicator (tooltip and aria-label "المؤشر {n}: {label} ({pct}%)") opening `/assessment/{track}?indicator={id}`. The workspace now reads `?indicator=`.
- [x] `ResultsSections`: "كيف تُحتسب النتيجة؟" (closed; three lines; band table from `level_bands` and `level_labels`) and the results-by-cycle table (الدورة، الحالة، النتيجة with band label; unapproved tagged "تقديرية").
- Critique after build (screenshots at 1440 and 390): `cn()` (tailwind-merge) dropped the custom `text-h1` size when a text colour followed, so the days number rendered small; those class lists are now plain strings. Removed one element: the "1." prefix before each track name. 390 px: band stacks, stepper vertical, summary columns stack, track rows wrap.

## Decisions

- `ensureMyAssessment` and `ensureAssessmentFor` return the full `Assessment` (with cycle and deadline): after the RPC they read the row by id. The page then has one type in every case.
- `useAssessment` treats "no open cycle in its submission period" as `null`, not an error, so the dashboard can show its empty state. It tries to open the assessment only once per scope while mounted.
- `useExcludedItems(cycleId)` is keyed `["cycles", cycleId, "exclusions"]` and not under `["assessment", id]`: exclusions belong to the cycle, and Step 5's admin mutations invalidate `["cycles"]`.
- The scope lookups are keyed `["assessment", "scope", ...]`, apart from `["assessment", id]`, because the id is unknown until they resolve. Submission invalidates the scope lookups and the history as well.
- In error mapping, the text checks run before the `42501` check, because `transition_assessment` and `ensure_my_assessment` raise with `insufficient_privilege` (42501) but need their own messages.
- The supervisor test account was created through the Auth admin API instead of the dashboard. It got a generated password because no shared test password is recorded in the repo.

## Fixes before Step 3

- [x] Migration 9 `20261028150000_response_actor.sql` (pushed to staging; dry run listed only this file). `stamp_response_actor()` stamps `updated_by` on insert. Before, it was stamped on update only, so a first answer recorded no actor.
- [x] `removeEvidence`: once the row is deleted, a failed file removal is logged with `console.warn` and does not throw.
- [x] `useAssessment`: the scope query uses `retry: false`. Also, when ensure fails, the once-guard resets, so a manual refetch (retry button) calls ensure again instead of falling back to the no-cycle state.
- [x] Org A reset on staging. The old submitted assessment was deleted (1 response, 1 history row, 1 review, no evidences or files), then the seed ran again. Org A now has a draft assessment, 0 responses, 0 evidences, evaluator1 assigned, no deadline extension.

## Flags for later steps

- The deployed edge functions predate the shared CORS module and the invites. `create-user` was deployed in Step 4 and `approve-organization` before Step 6, so both are current on staging.

## Not finished

- Auth Redirect URLs: the owner adds `https://tamkeen-git-staging-jouds-projects-5d6dfce8.vercel.app/set-password` in the dashboard.
