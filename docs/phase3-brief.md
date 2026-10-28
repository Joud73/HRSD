# Phase 3 brief: organization journey on the database

Read CLAUDE.md first. This brief wins where it conflicts. Work on branch `feat/org-journey`. Never push to `main`. Commit at the end of every step with the message given. Typecheck (`npx tsc --noEmit -p tsconfig.app.json`) and `npm run lint` must not gain problems; fix what you introduce before committing. Keep a log at `docs/phase3-log.md`: ticked steps, decisions, what you could not finish and why. If your context is compacted, re-read this brief and the log and continue from the first unticked step.

All Arabic copy goes in `src/lib/strings/*.ts` (never hardcoded in components). Formal, short, active. Buttons name the result. No em dashes anywhere. Western digits through `formatNumber()`. Logical RTL utilities only. Business logic follows the services layer pattern already used by `cycleService.ts` and `organizationService.ts`: service (typed, maps DB errors to Arabic `ServiceError`), React Query hook, page.

## What already exists (do not rebuild)

- Migrations 1 to 5: tool (CTS v0.2.1, approved, immutable), cycles, assessments, `assessment_reviews`, status history, `item_responses`, `evidences`, private bucket `evidences`, RLS and triggers, `transition_assessment()`, `ensure_my_assessment()`, organization profile, delegates, evaluator profiles.
- Migrations 6 and 7 (new, already written and verified on a local Postgres): role `supervisor`, provisional lookups, `cycle_item_exclusions`, supervisor policies, org update policy, and the scoring views `v_item_scores`, `v_indicator_scores`, `v_track_scores`, `v_assessment_progress`. Read migration 7 before writing any code; the views are the only place scores are defined.
- Scoring rule (approved by HRSD): an item counts only when `is_met` AND it has at least one evidence. Indicator `score_pct` = counted / active items. Level from `level_bands` (0, 1 to 60, 61 to 99, 100 → 0, 1, 2, 4). Track and assessment score = average level. `progress_pct` counts items marked met regardless of evidence. Excluded items (per cycle) are out of the form and out of every denominator.

## Step 1: database on staging, types, baseline commit

1. Commit the uncommitted work first: `git add -A && git commit -m "feat(org): organization profile, registration approval, account invitations"`. Then `git checkout -b feat/org-journey`.
2. `npx supabase db push` (project is linked to `tamkeen - staging`). Confirm migrations `20261028100000_role_supervisor` and `20261028100100_phase3_org_journey` applied.
3. In the staging SQL editor check the open cycle: `select name, status, submission_start, submission_end from assessment_cycles where status = 'open'`. If there is none, or its submission period does not include 2026-10-28, insert one: name `دورة التقييم التجريبية 2026`, tool `md5('cts-v0.2.1')::uuid`, status `open`, submission 2026-10-18 to 2026-11-12, review 2026-11-12 to 2026-11-26, approval 2026-11-26 to 2026-12-01. If an open cycle exists with other dates, update its dates to those.
4. Test accounts: make sure the six users in `supabase/seed/test_accounts.sql` exist in Authentication (add `supervisor.test@tamkeen.local`), run the seed, then run `supabase/checks/scoring_checks.sql` and paste its three result sets into the log. Expected values are in the file.
5. `npx supabase gen types typescript --linked > src/integrations/supabase/types.ts`. Views appear under `Views`; `app_role` now includes `supervisor`.
6. Set the edge function secrets if missing: `npx supabase secrets set SITE_URL=<staging url> ALLOWED_ORIGINS=<staging url>,http://localhost:8080`.

Commit: `chore(db): phase 3 migrations on staging, regenerated types`.

## Step 2: data layer (`services/assessmentService.ts`, `hooks/useAssessment.ts`)

One service file, one hook file. Types come from `Tables<...>` and `Database["public"]["Views"]`.

Service functions (all throw `ServiceError` with Arabic messages added to `src/lib/strings/assessment.ts`):

- `ensureMyAssessment(): Promise<Assessment>` → `rpc("ensure_my_assessment")`. Errors: no organization, no open cycle in its submission period.
- `getMyAssessment(): Promise<Assessment | null>` → the organization's assessment in the open cycle (`assessments` joined to open cycle), with `status`, `submitted_at`, `returned_at`, `return_note`, cycle name and `submission_end`.
- `isEditable(assessment, cycle)` (pure): `cycle.status === "open"` and today within submission period and status in `draft | returned`. Mirror of `assessment_editable_by_org()`; the database remains the authority.
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

Hooks (React Query, keys under `["assessment", assessmentId, ...]`): `useMyAssessment()` (calls `ensureMyAssessment` once when the user role is organization and `getMyAssessment` returns null, then returns the row + cycle + `editable`), `useResponses`, `useEvidences`, `useIndicatorScores`, `useTrackScores`, `useProgress`, `useExcludedItems`, and mutations `useSetItemMet` (optimistic update of the responses map, rollback on error), `useAddFileEvidence`, `useAddLinkEvidence`, `useRemoveEvidence`, `useSubmitAssessment`. Every mutation invalidates `["assessment", assessmentId]` so scores and progress refresh.

Commit: `feat(assessment): service and hooks for responses, evidences, scores, submit`.

## Step 3: organization pages on the database

### 3.1 Route and data source
- New route `/assessment/:trackNumber` (1 to 5) inside the organization shell. Keep `/technical-indicators/:courseSlug` as a redirect: altawajuh→1, alfariq→2, alsharakat→3, albaramij→4, altaathir→5.
- The page reads the tool from `useApprovedTool()` (tracks → standards → indicators → items) and the assessment from `useMyAssessment()`. Items in `useExcludedItems` are not rendered and not counted.
- Delete `src/components/assessment/indicatorsData.ts` and every import of it. Delete the localStorage code, improvement tasks, team members, `TaskDialog`, `ImprovementPlanPanel`, and `NotesPanel` from the organization page (improvement plans are issued from results in Phase 4). Keep `IndicatorNav`, `EvidencePanel` (adapted), the two-pane layout, the motion rules and the design tokens. Remove `TRACK_SLUG` and `readEvidence` from `Dashboard.tsx`.

### 3.2 Self-assessment page behaviour
- Header: track name, standard count, indicator count, cycle name and submission deadline, assessment `StatusBadge` (map `draft`→in_progress, `submitted`/`under_review`→submitted, `returned`→returned, `approved`→approved; `draft` with zero responses → not_started).
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
- Status summary: assessment status badge, cycle name, deadline (`submission_end`), and the submit button (3.3). When no open cycle: empty state "لا توجد دورة تقييم مفتوحة حالياً" and no continue button.

Commit: `feat(org): self-assessment, evidences and submission on the database`.

## Step 4: supervisor role in the app (مشرف المراجعة)

- `src/lib/roles.ts`: add `supervisor` to `AppRole`, default route `/supervisor`, accept it in `fetchUserRole`.
- `navigation.ts` / `AppShell` / `copy.shell_context`, `shell_user`: supervisor shell with sidebar: لوحة المتابعة (`/supervisor`), المنظمات (`/supervisor/organizations`), المدققون (`/supervisor/evaluators`).
- Pages: `SupervisorDashboard` (KPIs from `getReportSummary()` plus assessments by status), `SupervisorOrganizations` (reuse the `listOrganizations()` table from `AdminAssociations`, read-only, with assessment status, progress from `v_assessment_progress`, assigned evaluator), `SupervisorEvaluators` (reuse the evaluators list, read-only). No assignment UI yet (Phase 4), but the service for it should exist: `assignEvaluator(assessmentId, evaluatorId)` upsert on `assessment_reviews` in `evaluatorService.ts`.
- `AdminUsers`: role options admin / supervisor / evaluator / organization with Arabic labels (مدير النظام, مشرف المراجعة, مدقق, منظمة). `supabase/functions/create-user`: add `supervisor` to `validRoles`; deploy with `npx supabase functions deploy create-user`.
- `AdminRoles` reference page: add the supervisor row (reads all assessments, evidences and history across organizations; assigns evaluators; cannot edit answers or verdicts).

Commit: `feat(roles): review supervisor role, shell and pages`.

## Step 5: admin item exclusions per cycle

- In `AdminEvaluationYearDetail` add a tab "بنود الدورة": the rubric tree (reuse `RubricTree`) with a checkbox per item, checked = included. Unchecking inserts into `cycle_item_exclusions` (with an optional reason dialog), checking deletes the row. Show the live count "البنود الفعّالة في الدورة: N من 378". Editing allowed while the cycle is draft or open; otherwise read-only with a note. Service functions in `cycleService.ts`: `listExclusions(cycleId)`, `excludeItem(cycleId, itemId, reason)`, `includeItem(cycleId, itemId)`.
- `AdminRubric` stays read-only (the tool text is immutable; the ministry asked for selection, not editing).

Commit: `feat(admin): per-cycle item selection`.

## Step 6: data fields check (requested by HRSD)

Confirm every form shows exactly these fields, in this order, with the same Arabic labels, and fix any gap:

- نوع الكيان: جمعية أهلية / مؤسسة أهلية (`entity_type`).
- بيانات المنظمة: رقم التسجيل، تاريخ التسجيل، اسم المنظمة، التصنيف الفرعي (`sub_classifications`)، مركز التنمية الاجتماعية (`social_dev_centers`)، المنطقة، المدينة أو المحافظة، المركز أو الحي، العنوان، عدد العاملين بالمنظمة، البريد الإلكتروني، الموقع الإلكتروني.
- بيانات المفوض: رقم الهوية، الاسم، الجوال، البريد الإلكتروني (`delegates`).
- بيانات المقيم: رقم الهوية، الاسم، الجوال، البريد الإلكتروني، جهة العمل (`evaluator_profiles`).

Forms: `Register` (org + delegate), `AdminAssociationDetail` edit (org + delegate), `AdminOrganizationRequests` detail (all request fields visible before approval), `AdminReviewers` create/edit (add id_number, mobile, employer; today it only has name and email), `EvaluatorProfile` (evaluator edits own contact fields and employer), organization `Settings` (org data read with non-identity fields editable, delegate editable). The lookups are provisional (`TMP-` codes) until the ministry file arrives.

Commit: `fix(forms): HRSD data fields for organization, delegate and evaluator`.

## Step 7: verification and demo rehearsal (staging)

1. `npx tsc --noEmit -p tsconfig.app.json`, `npm run lint`, `npm run build`.
2. As `org.a@tamkeen.local`: open `/dashboard` (assessment created automatically), open track 1, mark 3 items in indicator 1 and attach a PDF to two of them and a link to one, refresh the page (state persists), check the indicator shows 3/7 and 43 % متحقق جزئياً, dashboard shows the same numbers.
3. Bulk-fill the rest for the demo in the SQL editor (as postgres): mark all items of tracks 1 and 2 met with a link evidence each, leave tracks 3 to 5 partially done (use the pattern in `scoring_checks.sql`). Dashboard must show tracks 1 and 2 complete, level 4.
4. Submit as org A: dialog warns about items without evidence, confirm, land on `/under-review` with the real status; `assessment_status_history` has the row; the page is read-only afterwards.
5. As `org.b@tamkeen.local`: cannot see org A's numbers (dashboard shows its own empty assessment).
6. As `supervisor.test@tamkeen.local`: sees both organizations with statuses and progress.
7. As admin: exclude one item from the open cycle, confirm org A's form no longer shows it and its indicator denominator drops by one.
8. Write the demo path for 13:00 Thursday into the log: login org A → dashboard → track 1 → tick + evidence → score → submit → under review → supervisor view → admin item selection.

Commit: `test: phase 3 rehearsal on staging`. Then `git push origin feat/org-journey` and open a PR to `staging`.
