/** Authentication pages (login, register, forgot password, individual access, pending approval, under review). Re-exported from @/lib/copy. */
export const authCopy = {
  // Shared
  back_to_login: "العودة إلى تسجيل الدخول",
  email_placeholder: "name@example.com",
  password_hint: "6 أحرف على الأقل.",
  error_password_short: "استخدم 6 أحرف على الأقل في كلمة المرور.",
  error_confirm_required: "أعد إدخال كلمة المرور للتأكيد.",
  error_password_mismatch: "كلمتا المرور غير متطابقتين.",
  confirm_password: "تأكيد كلمة المرور",
  support_prompt: "للاستفسارات والدعم الفني",
  support_link: "تواصل معنا",

  // Login
  individual_prompt: "حساب فردي؟",
  individual_link: "دخول الأفراد",

  // Nafath (simulated approval, as before)
  nafath_title: "التحقق عبر النفاذ الوطني الموحد",
  nafath_desc: "افتح تطبيق نفاذ ووافق على طلب الدخول.",
  nafath_waiting: "بانتظار الموافقة في تطبيق نفاذ",
  nafath_confirm: "تأكيد الموافقة",
  nafath_cancel: "إلغاء والعودة",
  nafath_demo_note: "نسخة تجريبية: الموافقة محاكاة.",
  nafath_success_title: "تم التحقق بنجاح",
  nafath_success_desc: "جارٍ تحويلك إلى لوحة التحكم.",

  // Forgot password
  forgot_title: "استعادة كلمة المرور",
  forgot_subtitle: "أدخل بريدك الإلكتروني لنرسل إليك رابط تعيين كلمة مرور جديدة.",
  forgot_submit: "إرسال الرابط",
  forgot_submitting: "جارٍ الإرسال",
  forgot_sent_title: "تحقق من بريدك الإلكتروني",
  forgot_sent_desc:
    "إذا كان البريد مسجلاً لدينا فستصلك رسالة برابط تعيين كلمة المرور. راجع أيضاً مجلد البريد غير المرغوب فيه.",

  // Register (organization)
  register_title: "تسجيل منظمة",
  register_subtitle: "أنشئ حساب منظمتك لبدء التقييم الذاتي.",
  register_steps_label: "خطوات التسجيل",
  register_step_counter: "الخطوة",
  register_step_of: "من",
  register_steps: ["بيانات المنظمة", "بيانات الدخول", "بيانات الممثل"],
  org_name: "اسم المنظمة",
  org_name_placeholder: "اختر المنظمة",
  /** Demo organizations; the selected value is stored as-is in profiles.organization_name */
  org_options: ["منظمة تجريبية 1", "منظمة تجريبية 2"],
  reg_number: "رقم التسجيل",
  rep_full_name: "الاسم الكامل",
  rep_full_name_placeholder: "اسم ممثل المنظمة",
  rep_id_number: "رقم الهوية",
  rep_mobile: "رقم الجوال",
  rep_mobile_placeholder: "9665XXXXXXXX",
  rep_email: "البريد الإلكتروني للممثل",
  rep_login_name: "اسم المستخدم",
  account_created_note: "أُنشئ حساب المنظمة. أكمل بيانات الممثل لتفعيله.",
  register_next: "التالي",
  register_back: "السابق",
  register_create: "إنشاء الحساب",
  register_creating: "جارٍ إنشاء الحساب",
  register_save: "حفظ وتفعيل الحساب",
  register_saving: "جارٍ الحفظ",
  error_org_required: "اختر اسم المنظمة.",
  error_full_name_required: "أدخل الاسم الكامل.",
  error_id_required: "أدخل رقم الهوية.",
  error_mobile_required: "أدخل رقم الجوال.",
  error_save_failed: "تعذر حفظ البيانات. حاول مرة أخرى.",
  register_success_title: "تم تفعيل حساب المنظمة",
  register_success_desc: "يمكنك الآن الدخول إلى لوحة التحكم وبدء التقييم الذاتي.",
  register_success_action: "الذهاب إلى لوحة التحكم",
  login_prompt: "لديك حساب؟",

  // Individual access
  individual_login_title: "دخول الأفراد",
  individual_login_subtitle: "ادخل إلى حسابك للوصول إلى رحلة الأفراد.",
  individual_register_title: "حساب فرد جديد",
  individual_register_subtitle: "أنشئ حساباً للوصول إلى رحلة الأفراد.",
  individual_mode_label: "نوع الإجراء",
  individual_mode_login: "تسجيل الدخول",
  individual_mode_register: "حساب جديد",
  individual_register_submit: "إنشاء الحساب",
  individual_register_submitting: "جارٍ إنشاء الحساب",
  individual_only_error: "هذه الصفحة مخصصة لدخول الأفراد. استخدم صفحة تسجيل الدخول العامة.",
  individual_register_error: "تعذر إنشاء الحساب. حاول مرة أخرى.",
  individual_register_success: "تم إنشاء الحساب. تحقق من بريدك الإلكتروني لتأكيده.",
  org_prompt: "تمثل منظمة؟",
  org_link: "الدخول إلى حساب المنظمة",

  // Pending approval
  pending_title: "طلب التسجيل قيد المراجعة",
  pending_desc: "استلمنا طلب تسجيل منظمتك، وسيُفعَّل الحساب بعد اعتماده من مدير النظام.",

  // Under review
  review_title: "التقييم قيد التدقيق",
  review_desc: "استلمنا التقييم الذاتي والشواهد، ويراجعها المدقق الآن. لا يمكن تعديل البيانات خلال التدقيق.",
  review_org_label: "المنظمة",
  review_status_label: "الحالة",
  review_action: "العودة إلى لوحة التحكم",
} as const;
