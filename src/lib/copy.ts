// Platform copy, keyed exactly as in CLAUDE.md "## Copy". Edit there first, then here.
// Page-level strings live in src/lib/strings/<area>.ts and are re-exported from here,
// so every component imports copy from "@/lib/copy".

const split = (value: string) => value.split(" | ");

export const copy = {
  gov_strip: "منصة تابعة لوزارة الموارد البشرية والتنمية الاجتماعية",

  nav_home: "الرئيسية",
  nav_about: "عن المركز",
  nav_about_items: split("نبذة عن المركز | الأهداف | منهجية التقييم"),
  nav_tracks: "مسارات التقييم",
  nav_tracks_items: split("التوجه | الفريق | الشراكات | البرامج | التأثير"),
  nav_guides: "الأدلة",
  nav_guides_items: split("دليل الكفاءة الفنية | دليل استخدام المنصة"),
  nav_contact: "تواصل معنا",
  login: "تسجيل الدخول",
  lang: "English",

  hero_title: "مركز التمكين الفني للمنظمات غير الربحية",
  hero_subtitle: "تقييم الأداء الفني وتأهيل المنظمات وتمكينها، بإشراف وزارة الموارد البشرية والتنمية الاجتماعية",
  hero_cta_primary: "ابدأ التقييم",
  hero_cta_secondary: "تعرّف على المنهجية",

  steps_title: "رحلة التقييم",
  steps: split("تسجيل المنظمة | التقييم الذاتي ورفع الشواهد | المراجعة والاعتماد | النتائج وخطة التحسين"),

  tracks_title: "مسارات التقييم",
  tracks_subtitle: "5 مسارات، 15 معياراً، 61 مؤشراً",
  track_orientation: split("التوجه | تحليل السياق، تحديد الأهداف، إدارة المخاطر"),
  track_team: split("الفريق | تخطيط الموارد البشرية، إدارة الموارد البشرية، إدارة الأداء"),
  track_partnerships: split("الشراكات | تخطيط الشراكات، إدارة الشراكات، تقييم الشراكات"),
  track_programs: split("البرامج | تخطيط البرامج، تقديم الخدمات، جودة الخدمات"),
  track_impact: split("التأثير | نتائج الفريق، نتائج العمليات، نتائج المستفيدين"),

  footer_about:
    "منصة رقمية لتقييم الأداء الفني للمنظمات غير الربحية وتأهيلها، بإشراف وزارة الموارد البشرية والتنمية الاجتماعية.",
  footer_col1: "عن المركز",
  footer_col2: "روابط مهمة",
  footer_col2_items: split(
    "وزارة الموارد البشرية والتنمية الاجتماعية | المركز الوطني لتنمية القطاع غير الربحي | سياسة الخصوصية | شروط الاستخدام"
  ),
  footer_col3: "تواصل معنا",
  footer_legal: "© 2026 وزارة الموارد البشرية والتنمية الاجتماعية. جميع الحقوق محفوظة.",
  footer_credit: "تطوير وتشغيل أكاديمية التعلم",

  // ---------- Brief additions ----------
  lang_soon: "النسخة الإنجليزية متاحة في الإصدار القادم",

  journey_output_label: "المخرج",
  journey_role_label: "الجهة المنفذة",

  tracks_indicators_label: "مؤشراً",
  tracks_standards_label: "معايير",
  tracks_summary_tracks: "مسارات",
  tracks_summary_standards: "معياراً",
  tracks_summary_indicators: "مؤشراً",
  tracks_standards_heading: "معايير المسار",

  map_title: "التوزيع الجغرافي للمنظمات",
  map_subtitle: "عدد المنظمات الأهلية المسجلة في كل منطقة إدارية",
  map_note: "بيانات توضيحية",
  map_total: "الإجمالي",
  map_org_umbrella: "منظمة أهلية",
  map_association: "جمعية أهلية",
  map_foundation: "مؤسسة أهلية",
  map_ranking_title: "ترتيب المناطق",
  map_show_all: "عرض كل المناطق",
  map_share: "من الإجمالي الوطني",
  map_rank: "الترتيب",
  map_rank_of: "من",
  map_legend_label: "عدد المنظمات",
  map_aria: "خريطة المملكة العربية السعودية حسب المناطق الإدارية",
  map_national_view: "على مستوى المملكة",

  cta_title: "ابدأ تقييم منظمتك",
  cta_subtitle: "سجّل منظمتك وابدأ التقييم الذاتي وفق أداة القياس المعتمدة.",

  login_title: "تسجيل الدخول",
  login_subtitle: "ادخل إلى حسابك في مركز التمكين",
  nafath_btn: "الدخول عبر النفاذ الوطني الموحد",
  login_or: "أو",
  login_email: "البريد الإلكتروني",
  login_password: "كلمة المرور",
  login_remember: "تذكرني",
  login_forgot: "نسيت كلمة المرور؟",
  login_submit: "دخول",
  login_submitting: "جارٍ الدخول",
  login_error_generic: "تعذر تسجيل الدخول. تحقق من البريد الإلكتروني وكلمة المرور.",
  login_error_email_required: "أدخل البريد الإلكتروني.",
  login_error_email_invalid: "أدخل بريداً إلكترونياً صحيحاً، مثل name@example.com.",
  login_error_password_required: "أدخل كلمة المرور.",
  login_show_password: "إظهار كلمة المرور",
  login_hide_password: "إخفاء كلمة المرور",
  tab_nafath: "النفاذ الوطني",
  tab_email: "البريد الإلكتروني",
  nafath_hint: "للأفراد وممثلي المنظمات المسجلين في النفاذ الوطني الموحد",
  help_guide: "دليل استخدام المنصة",
  help_support: "الدعم الفني",
  login_method_label: "طريقة الدخول",
  help_guide_soon: "دليل استخدام المنصة متاح قريباً",
  register_prompt: "منظمة جديدة؟",
  register_link: "سجّل منظمتك",

  status_not_started: "لم يبدأ",
  status_in_progress: "قيد التقييم",
  status_submitted: "مرسل للمراجعة",
  status_returned: "معاد للاستكمال",
  status_approved: "معتمد",

  empty_default: "لا توجد بيانات بعد",
  not_found_title: "الصفحة غير موجودة",
  not_found_desc: "الرابط غير صحيح أو أن الصفحة نُقلت.",
  not_found_action: "العودة إلى الرئيسية",

  // ---------- Shell ----------
  logo_alt: "وزارة الموارد البشرية والتنمية الاجتماعية",
  vision_alt: "رؤية المملكة 2030",
  main_nav: "القائمة الرئيسية",
  open_menu: "فتح القائمة",
  more_options: "خيارات إضافية",
  breadcrumb_label: "مسار التنقل",
  account_fallback: "حسابي",
  account_dashboard: "لوحة التحكم",
  account_settings: "الإعدادات",
  account_profile: "الملف الشخصي",
  logout: "تسجيل الخروج",
  skip_to_content: "تخطَّ إلى المحتوى",
  footer_email_missing: "البريد الإلكتروني غير متوفر",
  footer_phone_missing: "رقم الهاتف غير متوفر",

  shell_context: {
    admin: "لوحة الإدارة",
    evaluator: "بوابة المدقق",
    organization: "بوابة المنظمة",
  },
  shell_user: {
    admin: "مدير النظام",
    evaluator: "المدقق",
  },
  nav_admin: {
    dashboard: "لوحة التحكم",
    group_management: "الإدارة",
    users: "المستخدمون",
    roles: "الصلاحيات",
    associations: "الجمعيات",
    requests: "طلبات التسجيل",
    reviewers: "المدققون",
    group_performance: "الأداء",
    setup: "تهيئة التقييم",
    years: "سنوات التقييم",
    reports: "التقارير",
  },
  nav_evaluator: {
    dashboard: "لوحة التحكم",
    assignments: "التقييمات المسندة",
  },
  sidebar_collapse: "طي القائمة الجانبية",
  sidebar_expand: "توسيع القائمة الجانبية",

  // ---------- Shared primitives ----------
  table_loading: "جارٍ تحميل البيانات",
  search_placeholder: "ابحث",
  filter_all: "الكل",
  missing_value: "غير متوفر",
  close: "إغلاق",
  profile_title: "الملف الشخصي",
  profile_desc: "بيانات حسابك في المنصة",
  profile_account: "معلومات الحساب",
  profile_email: "البريد الإلكتروني",
  profile_role: "الدور",
  no_role_title: "لا توجد صلاحيات",
  no_role_desc: "ليس لديك دور محدد في النظام. تواصل مع مدير النظام.",
} as const;


/** Track ids double as in-page anchors (#track-orientation …), in nav_tracks_items order. */
export const TRACKS = [
  { id: "track-orientation", entry: copy.track_orientation },
  { id: "track-team", entry: copy.track_team },
  { id: "track-partnerships", entry: copy.track_partnerships },
  { id: "track-programs", entry: copy.track_programs },
  { id: "track-impact", entry: copy.track_impact },
].map(({ id, entry }) => ({ id, name: entry[0], standards: entry[1], standardList: entry[1].split("، ") }));

/** Journey steps (home page), in order */
export const JOURNEY_STEPS = [
  {
    title: "تسجيل المنظمة",
    desc: "يسجل ممثل المنظمة بيانات الجمعية ويرفع وثائقها، وتعتمد الوزارة الطلب.",
    role: "ممثل المنظمة",
    output: "حساب منظمة معتمد",
  },
  {
    title: "التقييم الذاتي ورفع الشواهد",
    desc: "تجيب المنظمة على بنود التحقق ضمن 61 مؤشراً، وترفق الشواهد لكل بند، وتحفظ تقدمها قبل الإرسال.",
    role: "ممثل المنظمة",
    output: "تقييم مكتمل مرسل للمراجعة",
  },
  {
    title: "المراجعة والاعتماد",
    desc: "يراجع المدقق الشواهد على مستوى البند، ثم يعتمد التقييم أو يعيده للاستكمال مع الملاحظات.",
    role: "المدقق",
    output: "تقييم معتمد",
  },
  {
    title: "النتائج وخطة التحسين",
    desc: "تصدر نتيجة كل مؤشر ومسار، مع نقاط القوة وفرص التحسين وخطة تحسين مقترحة.",
    role: "المنظمة والوزارة",
    output: "تقرير النتائج وخطة التحسين",
  },
] as const;

/** Indicators per track, in TRACKS order (tracks_detail) */
export const TRACK_INDICATORS: Record<string, number> = {
  "track-orientation": 13,
  "track-team": 14,
  "track-partnerships": 10,
  "track-programs": 14,
  "track-impact": 10,
};
export { homeCopy } from "@/lib/strings/home";
export { authCopy } from "@/lib/strings/auth";
export { orgCopy } from "@/lib/strings/org";
export { evaluatorCopy } from "@/lib/strings/evaluator";
export { adminCopy } from "@/lib/strings/admin";
export { adminSetupCopy } from "@/lib/strings/adminSetup";
export { assessmentCopy } from "@/lib/strings/assessment";
export { pagesCopy } from "@/lib/strings/pages";
