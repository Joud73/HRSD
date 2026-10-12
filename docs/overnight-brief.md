# Overnight brief: مركز التمكين visual and UX overhaul

You are the senior UI/UX engineer of a studio that builds Saudi government digital services. Tomorrow (8 Oct) this prototype is shown to non-technical HRSD staff. The bar is: calm, credible, precise, modern, unmistakably an HRSD platform, and pleasant to use. Every page must feel like one product.

Load the frontend-design skill (.claude/skills/frontend-design) and CLAUDE.md before starting. Where this brief conflidects with CLAUDE.md, this brief wins for this run.

## 0. Operating rules (read twice)

- Work fully autonomously. Never ask me questions, never wait for approval, never stop before the last phase. When something is ambiguous, choose the simplest option that fits the design principles below and record the decision in the log.
- Keep a running log at docs/overnight-log.md: a checklist of all phases (tick when done), decisions taken, anything you could not finish and why. Update it at the end of every phase. If your context is compacted, re-read this brief and the log, then continue from the first unticked item.
- Commit at the end of every phase with message "overnight: phase N <name>". Never push (pushing is disabled anyway). Never touch the main branch.
- Do not use the browser or screenshots. Verify with: npx tsc --noEmit -p tsconfig.app.json, npm run lint, and at the end npm run build. Typecheck currently has ~32 pre-existing problems: the count must not increase. Fix any problem you introduce before committing.
- Business logic, Supabase queries, AuthContext, ProtectedRoute and role routing stay functionally unchanged. This run is presentation, interaction, structure of the UI layer, and copy.
- All Arabic copy comes from src/lib/copy.ts (already created from CLAUDE.md). Add every new string from section "Copy additions" below to copy.ts. Never hardcode Arabic in components.
- Delete dead code you replace. No duplicate components left behind.

## 1. Design principles (apply to every page)

1. Restraint is the luxury. One accent (gold) per screen at most. Deep green carries identity. Everything else is ink, muted, white, and the light section grey.
2. One container rule. Create src/components/layout/Container.tsx: max-width 1440px, horizontal padding 20px mobile, 32px tablet, 48px desktop. Header, strip, hero, every section, footer, and every internal page use it, so the logo, the hero headline, every section title and the footer all start on the same vertical line. This replaces all max-w-[1200px] containers and reduces the side gutters.
3. Section rhythm like hrsd.gov.sa: sections alternate white and section-alt (the same light grey as the top strip). No borders or divider lines between sections. Vertical padding 96px desktop, 64px tablet, 48px mobile. Add a --section-alt token if needed and use it everywhere.
4. Type scale (HRSDGov only): display 48/60, h1 36/48, h2 28/40, h3 20/30, body 16/28, small 14/22, caption 12/18. Max two sizes per block. Arabic text aligned start; centered text only for short labels inside components.
5. Motion system. Install the "motion" package (Framer Motion). Create src/lib/motion.ts with shared tokens: durations 150ms (micro), 240ms (UI), 420ms (reveal); easing [0.2, 0, 0, 1]; stagger 60ms; reveal distance 12px. Rules:
   - Every user action gets feedback: hover, press (scale 0.98), focus ring, menu open and close, tab change, accordion, sheet, dialog, toast. Use the shared tokens.
   - Entrance motion only for meaningful groups: the hero sequence, each section heading together with its content group once when it first enters the viewport (whileInView, once: true, amount 0.3). Never animate every card separately, never loop, never parallax, never bounce.
   - Numbers count up once when visible (KPI values, track counts).
   - Route changes: 150ms opacity crossfade on the main content only.
   - Loading states use skeletons shaped like the final content, not spinners.
   - prefers-reduced-motion: disable all transforms and counters, keep instant state changes. Wire this through a single useReducedMotion helper.
6. Surfaces: radius 12px for containers, 8px for buttons and inputs, 999px for badges. One shadow (subtle) only for floating layers (menus, dialogs, sticky header when scrolled). Cards use a 1px border and no shadow.
7. Accessibility floor: visible focus ring (2px primary, 2px offset) on every interactive element, AA contrast, all icons decorative unless labelled, logical RTL utilities only (ps, pe, ms, me, start, end), works at 360px with no horizontal scroll.
8. Copy: formal, short, active. Buttons name the result. Empty states: one sentence plus one action. No marketing sentences, no exclamation marks.
9. Numbers: Western digits everywhere (0-9), formatted with a single helper formatNumber() in src/lib/format.ts using Intl.NumberFormat("ar-SA-u-nu-latn"). Replace every toLocaleString("ar-SA"), every Arabic-Indic digit in copy or components, and every hand-formatted number. No "+" prefix on exact counts.
10. No fixed heights on content containers. Height comes from content, grids use align-items: stretch, and scrolling regions (when unavoidable) show a visible scroll affordance and never clip a row in half. Before closing each phase, scan the files you touched for h-[...] or fixed heights combined with overflow-hidden and remove them unless they are media or map canvases.

## Phase 1: Remove Lovable

1. Remove lovable-tagger from devDependencies and componentTagger from vite.config.ts. Delete bun.lock. npm install.
2. Rename package to "tamkeen-platform", version 0.1.0.
3. For every file under public/lovable-uploads referenced in src, move it to src/assets/images with a meaningful English name and import it. Delete public/lovable-uploads (unreferenced files included).
4. Replace README.md: Arabic and English, project name منصة التمكين, stack, local run steps, required .env variables (names only), branch policy, note that this is the functional prototype and reference for the HRSD SDP implementation.
5. Grep the repo (excluding node_modules, dist, .git) for "lovable" case-insensitive and remove remaining references.

## Phase 2: Foundations

1. Tokens: finalize src/index.css and tailwind.config.ts with the type scale, --section-alt, motion-friendly focus ring utility, and status tokens. Remove any leftover teal (#148287), orange (#f5961e), Cairo, and stray hex values across all of src (excluding components/ui). Remove every inline style={{ fontFamily }}.
2. Create Container (principle 2) and a Section component (handles alternating background, padding, optional id, heading block with title and one-line subtitle, and the once-only reveal).
3. Create layouts and route all pages through them:
   - PublicLayout: GovStrip + AppHeader + main + Footer.
   - AppShell (for admin, evaluator, organization internal pages): compact top bar (HRSD logo, page context, user menu), sidebar for admin and evaluator, breadcrumb plus PageHeader (title, one-line description, primary action at the start side), content area on section-alt background with white panels.
   Replace TrainingHeader, TrainingFooter, AdminHeader, EvaluatorHeader and EvaluatorLayout with these where they duplicate.
4. Create shared primitives in src/components/shared: PageHeader, KpiCard, StatusBadge, EmptyState, DataTable wrapper (56px rows, sticky header, no zebra, row hover, skeleton rows), ProgressRow, Skeletons. Animate per principle 5.

## Phase 3: Public shell corrections

1. GovStrip is not sticky: it scrolls away with the page. Only the header is sticky (top: 0). When the page is scrolled more than 8px, the header gets the subtle shadow, transitioned in 240ms. Update scroll-margin-top for anchors to the header height only.
2. Header and footer use Container so their edges align with the hero text.
3. "English" button: keep it, on click show a toast with lang_soon.
4. Dropdown menus: open with the motion tokens, items have hover and focus states, the active route item is marked.

## Phase 4: Home page

1. Hero: delete the decorative star visual completely. Deep green, text block at the start side, generous whitespace. One orchestrated load sequence: headline, then subtitle, then buttons, staggered 60ms, 420ms each, 12px rise. Height around 480px desktop.
2. رحلة التقييم becomes an interactive journey, the signature moment of the page:
   - Desktop: a horizontal track of 4 steps. The connecting line fills with primary color from step 1 to the active step (animated width, 600ms). The active step circle is solid primary with a soft ring; inactive steps are outlined.
   - Below the track, a detail panel for the active step showing: step title, one sentence description, a role chip (who acts), and an "المخرج" line (what the step produces), plus a small, clean illustrative UI fragment built with real components (for example a mini progress row for step 2, a status badge transition from مرسل للمراجعة to معتمد for step 3, a small result bar for step 4). No images, no clip art.
   - The panel content crossfades with a 12px slide in reading direction when the step changes. Steps are clickable and keyboard accessible (tablist semantics, arrow keys).
   - Auto-advance every 5 seconds only while the section is in view, pausing on hover or focus, with a thin progress indicator under the active step. Disabled under reduced motion.
   - Mobile: vertical timeline, each step expandable as an accordion with the same detail content.
3. مسارات التقييم: keep the 5 tracks, make them interactive. Each track shows its name, indicator count (count up once), and standards count. Selecting a track (click or keyboard) expands a detail area below the grid listing its 3 standards with their names, animated height. One track open at a time. Hover shows the gold top edge (the only gold on the page). Add the summary line from tracks_subtitle with counters.
4. Geographic section, rebuilt as a proper data module (files: GeographicDistributionSection.tsx, geographic/SaudiHeatmapMap.tsx, geographic/RegionDetailsPanel.tsx, geographic/types.ts). Load the dataviz skill if available.
   Fix these confirmed defects:
   - The region list is clipped (fixed h-[420px] with overflow). Remove fixed heights; the two columns stretch to equal height from content.
   - Only the top 3 of 13 regions are listed (.slice(0, 3)). Show all 13 as a ranked list: rank, region name, count, and a thin horizontal bar proportional to the max, in primary. If the list is taller than the map, the list area scrolls inside the card with a soft fade at the bottom edge, and the map stays sticky beside it.
   - Mixed digits (toLocaleString("ar-SA") vs raw numbers). Use formatNumber() everywhere in this module.
   - Typos: "جمعية اهلية" and "مؤسسة اهلية" must be "جمعية أهلية" and "مؤسسة أهلية". Use one consistent term for the selected region view (منظمة أهلية as the umbrella term, with the two types as its breakdown).
   - Remove "+" from exact counts.
   - The map fills only a third of its card. Tighten the SVG viewBox to the actual bounds of the region paths (compute from getBBox or the path extents, add 2% padding) so the country fills the canvas. White card background, no grey inner box, no gradient, no shadow.
   - The legend overlaps the map. Move it below the map as a horizontal scale with the min and max values as numbers, not only أقل and أكثر.
   - The colour scale bins between min and max leave 9 of 13 regions in the two lightest shades. Use quantile bins (5 classes) built from the primary token at increasing opacity so the distribution reads honestly.
   Interaction:
   - Map and list are linked: hovering or focusing a region on the map highlights its row and vice versa; clicking either selects it.
   - Selected state: the region gets a 2px ink outline and the others dim to 60% opacity, animated 240ms. The details panel swaps to the region view (name, total, breakdown by type, share of national total as a percentage, rank out of 13) with a crossfade, plus a clear "عرض كل المناطق" action to return to the national view.
   - Keyboard: regions reachable by Tab in a logical order (north to south), Enter selects, Escape clears.
   - Tooltip on hover shows region name and count, positioned so it never leaves the canvas.
   - Mobile: the map on top at full width, the ranked list below it, tapping a region scrolls the list to its row and highlights it. No bottom drawer.
   Layout: map column 7/12, data column 5/12 on desktop; title, one-line subtitle and the map_note caption ("بيانات توضيحية") in the section heading block; national totals as three compact KpiCards above the list (الإجمالي, جمعية أهلية, مؤسسة أهلية) with count-up once. Check the region IDs cover all 13 administrative regions and that every path renders.
5. Closing CTA band before the footer: deep green band (not full hero height), cta_title, cta_subtitle, primary white button hero_cta_primary to /login.
6. Footer: aligned to Container, link hover states, Vision 2030 logo, credit line.

## Phase 5: Authentication pages

1. /login becomes the single sign-in page for all roles:
   - Desktop split: start side (55%) white with the form; end side (45%) deep green panel with panel_title and the three panel_points as a quiet list with icons, and the HRSD white logo at the bottom. No photos, no patterns.
   - Form column: small HRSD logo, login_title, login_subtitle, a full-width Nafath button (keep NafathIcon) labelled nafath_btn, a divider with "أو", then email, password (show and hide toggle), remember me, forgot link, submit button. Under the form: register_prompt with register_link to /register.
   - Inline validation with clear Arabic messages, submit button shows a loading state, errors appear inline above the form with the danger token, never as alerts.
   - On success, route with getDefaultRouteForRole. Use the existing sign-in logic from LoginLocal.tsx unchanged.
   - /login-local and /nafath-auth redirect to /login (keep NafathAuth logic reachable from the Nafath button if it currently simulates a flow).
   - Mobile: the green panel collapses to a slim top strip with the logo.
2. Apply the same split layout and form styling to /register, /forgot-password, /individual-auth, /pending-approval and /under-review so authentication feels like one flow. Register: group fields into clear sections with a step indicator if the form is long.

## Phase 6: Internal app (all roles)

1. Organization dashboard (/dashboard): PageHeader with the organization name, a status summary row (current assessment status as StatusBadge, cycle name, deadline), 4 KpiCards, then the 5 tracks as ProgressRows (name, completed items over total, animated progress bar, status badge, link to continue). Primary action: continue the assessment.
2. Evaluator dashboard and assignments: KpiCards, assignments in DataTable with StatusBadge, filters as segmented controls, row click to details. EvaluationDetails: a clear two-pane layout (indicator list on the start side, item and evidence detail on the end side), sticky action bar with approve and return actions styled per their meaning.
3. Admin: dashboard with KpiCards and a restrained chart (recharts, primary and neutral only, animated once), recent evaluations table. All admin list pages (users, roles, associations, reviewers, organization requests, entities, rubric, evaluation years, reports, profiles) use PageHeader + toolbar (search, filters) + DataTable + EmptyState, and detail pages use a consistent header with key facts and tabs.
4. Sidebars (admin, evaluator): 264px, deep green, white text at 80% with full white for active, active item with a gold bar at the start edge and a subtle lighter background, icons aligned, collapsible to icons on tablet, Sheet on mobile.
5. StatusBadge states only: لم يبدأ (neutral), قيد التقييم (warning), مرسل للمراجعة (primary), معاد للاستكمال (danger), معتمد (success). Map every existing status to these and replace all ad hoc badges.
6. Missing data shows a muted dash, never invented numbers. If a list is empty show EmptyState.

## Phase 7: Remaining pages sweep

Go through every route in src/App.tsx one by one, including TechnicalEvaluationIndicators, TrainingStage, CourseDetail, IndividualCourseDetail, IndividualsJourney and its step components, Certificate, Settings, ContactUs, NotFound. For each: correct layout, Container alignment, type scale, tokens, primitives, motion rules, copy from copy.ts, mobile at 360px. NotFound gets a calm page with a clear way back home. ContactUs gets a clean form with the same field styling as login. Certificate keeps its export logic, restyle only.

## Phase 8: Quality pass

1. Grep for leftover hex colors, left/right physical utilities used for layout, inline fonts, English placeholder text visible to users, and console.log. Fix.
2. Typecheck, lint, npm run build. All must pass with no new problems.
3. Write the final section of docs/overnight-log.md: a table of every route with status (done, partial, not touched) and notes, decisions you made, open questions for me, and a 60-second demo path for tomorrow (which pages to show in which order, and which test account role each needs).
4. Final commit.
5. Defect hunt across every page you touched, as a senior reviewer would: clipped text or rows, inconsistent digits, Arabic spelling (hamza, taa marbuta, alif maqsura), terms used inconsistently for the same concept, misaligned edges against the Container line, overlapping absolute elements, icons mirrored wrongly in RTL (arrows and chevrons must point in reading direction), focus traps, and headings hidden under the sticky header on anchor jumps. Fix each one and list them in the log.
## Copy additions (add to src/lib/copy.ts)

lang_soon: النسخة الإنجليزية متاحة في الإصدار القادم

journey_steps:
1. title: تسجيل المنظمة | desc: يسجل ممثل المنظمة بيانات الجمعية ويرفع وثائقها، وتعتمد الوزارة الطلب. | role: ممثل المنظمة | output: حساب منظمة معتمد
2. title: التقييم الذاتي ورفع الشواهد | desc: تجيب المنظمة على بنود التحقق ضمن 61 مؤشراً، وترفق الشواهد لكل بند، وتحفظ تقدمها قبل الإرسال. | role: ممثل المنظمة | output: تقييم مكتمل مرسل للمراجعة
3. title: المراجعة والاعتماد | desc: يراجع المدقق الشواهد على مستوى البند، ثم يعتمد التقييم أو يعيده للاستكمال مع الملاحظات. | role: المدقق | output: تقييم معتمد
4. title: النتائج وخطة التحسين | desc: تصدر نتيجة كل مؤشر ومسار، مع نقاط القوة وفرص التحسين وخطة تحسين مقترحة. | role: المنظمة والوزارة | output: تقرير النتائج وخطة التحسين
journey_output_label: المخرج

tracks_detail (indicators per track): التوجه 13 | الفريق 14 | الشراكات 10 | البرامج 14 | التأثير 10
tracks_indicators_label: مؤشراً
tracks_standards_label: معايير

map_note: بيانات توضيحية

cta_title: ابدأ تقييم منظمتك
cta_subtitle: سجّل منظمتك وابدأ التقييم الذاتي وفق أداة القياس المعتمدة.

login_title: تسجيل الدخول
login_subtitle: ادخل إلى حسابك في مركز التمكين
nafath_btn: الدخول عبر النفاذ الوطني الموحد
login_or: أو
login_email: البريد الإلكتروني
login_password: كلمة المرور
login_remember: تذكرني
login_forgot: نسيت كلمة المرور؟
login_submit: دخول
login_error_generic: تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.
register_prompt: منظمة جديدة؟
register_link: سجّل منظمتك
panel_title: مركز التمكين الفني للمنظمات غير الربحية
panel_points: تقييم ذاتي وفق 61 مؤشراً | متابعة حالة التقييم والمراجعة | نتائج وخطة تحسين لكل مسار

status_not_started: لم يبدأ
status_in_progress: قيد التقييم
status_submitted: مرسل للمراجعة
status_returned: معاد للاستكمال
status_approved: معتمد

empty_default: لا توجد بيانات بعد
not_found_title: الصفحة غير موجودة
not_found_action: العودة إلى الرئيسية