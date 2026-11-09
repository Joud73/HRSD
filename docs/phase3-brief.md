# Phase 3 brief: organization journey on the database

Read CLAUDE.md first. This brief wins where it conflicts. Work on branch `feat/org-journey`. Never push to `main`. Commit at the end of every step with the message given. Typecheck (`npx tsc --noEmit -p tsconfig.app.json`) and `npm run lint` must not gain problems; fix what you introduce before committing. Keep a log at `docs/phase3-log.md`: ticked steps, decisions, what you could not finish and why. If your context is compacted, re-read this brief and the log and continue from the first unticked step.

All Arabic copy goes in `src/lib/strings/*.ts` (never hardcoded in components). Formal, short, active. Buttons name the result. No em dashes anywhere. Western digits through `formatNumber()`. Logical RTL utilities only. Business logic follows the services layer pattern already used by `cycleService.ts` and `organizationService.ts`: service (typed, maps DB errors to Arabic `ServiceError`), React Query hook, page.

## What already exists (do not rebuild)

- Migrations 1 to 5: tool (CTS v0.2.1, approved, immutable), cycles, assessments, `assessment_reviews`, status history, `item_responses`, `evidences`, private bucket `evidences`, RLS and triggers, `transition_assessment()`, `ensure_my_assessment()`, organization profile, delegates, evaluator profiles.
- Migrations 6, 7 and 8 (new, written and verified on a local Postgres replay of all 9 migrations): role `supervisor`, `cycle_item_exclusions`, supervisor policies, org update policy, the scoring views `v_item_scores`, `v_indicator_scores`, `v_track_scores`, `v_assessment_progress`, then migration 8 with the decisions of verification meeting 1: official lookups (39 centers, 18 sub-classifications), result labels of the reference tool in `level_labels`, `assessments.submission_due` (per-organization deadline extension), supervisor proxy entry, `ensure_assessment_for(org)`. Read migrations 7 and 8 before writing any code; the views are the only place scores are defined.
- Scoring rule (approved by HRSD): an item counts only when `is_met` AND it has at least one evidence. Indicator `score_pct` = counted / active items. Level from `level_bands` (0, 1 to 60, 61 to 99, 100 → 0, 1, 2, 4). Indicators carry equal weight. Track and assessment score = average level. `progress_pct` counts items marked met regardless of evidence. Excluded items (per cycle) are out of the form and out of every denominator.
- Result labels (use `level_label` from the views, never hardcode): 0 غير مكتمل، 1 بحاجة لتحسين كبير، 2 بحاجة لتحسين بسيط، 4 مكتمل. These match the reference tool (tamkeen-cts.com) that tomorrow's meeting compares against.
- Roles in Release 1: `admin` مدير النظام (users and privileges, assessment journey incl. evaluator assignment and deadlines, cycle item selection), `supervisor` المشرف الفني (follows all organizations, enters the self-assessment and evidences on behalf of an organization without connectivity, edits evidences, submits for it; cannot assign evaluators, cannot record verdicts), `evaluator` مدقق, `organization` منظمة (the delegate المفوض). Legacy values `user` and `individual` stay in the enum and are ignored by the UI.
- Effective deadline of an assessment = `coalesce(assessments.submission_due, cycle.submission_end)`. Use it everywhere a deadline is shown or checked.

## Step 1: database on staging, types, baseline commit

1. Commit the uncommitted work first: `git add -A && git commit -m "feat(org): organization profile, registration approval, account invitations"`. Then `git checkout -b feat/org-journey`.
2. `npx supabase db push` (project is linked to `tamkeen - staging`). Confirm migrations `20261028100000_role_supervisor`, `20261028100100_phase3_org_journey` and `20261028120000_mom1_decisions` applied. Check: `select count(*) from social_dev_centers` = 39, `select count(*) from sub_classifications` = 18.
3. In the staging SQL editor check the open cycle: `select name, status, submission_start, submission_end from assessment_cycles where status = 'open'`. If there is none, or its submission period does not include 2026-10-28, insert one: name `دورة التقييم التجريبية 2026`, tool `md5('cts-v0.2.1')::uuid`, status `open`, submission 2026-10-18 to 2026-11-12, review 2026-11-12 to 2026-11-26, approval 2026-11-26 to 2026-12-01. If an open cycle exists with other dates, update its dates to those.
4. Test accounts: make sure the six users in `supabase/seed/test_accounts.sql` exist in Authentication (add `supervisor.test@tamkeen.local`), run the seed, then run `supabase/checks/scoring_checks.sql` and paste its three result sets into the log. Expected values are in the file.
5. `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`. Views appear under `Views`; `app_role` now includes `supervisor`.
6. Set the edge function secrets if missing: `npx supabase secrets set SITE_URL=<staging url> ALLOWED_ORIGINS=<staging url>,http://localhost:8080`.

Commit: `chore(db): phase 3 migrations on staging, regenerated types`.

## Step 2: data layer (`services/assessmentService.ts`, `hooks/useAssessment.ts`)

One service file, one hook file. Types come from `Tables<...>` and `Database["public"]["Views"]`.

Service functions (all throw `ServiceError` with Arabic messages added to `src/lib/strings/assessment.ts`):

- `ensureMyAssessment(): Promise<Assessment>` → `rpc("ensure_my_assessment")`. Errors: no organization, no open cycle in its submission period.
- `ensureAssessmentFor(orgId): Promise<Assessment>` → `rpc("ensure_assessment_for", { p_org })` (supervisor and admin, proxy mode).
- `getAssessment(scope)`, where `scope` is `{ kind: "mine" }` or `{ kind: "org", orgId }` → the assessment in the open cycle with `status`, `submitted_at`, `returned_at`, `return_note`, `submission_due`, cycle name, `submission_end`, and `deadline` = `submission_due ?? submission_end`. The whole page works from an assessment id, so the same components serve the organization and the supervisor's proxy mode.
- `listMyAssessmentHistory()` → every assessment of the organization across cycles (cycle name, status, `approved_at`) joined to `v_assessment_progress` (`score_pct`, `avg_level`). Used for the results-by-year panel (MoM point 10).
- `isEditable(assessment, cycle)` (pure): `cycle.status === "open"` and today between `submission_start` and `deadline` and status in `draft | returned`. Mirror of `assessment_editable_by_org()`; the database remains the authority.
- `listResponses(assessmentId): Promise<Map<itemId, { isMet, orgNote }>>`.
- `setItemMet(assessmentId, itemId, isMet, orgNote?)` → upsert on `item_responses` (conflict `assessment_id,item_id`).
- `listEvidences(assessmentId): Promise<Evidence[]>` (id, itemId, kind, fileName, url, storagePath, sizeBytes, uploadedAt).
- `addFileEvidence(assessmentId, itemId, file)` → validate client-side (max 20 MB, MIME in the bucket list: pdf, png, jpeg, doc, docx, xls, xlsx), upload to `evidences` bucket at `${assessmentId}/${itemId}/${crypto.randomUUID()}.${ext}` (never the original file name in the path), then insert the row (`kind: "file"`, `storage_path`, `file_name`, `mime_type`, `size_bytes`, `uploaded_by` = session user). If the insert fails, remove the uploaded object.
- `addLinkEvidence(assessmentId, itemId, url, label?)` → validate `https?://`, insert `kind: "link"`.
- `removeEvidence(evidence)` → delete row, then the storage object when `kind === "file"`.
- `getEvidenceUrl(evidence)` → signed URL, 10 minutes, for files; the `url` for links.
- `submitAssessment(assessmentId)` → `rpc("transition_assessment", { p_assessment, p_to: "submitted" })`.
- `getIndicatorScores(assessmentId)` → `v_indicator_scores`; `getTrackScores(assessmentId)` → `v_track_scores`; `getProgress(assessmentId)` → `v_assessment_progress` (single row).
- `listExcludedItemIds(cycleId): Promise<Set<string>>` → `cycle_item_exclusions`.

Error mapping (`PostgrestError` text contains): `No open cycle` → period closed; `not linked to an organization`; `42501` / `row-level security` → not editable now; `Item is excluded`; storage `Payload too large` / mime → file errors; `not allowed for this user at this time` → cannot submit now.

Hooks (React Query, keys under `["assessment", assessmentId, ...]`): `useAssessment(scope)` (for `mine`, calls `ensureMyAssessment` once when none exists; for `org`, calls `ensureAssessmentFor` once; returns the row + cycle + `deadline` + `editable`), `useAssessmentHistory()`, `useResponses`, `useEvidences`, `useIndicatorScores`, `useTrackScores`, `useProgress`, `useExcludedItems`, and mutations `useSetItemMet` (optimistic update of the responses map, rollback on error), `useAddFileEvidence`, `useAddLinkEvidence`, `useRemoveEvidence`, `useSubmitAssessment`. Every mutation invalidates `["assessment", assessmentId]` so scores and progress refresh.

Commit: `feat(assessment): service and hooks for responses, evidences, scores, submit`.

## Step 3: organization pages on the database

### 3.1 Route and data source
- New route `/assessment/:trackNumber` (1 to 5) inside the organization shell. Keep `/technical-indicators/:courseSlug` as a redirect: altawajuh→1, alfariq→2, alsharakat→3, albaramij→4, altaathir→5.
- The page reads the tool from `useApprovedTool()` (tracks → standards → indicators → items) and the assessment from `useAssessment({ kind: "mine" })`. Build the page as `AssessmentWorkspace` taking a `scope` prop, so Step 4 mounts it for the supervisor with `{ kind: "org", orgId }`. Items in `useExcludedItems` are not rendered and not counted.
- Delete `src/components/assessment/indicatorsData.ts` and every import of it. Delete the localStorage code, improvement tasks, team members, `TaskDialog`, `ImprovementPlanPanel`, and `NotesPanel` from the organization page (improvement plans are issued from results in Phase 4). Keep `IndicatorNav`, `EvidencePanel` (adapted), the two-pane layout, the motion rules and the design tokens. Remove `TRACK_SLUG` and `readEvidence` from `Dashboard.tsx`.

### 3.2 Self-assessment page behaviour
- Header: track name, standard count, indicator count, cycle name and the effective deadline with days remaining ("متبقٍ 15 يوماً على انتهاء فترة التقييم الذاتي"; warning tone under 7 days; MoM point 7), assessment `StatusBadge` (map `draft`→in_progress, `submitted`/`under_review`→submitted, `returned`→returned, `approved`→approved; `draft` with zero responses → not_started).
- Indicator list (start side): per indicator show `items_counted / items_total` from `v_indicator_scores`, state from `is_started` / `is_complete`.
- Indicator detail (end side): for each active item a checkbox (`is_met`), optional note (`org_note`, saved on blur), an evidence row: list of this item's evidences (file name or link host, date, open via signed URL, delete), buttons "إرفاق ملف" and "إضافة رابط" (a small dialog with URL field). Show the rule inline once per indicator: "يُحتسب البند عند تحديده وإرفاق شاهد له" (add to strings).
- Every checkbox change saves immediately (mutation, optimistic). A small "تم الحفظ" stamp with the time of the last successful save sits in the page header; while a mutation is pending show "جارٍ الحفظ".
- Indicator result block: `score_pct`, `level_label`, and the band from `levelBands`, computed from the view (no client formula). Replace `calculateIndicatorResult` and `RESULT` entirely.
- Read-only mode when `editable` is false: all inputs disabled, a banner at the top explaining why (period closed, or status). When status is `returned`, the banner shows `return_note` and the inputs are enabled.
- Primary action in the header on every assessment page and on the dashboard: "إرسال التقييم للمراجعة", opening the submit dialog (3.3). Disabled with a tooltip when not editable.

### 3.3 Submit dialog
- Content: progress summary from `v_assessment_progress` (items met, items with evidence, indicators complete of total), the list of indicators that are started but have items marked met without evidence (warning, not blocking), and a confirmation sentence that answers are frozen after submission.
- Confirm → `useSubmitAssessment` → on success toast and navigate to `/under-review`.
- `/under-review` reads the real assessment: status badge from DB, `submitted_at`, cycle name, and a link back to the dashboard. Handle `returned` (show note, button "استكمال التقييم" → dashboard) and `approved`.

### 3.4 Dashboard (`/dashboard`)
- KPIs from `v_assessment_progress`: البنود المحققة (`items_met` of `items_total`), الشواهد المرفقة (count of evidences), المؤشرات المكتملة (`indicators_complete` of `indicators_total`), نسبة الإنجاز (`progress_pct`). Second line in the status row: النتيجة الحالية `score_pct` and `avg_level` with the label "تقديرية حتى اعتماد المراجعة".
- Track rows from `v_track_scores`: `items_met / items_total`, progress bar on `progress_pct`, status not_started / in_progress / complete, link to `/assessment/:trackNumber`.
- Status summary: assessment status badge, cycle name, effective deadline with days remaining, and the submit button (3.3). When no open cycle: empty state "لا توجد دورة تقييم مفتوحة حالياً" and no continue button.
- Results by year (MoM point 10): a panel "النتائج حسب الدورة" from `useAssessmentHistory()`: one row per cycle with cycle name, status, and the score. For the delegate the result is the score only (MoM point 15): `score_pct` and `level_label` of the overall average, no evaluator notes. Current, unapproved cycle shows the score marked "تقديرية".
- Journey stepper at the top of the dashboard, always visible so the full cycle is clear: التقييم الذاتي ← إرسال للمراجعة ← المراجعة والتدقيق ← اعتماد النتائج ← خطة التحسين. The current step comes from `assessments.status`. Reuse `JourneyStepper`.

Commit: `feat(org): self-assessment, evidences and submission on the database`.

## Step 4: the four roles active (المشرف الفني added, admin journey controls)

- `src/lib/roles.ts`: add `supervisor` to `AppRole`, default route `/supervisor`, accept it in `fetchUserRole`.
- `navigation.ts` / `AppShell` / `copy.shell_context`, `shell_user`: supervisor shell with sidebar: لوحة المتابعة (`/supervisor`), المنظمات (`/supervisor/organizations`).
- `SupervisorDashboard`: KPIs from `getReportSummary()` plus assessments by status.
- `SupervisorOrganizations`: the `listOrganizations()` table with assessment status, `progress_pct` from `v_assessment_progress`, deadline, assigned evaluator (read-only). Row action "إدخال التقييم نيابة عن المنظمة" opens `/supervisor/organizations/:orgId/assessment/:trackNumber`, which mounts `AssessmentWorkspace` with `{ kind: "org", orgId }` and shows a persistent banner "أنت تُدخل التقييم نيابة عن: {اسم المنظمة}". Submit works the same way (the database allows it for the supervisor).
- Admin, evaluator assignment (MoM point 12, assignment is the admin's): in `AdminAssociationDetail`, a select of active evaluators that upserts `assessment_reviews` for the organization's assessment in the open cycle (`assignEvaluator(assessmentId, evaluatorId)` in `evaluatorService.ts`; call `ensureAssessmentFor` first when the organization has none).
- Admin, deadline extension (MoM point 7): in the same page, a date field "تمديد مهلة التقييم الذاتي" writing `assessments.submission_due` (must be on or after the cycle's `submission_start`); shows the effective deadline.
- `AdminUsers`: role options with Arabic labels مدير النظام / المشرف الفني / مدقق / منظمة. `supabase/functions/create-user`: add `supervisor` to `validRoles`; deploy with `npx supabase functions deploy create-user`.
- `AdminRoles` reference page: four rows with the responsibilities listed under "Roles in Release 1" above.

Commit: `feat(roles): technical supervisor with proxy entry, admin assignment and deadline extension`.

## Step 5: admin item exclusions per cycle

- MoM point 8: the admin selects tracks, standards and indicators per annual plan. In `AdminEvaluationYearDetail` add a tab "نطاق التقييم في الدورة": the rubric tree (reuse `RubricTree`) with a tri-state checkbox at every level (track, standard, indicator, item). Unchecking a parent excludes all its items in one batch insert; checking includes them in one batch delete. Checked = included. Unchecking inserts into `cycle_item_exclusions` (with an optional reason dialog), checking deletes the row. Show the live count "البنود الفعّالة في الدورة: N من 378". Editing allowed while the cycle is draft or open; otherwise read-only with a note. Service functions in `cycleService.ts`: `listExclusions(cycleId)`, `excludeItem(cycleId, itemId, reason)`, `includeItem(cycleId, itemId)`.
- `AdminRubric` stays read-only (the tool text is immutable; the ministry asked for selection, not editing).

Commit: `feat(admin): per-cycle item selection`.

## Step 6: data fields check (requested by HRSD)

Confirm every form shows exactly these fields, in this order, with the same Arabic labels, and fix any gap:

- نوع الكيان: جمعية أهلية / مؤسسة أهلية (`entity_type`).
- بيانات المنظمة: رقم التسجيل، تاريخ التسجيل، اسم المنظمة، التصنيف الفرعي (`sub_classifications`)، مركز التنمية الاجتماعية (`social_dev_centers`)، المنطقة، المدينة أو المحافظة، المركز أو الحي، العنوان، عدد العاملين بالمنظمة، البريد الإلكتروني، الموقع الإلكتروني.
- بيانات المفوض: رقم الهوية، الاسم، الجوال، البريد الإلكتروني (`delegates`).
- بيانات المقيم: رقم الهوية، الاسم، الجوال، البريد الإلكتروني، جهة العمل (`evaluator_profiles`).

Forms: `Register` (org + delegate), `AdminAssociationDetail` edit (org + delegate), `AdminOrganizationRequests` detail (all request fields visible before approval), `AdminReviewers` create/edit (add id_number, mobile, employer; today it only has name and email), `EvaluatorProfile` (evaluator edits own contact fields and employer), organization `Settings` (org data read with non-identity fields editable, delegate editable). Lookups are the official ones from ملف التصنيفات (migration 8). Order sub-classifications by `sort_order` and centers by `code`. When a center is chosen, prefill المنطقة from `social_dev_centers.region` (editable).

Commit: `fix(forms): HRSD data fields for organization, delegate and evaluator`.

## Step 7: verification and demo rehearsal (staging)

1. `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run build`.
2. As `org.a@tamkeen.local`: open `/dashboard` (assessment created automatically), open track 1, mark 3 items in indicator 1 and attach a PDF to two of them and a link to one, refresh the page (state persists), check the indicator shows 3/7 and 43 % متحقق جزئياً, dashboard shows the same numbers.
3. Bulk-fill the rest for the demo in the SQL editor (as postgres): mark all items of tracks 1 and 2 met with a link evidence each, leave tracks 3 to 5 partially done (use the pattern in `scoring_checks.sql`). Dashboard must show tracks 1 and 2 complete, level 4.
4. Submit as org A: dialog warns about items without evidence, confirm, land on `/under-review` with the real status; `assessment_status_history` has the row; the page is read-only afterwards.
5. As `org.b@tamkeen.local`: cannot see org A's numbers (dashboard shows its own empty assessment).
6. As `supervisor.test@tamkeen.local`: sees both organizations with statuses and progress; opens org B in proxy mode, marks one item with a link evidence, and org B's dashboard shows it.
7. As admin: exclude one item from the open cycle, confirm org A's form no longer shows it and its indicator denominator drops by one.
8. Write the demo path for 13:00 Thursday into the log: login org A → dashboard (journey stepper, deadline, results by cycle) → track 1 → tick + evidence → indicator label changes from غير مكتمل to بحاجة لتحسين كبير → submit → under review → supervisor proxy entry for org B → admin cycle scope selection and deadline extension.

Commit: `test: phase 3 rehearsal on staging`. Then `git push origin feat/org-journey` and open a PR to `staging`.
