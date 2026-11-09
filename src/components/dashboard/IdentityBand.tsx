import { orgCopy as t } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { daysUntil, type Assessment } from "@/services/assessmentService";
import { journeyStep } from "@/components/assessment/indicatorUtils";
import Container from "@/components/layout/Container";
import CountUp from "@/components/shared/CountUp";
import JourneyStepper from "@/components/shared/JourneyStepper";

const JOURNEY = t.journey_steps.map((step, i) => ({ id: i + 1, ...step }));

interface IdentityBandProps {
  name: string;
  registrationNumber: string | null;
  assessment: Assessment | null;
}

/**
 * Deep green band under the top bar, full width of the content area: where am I (organization, cycle),
 * how long is left, and the journey. Breaks out of the shell's padding and re-enters through Container.
 */
const IdentityBand = ({ name, registrationNumber, assessment }: IdentityBandProps) => {
  const days = assessment ? daysUntil(assessment.deadline) : null;
  const counting = assessment && (assessment.status === "draft" || assessment.status === "returned");
  const subtitle = [registrationNumber ? t.registration(registrationNumber) : null, assessment?.cycle.name].filter(Boolean).join(" · ");

  return (
    <section aria-label={t.band_label} className="-mx-5 -mt-8 bg-primary text-primary-foreground md:-mx-8 lg:-mx-12 lg:-mt-10">
      <Container className="flex flex-col gap-8 pb-16 pt-8 lg:pt-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="flex min-w-0 flex-col gap-2">
            <h1 className="text-h1 text-primary-foreground">{name}</h1>
            {subtitle && <p className="tabular text-body text-primary-foreground/80">{subtitle}</p>}
          </div>

          {assessment && days !== null && (
            <div className="flex shrink-0 flex-col gap-1 md:items-end md:text-end">
              {counting && days > 0 ? (
                <p className="flex items-baseline gap-2">
                  <CountUp value={days} // Not cn(): tailwind-merge drops the custom text-h1 size when a text colour follows
                    className={`tabular text-h1 font-hrsd-bold ${days < 7 ? "text-accent" : "text-primary-foreground"}`} />
                  <span className="text-body text-primary-foreground/80">{t.days_left_unit}</span>
                </p>
              ) : counting && days === 0 ? (
                <p className="text-h3 font-hrsd-bold text-accent">{t.deadline_today}</p>
              ) : counting ? (
                <p className="text-h3 font-hrsd-bold text-primary-foreground">{t.deadline_passed}</p>
              ) : null}
              <p className="tabular text-small text-primary-foreground/80">{t.deadline_on(formatDate(assessment.deadline))}</p>
            </div>
          )}
        </div>

        <JourneyStepper tone="inverse" steps={JOURNEY} current={journeyStep(assessment?.status)} label={t.journey_label} />
      </Container>
    </section>
  );
};

export default IdentityBand;
