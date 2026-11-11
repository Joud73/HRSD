import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Check, ChevronDown, ChevronLeft, ClipboardCheck, FileText, Loader2, SearchX, Wrench, type LucideIcon } from "lucide-react";
import { tamohiCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import {
  useEnroll, useIndicatorResults, useLessonGaps, useLessonProgress, useProgram, useSetLessonDone, useTamohiPersonal,
} from "@/hooks/useTamohi";
import type { LessonKind, ProgramDetail, ProgramLesson, ProgramModule } from "@/services/tamohiService";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { TamohiFrame } from "@/components/tamohi/TamohiShell";
import { ProgressRing } from "@/components/tamohi/Rings";
import { TrackLabel } from "@/components/tamohi/ProgramCards";
import { chipClass, deliveryLabel, hours, LEVEL_CHIP, trackUi } from "@/components/tamohi/tamohiUi";

const KIND_ICON: Record<LessonKind, LucideIcon> = { practice: Wrench, template: FileText, checkpoint: ClipboardCheck };

/* ── Lesson ── */

interface LessonRowProps {
  lesson: ProgramLesson;
  gap: boolean;
  done: boolean;
  /** Present for an enrolled organization */
  onToggle?: (done: boolean) => void;
}

const LessonRow = ({ lesson, gap, done, onToggle }: LessonRowProps) => {
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  const Icon = KIND_ICON[lesson.kind] ?? Wrench;
  const panelId = `lesson-panel-${lesson.id}`;
  const checkId = `lesson-done-${lesson.id}`;
  return (
    <li id={`lesson-${lesson.id}`} className="scroll-mt-48">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-start gap-3 rounded-md px-3 py-3 text-start transition-colors duration-micro hover:bg-section-alt focus-ring"
      >
        <span
          aria-hidden
          className={cn(
            "mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border",
            done ? "border-success bg-success text-success-foreground" : "border-border bg-card text-muted-foreground"
          )}
        >
          <AnimatePresence initial={false} mode="wait">
            {done ? (
              <motion.span key="done" initial={reduced ? false : { scale: 0.4, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={reduced ? undefined : { scale: 0.4, opacity: 0 }} transition={transition.micro}>
                <Check className="h-4 w-4" />
              </motion.span>
            ) : (
              <motion.span key="kind" initial={reduced ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={reduced ? undefined : { opacity: 0 }} transition={transition.micro}>
                <Icon className="h-3.5 w-3.5" />
              </motion.span>
            )}
          </AnimatePresence>
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1 text-caption text-muted-foreground">
            <span>{t.lesson_kind[lesson.kind]}</span>
            <span className="tabular">{t.lesson_minutes(formatNumber(lesson.durationMinutes))}</span>
            {gap && (
              <span className="inline-flex items-center gap-1.5 font-hrsd-medium text-warning-ink">
                <span aria-hidden className="h-2 w-2 rounded-full bg-warning" />
                {t.lesson_gap}
              </span>
            )}
          </span>
          <span className="text-body text-ink">{lesson.title}</span>
        </span>
        <ChevronDown aria-hidden className={cn("mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-ui", open && "rotate-180")} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={panelId}
            key="panel"
            initial={reduced ? false : { height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={reduced ? undefined : { height: 0, opacity: 0 }}
            transition={transition.ui}
            className="overflow-hidden"
          >
            <div className="flex flex-col gap-4 pb-4 pe-3 ps-[3.25rem]">
              <dl className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <dt className="text-caption font-hrsd-medium text-muted-foreground">{t.lesson_steps}</dt>
                  <dd className="text-small text-ink">{lesson.objective}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-caption font-hrsd-medium text-muted-foreground">{t.lesson_criterion}</dt>
                  <dd className="text-small text-ink">{lesson.title}</dd>
                </div>
              </dl>
              {onToggle && (
                <label htmlFor={checkId} className="flex w-fit cursor-pointer items-center gap-2 text-small font-hrsd-medium text-ink">
                  <Checkbox id={checkId} checked={done} onCheckedChange={(v) => onToggle(v === true)} />
                  {t.lesson_done}
                </label>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

/* ── Module (one step of the curriculum stepper) ── */

interface ModuleStepProps {
  module: ProgramModule;
  lessons: ProgramLesson[];
  trackNumber: number;
  open: boolean;
  onToggle: () => void;
  gaps: Set<string> | null;
  doneSet: Set<string> | null;
  last: boolean;
  onLesson?: (lessonId: string, done: boolean) => void;
}

const ModuleStep = ({ module, lessons, trackNumber, open, onToggle, gaps, doneSet, last, onLesson }: ModuleStepProps) => {
  const reduced = useReducedMotion();
  const ui = trackUi(trackNumber);
  const minutes = lessons.reduce((sum, l) => sum + l.durationMinutes, 0);
  const gapCount = gaps ? lessons.filter((l) => gaps.has(l.id)).length : 0;
  const doneCount = doneSet ? lessons.filter((l) => doneSet.has(l.id)).length : 0;
  const complete = !!doneSet && lessons.length > 0 && doneCount === lessons.length;
  const panelId = `module-panel-${module.id}`;
  return (
    <li id={`module-${module.id}`} className="relative grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-4">
      {/* Node and the line to the next step; the line fills with the module's progress */}
      <div aria-hidden className="relative flex flex-col items-center">
        <span
          className={cn(
            "tabular z-10 flex h-10 w-10 items-center justify-center rounded-full border-2 bg-card text-small font-hrsd-bold",
            complete ? cn("border-transparent text-primary-foreground", ui.fill) : cn("border-current", ui.text)
          )}
        >
          {formatNumber(module.number)}
        </span>
        {!last && (
          <span className="relative w-0.5 flex-1 bg-border">
            {doneSet && (
              <span
                className={cn("absolute inset-x-0 top-0 transition-[height] duration-reveal ease-standard motion-reduce:transition-none", ui.fill)}
                style={{ height: `${lessons.length ? (doneCount / lessons.length) * 100 : 0}%` }}
              />
            )}
          </span>
        )}
      </div>

      <div className={cn("flex min-w-0 flex-col", !last && "pb-6")}>
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={onToggle}
          className="flex w-full items-start gap-3 rounded-md py-1.5 text-start focus-ring"
        >
          <span className="flex min-w-0 flex-1 flex-col gap-1">
            <span className="text-caption text-muted-foreground">{t.module_label(formatNumber(module.number))}</span>
            <span className="text-body font-hrsd-bold text-ink">{module.title}</span>
            {module.summary && <span className="text-small text-muted-foreground">{module.summary}</span>}
            <span className="flex flex-wrap items-center gap-2 pt-1">
              <span className="tabular text-caption text-muted-foreground">
                {t.module_meta(formatNumber(lessons.length), formatNumber(minutes))}
              </span>
              {gapCount > 0 && <span className={cn(chipClass, "bg-warning/15 text-warning-ink")}>{t.module_gaps(formatNumber(gapCount))}</span>}
              {doneSet && (
                <span className="tabular text-caption text-muted-foreground">{t.progress_label(formatNumber(doneCount), formatNumber(lessons.length))}</span>
              )}
            </span>
          </span>
          <ChevronDown aria-hidden className={cn("mt-6 h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-ui", open && "rotate-180")} />
        </button>
        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              id={panelId}
              key="lessons"
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={reduced ? undefined : { height: 0, opacity: 0 }}
              transition={transition.ui}
              className="overflow-hidden"
            >
              <ul className="mt-3 divide-y divide-border rounded-lg border border-border bg-card">
                {lessons.map((l) => (
                  <LessonRow
                    key={l.id}
                    lesson={l}
                    gap={!!gaps?.has(l.id)}
                    done={!!doneSet?.has(l.id)}
                    onToggle={onLesson ? (done) => onLesson(l.id, done) : undefined}
                  />
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
};

/* ── Side column ── */

const WhySection = ({ detail, assessmentId, gapCount }: { detail: ProgramDetail; assessmentId: string; gapCount: number }) => {
  const results = useIndicatorResults(
    assessmentId,
    detail.program.programId,
    detail.indicators.map((i) => i.id)
  );
  const byIndicator = new Map((results.data ?? []).map((r) => [r.indicatorId, r]));
  return (
    <>
      <p className="tabular text-small text-ink">{t.why_gap(formatNumber(gapCount), formatNumber(detail.lessons.length))}</p>
      <ul className="flex flex-col divide-y divide-border">
        {detail.indicators.map((ind) => {
          const r = byIndicator.get(ind.id);
          return (
            <li key={ind.id} className="flex flex-col gap-2 py-3">
              <div className="flex items-center justify-between gap-3">
                <span className="tabular text-caption font-hrsd-medium text-muted-foreground">{t.why_indicator(formatNumber(ind.number))}</span>
                {r && <span className={cn(chipClass, LEVEL_CHIP[r.reviewLevel] ?? LEVEL_CHIP[0])}>{r.reviewLabel}</span>}
              </div>
              <p className="line-clamp-3 text-small text-ink">{ind.text}</p>
            </li>
          );
        })}
      </ul>
    </>
  );
};

/* ── Page ── */

const TamohiProgram = () => {
  const { code } = useParams<{ code: string }>();
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const program = useProgram(code);
  const personal = useTamohiPersonal();
  const detail = program.data ?? null;
  const programId = detail?.program.programId;

  const gapsQuery = useLessonGaps(personal.assessmentId, programId);
  const gaps = personal.issued && gapsQuery.data ? gapsQuery.data : null;
  const enrollment = programId ? personal.enrollmentByProgram.get(programId) : undefined;
  const progress = useLessonProgress(enrollment?.enrollmentId);
  const doneSet = enrollment ? progress.data ?? new Set<string>() : null;
  const enrollMutation = useEnroll();
  const setDone = useSetLessonDone(enrollment?.enrollmentId);

  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const [gapsOnly, setGapsOnly] = useState(false);

  const lessonsByModule = useMemo(() => {
    const map = new Map<string, ProgramLesson[]>();
    for (const l of detail?.lessons ?? []) map.set(l.moduleId, [...(map.get(l.moduleId) ?? []), l]);
    return map;
  }, [detail]);

  if (program.isLoading) {
    return (
      <TamohiFrame className="py-10">
        <SkeletonPanel lines={8} />
      </TamohiFrame>
    );
  }
  if (program.isError || !detail) {
    return (
      <TamohiFrame className="py-10">
        <div className="rounded-lg border border-border bg-card">
          {program.isError ? (
            <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void program.refetch() }} />
          ) : (
            <EmptyState icon={SearchX} message={t.not_found} action={{ label: t.back_to_catalog, to: "/tamohi" }} />
          )}
        </div>
      </TamohiFrame>
    );
  }

  const p = detail.program;
  const toggleModule = (id: string) =>
    setOpenModules((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const enroll = () =>
    enrollMutation.mutate(
      { programId: p.programId, assessmentId: personal.assessmentId ?? null },
      {
        onSuccess: () => toast({ title: t.enrolled_toast }),
        onError: (e) => toast({ title: e.message, variant: "destructive" }),
      }
    );

  const onLesson = enrollment
    ? (lessonId: string, done: boolean) =>
        setDone.mutate({ lessonId, done }, { onError: (e) => toast({ title: e.message, variant: "destructive" }) })
    : undefined;

  /** Opens the module of the first lesson not done and brings that lesson into view. */
  const continueProgram = () => {
    const next = detail.lessons.find((l) => !doneSet?.has(l.id)) ?? detail.lessons[0];
    if (!next) return;
    setGapsOnly(false);
    setOpenModules((prev) => new Set(prev).add(next.moduleId));
    window.setTimeout(() => {
      document.getElementById(`lesson-${next.id}`)?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
    }, reduced ? 0 : 260);
  };

  const modules = detail.modules
    .map((m) => ({ module: m, lessons: (lessonsByModule.get(m.id) ?? []).filter((l) => !gapsOnly || !!gaps?.has(l.id)) }))
    .filter((m) => !gapsOnly || m.lessons.length > 0);

  const done = enrollment?.lessonsDone ?? 0;
  const total = enrollment?.lessonsTotal ?? detail.lessons.length;

  return (
    <>
      {/* Header band */}
      <section className="border-b border-border bg-card">
        <TamohiFrame className="flex flex-col gap-6 py-8 lg:flex-row lg:items-end lg:justify-between lg:py-10">
          <div className="flex min-w-0 flex-col gap-3">
            <nav aria-label="breadcrumb">
              <ol className="flex flex-wrap items-center gap-1.5 text-small text-muted-foreground">
                <li>
                  <Link to="/tamohi" className="rounded-sm hover:text-primary focus-ring">
                    {t.breadcrumb_root}
                  </Link>
                </li>
                <li aria-hidden>
                  <ChevronLeft className="h-4 w-4" />
                </li>
                <li aria-current="page" className="text-ink">
                  {p.trackName}
                </li>
              </ol>
            </nav>
            <div className="flex flex-wrap items-center gap-2">
              <span className={cn(chipClass, "border border-border bg-card text-ink")}>
                <TrackLabel number={p.trackNumber} name={p.trackName} className="text-ink" />
              </span>
              <span className={cn(chipClass, "border border-border bg-card text-ink")}>{p.standardName}</span>
            </div>
            <h1 className="text-h1 font-hrsd-bold text-ink">{p.title}</h1>
            {p.subtitle && <p className="max-w-[65ch] text-body text-muted-foreground">{p.subtitle}</p>}
            <p className="tabular text-small text-muted-foreground">
              {t.card_meta(formatNumber(p.modulesCount), formatNumber(p.lessonsCount), hours(p.totalMinutes), deliveryLabel(p.delivery))}
            </p>
          </div>

          {personal.isOrg && (
            <div className="flex shrink-0 flex-col gap-3 sm:flex-row sm:items-center">
              {enrollment ? (
                <>
                  <div className="flex items-center gap-3">
                    <ProgressRing done={done} total={total} label={t.progress_label(formatNumber(done), formatNumber(total))} />
                    <div className="flex flex-col">
                      <span className="tabular text-body font-hrsd-bold text-ink">{t.progress_label(formatNumber(done), formatNumber(total))}</span>
                      <span className="text-caption text-muted-foreground">{t.enrollment[enrollment.status]}</span>
                    </div>
                  </div>
                  <Button onClick={continueProgram}>{t.continue}</Button>
                </>
              ) : (
                <Button onClick={enroll} disabled={enrollMutation.isPending || personal.loading}>
                  {enrollMutation.isPending && <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />}
                  {t.enroll}
                </Button>
              )}
              <Button asChild variant="outline">
                <Link to="/tamohi/my-path">{t.open_my_path}</Link>
              </Button>
            </div>
          )}
        </TamohiFrame>
      </section>

      <TamohiFrame className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start lg:py-10">
        <div className="flex min-w-0 flex-col gap-10">
          {p.outcomes.length > 0 && (
            <section aria-labelledby="outcomes-title" className="flex flex-col gap-4">
              <h2 id="outcomes-title" className="text-h3 font-hrsd-bold text-ink">
                {t.outcomes_title}
              </h2>
              <ul className="flex flex-col gap-3">
                {p.outcomes.map((o) => (
                  <li key={o} className="flex items-start gap-3 text-body text-ink">
                    <Check aria-hidden className={cn("mt-1 h-4 w-4 shrink-0", trackUi(p.trackNumber).text)} />
                    {o}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="curriculum-title" className="flex flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 id="curriculum-title" className="text-h3 font-hrsd-bold text-ink">
                {t.curriculum_title}
              </h2>
              {gaps && gaps.size > 0 && (
                <label className="flex items-center gap-2 text-small text-ink">
                  <Switch checked={gapsOnly} onCheckedChange={setGapsOnly} />
                  {t.gaps_only}
                </label>
              )}
            </div>
            <ol className="flex flex-col">
              {modules.map(({ module, lessons }, i) => (
                <ModuleStep
                  key={module.id}
                  module={module}
                  lessons={lessons}
                  trackNumber={p.trackNumber}
                  open={openModules.has(module.id)}
                  onToggle={() => toggleModule(module.id)}
                  gaps={gaps}
                  doneSet={doneSet}
                  last={i === modules.length - 1}
                  onLesson={onLesson}
                />
              ))}
            </ol>
          </section>
        </div>

        <aside className="order-first flex flex-col rounded-lg border border-border bg-card lg:sticky lg:top-24 lg:order-none">
          {personal.isOrg && (
            <section aria-labelledby="why-title" className="flex flex-col gap-3 border-b border-border p-5">
              <h2 id="why-title" className="text-body font-hrsd-bold text-ink">
                {t.why_title}
              </h2>
              {personal.issued ? (
                <WhySection detail={detail} assessmentId={personal.issued.id} gapCount={gaps?.size ?? 0} />
              ) : (
                <p className="text-small text-muted-foreground">{t.why_empty}</p>
              )}
            </section>
          )}
          <dl className="flex flex-col divide-y divide-border">
            {[
              [t.audience, p.audience ?? "-"],
              [t.delivery_label, deliveryLabel(p.delivery)],
              [t.duration, t.duration_value(hours(p.totalMinutes))],
            ].map(([label, value]) => (
              <div key={label} className="flex flex-col gap-1 px-5 py-4">
                <dt className="text-caption text-muted-foreground">{label}</dt>
                <dd className="text-small text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </aside>
      </TamohiFrame>
    </>
  );
};

export default TamohiProgram;
