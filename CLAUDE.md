# Tamkeen Platform (مركز التمكين) - Frontend
Vite + React 18 + TypeScript + Tailwind + shadcn/ui + Supabase. RTL Arabic first.
Dev server: npm run dev (port 8080). Never run npm run build unless asked.
Branch: demo/visual-polish. Never push to main.

## Design system (single source of truth: src/index.css + tailwind.config.ts)
- Colors: primary #0D3F29, primary-light #1D4D37, accent gold #D4A017, surface #F6F7F5, ink #1B1F1D, muted #6B746F. Status: success #2E7D4F, warning #C98A1B, danger #B3402E, neutral #8A918D.
- Never use teal #148287 or orange #f5961e. Never hardcode hex in components; use tokens.
- Font: HRSDGov family only (public/fonts). No Google Fonts. No inline style={{fontFamily}}.
- Spacing 8px scale, card radius 12px, button radius 8px, one shadow level, max content width 1200px.
- RTL: use logical utilities (start/end, ps/pe, ms/me). Never left/right for layout.
- Dropdowns/menus: use shadcn DropdownMenu / Sheet, never hand-rolled absolute divs.

## Wording
Arabic, formal, short, active. Buttons say what happens (ابدأ التقييم, حفظ, إرسال للمراجعة). No marketing sentences.

## Roles
admin -> /admin, evaluator -> /evaluator, organization -> /dashboard, individual -> /individuals-journey (src/lib/roles.ts).

## Rules
- Keep business logic and Supabase calls unchanged. This phase is visual and UX only.
- Prefer editing existing components over creating new ones. Delete dead duplicates when you replace them.
- After each change, list the files touched and what to check in the browser.

## Copy
### Top strip
gov_strip: منصة تابعة لوزارة الموارد البشرية والتنمية الاجتماعية

### Navigation
nav_home: الرئيسية
nav_about: عن المركز
nav_about_items: نبذة عن المركز | الأهداف | منهجية التقييم
nav_tracks: مسارات التقييم
nav_tracks_items: التوجه | الفريق | الشراكات | البرامج | التأثير
nav_guides: الأدلة
nav_guides_items: دليل الكفاءة الفنية | دليل استخدام المنصة
nav_contact: تواصل معنا
login: تسجيل الدخول
lang: English

### Hero
hero_title: مركز التمكين الفني للمنظمات غير الربحية
hero_subtitle: تقييم الأداء الفني وتأهيل المنظمات وتمكينها، بإشراف وزارة الموارد البشرية والتنمية الاجتماعية
hero_cta_primary: ابدأ التقييم
hero_cta_secondary: تعرّف على المنهجية

### How it works
steps_title: رحلة التقييم
steps: تسجيل المنظمة | التقييم الذاتي ورفع الشواهد | المراجعة والاعتماد | النتائج وخطة التحسين

### Tracks
tracks_title: مسارات التقييم
tracks_subtitle: 5 مسارات، 15 معياراً، 61 مؤشراً
track_orientation: التوجه | تحليل السياق، تحديد الأهداف، إدارة المخاطر
track_team: الفريق | تخطيط الموارد البشرية، إدارة الموارد البشرية، إدارة الأداء
track_partnerships: الشراكات | تخطيط الشراكات، إدارة الشراكات، تقييم الشراكات
track_programs: البرامج | تخطيط البرامج، تقديم الخدمات، جودة الخدمات
track_impact: التأثير | نتائج الفريق، نتائج العمليات، نتائج المستفيدين

### Footer
footer_about: منصة رقمية لتقييم الأداء الفني للمنظمات غير الربحية وتأهيلها، بإشراف وزارة الموارد البشرية والتنمية الاجتماعية.
footer_col1: عن المركز
footer_col2: روابط مهمة
footer_col2_items: وزارة الموارد البشرية والتنمية الاجتماعية | المركز الوطني لتنمية القطاع غير الربحي | سياسة الخصوصية | شروط الاستخدام
footer_col3: تواصل معنا
footer_legal: © 2026 وزارة الموارد البشرية والتنمية الاجتماعية. جميع الحقوق محفوظة.
footer_credit: تطوير وتشغيل أكاديمية التعلم

