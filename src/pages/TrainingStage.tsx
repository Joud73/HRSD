import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OrganizationJourney from "@/components/OrganizationJourney";
import TrainingHero from "@/components/training/TrainingHero";
import TrainingCard from "@/components/training/TrainingCard";
import OutputCard from "@/components/training/OutputCard";
import TrainingProgramModal from "@/components/training/TrainingProgramModal";
import CategoryFilter from "@/components/training/CategoryFilter";
import { trainingPrograms, outputs, categories, TrainingProgram } from "@/data/trainingPrograms";

const TrainingStage = () => {
  const navigate = useNavigate();
  const [enrolledPrograms, setEnrolledPrograms] = useState<number[]>(() => {
    const stored = localStorage.getItem("enrolledPrograms");
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState("جميع البرامج");

  const handleEnroll = (programId: number) => {
    // Navigate to course detail page instead of enrolling directly
    navigate(`/course/${programId}`);
  };

  const handleOpenDetails = (program: TrainingProgram) => {
    setSelectedProgram(program);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProgram(null);
  };

  const handleModalEnroll = () => {
    if (selectedProgram) {
      navigate(`/course/${selectedProgram.id}`);
      handleCloseModal();
    }
  };

  // Filter programs by category
  const filteredPrograms =
    activeCategory === "جميع البرامج"
      ? trainingPrograms
      : trainingPrograms.filter((p) => p.category === activeCategory);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header - using platform header */}
      <Header variant="org" />
      
      {/* Spacer for fixed header */}
      <div className="h-20" />
      
      {/* Organization Journey */}
      <OrganizationJourney />

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
        onEnroll={handleModalEnroll}
        isEnrolled={
          selectedProgram ? enrolledPrograms.includes(selectedProgram.id) : false
        }
      />
    </div>
  );
};

export default TrainingStage;
