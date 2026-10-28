import type { ReactNode } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, CalendarDays, FileCheck, History, ListChecks, PieChart, Target } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { assessmentCopy, copy, orgCopy } from "@/lib/copy";
import { revealGroup, revealItem, inViewOnce } from "@/lib/motion";
import { counted, formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { StatusKey } from "@/lib/status";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { useAssessment, useAssessmentHistory, useEvidences, useProgress, useTrackScores } from "@/hooks/useAssessment";
import type { AssessmentStatus, TrackScore } from "@/services/assessmentService";
import type { ApprovedTool } from "@/services/toolService";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import KpiCard from "@/components/shared/KpiCard";
import ProgressRow from "@/components/shared/ProgressRow";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import JourneyStepper from "@/components/shared/JourneyStepper";
import { SkeletonKpis, SkeletonPanel, SkeletonProgressRows } from "@/components/shared/Skeletons";
import SubmitAssessment from "@/components/assessment/SubmitAssessment";
import { assessmentStatusKey, deadlineCountdown } from "@/components/assessment/indicatorUtils";

const SCOPE = { kind: "mine" } as const;
const JOURNEY = orgCopy.journey_steps.map((step, i) => ({ id: i + 1, ...step }));

/** Journey step from the assessment status: self-assessment, sent, review, approval, improvement plan. */
function journeyStep(status: AssessmentStatus | undefined): number {
  switch (status) {
    case "submitted":
    case "under_review":
      return 3;
    case "approved":
      return 5;
    default:
      return 1;
  }
}

type TrackState = "not_started" | "in_progress" | "complete";
const trackState = (s: TrackScore | undefined): TrackState =>
  !s || s.indicatorsStarted === 0 ? "not_started" : s.indicatorsTotal > 0 && s.indicatorsComplete === s.indicatorsTotal ? "complete" : "in_progress";

/** Result label for an overall score: the level band containing the score, then that level's label (data lookup only). */
function overallLabel(tool: ApprovedTool | null | undefined, scorePct: number): string | null {
  const band = tool?.levelBands.find((b) => scorePct >= b.minPct && scorePct <= b.maxPct);
  return band ? tool?.levelLabels[band.level] ?? band.label : null;
}

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className="text-small font-hrsd-medium text-ink">{children}</dd>
  </div>
);

/** النتائج حسب الدورة: the overall score only, never evaluator notes. Unapproved cycles are marked as estimates. */
const HistoryPanel = ({ tool }: { tool: ApprovedTool | null | undefined }) => {
  const { data, isLoading, isError, refetch } = useAssessmentHistory();
  return (
    <section aria-labelledby="history-title" className="rounded-lg border border-border bg-card">
      <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
        <h2 id="history-title" className="text-h3 text-ink">
          {orgCopy.history_title}
        </h2>
        <p className="text-small text-muted-foreground">{orgCopy.history_desc}</p>
      </div>
      {isLoading ? (
        <SkeletonPanel lines={2} className="border-0" />
      ) : isError ? (
        <EmptyState icon={AlertCircle} message={orgCopy.load_error} action={{ label: orgCopy.retry, onClick: () => void refetch() }} className="py-10" />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={History} message={orgCopy.history_empty} className="py-10" />
      ) : (
        <ul className="divide-y divide-border">
          {data.map((row) => {
            const label = overallLabel(tool, row.scorePct);
            return (
              <li key={row.assessmentId} className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 px-5 py-4">
                <p className="text-body font-hrsd-medium text-ink">{row.cycleName}</p>
                <div className="flex flex-wrap items-center gap-3">
                  <StatusBadge status={assessmentStatusKey(row.status)} />
                  <p className="text-small text-ink">
                    <span className="sr-only">{orgCopy.history_score}: </span>
                    <span className="tabular font-hrsd-bold">{formatNumber(row.scorePct)}%</span>
                    {label && <span className="ms-2 text-muted-foreground">{label}</span>}
                  </p>
                  {row.status !== "approved" && (
                    <span className="rounded-full bg-section-alt px-2.5 py-0.5 text-caption text-muted-foreground">{orgCopy.history_estimated}</span>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

const Dashboard = () => {
  const { organizationName } = useAuth();
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const tool = useApprovedTool();
  const current = useAssessment(SCOPE);
  const { assessment, editable } = current;
  const id = assessment?.id;
  const progress = useProgress(id);
  const trackScores = useTrackScores(id);
  const evidences = useEvidences(id);

  const loading = current.isLoading || tool.isLoading || (!!id && (progress.isLoading || trackScores.isLoading));
  const p = progress.data;
  const scoreByTrack = new Map((trackScores.data ?? []).map((s) => [s.trackNumber, s]));
  const tracks = (tool.data?.tracks ?? []).map((track) => {
    const score = scoreByTrack.get(track.number);
    return { number: track.number, name: track.name, score, state: trackState(score) };
  });
  // Continue where the organization left off: first track that is not complete
  const next = tracks.find((tr) => tr.state !== "complete") ?? tracks[0];
  const statusKey: StatusKey = assessmentStatusKey(assessment?.status, p);
  const countdown = assessment ? deadlineCountdown(assessment.deadline) : null;

  const linkLabel = (state: TrackState) =>
    !editable || state === "complete" ? orgCopy.track_view : state === "not_started" ? orgCopy.track_start : orgCopy.track_continue;

  return (
    <>
      <PageHeader
        title={organizationName || orgCopy.dashboard_title_fallback}
        description={orgCopy.dashboard_desc}
        breadcrumbs={[{ label: copy.shell_context.organization, to: "/dashboard" }, { label: orgCopy.dashboard_crumb }]}
        actions={
          assessment && next ? (
            <div className="flex flex-wrap items-center gap-3">
              <SubmitAssessment assessmentId={id} editable={editable} onSubmitted={() => navigate("/under-review")} />
              <Button asChild variant="outline">
                <Link to={`/assessment/${next.number}`}>
                  {orgCopy.dashboard_continue}
                  <ArrowLeft aria-hidden />
                </Link>
              </Button>
            </div>
          ) : undefined
        }
        meta={
          <div className="flex flex-col gap-4">
            <section aria-label={orgCopy.journey_label} className="rounded-lg border border-border bg-card px-5 py-5">
              <JourneyStepper steps={JOURNEY} current={journeyStep(assessment?.status)} label={orgCopy.journey_label} />
            </section>
            {assessment && (
              <dl aria-label={orgCopy.summary_label} className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4">
                <div className="flex flex-wrap items-center gap-x-8 gap-y-3">
                  <Fact label={orgCopy.summary_status}>
                    <StatusBadge status={statusKey} />
                  </Fact>
                  <Fact label={orgCopy.summary_cycle}>{assessment.cycle.name}</Fact>
                  <Fact label={orgCopy.summary_deadline}>
                    <span className="tabular">{formatDate(assessment.deadline)}</span>
                    {editable && countdown && (
                      <span className={cn("ms-2 text-caption font-hrsd-regular", countdown.warning ? "text-warning-ink" : "text-muted-foreground")}>
                        ({countdown.text})
                      </span>
                    )}
                  </Fact>
                </div>
                {p && (
                  <div className="flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-border pt-3">
                    <Fact label={orgCopy.summary_score}>
                      <span className="tabular">{formatNumber(p.scorePct)}%</span>
                    </Fact>
                    <Fact label={orgCopy.summary_score_level}>
                      <span className="tabular">{formatNumber(p.avgLevel)}</span>
                    </Fact>
                    {assessment.status !== "approved" && <p className="text-caption text-muted-foreground">{orgCopy.summary_score_note}</p>}
                  </div>
                )}
              </dl>
            )}
          </div>
        }
      />

      {loading ? (
        <div className="flex flex-col gap-8">
          <SkeletonKpis />
          <SkeletonProgressRows />
        </div>
      ) : current.isError || tool.isError ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={AlertCircle}
            message={current.error?.message || orgCopy.load_error}
            action={{ label: orgCopy.retry, onClick: () => void Promise.all([current.refetch(), tool.refetch()]) }}
          />
        </div>
      ) : (
        <motion.div variants={revealGroup} initial={reduced ? false : "hidden"} whileInView="visible" viewport={inViewOnce} className="flex flex-col gap-8">
          {!assessment ? (
            <motion.div variants={revealItem} className="rounded-lg border border-border bg-card">
              <EmptyState icon={CalendarDays} message={orgCopy.no_cycle} />
            </motion.div>
          ) : (
            <>
              <motion.div variants={revealItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <KpiCard
                  label={orgCopy.kpi_items_met}
                  value={p?.itemsMet}
                  icon={ListChecks}
                  hint={p ? `${orgCopy.kpi_of} ${counted(p.itemsTotal, assessmentCopy.items_forms)}` : undefined}
                />
                <KpiCard label={orgCopy.kpi_evidence} value={evidences.data?.length} icon={FileCheck} hint={orgCopy.kpi_evidence_hint} />
                <KpiCard
                  label={orgCopy.kpi_indicators}
                  value={p?.indicatorsComplete}
                  icon={Target}
                  hint={p ? `${orgCopy.kpi_of} ${counted(p.indicatorsTotal, assessmentCopy.indicators_forms)}` : undefined}
                />
                <KpiCard label={orgCopy.kpi_progress} value={p?.progressPct} suffix="%" icon={PieChart} hint={orgCopy.kpi_progress_hint} />
              </motion.div>

              <motion.section variants={revealItem} aria-labelledby="tracks-title" className="rounded-lg border border-border bg-card">
                <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
                  <h2 id="tracks-title" className="text-h3 text-ink">
                    {orgCopy.tracks_panel_title}
                  </h2>
                  <p className="text-small text-muted-foreground">{orgCopy.tracks_panel_note}</p>
                </div>
                <ul className="divide-y divide-border [&>li:last-child>a]:rounded-b-lg">
                  {tracks.map((tr) => (
                    <li key={tr.number}>
                      <ProgressRow
                        name={tr.name}
                        completed={tr.score?.itemsMet ?? 0}
                        total={tr.score?.itemsTotal ?? 0}
                        status={tr.state === "complete" ? "approved" : tr.state}
                        statusLabel={tr.state === "complete" ? orgCopy.track_complete : undefined}
                        to={`/assessment/${tr.number}`}
                        linkLabel={linkLabel(tr.state)}
                      />
                    </li>
                  ))}
                </ul>
              </motion.section>
            </>
          )}

          <motion.div variants={revealItem}>
            <HistoryPanel tool={tool.data} />
          </motion.div>
        </motion.div>
      )}
    </>
  );
};

export default Dashboard;
