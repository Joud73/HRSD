import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import IndividualJourney from "@/components/IndividualJourney";
import LoginStep from "@/components/individual/LoginStep";
import SelfAssessmentStep from "@/components/individual/SelfAssessmentStep";
import SuggestedCoursesStep from "@/components/individual/SuggestedCoursesStep";
import TrainingCertificateStep from "@/components/individual/TrainingCertificateStep";

const IndividualsJourneyPage = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessmentScore, setAssessmentScore] = useState<number | undefined>();
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([]);

  const handleLoginComplete = () => {
    setCurrentStep(2);
  };

  const handleAssessmentComplete = (score: number) => {
    setAssessmentScore(score);
    setCurrentStep(3);
  };

  const handleAssessmentSkip = () => {
    setCurrentStep(3);
  };

  const handleCourseEnroll = (courseId: number) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId]);
    }
  };

  const handleStepClick = (stepId: number) => {
    // Only allow navigating to completed steps or current step
    if (stepId <= currentStep) {
      setCurrentStep(stepId);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <LoginStep onComplete={handleLoginComplete} />;
      case 2:
        return <SelfAssessmentStep onComplete={handleAssessmentComplete} onSkip={handleAssessmentSkip} />;
      case 3:
        return <SuggestedCoursesStep assessmentScore={assessmentScore} onEnroll={handleCourseEnroll} />;
      case 4:
        return <TrainingCertificateStep />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Spacer for fixed header */}
      <div className="h-20" />

      <main className="flex-1">
        {/* Journey Timeline */}
        <IndividualJourney currentStep={currentStep} onStepClick={handleStepClick} />

        {/* Step Content */}
        <section className="py-12 px-4 md:px-8">
          <div className="max-w-7xl mx-auto">{renderStepContent()}</div>

          {/* Navigation to next step for courses step */}
          {currentStep === 3 && enrolledCourses.length > 0 && (
            <div className="max-w-md mx-auto mt-8 text-center">
              <button
                onClick={() => setCurrentStep(4)}
                className="px-8 py-3 rounded-lg font-hrsd-semibold text-white transition-all"
                style={{ backgroundColor: "hsl(175, 75%, 30%)" }}
              >
                الانتقال إلى التدريب وإصدار الشهادة
              </button>
            </div>
          )}
        </section>
      </main>

      <Footer />

      {/* Side Badge */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 py-4 px-2 text-xs text-white z-50"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          backgroundColor: "hsl(var(--accent-orange))",
          borderRadius: "0 4px 4px 0",
        }}
      >
        نسخة تجريبية
      </div>
    </div>
  );
};

export default IndividualsJourneyPage;
