/** Organization dashboard. Re-exported from @/lib/copy. */
export const orgCopy = {
  dashboard_title_fallback: "لوحة التحكم",
  load_error: "تعذّر تحميل بيانات التقييم.",
  retry: "إعادة المحاولة",

  // Identity band
  band_label: "بيانات المنظمة والدورة",
  registration: (n: string) => `رقم التسجيل ${n}`,
  days_left_unit: "يوماً متبقياً",
  deadline_on: (date: string) => `الموعد النهائي ${date}`,
  deadline_passed: "انتهت فترة التقييم الذاتي",
  deadline_today: "ينتهي التقييم الذاتي اليوم",

  // Journey
  journey_label: "مراحل رحلة التقييم",
  journey_steps: [
    { title: "التقييم الذاتي", description: "تحدد المنظمة البنود وترفق الشواهد" },
    { title: "إرسال للمراجعة", description: "ترسل المنظمة التقييم قبل الموعد النهائي" },
    { title: "المراجعة والتدقيق", description: "يتحقق المدقق من الشواهد" },
    { title: "اعتماد النتائج", description: "تصدر النتيجة المعتمدة" },
    { title: "خطة التحسين", description: "تصدر خطة التحسين والتقرير التعقيبي" },
  ],

  // Next action
  next_label: "الخطوة التالية",
  next_start: (track: string) => `ابدأ التقييم الذاتي من مسار ${track}.`,
  next_start_action: "ابدأ التقييم",
  next_progress: (met: string, total: string, remaining: string) => `أكملت ${met} من ${total}. المتبقي: ${remaining}.`,
  next_progress_action: (track: string) => `متابعة التقييم: ${track}`,
  next_all_ticked: "اكتملت البنود. راجع الشواهد ثم أرسل التقييم.",
  next_in_review: (date: string) => `تقييمك قيد المراجعة منذ ${date}. سيصلك إشعار عند صدور النتيجة.`,
  next_returned_title: "أُعيد التقييم للاستكمال",
  next_returned_action: "استكمال التقييم",
  next_approved: "اعتُمدت نتيجة التقييم.",
  next_approved_action: "عرض النتيجة",
  next_closed: "انتهت فترة التقييم الذاتي، ولم يُرسل التقييم.",
  next_not_open: (date: string) => `تبدأ فترة التقييم الذاتي في ${date}.`,
  no_cycle: "لا توجد دورة تقييم مفتوحة حالياً.",
  list_separator: "، ",

  // Summary
  summary_label: "ملخص التقييم",
  progress_title: "إنجاز التقييم",
  progress_items: (met: string, total: string) => `${met} من ${total} محدداً`,
  progress_indicators: (n: string, m: string) => `المؤشرات المكتملة ${n} من ${m}`,
  progress_evidence: (k: string) => `الشواهد المرفقة ${k}`,
  result_title: "النتيجة التقديرية",
  result_note: "تُحتسب البنود المحددة المرفق لها شاهد. تصبح النتيجة نهائية بعد اعتماد المراجعة.",
  result_warning: (n: string) => `${n} محدد دون شاهد لا يُحتسب`,

  // Tracks
  tracks_title: "مسارات التقييم",
  tracks_legend: "مستوى المؤشر",
  track_items: (met: string, total: string) => `${met} من ${total}`,
  track_start: "ابدأ",
  track_continue: "تابع",
  track_view: "عرض المسار",
  track_complete: "مكتمل",
  track_action_label: (action: string, track: string) => `${action}: مسار ${track}`,
  indicator_square: (n: string, label: string, pct: string) => `المؤشر ${n}: ${label} (${pct}%)`,
  indicators_label: (track: string) => `مؤشرات مسار ${track}`,

  // How the result is calculated
  how_title: "كيف تُحتسب النتيجة؟",
  how_lines: [
    "يُحتسب البند عند تحديده وإرفاق شاهد واحد له على الأقل.",
    "نتيجة المؤشر نسبة بنوده المحتسبة، ويحدد الجدول مستواه.",
    "النتيجة التقديرية للتقييم نسبة البنود المحتسبة من جميع بنود الدورة.",
  ],
  how_range: "النطاق",
  how_level: "المستوى",

  // Results by cycle
  history_title: "النتائج حسب الدورة",
  history_cycle: "الدورة",
  history_status: "الحالة",
  history_score: "النتيجة",
  history_estimated: "تقديرية",
  history_empty: "لا توجد نتائج بعد.",
} as const;
