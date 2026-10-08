# Overnight log

Brief: docs/overnight-brief.md

Baseline before the run: typecheck 0 errors, lint 32 problems (22 errors, 10 warnings). The "~32 pre-existing problems" in the brief match the lint count; that is the ceiling.

## Phases

- [x] Phase 1: Remove Lovable
- [x] Phase 2: Foundations
- [x] Phase 3: Public shell corrections
- [ ] Phase 4: Home page
- [ ] Phase 5: Authentication pages
- [ ] Phase 6: Internal app
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

## Not finished
