import { useMemo } from "react";
import { Link, Navigate } from "react-router-dom";
import { motion } from "motion/react";
import { useQueries } from "@tanstack/react-query";
import { AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { tamohiCopy as t } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { duration, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { tamohiKeys, useCatalog, useEnroll, useLessonGaps, useTamohiPersonal } from "@/hooks/useTamohi";
import { listLessonProgress, type CatalogProgram, type Enrollment, type Priority, type Recommendation } from "@/services/tamohiService";
import { Button } from "@/components/ui/button";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { TamohiFrame } from "@/components/tamohi/TamohiShell";
import { ProgressRing } from "@/components/tamohi/Rings";
import { Bar } from "@/components/tamohi/ProgramCards";
import { chipClass, ENROLLMENT_CHIP, programPath, trackUi } from "@/components/tamohi/tamohiUi";

const GROUPS: Priority[] = ["high", "medium"];

/* ── One program on the timeline ── */

const PathNode = ({
  recommendation,
  program,
  enrollment,
  assessmentId,
}: {
  recommendation: Recommendation;
  program: CatalogProgram | undefined;
  enrollment: Enrollment | undefined;
  assessmentId: string;
}) => {
  const { toast } = useToast();
  const enroll = useEnroll();
  const trackNumber = program?.trackNumber ?? 1;
  const status = enrollment?.status;
  return (
    <li className="relative flex flex-col gap-3 pb-8 ps-10 last:pb-0 sm:flex-row sm:items-center sm:gap-6">
      <span aria-hidden className={cn("absolute start-[7px] top-1.5 h-3.5 w-3.5 rounded-full ring-4 ring-section-alt", trackUi(trackNumber).dot)} />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="tabular text-caption text-muted-foreground">{formatNumber(recommendation.rank)}</span>
          {/* The node on the line already carries the track colour */}
          {program && <span className="text-caption font-hrsd-medium text-muted-foreground">{program.trackName}</span>}
        </div>
        <Link to={programPath(recommendation.code)} className="w-fit rounded-sm text-body font-hrsd-bold text-ink hover:text-primary focus-ring">
          {recommendation.title}
        </Link>
        <p className="tabular text-small text-muted-foreground">{t.path_gap(formatNumber(recommendation.gapLessons))}</p>
        {enrollment && (
          <div className="flex max-w-md items-center gap-3">
            <span className={cn(chipClass, ENROLLMENT_CHIP[enrollment.status])}>{t.enrollment[enrollment.status]}</span>
            <Bar value={enrollment.lessonsDone} total={enrollment.lessonsTotal} label={t.progress_label(formatNumber(enrollment.lessonsDone), formatNumber(enrollment.lessonsTotal))} />
            <span className="tabular shrink-0 text-caption text-muted-foreground">
              {t.progress_label(formatNumber(enrollment.lessonsDone), formatNumber(enrollment.lessonsTotal))}
            </span>
          </div>
        )}
      </div>
      <div className="shrink-0">
        {!status ? (
          <Button
            variant="outline"
            className="w-full sm:w-auto"
            disabled={enroll.isPending}
            onClick={() =>
              enroll.mutate(
                { programId: recommendation.programId, assessmentId },
                {
                  onSuccess: () => toast({ title: t.enrolled_toast }),
                  onError: (e) => toast({ title: e.message, variant: "destructive" }),
                }
              )
            }
          >
            {enroll.isPending && <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />}
            {t.path_enroll}
          </Button>
        ) : (
          <Button asChild variant={status === "completed" ? "outline" : "default"} className="w-full sm:w-auto">
            <Link to={programPath(recommendation.code)}>{status === "completed" ? t.path_view : t.path_continue}</Link>
          </Button>
        )}
      </div>
    </li>
  );
};

/** The line behind a group's nodes, drawn once from the top. */
const TimelineLine = () => {
  const reduced = useReducedMotion();
  return (
    <motion.span
      aria-hidden
      className="absolute bottom-2 start-[13px] top-2 w-0.5 origin-top bg-border"
      initial={reduced ? false : { scaleY: 0 }}
      animate={{ scaleY: 1 }}
      transition={{ duration: duration.reveal * 2, ease }}
    />
  );
};

/* ── Page ── */

const TamohiMyPath = () => {
  const { userRole } = useAuth();
  const personal = useTamohiPersonal();
  const catalog = useCatalog();
  const gaps = useLessonGaps(personal.assessmentId);

  const recommendedIds = useMemo(() => new Set(personal.recommendations.map((r) => r.programId)), [personal.recommendations]);
  const recommendedEnrollments = personal.enrollments.filter((e) => recommendedIds.has(e.programId));
  // Lesson progress of every enrollment in a recommended program (shared cache with the program page)
  const progress = useQueries({
    queries: recommendedEnrollments.map((e) => ({
      queryKey: tamohiKeys.progress(e.enrollmentId),
      queryFn: () => listLessonProgress(e.enrollmentId),
    })),
  });

  if (userRole !== "organization") return <Navigate to="/tamohi" replace />;

  const programs = new Map((catalog.data ?? []).map((p) => [p.programId, p]));
  const loading = personal.loading || catalog.isLoading || (!!personal.assessmentId && gaps.isLoading);

  if (loading) {
    return (
      <TamohiFrame className="py-10">
        <SkeletonPanel lines={8} />
      </TamohiFrame>
    );
  }
  if (personal.error || catalog.isError) {
    return (
      <TamohiFrame className="py-10">
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => window.location.reload() }} />
        </div>
      </TamohiFrame>
    );
  }
  if (!personal.issued) {
    return (
      <TamohiFrame className="py-10">
        <div className="rounded-lg border border-border bg-card">
          <EmptyState message={t.path_empty} action={{ label: t.path_empty_action, to: "/dashboard" }} />
        </div>
      </TamohiFrame>
    );
  }

  const issuedId = personal.issued.id;
  const gapSet = gaps.data ?? new Set<string>();
  const gapTotal = personal.recommendations.reduce((sum, r) => sum + r.gapLessons, 0);
  const gapClosed = progress.reduce((sum, q) => sum + [...(q.data ?? [])].filter((id) => gapSet.has(id)).length, 0);
  const completed = personal.enrollments.filter((e) => e.status === "completed").length;
  const summary: [string, string][] = [
    [t.path_recommended, formatNumber(personal.recommendations.length)],
    [t.path_enrolled, formatNumber(personal.enrollments.length)],
    [t.path_completed, formatNumber(completed)],
  ];

  return (
    <>
      <section className="border-b border-border bg-card">
        <TamohiFrame className="flex flex-col gap-8 py-8 lg:py-10">
          <div className="flex flex-col gap-2">
            <h1 className="text-h1 font-hrsd-bold text-ink">{t.path_title}</h1>
            <p className="text-small text-muted-foreground">{t.path_desc(personal.issued.cycleName, formatDate(personal.issued.issuedAt))}</p>
          </div>
          <dl aria-label={t.path_summary_label} className="grid grid-cols-3 gap-y-6 md:flex md:flex-wrap md:items-center">
            <div className="col-span-3 flex items-center gap-4 md:pe-8">
              <ProgressRing done={gapClosed} total={gapTotal} size={64} label={`${t.path_closed_label} ${t.path_closed(formatNumber(gapClosed), formatNumber(gapTotal))}`} />
              <div className="flex flex-col">
                <dt className="order-2 text-small text-muted-foreground">{t.path_closed_label}</dt>
                <dd className="tabular order-1 text-h3 font-hrsd-bold text-ink">{t.path_closed(formatNumber(gapClosed), formatNumber(gapTotal))}</dd>
              </div>
            </div>
            {summary.map(([label, value], i) => (
              <div key={label} className={cn("flex flex-col border-border md:border-s md:px-8", i > 0 && "border-s ps-4 md:ps-8")}>
                <dt className="order-2 text-small text-muted-foreground">{label}</dt>
                <dd className="tabular order-1 text-h3 font-hrsd-bold text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </TamohiFrame>
      </section>

      <TamohiFrame className="flex flex-col gap-10 py-8 lg:py-10">
        {GROUPS.map((priority) => {
          const rows = personal.recommendations.filter((r) => r.priority === priority);
          if (rows.length === 0) return null;
          return (
            <section key={priority} aria-labelledby={`group-${priority}`} className="flex flex-col gap-5">
              <h2 id={`group-${priority}`} className="flex items-center gap-3 text-h3 font-hrsd-bold text-ink">
                {t.priority[priority]}
                <span className="tabular text-small font-hrsd-regular text-muted-foreground">{formatNumber(rows.length)}</span>
              </h2>
              <div className="relative rounded-lg border border-border bg-card p-5 md:p-6">
                <div className="relative">
                  <TimelineLine />
                  <ol className="relative flex flex-col">
                    {rows.map((r) => (
                      <PathNode
                        key={r.programId}
                        recommendation={r}
                        program={programs.get(r.programId)}
                        enrollment={personal.enrollmentByProgram.get(r.programId)}
                        assessmentId={issuedId}
                      />
                    ))}
                  </ol>
                </div>
              </div>
            </section>
          );
        })}
      </TamohiFrame>
    </>
  );
};

export default TamohiMyPath;
