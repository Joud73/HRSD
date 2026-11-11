# طموحي log

Brief: `docs/tamohi-brief.md`. Branch `feat/tamohi`.

## Step 1: database on staging and data layer

- [x] 1.1 Branch. PR #2 was still open on GitHub on 11 Nov (`merged: false`, `origin/staging` at the PR #1 merge b7ff015), so `feat/tamohi` starts from `feat/review-results` (860c859, PR #2's head: the content staging gets when PR #2 is merged). The tamohi PR shows PR #2's commits until then.
- [x] 1.2 `db push --dry-run` listed only `20261111100000_tamohi_catalog.sql`; pushed. `tamohi_catalog.sql`: 15 programs, 61 modules, 378 lessons, 173 hours. `supabase/seed/programs.sql` deleted (the seed removes the DEMO-T programs); references updated in `e2e/review.spec.ts` and the phase 4 demo path line (history lines in the phase 4 log/brief stay as written).
- [x] 1.3 Types regenerated: +902 lines, nothing removed (new tables `program_modules`, `program_lessons`, `program_enrollments`, `lesson_progress`, views `v_program_catalog`, `v_program_lesson_gaps`, `v_enrollment_progress`, `v_program_recommendations` with `gap_lessons`, `lessons_total`, `priority`, `rank`; `programs` gains `subtitle`, `audience`, `outcomes`, `standard_id`).
- [x] 1.4 Checks on staging (below): `tamohi_checks.sql` 13 PASS, `review_checks.sql` 25 PASS.
- [x] 1.5 `reset-demo.mjs` deletes org A's and org B's `program_enrollments` (lesson progress cascades) and prints the count.
- [x] 1.6 `src/services/tamohiService.ts`, `src/hooks/useTamohi.ts`.
- [x] 1.7 `src/lib/strings/tamohi.ts`, re-exported as `tamohiCopy`.

### Decisions (Step 1)
- Keys: `["tamohi", "catalog" | "program" | "issued" | "recommendations" | "readiness" | "gaps" | "indicator-results" | "enrollments" | "progress", ...]`. Catalog and program detail cached 30 minutes (they change only with a new tool version).
- `useIssuedAssessment` and `useMyEnrollments` run for the organization role only; other roles get the plain catalog without extra requests.
- `enroll` reads `current_org_id()` and inserts; the database forces status `enrolled` and the stamps. `withdraw` reports "لا يمكن الانسحاب بعد بدء البرنامج." when the policy deletes 0 rows. `setLessonDone` ignores a duplicate insert (same outcome).
- Lesson toggles are optimistic on both the progress set and the enrollment counts/status, rolled back on error; every mutation invalidates enrollments and progress.
- Errors: `mapTamohiError` (duplicate → already enrolled; RLS/permission and the status guard → not allowed; else the caller's fallback).
- Working tree: uncommitted owner changes (logo files, AppHeader, Footer, AppShell, DocumentView, Certificate, favicons, CLAUDE.md, copy.ts footer/logo strings) are left untouched and out of these commits; only the tamohi re-export line of `copy.ts` is staged.

### Checks: `tamohi_checks.sql` on staging (13 PASS, 0 FAIL)
| n | who | action | expected | actual | result |
|---|---|---|---|---|---|
| 1 | org B | select v_program_catalog | 15 programs, 378 lessons | 15, 378 | PASS |
| 2 | org B | recommendations from issued results | 13, rank 1 at level 0 | 13, rank 1 TMH-11 level 0 | PASS |
| 3 | org B | TMH-01 gap lessons | 7 of 38 | 7 of 38 | PASS |
| 4 | org B | enroll in TMH-01 with status completed | enrolled | enrolled | PASS |
| 5 | org B | record first lesson | in_progress, 1 done | in_progress, 1 done | PASS |
| 6 | org B | update enrollment status by hand | 0 rows, still in_progress | 0 rows, in_progress | PASS |
| 7 | org B | progress on a lesson of another program | error | new row violates row-level security policy for table "lesson_progress" | PASS |
| 8 | org B | withdraw an in-progress enrollment | 0 rows | 0 rows | PASS |
| 9 | org B | record all lessons | completed, completed_at set | completed, true | PASS |
| 10 | org A | org B enrollments, recommendations, gaps | 0, 0, 0 | 0, 0, 0 | PASS |
| 11 | org A | enroll org B | error | new row violates row-level security policy for table "program_enrollments" | PASS |
| 12 | anon | select programs; program_lessons | denied; denied | denied; denied | PASS |
| 13 | org B | recommendations and gaps while approved (not issued) | 0, 0 | 0, 0 | PASS |

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
| 42 | supervisor | issue_results wrong / right number | error; issued, number set | error; issued, ت.م.TEST-0001\|26.11.11, issued_at true | PASS |
| 43 | org A | select documents, lines, results after issuance | 2 docs, 756 lines, 61 results, review_pct 0 | 2 docs, 756 lines, 61 results, review_pct 0 | PASS |
| 44 | evaluator2 | select org A documents and results | 0, 0 | 0, 0 | PASS |
| 45 | admin / org A | program on indicator 1 (level 1) recommended | 1 | 1 | PASS |
| 46 | anon | select programs; select assessment_documents | denied; denied | denied; denied | PASS |
| 47 | supervisor | update document lines | 0 rows or error | 0 rows | PASS |
| 48 | org A | issue_results | error | Only the final sign-off issues results | PASS |
| 49 | supervisor | issue_results with a PDF outside the assessment folder | error: invalid entry | error | PASS |
| 50 | supervisor | upload canonical / other name while approved | allowed; refused | allowed; refused | PASS |
| 51 | supervisor | upload a PDF for an issued assessment | refused | refused | PASS |

`tsc` 0 errors; lint 6 problems (baseline).

## Not finished
