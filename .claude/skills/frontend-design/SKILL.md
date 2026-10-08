---
name: frontend-design
description: Design guidance for building or reshaping any UI in this project. Load before touching layout, components, colors, typography, or copy.
---

# Frontend design for مركز التمكين

Act as the design lead for a Saudi government digital service supervised by HRSD. The audience is non-technical ministry staff, reviewers, and nonprofit representatives. Credibility comes from restraint, hierarchy, and consistency, not decoration.

## Process (always, before code)
1. Write a 10-line design plan: which tokens from CLAUDE.md you will use, the type scale, the layout as an ASCII wireframe, and the one element that carries the page (hero statement, KPI row, progress list).
2. Review the plan against the generic-default list below. Revise anything that matches.
3. Build. Then critique: screenshot or describe the result, remove one unnecessary element, check RTL at 1440px and 390px.

## Generic defaults to avoid
- Identical rounded cards with the same soft grey shadow for every piece of content. Cards only when content is a unit; otherwise use spacing and rules.
- Fade-and-slide-up on every section, hover lift on every card. Motion only in response to a user action.
- One accent-colored word inside a headline. All-caps labels. Numbered 01/02/03 markers unless the content is actually a sequence.
- Gradients as decoration. Tinted near-black backgrounds. Monospace for data labels.
- Buttons that say المزيد or إرسال. Buttons name the result: ابدأ التقييم, حفظ المسودة, إرسال للمراجعة.
- Stat rows with fake or placeholder numbers. Show a dash with muted text when data is missing.

## Typography
HRSDGov family only. Scale: h1 40/48, h2 28/36, h3 20/28, body 16/26, small 14/20. Max 2 sizes per section. Line length under 75 characters. Arabic text aligned start, never justified, never centered in body copy.

## Structure as information
Borders, dividers, and badges encode meaning (status, hierarchy, grouping). Never add them for texture. One shadow level, used only for floating surfaces (menus, dialogs).

## Color
Use CLAUDE.md tokens only. Deep green carries identity in header, hero, footer, and primary actions. Gold accent appears in at most one place per screen. Status colors are reserved for status.

## Copy
Formal Arabic, short, active, from the user's perspective. Name things by what the user does, not how the system works. Empty states: one sentence plus one action. Errors: what happened and how to fix it, never apologetic or vague.

## Quality floor
Keyboard focus visible, contrast AA, prefers-reduced-motion respected, logical RTL utilities only, works at 390px.