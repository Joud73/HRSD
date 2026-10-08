// Platform copy, keyed exactly as in CLAUDE.md "## Copy". Edit there first, then here.

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
} as const;

/** Track ids double as in-page anchors (#track-orientation …), in nav_tracks_items order. */
export const TRACKS = [
  { id: "track-orientation", entry: copy.track_orientation },
  { id: "track-team", entry: copy.track_team },
  { id: "track-partnerships", entry: copy.track_partnerships },
  { id: "track-programs", entry: copy.track_programs },
  { id: "track-impact", entry: copy.track_impact },
].map(({ id, entry }) => ({ id, name: entry[0], standards: entry[1] }));
