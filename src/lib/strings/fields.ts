/**
 * HRSD data fields (organization, delegate, evaluator): the labels and their order are fixed by the ministry
 * and shared by every form and detail view. Re-exported from @/lib/copy.
 */
export const fieldsCopy = {
  entity_type: "نوع الكيان",
  entity_types: { association: "جمعية أهلية", foundation: "مؤسسة أهلية" },

  section_org: "بيانات المنظمة",
  org: {
    registration_number: "رقم التسجيل",
    registration_date: "تاريخ التسجيل",
    name: "اسم المنظمة",
    sub_classification: "التصنيف الفرعي",
    social_dev_center: "مركز التنمية الاجتماعية",
    region: "المنطقة",
    city: "المدينة أو المحافظة",
    district: "المركز أو الحي",
    address: "العنوان",
    employees_count: "عدد العاملين بالمنظمة",
    email: "البريد الإلكتروني",
    website: "الموقع الإلكتروني",
  },

  section_delegate: "بيانات المفوض",
  delegate: {
    id_number: "رقم الهوية",
    name: "الاسم",
    mobile: "الجوال",
    email: "البريد الإلكتروني",
  },

  section_evaluator: "بيانات المقيم",
  evaluator: {
    id_number: "رقم الهوية",
    name: "الاسم",
    mobile: "الجوال",
    email: "البريد الإلكتروني",
    employer: "جهة العمل",
  },

  region_prefilled: "عُبئت من مركز التنمية الاجتماعية، ويمكن تعديلها.",
  identity_locked: "يعدّلها مدير النظام فقط.",
  id_locked: "لا يُعدَّل رقم الهوية بعد تسجيله.",
} as const;
