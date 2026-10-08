# Overnight log

Brief: docs/overnight-brief.md

Baseline before the run: typecheck 0 errors, lint 32 problems (22 errors, 10 warnings). The "~32 pre-existing problems" in the brief match the lint count; that is the ceiling.

## Phases

- [x] Phase 1: Remove Lovable
- [x] Phase 2: Foundations
- [x] Phase 3: Public shell corrections
- [x] Phase 4: Home page
- [x] Phase 5: Authentication pages
- [x] Phase 6: Internal app
- [x] Phase 7: Remaining pages sweep
- [x] Phase 8: Quality pass

## Decisions

- Phase 1: the only file in public/lovable-uploads was not referenced anywhere in src or index.html, so it was deleted and nothing moved to src/assets/images.
- Phase 1: the brief itself still contains the word "lovable"; it is the instruction document and was left unchanged.
- Phase 1: the `motion` package was installed in Phase 1 alongside the dependency cleanup so the lockfile changes in one commit.

- Phase 2: the brief was moved from .claude/docs to docs/ during the run; both copies were identical.
- Phase 2: `--section-alt` aliases `--surface` (#F6F7F5), the same grey as the gov strip.
- Phase 2: one shadow level. Tailwind `shadow-sm` and `shadow` now resolve to none; `shadow-md` and up resolve to the single float shadow. This removes card shadows app-wide without touching every file, while menus and dialogs keep theirs.
- Phase 2: a global `:focus-visible` outline (2px primary, 2px offset) is the accessibility floor; components that draw their own ring opt out with `focus-visible:outline-none`.
- Phase 2: `MotionConfig reducedMotion="user"` at the app root plus a CSS reduced-motion block; `useReducedMotion` (src/hooks/useReducedMotion.ts) is the single helper for counters and auto-advance.
- Phase 2: layouts are layout routes in App.tsx. ProtectedRoute now wraps each AppShell (same guard, same roles), so an unauthenticated visitor never sees the shell flash. The loading state became a skeleton instead of a spinner; the logic is unchanged.
- Phase 2: PageHeader puts its action group at the end of the title row; within the group the primary action comes first (start). I read "primary action at the start side" as the order inside the group.
- Phase 2: section tone (white or alt) is an explicit prop on Section, not automatic alternation. That is simpler and survives reordering.
- Phase 2: sidebar labels were renamed for one term per concept: المدقق (not المقيّم) for the evaluator role, matching the journey copy.
- Phase 2: AdminHeader, AdminSidebar, EvaluatorHeader, EvaluatorSidebar, EvaluatorLayout and admin/StatusBadge were deleted. TrainingHeader and TrainingFooter no longer existed. AdminProfile and EvaluatorProfile now share one AccountProfile component.
- Phase 2: dead code deleted: RecentEvaluationsTable, LoginStep, JourneyStepper, NavLink, CircularProgress, TrainingBreadcrumb, App.css, empty SVG icons in src/assets/icons.
- Phase 2: stray hex values were mapped to tokens mechanically (teal to primary, orange to primary-light, greys to border, neutral and muted). Pages rebuilt in later phases get proper classes; Phase 8 re-greps.
- Phase 2: the old admin KpiCard stays until Phase 6 rebuilds its five pages on the shared KpiCard (its API differs).
- Phase 3: GovStrip moved out of the sticky wrapper into PublicLayout, so it scrolls away; only the header is sticky. The header gains the float shadow after 8px of scroll (240ms). Anchor offset is `--header-h` (64px, 80px on desktop) plus 16px, set once on `[id]` in index.css.
- Phase 3: "English" shows a toast with lang_soon on desktop and in the mobile options menu.
- Phase 3: dropdown items mark the active route with primary text, a check icon and aria-current. The underline bar animates its scale (240ms).
- Phase 3: the radix toast had physical right/pr/space-x utilities; they are now logical (end, pe, gap).
- Phase 4: the hero carries id="about" (targets of نبذة عن المركز and الأهداف). The secondary CTA تعرّف على المنهجية now goes to #steps (the journey), matching the منهجية التقييم nav item.
- Phase 4: journey auto-advance is driven by a CSS keyframe on the thin indicator under the active step; `animationend` advances, `animation-play-state` pauses while hovered, focused or out of view. Under reduced motion the indicator is not rendered, so nothing auto-advances. Each illustrative fragment is captioned مثال توضيحي so its sample figures (8 of 13, 82%) are not read as real data.
- Phase 4: tracks open their standards below the grid; header links (/#track-team …) open the matching track. Selected tile uses a primary edge; gold appears only on hover, the page's single accent.
- Phase 4 (map): the region paths already spanned the full 730x600 box; the map looked small because its card had a fixed 360px height. The SVG now takes the full column width with a viewBox padded 2%; the card has no fixed height.
- Phase 4 (map): the dataset had no per-region type breakdown, which the region view requires. I added an illustrative split (foundations per region) that sums exactly to the existing national totals (2463 associations, 73 foundations, 2536 total). The whole module is captioned بيانات توضيحية. **Replace with real data before production.**
- Phase 4 (map): quantile classes (5 classes over the 13 regions, 2–3 regions each) built from the primary token at rising opacity; the legend shows numeric breaks under the scale (min … max).
- Phase 4 (map): on desktop the data column takes the map's height (absolute inset inside the stretched grid cell); the ranked list scrolls inside its card with a bottom fade. On mobile everything flows: map, totals, list. Selecting a region scrolls its row into view.
- Phase 4 (map): tab order north to south (تبوك, الجوف, الحدود الشمالية, حائل, القصيم, المدينة المنورة, الرياض, الشرقية, مكة المكرمة, الباحة, عسير, نجران, جازان); Enter selects, Escape clears. The outline of the hovered or selected region is drawn as a last overlay path so neighbours never cover it.
- Phase 4: CTA band is an inset deep green panel on the section grey, so it does not merge with the green footer.
- Phase 5: AuthLayout is a standalone split screen (no gov strip, header or footer): form column 55% at the start side with the small HRSD logo, deep green panel 45% with panel_title, panel_points and the white logo. On mobile the panel becomes a 56px green strip with the logo. /under-review and /pending-approval use it too (under-review keeps its organization guard).
- Phase 5: one field system for every form: TextField / PasswordField / FieldShell / FormError in src/components/shared/FormField.tsx (labels above, 48px inputs, inline errors that animate in, aria-invalid and aria-describedby wired). The shadcn Input lost its `md:text-sm` so form text stays 16px.
- Phase 5: /login uses the LoginLocal sign-in sequence unchanged (signIn, getUser, fetchUserRole, getDefaultRouteForRole). Every failure shows login_error_generic inline above the form. /login-local and /nafath-auth are `<Navigate to="/login">` routes; their page files were deleted.
- Phase 5: the Nafath simulation (same localStorage flag, same /dashboard redirect after 1.5s) now runs as an inline step inside /login (src/components/auth/NafathStep.tsx).
- Phase 5: Register is three steps (بيانات المنظمة, بيانات الدخول, بيانات الممثل). The existing order is kept: signUp must run before the delegates insert, so step 2's button creates the account and step 3 has no Back button. Payload and calls are unchanged.
- Phase 5: UnderReview no longer shows OrganizationJourney, an invented submission date or a disabled certificate button; it shows the organization name and the submitted status.
- Phase 5: ForgotPassword back links now point to /login instead of the retired /login-local.
- Phase 6 (method): phases 5 to 7 ran as six parallel engineers on disjoint file sets (auth; org dashboard + evaluator; admin management; admin performance + reports; assessment + training; remaining pages). Each area has its own strings module in src/lib/strings/, re-exported from src/lib/copy.ts, so no two engineers edited copy.ts at once. I made every shared-file change myself.
- Phase 6 (dashboard): there is no stored cycle name or deadline, so both show a muted dash. Track progress is read from the evidence the self-assessment page already stores in localStorage (`evidence-<slug>`): an indicator counts as completed when it has at least one evidence record, and the panel says so. Track status can only be لم يبدأ or قيد التقييم, because nothing records a submission. DashboardHeroSection was deleted (mock numbers, teal SVG backgrounds).
- Phase 6 (evaluator): EvaluationDetails replaced the free status dropdown, which listed ten legacy statuses, with two actions: اعتماد التقييم and إعادة للاستكمال, each behind a confirm dialog. They write the same `status` column through the same save mutation, with values that existed before (`approved`, `needs_revision`). **Please review: this is the one place where the interaction, not only the look, changed.**
- Phase 6 (admin): list pages follow PageHeader, toolbar, DataTable, EmptyState. The KPI strips that only repeated status counts were removed from list pages; the counts now sit inside the filter controls. Validation messages moved from toasts to inline fields. Destructive confirmations use a danger button.
- Phase 6 (statuses): non-assessment states are not forced into the five badges. User active/disabled, evaluation year open/closed and a rejected registration request show plain text with a small dot. A pending request shows مرسل للمراجعة and an approved one معتمد. Every legacy Arabic label and database code maps through toStatusKey in src/lib/status.ts.
- Phase 6 (terms): مساق became مسار, نوع الدليل became نوع الشاهد, and المقيّم/مقيم became المدقق everywhere, including the role label in useAdminData (a display string only).
- Phase 6 (data): the rubric mock now uses the official 5 tracks and 15 standards. Reports keep their mock values, and the hardcoded "تراجع بنسبة 8%" is now computed from the comparison data. Detail pages still show their demo record for any id, as before.
- Phase 6 (shared fixes I made): SegmentedControl and DataTable infer their row and value type through NoInfer, so a useState setter can be passed directly. The dialog close button moved to the end side with an Arabic label and no gold. Dialog and AlertDialog headers are start-aligned, and their footers use gap with the primary action first. The Switch thumb moves the right way in RTL. Submenu chevrons point in reading direction. Added a `font-hrsd-regular` alias (the header, footer and hero already used it), collapsible keyframes and `formatDateTime`. The old admin KpiCard was deleted.
- Phase 7 (self-assessment): TechnicalEvaluationIndicators went from 2273 lines to about 720, with its parts split into src/components/assessment/. It shows one indicator at a time with a sticky indicator list at the start side (a Select below lg), item rows, evidence chips, and tabs for الشواهد / خطة التحسين / الملاحظات. The page has no submit or save logic and no Supabase calls (everything is localStorage), so the header has no إرسال للمراجعة or حفظ المسودة buttons rather than buttons that do nothing.
- Phase 7 (self-assessment, bugs fixed in local state): item ids repeat across indicators in the data, so ticking one item ticked it everywhere; checked state is now keyed per indicator. Switching tracks kept the component mounted and could write one track's evidence under the next track's key; the page now remounts per track. The localStorage keys and record formats are unchanged.
- Phase 7 (data text): about 15 spelling errors in the indicator text were corrected. Program 1's description in trainingPrograms.ts was copied from a PMP course and was rewritten to match its own objectives.
- Phase 7 (training): CourseDetail gained a الالتحاق بالبرنامج button that writes the `enrolledPrograms` localStorage key, which TrainingStage already read but nothing ever wrote. This is new local-only behaviour.
- Phase 7 (certificate): export logic kept. Two fixes: html2canvas received the literal "hsl(var(--background))", which it cannot parse, so the variable is now resolved first; and the certificate number and verification code are generated once per visit, so the preview and the PDF match.
- Phase 7 (journeys): one shared JourneyStepper (src/components/shared/JourneyStepper.tsx) drives both the organization and individual journeys. IndividualsJourney had an off-by-one between its 3 steps and the 4-step stepper; registration now always shows as completed.
- Phase 7 (contact): all contact rows show a dash, matching the footer. The mailto submit logic is kept and an organization-name input was added (it was already in state and in the email body).
- Phase 7: the fixed "نسخة تجريبية" side badges (inline styles, physical left) were removed from Dashboard, IndividualsJourney and UnderReview.

- Phase 8: 26 shadcn primitives that nothing imported were deleted (card, table, badge, sidebar, carousel, chart, command, drawer, menubar and others), along with hero-bg.png and public/placeholder.svg. The remaining ui files use logical utilities only (sheet keeps its explicit left/right side variants by design).
- Phase 8: the calendar now runs with dir="rtl" and the Arabic date-fns locale; react-day-picker then swaps its chevrons itself.
- Phase 8: the page meta description was a marketing line; it now uses footer_about.

## Not finished

- Hardcoded Arabic still in component files, all of it demo data or punctuation: seed records in AdminAssociationDetail and AdminReviewerDetail, ordinal labels in TechnicalEvaluationIndicators (their text is saved into evidence records, so they stay), and status-label keys used for mapping. Static indicator and training content lives in data files (src/components/assessment/indicatorsData.ts, src/data/trainingPrograms.ts), not in copy.ts.
- Lint: 10 problems remain, all in files outside this run's scope (AuthContext, useAdminData, useEvaluatorAssignments, the tailwind.config require, two shadcn files). Baseline was 32.
- The production bundle is one 2.3 MB chunk (670 KB gzip). Route-level code splitting would fix it; not done because it is not presentation work.
- Nothing was checked in a browser (the brief forbids it). Every "what to check" note is unverified.

## Final report

Checks at the end of the run: typecheck 0 errors; lint 10 problems (baseline 32; none introduced); `npm run build` passes.

### Routes

| Route | Layout | Status | Notes |
|---|---|---|---|
| / | Public | done | Hero, interactive journey, tracks, map module, CTA band |
| /contact-us | Public | done | Login field styling, inline validation, mailto logic kept |
| /individuals-journey | Public, individual | done | Shared stepper; self-assessment, courses, certificate steps restyled |
| /individual-course/:courseId | Public, individual | done | Reading column, facts strip, accordion |
| * (NotFound) | Public | done | Calm 404 with one way home |
| /login | Auth | done | Single sign-in, Nafath inline step, inline validation |
| /login-local, /nafath-auth | none | done | Redirect to /login |
| /register | Auth | done | Three steps; same payload |
| /forgot-password | Auth | done | |
| /individual-auth | Auth | done | |
| /pending-approval | Auth | done | Status page |
| /under-review | Auth, organization | done | Status page |
| /dashboard | App shell, organization | done | Status row, 4 KPIs, 5 track ProgressRows |
| /settings | App shell, organization | partial | Restyled; save has no persistence (toast only) |
| /technical-indicators/:courseSlug | App shell, organization | done | Two-pane self-assessment; no submit logic exists |
| /training-stage | App shell, organization | done | |
| /course/:courseId | App shell, organization | done | Enrolment writes localStorage only |
| /certificate/:organizationId | App shell, organization | done | Export logic kept |
| /admin | App shell, admin | done | KPIs, bar chart, recent evaluations |
| /admin/users, /roles, /associations, /reviewers, /organization-requests | App shell, admin | done | PageHeader, toolbar, DataTable, EmptyState |
| /admin/associations/:id, /admin/reviewers/:id | App shell, admin | done | Key facts and tabs; still show demo records for any id |
| /admin/performance/evaluation-setup (+ /entities, /rubric) | App shell, admin | done | |
| /admin/performance/evaluation-years (+ /:yearId) | App shell, admin | done | |
| /admin/reports | App shell, admin | done | Mock data, primary and neutral charts |
| /admin/profile, /evaluator/profile | App shell | done | One shared AccountProfile |
| /evaluator | App shell, evaluator | done | |
| /evaluator/assignments | App shell, evaluator | done | Segmented status filter |
| /evaluator/assignment/:assignmentId | App shell, evaluator | done | Two panes, sticky approve and return bar |

### Open questions for you

1. Map data: the per-region association and foundation splits are illustrative (they sum to the original national totals). Do real figures exist?
2. EvaluationDetails: approve and return now replace the free status dropdown. Is limiting the evaluator to these two outcomes acceptable?
3. Settings: the save button only shows a toast, because no save logic exists. Hide it for the demo, or keep it?
4. Organization dashboard: cycle name and deadline have no data source and show a dash. Is there a table for them?
5. Self-assessment has no submit action. Should one be specified for the SDP build?
6. Contact details (email, phone, address) are missing everywhere and show a dash. Can you provide them?

### Defect hunt (Phase 8.5): found and fixed

- `font-hrsd-regular` was used in the header, strip, footer and hero but did not exist in Tailwind, so those texts fell back to the default face; alias added.
- The shadcn Input forced 14px text from md up (`md:text-sm`), shrinking every form field; removed.
- The dialog close button sat on the start side with a gold background and an English "Close" label; it is now on the end side, neutral, labelled إغلاق. Dialog headers were left-aligned and footers used `space-x`; both are now logical.
- The Switch thumb moved the wrong way in RTL; submenu chevrons pointed right; the calendar's navigation and range rounding were physical and its "today" cell was gold.
- The toast used physical right/pr/space-x utilities.
- The chart tooltip formatted numbers with toLocaleString; it now uses formatNumber.
- Self-assessment: ticking an item ticked the same item in every indicator (duplicate ids), and switching tracks could save one track's evidence under another track's key.
- Certificate: html2canvas received an unparseable `hsl(var(--background))`, and the certificate number changed between preview and PDF.
- IndividualsJourney: an off-by-one between the page's 3 steps and the 4-step stepper.
- The map card had a fixed 360px height that left the country at a third of the card; the region list was clipped (fixed height plus overflow) and showed only 3 of 13 regions.
- Typos: جمعية اهلية / مؤسسة اهلية corrected to أهلية; about 15 spelling errors fixed in the indicator text; المقيّم/مقيم unified to المدقق; مساق unified to مسار.
- Every "+" on exact counts removed; every Arabic-Indic digit and toLocaleString replaced by formatNumber / formatDate.
- Fixed "نسخة تجريبية" side badges with inline styles and a physical `left` overlapped content on three pages; removed.
- Anchors: one `scroll-margin-top` rule (header height plus 16px) replaces the per-element scroll-mt values, so headings no longer hide under the sticky header.
- Right-pointing icons were checked one by one: each is a back or previous action, which is correct in RTL.

### 60-second demo path

1. **Home, no login** (25s): the hero load sequence; scroll to رحلة التقييم and let it advance once, then click step 3 to show the badge moving from مرسل للمراجعة to معتمد; open a track (التوجه) to show its standards; hover a region on the map, click الرياض, then عرض كل المناطق.
2. **/login** (5s): submit empty to show the inline errors, then sign in with an **organization** test account.
3. **/dashboard** (10s): the status row, KPIs counting up, the five track rows; open التوجه.
4. **/technical-indicators/altawajuh** (10s): tick two items and attach a piece of evidence to show the progress bar move.
5. Sign out, sign in with an **evaluator** account: **/evaluator/assignments** (5s), filter by status, open a row to show the two-pane review and the approve and return bar.
6. Optional, with an **admin** account: **/admin** (5s): KPIs and chart, then the sidebar to الجمعيات.
