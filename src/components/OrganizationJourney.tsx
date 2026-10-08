import { useLocation, useNavigate } from "react-router-dom";
import { pagesCopy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import JourneyStepper from "@/components/shared/JourneyStepper";

/** Route that represents each step; `navigable` marks steps the user can jump to. */
const STEP_ROUTES = [
  { path: "/login", navigable: false },
  { path: "/dashboard", navigable: true },
  { path: "/training-stage", navigable: true },
  { path: "/under-review", navigable: true },
  { path: "/certificate", navigable: false },
] as const;

const steps = pagesCopy.oj_steps.map((step, i) => ({ id: i + 1, ...step, ...STEP_ROUTES[i] }));

interface OrganizationJourneyProps {
  className?: string;
}

/** Organization journey stepper; the active step follows the current route. */
const OrganizationJourney = ({ className }: OrganizationJourneyProps = {}) => {
  const location = useLocation();
  const navigate = useNavigate();

  const path = location.pathname;
  const currentStep = steps.find((step) => path === step.path || path.startsWith(`${step.path}/`))?.id ?? 1;

  return (
    <section aria-labelledby="org-journey-title" className={cn("rounded-lg border border-border bg-card p-5 md:p-6", className)}>
      <h2 id="org-journey-title" className="mb-6 text-h3 text-primary">
        {pagesCopy.oj_title}
      </h2>
      <JourneyStepper
        steps={steps}
        current={currentStep}
        label={pagesCopy.oj_title}
        isSelectable={(id) => Boolean(steps[id - 1]?.navigable)}
        onSelect={(id) => navigate(steps[id - 1].path)}
      />
    </section>
  );
};

export default OrganizationJourney;
