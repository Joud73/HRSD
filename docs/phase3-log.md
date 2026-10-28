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

- The deployed edge functions predate the shared CORS module and the invites. `create-user` is deployed in Step 4. `approve-organization` also needs `npx supabase functions deploy approve-organization` before approving a request on staging.

## Not finished

- Auth Redirect URLs: the owner adds `https://tamkeen-git-staging-jouds-projects-5d6dfce8.vercel.app/set-password` in the dashboard.
