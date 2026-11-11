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

## Step 2: shell, catalog, program page

### Design plan: TamohiShell (written before building)
1. Tokens: background white top bar with border-border, page on section-alt, primary for the wordmark and active link, no gold in the shell.
2. Type: wordmark "طموحي" h3 bold primary, tagline small muted; links small medium; footer caption muted.
3. Layout: `[wordmark | tagline] ··· [الكتالوج  خطتي التطويرية] ··· [العودة إلى مركز التمكين] [account]`, 64px, sticky; content max 1200px (new `max-w-content` token), 20/32/48 gutters.
4. 390px: tagline hidden, links move to a second row under the bar (scrollable, no menu needed for two links), back link becomes an icon button with an accessible name.
5. Active link: primary text + 2px underline bar (same as the platform header), not a pill.
6. The page owns its full-bleed bands (hero, white header); the shell renders the outlet edge to edge and pages use the 1200 frame inside.
7. Footer: one line, start-aligned, top border.
8. Carries the page: nothing; the shell stays quiet so the readiness map leads.
9. Generic-default check: no logo collage, no gradient, no shadow on the bar; one account menu reused (`UserDropdown`).
10. Critique after build: remove the tagline at <640px, check focus ring on every link.

### Design plan: catalog `/tamohi` (written before building)
1. Tokens: hero on primary; track-1..5 only for dots, card start edges and ring arcs; warning tint for high priority, neutral for medium; gold not used.
2. Type: h1 "طموحي" and the ring centre / hero counts at h1; card titles h3; everything else body/small/caption.
3. Wireframe (lg):
   `| h1 طموحي + one sentence            | readiness map (white panel): ring, legend, summary, action |`
   `| مقترح لمنظمتك: [card][card][card]                                                          |`
   `| sticky filter bar: [الكل • • • • •] [delivery ▾] [search……] [switch]          {n} برنامجاً |`
   `| grid 3 cols of program cards (2 at md, 1 at 390)                                            |`
4. Carries the page: the readiness map (personalised) or the four real counts (plain).
5. Ring on deep green would lose the track colours (low contrast), so the map sits on a white panel inside the band; legend lists each track's dot, name and %; the SVG has an aria-label with all values.
6. Ring animates once from 0 (pathLength), static under reduced motion; filter results reorder with layout animation; nothing on scroll.
7. Program card = one link, 4px start edge in track colour, hover changes the border colour only, visible focus ring.
8. Filter bar sticky under the 64px bar on white with a bottom border; the track control scrolls horizontally at 390.
9. Empty filter: one sentence + "مسح التصفية".
10. Generic-default check: no stat cards for the counts (numerals with rules), no shadows on cards, no fake numbers (all from the views), recommendation cards differ from catalog cards by content (gap bar), not decoration.

### Design plan: program page `/tamohi/programs/:code` (written before building)
1. Tokens: white header band, section-alt body; track colour for the chip dot, the stepper nodes and the progress fill; level chips as in the plan (0 danger, 1 warning, 2 accent, 4 success); warning dot for gap lessons.
2. Type: h1 title, subtitle body muted, section titles h3, lesson titles body, meta caption/small.
3. Wireframe (lg):
   `| breadcrumbs · [track chip][standard chip] · h1 · subtitle · meta | actions / enrolled ring |`
   `| main: ما ستحققه منظمتك (checklist) · محتوى البرنامج (stepper)   | side (sticky): لماذا يُقترح, audience, delivery, duration |`
4. Carries the page: the curriculum stepper, with gaps marked on the exact lessons.
5. Stepper: numbered nodes on a vertical line (track colour), fill along the line for enrolled progress; modules open independently with height animation; "إظهار ما لم يتحقق فقط" filters lessons and hides modules without gaps.
6. Lesson row: kind icon + label, title, duration; gap dot and "لم يتحقق في تقييمكم"; expands to خطوات التطبيق / معيار الإنجاز; enrolled org gets the checkbox "أنجزت هذا الناتج" (optimistic, toast only on error, check animates).
7. "متابعة البرنامج" opens the module of the first lesson not done and scrolls it into view (smooth unless reduced motion).
8. 390px: one column, side panel after the header (before outcomes), actions full width.
9. Not found: one sentence + "العودة إلى الكتالوج".
10. Generic-default check: no cards inside cards (side sections separated by rules), no icon decoration beyond the lesson kind, numbers only where they are data.

- [x] 2.1 Shell and routes
- [x] 2.2 Catalog `/tamohi`
- [x] 2.3 Program page `/tamohi/programs/:code`

### Decisions (Step 2)
- Tokens: `--track-1..5` in `index.css` and `track.1..5` in Tailwind (HSL from the brief; contrast on white 5.46, 6.48, 6.35, 6.58, 6.55 : 1, all AA for text). `max-w-content` = 1200px for طموحي. Literal class maps in `components/tamohi/tamohiUi.ts` (Tailwind cannot see built class names).
- Routes under `TamohiShell`, guarded for organization, admin, supervisor, evaluator. `/tamohi/my-path` redirects other roles to `/tamohi` (Step 3 builds the page; a placeholder empty state stands in for this commit).
- Signed out → `/login?next=<path>` from `ProtectedRoute` (every protected page); `Login` follows `next` only for same-site paths (`/…`, never `//…`).
- Shell: text wordmark (no logo file: the new logo assets in the working tree are the owner's uncommitted work); "العودة إلى مركز التمكين" goes to the role's home (`getDefaultRouteForRole`); account menu is the existing `UserDropdown` (organization items, or the role's profile). Below md the two links take a second row. الكتالوج stays active on program pages.
- Readiness map: on a white panel inside the green band (track colours on deep green fail contrast), legend with each track's dot, name and review %; the SVG carries an aria-label with every value. Arcs run from 12 o'clock right to left (reading order). Gaps = items total − items confirmed (overall frozen results); programs = recommendation count.
- Plain hero: four counts from the catalog view (15 / 61 / 378 / 173), numerals at h1 with rules, no cards.
- Catalog order: organizations with results by recommendation rank, then the rest by track order (`sort_order`); others by `sort_order`. Search matches the title (and the code). The filter bar is sticky from md only: at 390 it is ~200px tall and would cover a quarter of the screen.
- `SegmentedControl` gains an optional `prefix` per option (the track dot); no other change.
- Program page: "لماذا يُقترح لمنظمتكم" is shown to organizations only (with results: indicator chips + the gap sentence; without: the one sentence); admin, supervisor and evaluator see audience, delivery and duration only, and no actions. "متابعة البرنامج" turns off the gaps-only filter, opens the module of the first lesson not done and scrolls it into view. The lesson checkbox sits in the expanded lesson (with خطوات التطبيق and معيار الإنجاز, as in the demo path); the row shows an animated check once done. Stepper line between nodes fills with the module's done share.
- Motion: ring (once, 1.1s), filter results (layout + fade), module and lesson panels (height), lesson check and the progress ring/bars; every one off under reduced motion (`useReducedMotion`, plus the global `MotionConfig reducedMotion="user"`).

### Checks (Step 2), staging, org B issued through `review.spec.ts` (tests 1 to 3)
- Screenshots (throwaway spec, gitignored `e2e/screens/tamohi/`): catalog org B and evaluator1, program TMH-11 org B (module 1 and its first lesson open) and evaluator1 (module 1 open), each at 1440 and 390. No console errors, page errors or HTTP ≥ 400 in any of the eight.
- Org B data: ring 49 % (التوجه 98, الفريق 100, الشراكات 46, البرامج 0, التأثير 0), "192 بنداً لم يتحقق · 10 برنامجاً مقترحاً"; top 3: TMH-11 (34), TMH-12 (31), TMH-10 (29), all high priority; TMH-11 "34 من 34 بنداً لم يتحقق في تقييمكم", indicators 43 to 47 "غير مكتمل".
- Smoke (throwaway, deleted): org B enrolls in TMH-11, "متابعة البرنامج", marks the first lesson → ring "1 من 34", reload keeps it, status قيد التنفيذ, the recommendation card shows it. Enrollment removed afterwards (org B only).
- Critique fixes: filter bar not sticky below md; الكتالوج active on program pages. `tsc` 0 errors, lint 6 (baseline).

## Step 3: my path and the integration with مركز التمكين

### Design plan: my path `/tamohi/my-path` (written before building)
1. Tokens: white header band, section-alt body; primary for the ring and progress bars; track colour for node dots; warning tint for the high-priority group label only.
2. Type: h1 "خطتي التطويرية", description small muted; summary numbers h3 bold (the ring carries the first number); node titles body bold; meta caption.
3. Wireframe: `| h1 + "مبنية على نتائج …" |` then one summary row `| (ring) البنود المعالجة x من y │ البرامج المقترحة n │ المسجلة n │ المكتملة n |` with vertical rules, no cards; then `أولوية عالية` timeline, `أولوية متوسطة` timeline.
4. Carries the page: the first summary number (gap lessons closed / gap lessons in recommended programs) with its ring.
5. Timeline: vertical line at the start, a node per program in rank order (track-colour dot on the line), row content: rank, title (link), "يعالج {gap} بنداً", status chip and progress bar when enrolled, action at the end (سجّل / متابعة / عرض).
6. The line draws once on load (scaleY from the top, reveal duration), static under reduced motion; nothing else moves.
7. 390: summary wraps to 2×2 with rules between pairs, ring beside the first number; timeline rows stack, action full width.
8. Empty (no issued results): one sentence + "العودة إلى لوحة المنظمة".
9. Gap lessons closed are computed from the gap set (`v_program_lesson_gaps`) intersected with each enrollment's lesson progress, so the number moves the moment a gap lesson is ticked.
10. Generic-default check: no stat cards, no badges for decoration (status chips encode state), no gold.

- [x] 3.1 خطتي التطويرية `/tamohi/my-path`
- [x] 3.2 Integration: results page programs panel, organization menu item, `review.spec.ts`

### Decisions (Step 3)
- "البنود المعالجة x من y": y = sum of `gap_lessons` over the recommended programs; x = gap lessons (`v_program_lesson_gaps`, this assessment) found in the lesson progress of the enrollments in those programs (one progress query per enrollment, the same cache keys as the program page, so ticking a lesson there moves the number here).
- المسجلة counts every enrollment of the organization; المكتملة the completed ones.
- Timeline: high priority, then medium, each group in rank order; the node on the line carries the track colour (the track name next to it has no second dot). Actions: سجّل enrolls in place (with the issued assessment id); متابعة (enrolled, in progress) and عرض (completed) open the program. The line draws once (scaleY, 0.84 s), static under reduced motion.
- Organizations have no sidebar in this platform: their navigation is the account menu built from `ORGANIZATION_NAV`, so "طموحي" (GraduationCap) → `/tamohi` is added there; it shows in the app shell's menu and in طموحي's own menu. `AppShell.tsx` (owner's uncommitted edits) is not touched.
- `/results` البرامج المقترحة: top 3 by `rank`, "يعالج {n} بنداً لم يتحقق", internal `Link` "عرض البرنامج" to `/tamohi/programs/{code}`, and "افتح خطتي التطويرية" → `/tamohi/my-path` in the panel header. `listRecommendedPrograms` orders by `rank`; `RecommendedProgram` gains `gapLessons`, `lessonsTotal`, `priority`, `rank`. `programs_desc` reworded to say what the list is.
- `review.spec.ts`: the programs panel now expects 3 rows, the first = rank 1 (title and gap read from `v_program_recommendations` through the CLI), its link `/tamohi/programs/{code}`, and the my-path link.

### Checks (Step 3)
- Browser (throwaway spec, deleted), org B issued: `/results` panel shows TMH-11 (34), TMH-12 (31), TMH-10 (29) with internal links; "افتح خطتي التطويرية" opens my path: "0 من 192", 10 recommended (9 high, 1 medium: TMH-01 at level 2), 0 enrolled, 0 completed. 1440 and 390, no console/page/HTTP errors.
- Critique fixes: duplicate track dot removed from path nodes; the three counts sit in one row at 390 instead of 2 + 1.
- `tsc` 0 errors, lint 6 (baseline).

## Not finished
