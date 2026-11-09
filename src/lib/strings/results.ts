/** Frozen results shown to the final sign-off and, once issued, to the organization. Re-exported from @/lib/copy. */
export const resultsCopy = {
  overall_label: "النتيجة الإجمالية",
  self_pct: "النتيجة الذاتية",
  review_pct: "نتيجة المراجعة",
  review_note: "نسبة البنود التي أكدها المدقق من إجمالي البنود.",
  tracks_title: "النتائج حسب المسار",
  col_track: "المسار",
  col_self: "النتيجة الذاتية",
  col_review: "نتيجة المراجعة",
  col_indicators: "المؤشرات",
  indicators_label: (track: string) => `مؤشرات ${track}`,
  indicator_square: (n: string, label: string, pct: string) => `المؤشر ${n}: ${label} (${pct}%)`,
  legend_label: "مستويات المؤشرات",
  not_frozen: "لم يعتمد المدقق هذا التقييم بعد، فلا توجد نتائج مجمدة.",
  load_error: "تعذّر تحميل النتائج.",
  retry: "إعادة المحاولة",
} as const;
