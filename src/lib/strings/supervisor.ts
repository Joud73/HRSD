/** Technical supervisor (المشرف الفني): follow-up dashboard, organizations, proxy entry. Re-exported from @/lib/copy. */
export const supervisorCopy = {
  // Dashboard
  dashboard_title: "لوحة المتابعة",
  dashboard_desc: "تابع تقدم المنظمات في دورة التقييم المفتوحة.",
  load_error: "تعذّر تحميل البيانات.",
  retry: "إعادة المحاولة",
  kpi_organizations: "المنظمات المسجلة",
  kpi_evaluators: "المدققون",
  kpi_assessments: "التقييمات في الدورة المفتوحة",
  kpi_awaiting_issue: "بانتظار الإصدار",
  kpi_issued: "صدرت النتائج",
  status_title: "التقييمات حسب الحالة",
  status_cycle: (name: string) => `دورة التقييم: ${name}`,
  no_cycle: "لا توجد دورة تقييم مفتوحة حالياً",
  open_organizations: "عرض المنظمات",

  // Organizations
  organizations_title: "المنظمات",
  organizations_desc: "حالة التقييم الذاتي لكل منظمة في الدورة المفتوحة، مع إدخال التقييم نيابة عن المنظمات غير المتصلة.",
  search: "ابحث باسم المنظمة أو رقم التسجيل",
  status_label: "تصفية حسب الحالة",
  status_all: "كل الحالات",
  col_organization: "المنظمة",
  col_registration: "رقم التسجيل",
  col_status: "حالة التقييم",
  col_progress: "نسبة الإنجاز",
  col_deadline: "الموعد النهائي",
  col_evaluator: "المدقق",
  col_actions: "الإجراءات",
  not_assigned: "غير مسند",
  proxy_action: "إدخال التقييم نيابة عن المنظمة",
  results_action: "النتائج",
  empty: "لا توجد منظمات مسجلة بعد.",
  no_results: "لا توجد نتائج مطابقة.",
  clear_filters: "مسح التصفية",

  // Results and final sign-off
  results_title: "نتائج التقييم",
  results_desc: "النتائج المجمدة عند اعتماد المدقق، والمستندات قبل إصدارها للمنظمة.",
  results_not_found: "التقييم غير موجود.",
  col_cycle: "دورة التقييم",
  col_approved: "تاريخ اعتماد المدقق",
  signoff_label: "الاعتماد النهائي",
  return_note_required: "اكتب ملاحظة الإعادة للمدقق.",
  return_note_hint: "مطلوبة. تظهر للمدقق.",
  toast_returned_to_evaluator: "أُعيد التقييم للمدقق",

  // Proxy entry
  proxy_banner: (name: string) => `أنت تُدخل التقييم نيابة عن: ${name}`,
  proxy_banner_note: "تُسجَّل الإجابات والشواهد باسمك، وتظهر للمنظمة في لوحتها.",
  proxy_tracks_label: "مسارات التقييم",
} as const;
