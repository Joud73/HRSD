import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { pagesCopy } from "@/lib/copy";
import { transition } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import Container from "@/components/layout/Container";
import IndividualJourney from "@/components/IndividualJourney";
import SelfAssessmentStep from "@/components/individual/SelfAssessmentStep";
import SuggestedCoursesStep from "@/components/individual/SuggestedCoursesStep";
import TrainingCertificateStep from "@/components/individual/TrainingCertificateStep";
import { Button } from "@/components/ui/button";

/** Page steps: 1 self assessment, 2 suggested courses, 3 training. The stepper adds registration before them. */
const IndividualsJourneyPage = () => {
  const reduced = useReducedMotion();
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentScore, setAssessmentScore] = useState<number | undefined>();
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([]);

  const handleAssessmentComplete = (score: number) => {
    setAssessmentScore(score);
    setCurrentStep(2);
  };

  const handleAssessmentSkip = () => {
    setCurrentStep(2);
  };

  const handleCourseEnroll = (courseId: number) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId]);
    }
  };

  const handleStepClick = (stepId: number) => {
    if (stepId >= 1 && stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <SelfAssessmentStep onComplete={handleAssessmentComplete} onSkip={handleAssessmentSkip} />;
      case 2:
        return <SuggestedCoursesStep assessmentScore={assessmentScore} onEnroll={handleCourseEnroll} />;
      case 3:
        return <TrainingCertificateStep />;
      default:
        return null;
    }
  };

  return (
    <Container className="py-12 md:py-16">
      <header className="mb-8 max-w-[720px]">
        <h1 className="text-h1 text-primary">{pagesCopy.ij_title}</h1>
        <p className="mt-2 text-body text-muted-foreground">{pagesCopy.ij_subtitle}</p>
      </header>

      <IndividualJourney
        currentStep={currentStep + 1}
        onStepClick={(stepId) => handleStepClick(stepId - 1)}
        className="mb-8"
      />

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, x: reduced ? 0 : 12 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0 }}
          transition={transition.ui}
        >
          {renderStepContent()}

          {currentStep === 2 && enrolledCourses.length > 0 && (
            <div className="mt-8 flex justify-start">
              <Button className="h-12 px-6 text-body" onClick={() => setCurrentStep(3)}>
                {pagesCopy.ij_next_training}
                <ArrowLeft aria-hidden />
              </Button>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </Container>
  );
};

export default IndividualsJourneyPage;
