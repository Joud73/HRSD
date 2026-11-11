# طموحي brief: the learning catalog integrated with مركز التمكين

Read CLAUDE.md, `.claude/skills/frontend-design/SKILL.md` and `docs/phase4-brief.md` (conventions) first. Work on branch `feat/tamohi` created from the updated `staging` (after PR #2 is merged). Never push to `main`. Commit at the end of every step with the message given. Typecheck and lint must not gain problems (baseline: 0 errors, 6 lint). Keep `docs/tamohi-log.md`: ticked steps, decisions, checks, screenshots list, what is not finished.

## What طموحي is

A learning catalog for nonprofit organizations, built on the approved measurement tool:

| Level | Count | Source |
|---|---|---|
| Program | 15 | one per standard (`programs.standard_id`) |
| Module | 61 | one per indicator (`program_modules.indicator_id`) |
| Lesson | 378 | one per verification item (`program_lessons.item_id`): title = the item text (what the organization has in place after the lesson), objective = the item's improvement action |

Because a lesson closes exactly one item, an organization with issued results sees which lessons close its own gaps (items the evaluator did not confirm). That item-level link is the product. Everything on screen serves it.

Access: signed-in users only (lessons quote the tool, which anonymous visitors cannot read). Organizations get personalisation from their latest **issued** assessment; admin, supervisor and evaluator see the catalog without it.

## Database (already written and tested; do not change the SQL)

- `supabase/migrations/20261111100000_tamohi_catalog.sql` (migration 14): program metadata (`subtitle`, `audience`, `outcomes text[]`, `standard_id`), `program_modules`, `program_lessons`, `program_enrollments`, `lesson_progress`, views `v_program_catalog`, `v_program_lesson_gaps`, `v_enrollment_progress`, and `v_program_recommendations` extended with `gap_lessons`, `lessons_total`, `priority` ('high' when the lowest indicator level is 0 or 1, else 'medium') and `rank` (1 = most urgent). Enrollment status is maintained by the database: first lesson done → `in_progress`, all lessons done → `completed`; organizations cannot set it, and can withdraw only while `enrolled`.
- `supabase/seed/tamohi_catalog.sql`: the 15 programs (texts for HRSD approval), 61 module titles, 378 lessons generated from the tool. Idempotent. Removes the `DEMO-T` programs.
- `supabase/checks/tamohi_checks.sql`: 13 cases (catalog, recommendations from issued results, gap lessons, enrollment rules, isolation between organizations, anon denied, nothing before issuance). Expected: 13 PASS.
- `supabase/checks/review_checks.sql`: case 46 updated (anon can no longer read the catalog). Expected: 25 PASS.

## Design direction

طموحي is a product of its own inside the platform. It follows the project skill (tokens, HRSDGov, restraint, motion only with meaning) and adds one thing the rest of the platform does not have: **the organization's own data as the visual centre**. It feels advanced because it is precise and responsive, not because it is decorated.

Rules on top of the skill:
- **Signature element:** the readiness map (hero, personalised): a ring of 5 equal arcs, one per track, each filled to that track's `review_pct` in its track colour, centre showing the overall review percentage. It animates once on load from 0 to its value (data reveal; static under reduced motion). Under it: "{gaps} بنداً لم يتحقق · {n} برنامجاً مقترحاً" and the primary action. When there are no issued results, the same position shows the catalog's real counts (15 / 61 / 378 / hours) as large numerals, no ring.
- **Track colours** (meaning, not decoration): add tokens in `src/index.css` and `tailwind.config.ts` as `track-1` … `track-5`, used for the track dot, the 4px start edge of program cards, ring arcs and curriculum accents only. HSL: 1 التوجه `152 45% 32%`, 2 الفريق `214 52% 40%`, 3 الشراكات `266 32% 46%`, 4 البرامج `340 40% 42%`, 5 التأثير `24 30% 36%`. Check AA for any text on white. Never teal or orange.
- **Motion:** filter results reorder with layout animation; module accordions animate height; the path timeline line draws once; lesson completion animates its check and the progress bar. Nothing animates on scroll by itself. All from `src/lib/motion.ts`, all disabled by `useReducedMotion`.
- **Typography:** large numerals (h1 size) only for the ring centre and the hero counts. Everything else at the normal scale.
- Write the 10-line design plan the skill asks for, per page, into the log before building each page.

## Step 1: database on staging and data layer

1. `git checkout staging && git pull && git checkout -b feat/tamohi`.
2. `npx.cmd supabase db push --dry-run`: must list only `20261111100000_tamohi_catalog.sql`. Push. Then run `supabase/seed/tamohi_catalog.sql` (expect 15 / 61 / 378 / 173 hours). Delete `supabase/seed/programs.sql` (superseded) and remove any reference to it.
3. `gen types` into `src/integrations/supabase/types.ts`.
4. Run `tamohi_checks.sql` (13 PASS) and `review_checks.sql` (25 PASS) on staging; paste both tables into the log.
5. `e2e/reset-demo.mjs`: also delete `program_enrollments` of org A and org B (lesson progress cascades), so every reset starts with no enrollments.
6. `src/services/tamohiService.ts` + `src/hooks/useTamohi.ts` (React Query, keys under `["tamohi", ...]`):
   - `listCatalog()` from `v_program_catalog` ordered by `sort_order`.
   - `getProgram(code)`: catalog row, modules (ordered), lessons (ordered), the program's indicators (via `program_indicators` + `indicators.text`).
   - `getMyIssuedAssessment()`: the organization's latest assessment with status `issued` (id, cycle name, issued_at) or null.
   - `listRecommendations(assessmentId)` from `v_program_recommendations` ordered by `rank`.
   - `getTrackReadiness(assessmentId)` from `v_assessment_results_tracks` and overall from `v_assessment_results_overall`.
   - `listLessonGaps(assessmentId, programId?)` from `v_program_lesson_gaps` → Set of gap lesson ids.
   - `listIndicatorResults(assessmentId, indicatorIds)` from `assessment_results` (review_level, review_label).
   - `listMyEnrollments()` from `v_enrollment_progress`; `enroll(programId, assessmentId)`; `withdraw(enrollmentId)`; `listLessonProgress(enrollmentId)`; `setLessonDone(enrollmentId, lessonId, done)` (insert or delete in `lesson_progress`). Optimistic updates for lesson toggles; every mutation invalidates enrollments and progress.
   - Arabic error mapping as in the other services.
7. Copy in `src/lib/strings/tamohi.ts` (re-export from `@/lib/copy`), formal and short. Delivery labels: online عن بعد, in_person حضوري, blended مدمج, self_paced ذاتي التعلم. Lesson kinds: practice تطبيق, template إعداد وثيقة, checkpoint تحقق واعتماد. Priority: high أولوية عالية, medium أولوية متوسطة. Enrollment: غير مسجل, مسجل, قيد التنفيذ, مكتمل.

Commit: `feat(tamohi): catalog schema on staging, content, data layer`.

## Step 2: shell, catalog, program page

### 2.1 Shell and routes
- `TamohiShell` (own layout, not the app sidebar): top bar with the wordmark "طموحي" and the line "منصة تأهيل المنظمات"; links الكتالوج, خطتي التطويرية (organization only); "العودة إلى مركز التمكين" to the user's home by role; the existing account menu. Footer one line: "طموحي، بالتكامل مع مركز التمكين. تطوير وتشغيل أكاديمية التعلم". Max width 1200.
- Routes, guard any signed-in role (`organization`, `admin`, `supervisor`, `evaluator`); signed out → login with return path: `/tamohi`, `/tamohi/programs/:code`, `/tamohi/my-path` (organization only; others redirect to `/tamohi`).

### 2.2 Catalog `/tamohi`
- Hero band on primary deep green, two columns at lg (stacked below): start column h1 "طموحي", one sentence "برامج تأهيل مبنية على أداة قياس الكفاءة الفنية، تقترح لمنظمتك ما يسد فجواتها بنداً بنداً."; end column the readiness map (organization with issued results) or the four real counts.
- "مقترح لمنظمتك" (organization with issued results only): the top 3 recommendations as wide cards: track dot and name, title, "يعالج {gap_lessons} بنداً لم يتحقق في تقييمكم", a thin bar gap/total, priority badge (high: warning tone; medium: neutral), enrollment state if any, link to the program.
- Catalog: sticky filter bar under the header: track segmented control (الكل + 5 with dots), delivery select, search by title (live, debounced 150 ms), and for organizations a switch "المقترح لمنظمتي فقط". Result count "{n} برنامجاً". Default order: organizations with results by rank then the rest by track; others by track.
- Program card: 4px start edge in the track colour, track name, code (muted, small), title (h3), subtitle (2-line clamp), meta line "{modules} وحدات · {lessons} درساً · {hours} ساعة · {delivery}". Personalised: priority badge and gap line. Enrolled: thin progress bar and status. Hover: border colour only. Whole card is one link; focus visible.
- Empty filter state: one sentence + "مسح التصفية".

### 2.3 Program page `/tamohi/programs/:code`
- Header (white band): breadcrumbs طموحي / {track}; chips track and standard; h1 title; subtitle; meta row; actions for organizations: "سجّل منظمتك في البرنامج" (primary, enrolls with the issued assessment id or null), or when enrolled a progress ring with "{done} من {total}" and "متابعة البرنامج" (scrolls to the first lesson not done, opens its module); "عرض خطتي التطويرية" (secondary). Non-organizations: no actions.
- Two columns at lg; side column sticky:
  - "لماذا يُقترح لمنظمتكم" (organization with issued results): the program's indicators with their review label chip (level colours as the plan: 0 danger, 1 warning, 2 accent, 4 success) and the sentence "{gap} من {total} بنداً لم يتحقق في تقييمكم". Without issued results: "تظهر هنا مواءمة البرنامج مع نتائج منظمتك بعد صدورها."
  - الفئة المستهدفة (audience), طريقة التقديم, المدة.
- Main column:
  - "ما ستحققه منظمتك": the outcomes as a checklist.
  - "محتوى البرنامج": vertical stepper of modules. Node = module number; title; summary (muted); meta "{lessons} دروس · {minutes} دقيقة"; gap chip "{n} لم يتحقق" when personalised; a progress fill along the stepper line when enrolled. Modules expand (multiple open). A toggle above the list: "إظهار ما لم يتحقق فقط" (personalised only).
  - Lesson row: kind icon and label, title, duration; gap lessons get a warning dot and "لم يتحقق في تقييمكم"; expanding a lesson shows "خطوات التطبيق" (objective) and "معيار الإنجاز" (title). Enrolled organizations get a checkbox "أنجزت هذا الناتج" that records progress (optimistic; toast only on error).
- Not found: one sentence + "العودة إلى الكتالوج".

Commit: `feat(tamohi): catalog and program pages`.

## Step 3: my path and the integration with مركز التمكين

### 3.1 خطتي التطويرية `/tamohi/my-path` (organization)
- No issued results: one sentence "تُبنى خطتك التطويرية بعد صدور نتائج التقييم." + "العودة إلى لوحة المنظمة".
- Header: h1 "خطتي التطويرية"; "مبنية على نتائج {cycle} الصادرة في {date}".
- Summary strip (no cards, one row of numbers with rules between): "البنود المعالجة {x} من {y}" (gap lessons completed / gap lessons across recommended programs), البرامج المقترحة, المسجلة, المكتملة; plus a progress ring for the first number.
- Timeline grouped "أولوية عالية" then "أولوية متوسطة", nodes in rank order: track dot, title, "يعالج {gap} بنداً", status and progress bar, action (سجّل / متابعة / عرض). The connecting line draws once on load.

### 3.2 Integration
- Organization results page (`/results`), البرامج المقترحة: show the top 3 by rank with "يعالج {gap_lessons} بنداً لم يتحقق", internal links (`url` is now `/tamohi/programs/{code}`; use `Link`, not an external anchor), and the action "افتح خطتي التطويرية" → `/tamohi/my-path`. Update `listRecommendedPrograms` order to `rank` and its type with the new columns.
- Organization sidebar: item "طموحي" (GraduationCap) → `/tamohi`.
- Update `e2e/review.spec.ts` where it expects DEMO programs: now the panel shows TMH programs (count = top 3, first = rank 1).

Commit: `feat(tamohi): development path and results integration`.

## Step 4: tests, screenshots, demo state

1. `e2e/tamohi.spec.ts` (same harness, fails on console, page or HTTP errors): starts from an issued org B (run the issuance path the way `review.spec.ts` does, or reuse it in `beforeAll`); org B: results panel → first recommended program → enroll → mark two lessons (one gap) → ring shows 2 of total → my path shows "البنود المعالجة 1 من …" and status قيد التنفيذ → reload keeps it; filter by track and search; org A (not issued): catalog without personalisation, my path shows the empty sentence; evaluator1: catalog without enroll actions; signed out: `/tamohi` goes to login.
2. Run the whole suite (`demo-path`, `review`, `tamohi`), `tamohi_checks.sql`, `review_checks.sql`, `rls_checks.sql`, security advisors (0 ERROR); paste results into the log.
3. Screenshots into `e2e/screens/tamohi/` (gitignored) at 1440 and 390: catalog personalised (org B issued), catalog plain (evaluator), program page personalised with one module open, my path. Critique each against the skill and fix before finishing.
4. Reset to the demo start state: `node e2e/reset-demo.mjs`, then `demo_phase4.sql` (org B under review, 3 pending; no enrollments). The catalog stays loaded.
5. Commit `test(tamohi): e2e, checks, screenshots, demo reset`, push `feat/tamohi`, open the PR to `staging` in the browser compare page. Do not merge. Report the PR link and every result.

## Demo path (Thursday), after the Phase 4 path issues org B
org B: dashboard "عرض النتائج" → results, البرامج المقترحة → "افتح خطتي التطويرية" → my path (high priority first) → open the first program → "لماذا يُقترح لمنظمتكم" shows its indicators and gaps → "سجّل منظمتك في البرنامج" → open a module, expand a gap lesson (خطوات التطبيق, معيار الإنجاز) → "أنجزت هذا الناتج" → back to my path: progress moved.
