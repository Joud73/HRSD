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
- [ ] 1.6 Secrets: `SITE_URL` and `ALLOWED_ORIGINS` are not set on staging. The staging frontend URL is not recorded anywhere in the repo, so it needs the owner. Until they are set, `create-user` and `approve-organization` reject every browser call.

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

## Decisions

- `ensureMyAssessment` and `ensureAssessmentFor` return the full `Assessment` (with cycle and deadline): after the RPC they read the row by id. The page then has one type in every case.
- `useAssessment` treats "no open cycle in its submission period" as `null`, not an error, so the dashboard can show its empty state. It tries to open the assessment only once per scope while mounted.
- `useExcludedItems(cycleId)` is keyed `["cycles", cycleId, "exclusions"]` and not under `["assessment", id]`: exclusions belong to the cycle, and Step 5's admin mutations invalidate `["cycles"]`.
- The scope lookups are keyed `["assessment", "scope", ...]`, apart from `["assessment", id]`, because the id is unknown until they resolve. Submission invalidates the scope lookups and the history as well.
- In error mapping, the text checks run before the `42501` check, because `transition_assessment` and `ensure_my_assessment` raise with `insufficient_privilege` (42501) but need their own messages.
- The supervisor test account was created through the Auth admin API instead of the dashboard. It got a generated password because no shared test password is recorded in the repo.

## Flags for later steps

- Staging state before Step 7: org A's assessment in the open cycle is already `submitted` (1 item met), left over from earlier testing. Step 7.2 needs it editable. Reset it before the rehearsal: `transition_assessment` has no submitted → draft path, so either an admin override to `returned` with a note, or delete org A's assessment so `/dashboard` opens a fresh one.

## Not finished

- 1.6 `SITE_URL` / `ALLOWED_ORIGINS` secrets: waiting for the staging frontend URL.
