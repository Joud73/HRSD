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
- [ ] Phase 7: Remaining pages sweep
- [ ] Phase 8: Quality pass

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

## Not finished
