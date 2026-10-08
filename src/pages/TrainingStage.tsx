import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { SearchX } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { transition } from "@/lib/motion";
import OrganizationJourney from "@/components/OrganizationJourney";
import PageHeader from "@/components/shared/PageHeader";
import SegmentedControl from "@/components/shared/SegmentedControl";
import EmptyState from "@/components/shared/EmptyState";
import TrainingCard from "@/components/training/TrainingCard";
import OutputCard from "@/components/training/OutputCard";
import TrainingProgramModal from "@/components/training/TrainingProgramModal";
import { trainingPrograms, outputs, categories, type TrainingProgram } from "@/data/trainingPrograms";

const ALL = categories[0];

const TrainingStage = () => {
  const navigate = useNavigate();
  const [enrolledPrograms] = useState<number[]>(() => {
    const stored = localStorage.getItem("enrolledPrograms");
    return stored ? JSON.parse(stored) : [];
  });
  const [selectedProgram, setSelectedProgram] = useState<TrainingProgram | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(ALL);

  const handleEnroll = (programId: number) => {
    // The program page holds the enrolment action
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
  const filteredPrograms = activeCategory === ALL ? trainingPrograms : trainingPrograms.filter((p) => p.category === activeCategory);

  const categoryOptions = categories.map((category) => ({
    value: category,
    label: category,
    count: category === ALL ? trainingPrograms.length : trainingPrograms.filter((p) => p.category === category).length,
  }));

  return (
    <>
      <PageHeader
        title={t.training_title}
        description={t.training_desc}
        breadcrumbs={[{ label: t.crumb_portal, to: "/dashboard" }, { label: t.training_crumb }]}
      />

      <OrganizationJourney className="mb-8" />

      {/* Training programs */}
      <section aria-labelledby="training-programs-title" className="flex flex-col gap-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h2 id="training-programs-title" className="text-h3 text-ink">
            {t.training_programs_title}
            <span className="tabular ms-2 text-small text-muted-foreground">{formatNumber(filteredPrograms.length)}</span>
          </h2>
          <SegmentedControl label={t.training_filter_label} value={activeCategory} onChange={setActiveCategory} options={categoryOptions} />
        </div>

        {filteredPrograms.length === 0 ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState icon={SearchX} message={t.training_empty} action={{ label: t.training_show_all, onClick: () => setActiveCategory(ALL) }} />
          </div>
        ) : (
          <motion.div
            key={activeCategory}
            id="training-programs-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={transition.ui}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3"
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
          </motion.div>
        )}
      </section>

      {/* Stage outputs */}
      <section aria-labelledby="outputs-title" className="mt-10 rounded-lg border border-border bg-card p-5 md:p-6">
        <h2 id="outputs-title" className="text-h3 text-ink">
          {t.outputs_title}
        </h2>
        <p className="mt-1 text-small text-muted-foreground">{t.outputs_desc}</p>
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
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
      </section>

      {/* Program summary */}
      <TrainingProgramModal
        program={selectedProgram}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onEnroll={handleModalEnroll}
        isEnrolled={selectedProgram ? enrolledPrograms.includes(selectedProgram.id) : false}
      />
    </>
  );
};

export default TrainingStage;
