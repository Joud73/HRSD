import {
  GraduationCap,
  FileText,
  Award,
  Target,
  BookOpen,
  Users,
  Laptop,
  TrendingUp,
  LucideIcon,
} from "lucide-react";

export interface CourseMaterial {
  name: string;
  type: string;
  size?: string;
}

export interface CourseDay {
  title: string;
  materials: CourseMaterial[];
}

export interface TrainingProgram {
  id: number;
  title: string;
  description: string;
  fullDescription: string;
  duration: string;
  type: string;
  deliveryMode: string;
  category: string;
  icon: LucideIcon;
  objectives: string[];
  requirements: string[];
  instructor: string;
  startDate: string;
  endDate: string;
  time: string;
  schedule?: {
    days: string[];
    time: string;
    sessions: number;
  };
  courseDays: CourseDay[];
}

export interface TrainingOutput {
  id: number;
  title: string;
  description: string;
  icon: LucideIcon;
  isComingSoon: boolean;
}

// Categories for filtering
export const categories = [
  "جميع البرامج",
  "القيادة والإدارة",
  "المهارات المهنية",
  "التقنية والابتكار",
];

// Training programs data with categories
export const trainingPrograms: TrainingProgram[] = [
  {
    id: 1,
    title: "أساسيات القيادة الإدارية",
    description:
      "برنامج شامل يغطي المفاهيم الأساسية للقيادة الفعالة وإدارة الفرق في بيئة العمل الحديثة.",
    fullDescription:
      "المشاريع تحسب الحياة العملية والشخصية، ولكي تنجز وترتقي في أماكن العمل، وفي مشاريعنا وأعمالنا الخاصة فحن بحاجة ماسة لتعلم هذا الفن. هذه الدورة هي عبارة عن برنامج متكامل لإدارة المشاريع يعتمد بشكل رئيسي على منهجية إدارة المشاريع الخاصة بالمعهد العالمي لإدارة المشاريع والمسمى 'الدليل المعرفي لإدارة المشاريع'. الإصدار الأخير (PMP) وهو الإصدار المعتمد الجديد، وهو بالتالي يقوم بتغطية كل ما يتعلق بشهادة 'مدير المشاريع المحترف'.",
    duration: "4 أسابيع",
    type: "تفاعلي",
    deliveryMode: "عن بُعد",
    category: "القيادة والإدارة",
    icon: Users,
    objectives: [
      "فهم أساليب القيادة المختلفة",
      "تطوير مهارات اتخاذ القرار",
      "بناء فرق عمل فعالة",
      "إدارة التغيير في المؤسسات",
    ],
    requirements: ["إتمام مرحلة التسجيل", "الالتزام بالحضور"],
    instructor: "د. أحمد الفهد",
    startDate: "الأحد الموافق 27 أبريل",
    endDate: "يوم الخميس الموافق 1 مايو",
    time: "6م وحتى 9م",
    schedule: {
      days: ["الأحد", "الثلاثاء", "الخميس"],
      time: "6:00 م - 8:00 م",
      sessions: 12,
    },
    courseDays: [
      {
        title: "اليوم الأول",
        materials: [
          { name: "عرض تقديمي أساسيات القيادة الإدارية اليوم الأول", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الثاني",
        materials: [
          { name: "أساسيات القيادة الإدارية اليوم التدريبي الثاني", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الثالث",
        materials: [],
      },
      {
        title: "اليوم الرابع",
        materials: [],
      },
      {
        title: "اليوم الخامس",
        materials: [],
      },
    ],
  },
  {
    id: 2,
    title: "مهارات التواصل المهني",
    description:
      "تعلم فنون التواصل الفعال في بيئة العمل، بما في ذلك العروض التقديمية والتفاوض وإدارة الاجتماعات.",
    fullDescription:
      "يهدف هذا البرنامج إلى تطوير مهارات التواصل الفعال في بيئة العمل المهنية. يتضمن البرنامج تدريبات عملية على العروض التقديمية، فنون الاستماع الفعال، التفاوض المهني، وإدارة الاجتماعات بكفاءة عالية. سيتمكن المشاركون من تطبيق هذه المهارات مباشرة في بيئة عملهم.",
    duration: "3 أسابيع",
    type: "تطبيقي",
    deliveryMode: "حضوري",
    category: "المهارات المهنية",
    icon: BookOpen,
    objectives: [
      "إتقان فن العرض والإلقاء",
      "تطوير مهارات الاستماع الفعال",
      "التفاوض وحل النزاعات",
    ],
    requirements: ["لا يوجد متطلبات مسبقة"],
    instructor: "أ. سارة المحمد",
    startDate: "الأحد الموافق 22 يناير",
    endDate: "يوم الأربعاء الموافق 10 فبراير",
    time: "4م وحتى 7م",
    schedule: {
      days: ["الاثنين", "الأربعاء"],
      time: "4:00 م - 7:00 م",
      sessions: 9,
    },
    courseDays: [
      {
        title: "اليوم الأول",
        materials: [
          { name: "مقدمة في التواصل المهني", type: "PPTX" },
          { name: "دليل المتدرب", type: "PDF" },
        ],
      },
      {
        title: "اليوم الثاني",
        materials: [
          { name: "العروض التقديمية الفعالة", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الثالث",
        materials: [
          { name: "فنون التفاوض", type: "PPTX" },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "التخطيط الاستراتيجي",
    description:
      "برنامج متقدم في التخطيط الاستراتيجي وتحديد الأهداف وقياس مؤشرات الأداء الرئيسية.",
    fullDescription:
      "برنامج متقدم ومتخصص في التخطيط الاستراتيجي للمؤسسات الحكومية والخاصة. يغطي البرنامج كيفية وضع الخطط الاستراتيجية، تحديد الأهداف الذكية، بناء مؤشرات الأداء الرئيسية، وتحليل البيئة الداخلية والخارجية باستخدام أدوات التحليل المختلفة مثل SWOT وPESTEL.",
    duration: "5 أسابيع",
    type: "تفاعلي",
    deliveryMode: "مدمج",
    category: "القيادة والإدارة",
    icon: Target,
    objectives: [
      "وضع الخطط الاستراتيجية",
      "تحديد مؤشرات الأداء الرئيسية",
      "تحليل البيئة الداخلية والخارجية",
    ],
    requirements: ["إتمام برنامج أساسيات القيادة"],
    instructor: "د. خالد العمري",
    startDate: "السبت الموافق 1 فبراير",
    endDate: "يوم الثلاثاء الموافق 5 مارس",
    time: "5م وحتى 8م",
    schedule: {
      days: ["السبت", "الثلاثاء"],
      time: "5:00 م - 8:00 م",
      sessions: 15,
    },
    courseDays: [
      {
        title: "اليوم الأول",
        materials: [
          { name: "مقدمة في التخطيط الاستراتيجي", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الثاني",
        materials: [
          { name: "تحليل SWOT", type: "PPTX" },
          { name: "نموذج التحليل", type: "XLSX" },
        ],
      },
      {
        title: "اليوم الثالث",
        materials: [
          { name: "بناء مؤشرات الأداء", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الرابع",
        materials: [],
      },
      {
        title: "اليوم الخامس",
        materials: [],
      },
    ],
  },
  {
    id: 4,
    title: "إدارة المشاريع الاحترافية",
    description:
      "برنامج معتمد في إدارة المشاريع وفق أفضل الممارسات والمعايير العالمية مع شهادة معتمدة.",
    fullDescription:
      "المشاريع تحسب الحياة العملية والشخصية، ولكي تنجز وترتقي في أماكن العمل، وفي مشاريعنا وأعمالنا الخاصة فحن بحاجة ماسة لتعلم هذا الفن. هذه الدورة هي عبارة عن برنامج متكامل لإدارة المشاريع (PMI) يعتمد بشكل رئيسي على منهجية إدارة المشاريع الخاصة بالمعهد العالمي لإدارة المشاريع والمسمى 'الدليل المعرفي لإدارة المشاريع'. الإصدار الأخير (PMP) وهو الإصدار المعتمد الجديد، وهو بالتالي يقوم بتغطية كل ما يتعلق بشهادة 'مدير المشاريع المحترف'.",
    duration: "6 أسابيع",
    type: "تطبيقي",
    deliveryMode: "عن بُعد",
    category: "المهارات المهنية",
    icon: TrendingUp,
    objectives: [
      "تخطيط وتنفيذ المشاريع",
      "إدارة الموارد والميزانيات",
      "متابعة وتقييم الأداء",
    ],
    requirements: ["خبرة سابقة في العمل المؤسسي"],
    instructor: "م. فاطمة الزهراني",
    startDate: "الأحد الموافق 15 فبراير",
    endDate: "يوم الخميس الموافق 28 مارس",
    time: "7م وحتى 9م",
    schedule: {
      days: ["الأحد", "الثلاثاء", "الخميس"],
      time: "7:00 م - 9:00 م",
      sessions: 18,
    },
    courseDays: [
      {
        title: "اليوم الأول",
        materials: [
          { name: "عرض تقديمي إدارة المشاريع الاحترافية اليوم الأول", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الثاني",
        materials: [
          { name: "إدارة المشاريع الاحترافية اليوم التدريبي الثاني", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الثالث",
        materials: [],
      },
      {
        title: "اليوم الرابع",
        materials: [],
      },
      {
        title: "اليوم الخامس",
        materials: [],
      },
    ],
  },
  {
    id: 5,
    title: "الابتكار وريادة الأعمال",
    description:
      "اكتشف عالم الابتكار والريادة وتعلم كيفية تحويل الأفكار إلى مشاريع ناجحة ومستدامة.",
    fullDescription:
      "برنامج شامل يهدف إلى تطوير مهارات الابتكار والتفكير الإبداعي وريادة الأعمال. يتعلم المشاركون كيفية توليد الأفكار الإبداعية، بناء نماذج العمل الناجحة، وجذب الاستثمارات. البرنامج يتضمن ورشات عمل تطبيقية ودراسات حالة من مشاريع ناشئة ناجحة.",
    duration: "4 أسابيع",
    type: "تفاعلي",
    deliveryMode: "حضوري",
    category: "التقنية والابتكار",
    icon: GraduationCap,
    objectives: [
      "توليد الأفكار الإبداعية",
      "بناء نموذج العمل",
      "جذب الاستثمارات",
    ],
    requirements: ["شغف بالابتكار والتطوير"],
    instructor: "أ. محمد الدوسري",
    startDate: "السبت الموافق 1 مارس",
    endDate: "يوم الأربعاء الموافق 26 مارس",
    time: "5م وحتى 7م",
    schedule: {
      days: ["السبت", "الاثنين", "الأربعاء"],
      time: "5:00 م - 7:00 م",
      sessions: 12,
    },
    courseDays: [
      {
        title: "اليوم الأول",
        materials: [
          { name: "مقدمة في الابتكار", type: "PPTX" },
          { name: "Business Model Canvas", type: "PDF" },
        ],
      },
      {
        title: "اليوم الثاني",
        materials: [
          { name: "التفكير التصميمي", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الثالث",
        materials: [
          { name: "بناء نموذج العمل", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الرابع",
        materials: [
          { name: "جذب الاستثمارات", type: "PPTX" },
        ],
      },
    ],
  },
  {
    id: 6,
    title: "التحول الرقمي",
    description:
      "برنامج متخصص في فهم التحول الرقمي وتطبيقاته في المؤسسات الحكومية والخاصة.",
    fullDescription:
      "برنامج متخصص ومتقدم في فهم وتطبيق التحول الرقمي في المؤسسات. يغطي البرنامج استراتيجيات التحول الرقمي، التقنيات الناشئة، إدارة التغيير التقني، والبنية التحتية الرقمية. يتضمن أمثلة عملية ودراسات حالة من تجارب تحول رقمي ناجحة.",
    duration: "4 أسابيع",
    type: "نظري وتطبيقي",
    deliveryMode: "مدمج",
    category: "التقنية والابتكار",
    icon: Laptop,
    objectives: [
      "فهم استراتيجيات التحول الرقمي",
      "تطبيق التقنيات الحديثة",
      "إدارة التغيير التقني",
    ],
    requirements: ["معرفة أساسية بالتقنية"],
    instructor: "د. نورة السعيد",
    startDate: "الأحد الموافق 15 مارس",
    endDate: "يوم الأربعاء الموافق 9 أبريل",
    time: "6م وحتى 9م",
    schedule: {
      days: ["الأحد", "الأربعاء"],
      time: "6:00 م - 9:00 م",
      sessions: 12,
    },
    courseDays: [
      {
        title: "اليوم الأول",
        materials: [
          { name: "مقدمة في التحول الرقمي", type: "PPTX" },
          { name: "دراسات حالة رقمية", type: "PDF" },
        ],
      },
      {
        title: "اليوم الثاني",
        materials: [
          { name: "استراتيجيات التحول", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الثالث",
        materials: [
          { name: "إدارة التغيير", type: "PPTX" },
        ],
      },
      {
        title: "اليوم الرابع",
        materials: [
          { name: "التطبيق العملي", type: "PPTX" },
          { name: "أدوات التقييم", type: "XLSX" },
        ],
      },
    ],
  },
];

// Outputs data
export const outputs: TrainingOutput[] = [
  {
    id: 1,
    title: "شهادة إتمام المرحلة",
    description: "شهادة رسمية معتمدة تثبت إتمامك لمرحلة التأهيل والتدريب بنجاح.",
    icon: Award,
    isComingSoon: false,
  },
  {
    id: 2,
    title: "الخطة التطويرية الشخصية",
    description: "خطة مفصلة لتطوير مهاراتك بناءً على نتائج التقييم والتدريب.",
    icon: Target,
    isComingSoon: false,
  },
  {
    id: 3,
    title: "تقرير الكفاءات",
    description: "تقرير شامل يوضح مستوى كفاءاتك ونقاط القوة والتحسين.",
    icon: FileText,
    isComingSoon: false,
  },
];

export const getProgramById = (id: number): TrainingProgram | undefined => {
  return trainingPrograms.find((p) => p.id === id);
};
