import { pagesCopy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import JourneyStepper from "@/components/shared/JourneyStepper";

const steps = pagesCopy.ij_steps.map((step, i) => ({ id: i + 1, ...step }));

interface IndividualJourneyProps {
  /** Active step id: 1 registration, 2 self assessment, 3 suggested courses, 4 training and certificate */
  currentStep?: number;
  /** Called for completed steps after registration (registration itself cannot be revisited) */
  onStepClick?: (stepId: number) => void;
  className?: string;
}

const IndividualJourney = ({ currentStep = 1, onStepClick, className }: IndividualJourneyProps) => (
  <div className={cn("rounded-lg border border-border bg-card p-5 md:p-6", className)}>
    <JourneyStepper
      steps={steps}
      current={currentStep}
      label={pagesCopy.ij_stepper_label}
      onSelect={onStepClick}
      isSelectable={(id) => id > 1 && id <= currentStep}
    />
  </div>
);

export default IndividualJourney;
