import { useState, useEffect } from "react";
import { CheckCircle2, Circle } from "lucide-react";
interface CourseStep {
  title: string;
  percentage: number;
  isComplete: boolean;
}
const steps: CourseStep[] = [{
  title: "التوجه",
  percentage: 53,
  isComplete: false
}, {
  title: "الفريق",
  percentage: 87,
  isComplete: true
}, {
  title: "الشراكات",
  percentage: 47,
  isComplete: false
}, {
  title: "التأثير",
  percentage: 62,
  isComplete: false
}, {
  title: "البرامج",
  percentage: 67,
  isComplete: false
}];
const JourneyStepper = () => {
  const [animatedSteps, setAnimatedSteps] = useState<number[]>([]);
  useEffect(() => {
    // Animate steps sequentially
    steps.forEach((_, index) => {
      setTimeout(() => {
        setAnimatedSteps(prev => [...prev, index]);
      }, 150 * (index + 1));
    });
  }, []);
  return <div className="w-full py-6 px-4" dir="rtl">
      <div className="max-w-4xl mx-auto">
        {/* Stepper Container */}
        
      </div>
    </div>;
};
export default JourneyStepper;