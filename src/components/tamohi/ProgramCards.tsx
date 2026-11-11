import { forwardRef } from "react";
import { Link } from "react-router-dom";
import { tamohiCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CatalogProgram, Enrollment, Recommendation } from "@/services/tamohiService";
import { chipClass, deliveryLabel, ENROLLMENT_CHIP, hours, pct, PRIORITY_CHIP, programPath, trackUi } from "@/components/tamohi/tamohiUi";

export const TrackLabel = ({ number, name, className }: { number: number; name: string; className?: string }) => (
  <span className={cn("inline-flex items-center gap-2 text-caption font-hrsd-medium text-muted-foreground", className)}>
    <span aria-hidden className={cn("h-2 w-2 shrink-0 rounded-full", trackUi(number).dot)} />
    {name}
  </span>
);

/** A thin bar: share of `value` in `total`, in the given fill. */
export const Bar = ({ value, total, className, fill = "bg-primary", label }: { value: number; total: number; className?: string; fill?: string; label: string }) => (
  <div
    role="progressbar"
    aria-label={label}
    aria-valuemin={0}
    aria-valuemax={total}
    aria-valuenow={value}
    className={cn("h-1.5 w-full overflow-hidden rounded-full bg-border", className)}
  >
    <div className={cn("h-full rounded-full transition-[width] duration-ui ease-standard motion-reduce:transition-none", fill)} style={{ width: `${pct(value, total)}%` }} />
  </div>
);

const EnrollmentLine = ({ enrollment }: { enrollment: Enrollment }) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between gap-3">
      <span className={cn(chipClass, ENROLLMENT_CHIP[enrollment.status])}>{t.enrollment[enrollment.status]}</span>
      <span className="tabular text-caption text-muted-foreground">
        {t.progress_label(formatNumber(enrollment.lessonsDone), formatNumber(enrollment.lessonsTotal))}
      </span>
    </div>
    <Bar value={enrollment.lessonsDone} total={enrollment.lessonsTotal} label={t.enrollment[enrollment.status]} />
  </div>
);

interface ProgramCardProps {
  program: CatalogProgram;
  recommendation?: Recommendation;
  enrollment?: Enrollment;
}

/** Catalog card: the whole card is one link; the start edge carries the track colour. */
export const ProgramCard = forwardRef<HTMLAnchorElement, ProgramCardProps>(({ program, recommendation, enrollment }, ref) => (
  <Link
    ref={ref}
    to={programPath(program.code)}
    className={cn(
      "group flex h-full flex-col gap-3 rounded-lg border border-border border-s-4 bg-card p-5 transition-colors duration-micro hover:border-primary/40 focus-ring",
      trackUi(program.trackNumber).edge,
      trackUi(program.trackNumber).hoverEdge
    )}
  >
    <div className="flex items-center justify-between gap-3">
      <TrackLabel number={program.trackNumber} name={program.trackName} />
      <span className="text-caption text-muted-foreground" dir="ltr">
        {program.code}
      </span>
    </div>
    <h3 className="text-h3 font-hrsd-bold text-ink group-hover:text-primary">{program.title}</h3>
    {program.subtitle && <p className="line-clamp-2 text-small text-muted-foreground">{program.subtitle}</p>}
    <p className="tabular mt-auto text-caption text-muted-foreground">
      {t.card_meta(formatNumber(program.modulesCount), formatNumber(program.lessonsCount), hours(program.totalMinutes), deliveryLabel(program.delivery))}
    </p>
    {recommendation && (
      <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
        <span className={cn(chipClass, PRIORITY_CHIP[recommendation.priority])}>{t.priority[recommendation.priority]}</span>
        <span className="tabular text-caption text-ink">{t.gap_line(formatNumber(recommendation.gapLessons))}</span>
      </div>
    )}
    {enrollment && <EnrollmentLine enrollment={enrollment} />}
  </Link>
));
ProgramCard.displayName = "ProgramCard";

/** "مقترح لمنظمتك": a wider card led by the gap the program closes. */
export const RecommendationCard = ({
  recommendation,
  program,
  enrollment,
}: {
  recommendation: Recommendation;
  program: CatalogProgram | undefined;
  enrollment?: Enrollment;
}) => (
  <Link
    to={programPath(recommendation.code)}
    className="group flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors duration-micro hover:border-primary/40 focus-ring md:p-6"
  >
    <div className="flex items-center justify-between gap-3">
      {program ? <TrackLabel number={program.trackNumber} name={program.trackName} /> : <span />}
      <span className={cn(chipClass, PRIORITY_CHIP[recommendation.priority])}>{t.priority[recommendation.priority]}</span>
    </div>
    <h3 className="text-h3 font-hrsd-bold text-ink group-hover:text-primary">{recommendation.title}</h3>
    <div className="mt-auto flex flex-col gap-2">
      <p className="tabular text-small text-ink">{t.gap_line(formatNumber(recommendation.gapLessons))}</p>
      <Bar
        value={recommendation.gapLessons}
        total={recommendation.lessonsTotal}
        fill={program ? trackUi(program.trackNumber).fill : "bg-primary"}
        label={t.gap_bar_label(formatNumber(recommendation.gapLessons), formatNumber(recommendation.lessonsTotal))}
      />
    </div>
    {enrollment && <EnrollmentLine enrollment={enrollment} />}
  </Link>
);
