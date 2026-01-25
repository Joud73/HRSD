import { useState } from "react";
import { toast } from "sonner";
import {
  GraduationCap,
  FileText,
  Award,
  Target,
  BookOpen,
  Users,
  Laptop,
  TrendingUp,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrganizationJourney from "@/components/OrganizationJourney";
import TrainingBreadcrumb from "@/components/training/TrainingBreadcrumb";
import TrainingHero from "@/components/training/TrainingHero";
import TrainingCard from "@/components/training/TrainingCard";
import OutputCard from "@/components/training/OutputCard";
import TrainingProgramModal from "@/components/training/TrainingProgramModal";
import CategoryFilter from "@/components/training/CategoryFilter";

// Categories for filtering
const categories = [
  "جميع البرامج",
  "القيادة والإدارة",
  "المهارات المهنية",
  "التقنية والابتكار",
];

// Training programs data with categories
const trainingPrograms = [
  {
    id: 1,
    title: "أساسيات القيادة الإدارية",
    description:
      "برنامج شامل يغطي المفاهيم الأساسية للقيادة الفعالة وإدارة الفرق في بيئة العمل الحديثة. يتضمن البرنامج تدريبات عملية ودراسات حالة.",
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
    startDate: "15 يناير 2026",
  },
  {
    id: 2,
    title: "مهارات التواصل المهني",
    description:
      "تعلم فنون التواصل الفعال في بيئة العمل، بما في ذلك العروض التقديمية والتفاوض وإدارة الاجتماعات بكفاءة عالية.",
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
    startDate: "22 يناير 2026",
  },
  {
    id: 3,
    title: "التخطيط الاستراتيجي",
    description:
      "برنامج متقدم في التخطيط الاستراتيجي وتحديد الأهداف وقياس مؤشرات الأداء الرئيسية للمؤسسات الحكومية والخاصة.",
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
    startDate: "1 فبراير 2026",
  },
  {
    id: 4,
    title: "إدارة المشاريع الاحترافية",
    description:
      "برنامج معتمد في إدارة المشاريع وفق أفضل الممارسات والمعايير العالمية مع شهادة معتمدة عند الإتمام.",
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
    startDate: "15 فبراير 2026",
  },
  {
    id: 5,
    title: "الابتكار وريادة الأعمال",
    description:
      "اكتشف عالم الابتكار والريادة وتعلم كيفية تحويل الأفكار إلى مشاريع ناجحة ومستدامة في السوق.",
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
    startDate: "1 مارس 2026",
  },
  {
    id: 6,
    title: "التحول الرقمي",
    description:
      "برنامج متخصص في فهم التحول الرقمي وتطبيقاته في المؤسسات الحكومية والخاصة مع أمثلة عملية.",
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
    startDate: "15 مارس 2026",
  },
];

// Outputs data - removed برامج متقدمة، شبكة المتدربين، فرص التوظيف
const outputs = [
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

const TrainingStage = () => {
  const [enrolledPrograms, setEnrolledPrograms] = useState<number[]>([1, 2]);
  const [selectedProgram, setSelectedProgram] = useState<
    (typeof trainingPrograms)[0] | null
  >(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("جميع البرامج");

  const handleEnroll = (programId: number) => {
    if (!enrolledPrograms.includes(programId)) {
      setEnrolledPrograms([...enrolledPrograms, programId]);
      toast.success("تم الالتحاق بالبرنامج بنجاح!");
    }
  };

  const handleOpenDetails = (program: (typeof trainingPrograms)[0]) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProgram(null);
  };

  // Filter programs by category
  const filteredPrograms =
    activeCategory === "جميع البرامج"
      ? trainingPrograms
      : trainingPrograms.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - using platform header */}
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-20" />
      
      {/* Organization Journey */}
      <OrganizationJourney />

      {/* Breadcrumb */}
      <TrainingBreadcrumb />

      {/* Hero Section */}
      <TrainingHero />

      {/* Training Programs Section */}
      <section
        id="training-programs"
        className="py-12 md:py-16 px-4 bg-section-light"
        dir="rtl"
      >
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="mb-6 md:mb-8">
            <h2 className="section-title">المسار التدريبي</h2>
            <div className="section-title-underline" />
            <p className="mt-4 text-muted-foreground max-w-2xl font-hrsd-medium">
              اختر من بين مجموعة متنوعة من البرامج التدريبية المصممة لتطوير
              مهاراتك وتعزيز قدراتك المهنية.
            </p>
          </div>

          {/* Category Filter Pills */}
          <div className="mb-8">
            <CategoryFilter
              categories={categories}
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
            />
          </div>

          {/* Cards Grid - 2 columns on desktop as per reference */}
          <div
            id="training-programs-grid"
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {filteredPrograms.map((program) => (
              <TrainingCard
                key={program.id}
                title={program.title}
                description={program.description}
                duration={program.duration}
                type={program.type}
                deliveryMode={program.deliveryMode}
                icon={program.icon}
                isEnrolled={enrolledPrograms.includes(program.id)}
                onEnroll={() => handleEnroll(program.id)}
                onDetails={() => handleOpenDetails(program)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Outputs Section */}
      <section
        id="outputs"
        className="py-12 md:py-16 px-4 bg-section-tealLight"
        dir="rtl"
      >
        <div className="container mx-auto">
          {/* Section Header */}
          <div className="mb-8 md:mb-12">
            <h2 className="section-title">مخرجات المرحلة</h2>
            <div className="section-title-underline" />
            <p className="mt-4 text-muted-foreground max-w-2xl font-hrsd-medium">
              عند إتمام مرحلة التأهيل والتدريب، ستحصل على مجموعة من المخرجات
              القيمة التي تدعم مسيرتك المهنية.
            </p>
          </div>

          {/* Stage 5 Explanation Block */}
          <div className="bg-card rounded-xl p-6 md:p-8 border border-border mb-8 md:mb-12">
            <h3 className="text-lg md:text-xl font-hrsd-bold text-foreground mb-4">
              استكمال التأهيل واعتماد المخرجات
            </h3>
            <div className="space-y-4 text-muted-foreground font-hrsd-medium leading-relaxed">
              <p>
                تمثل هذه المرحلة استكمال مسار التأهيل والتدريب، حيث يتم التأكد من
                إتمام جميع البرامج التدريبية المطلوبة، ومراجعة واعتماد المخرجات
                من قبل الجهة المختصة.
              </p>
              <p>
                لا يتم الانتقال من هذه المرحلة إلا بعد اعتماد النتائج النهائية
                وإصدار المخرجات الرسمية التي تعكس مستوى الجاهزية والتأهيل.
              </p>
            </div>
          </div>

          {/* Divider */}
          <div className="border-b border-border/50 mb-8 md:mb-12" />

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {outputs.map((output) => (
              <OutputCard
                key={output.id}
                title={output.title}
                description={output.description}
                icon={output.icon}
                isComingSoon={output.isComingSoon}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Footer - using platform footer */}
      <Footer />

      {/* Program Details Modal */}
      <TrainingProgramModal
        program={selectedProgram}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEnroll={() => {
          if (selectedProgram) {
            handleEnroll(selectedProgram.id);
          }
        }}
        isEnrolled={
          selectedProgram ? enrolledPrograms.includes(selectedProgram.id) : false
        }
      />
    </div>
  );
};

export default TrainingStage;
