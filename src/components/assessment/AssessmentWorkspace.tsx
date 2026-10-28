import { useMemo, useRef, useState, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, AlertTriangle, CalendarDays, CheckCircle2, ChevronLeft, ChevronRight, Info, Loader2, RotateCcw } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { counted, formatDate, formatNumber, formatTime } from "@/lib/format";
import { ease, transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import {
  useAddFileEvidence, useAddLinkEvidence, useAssessment, useEvidences, useExcludedItems, useIndicatorScores,
  useProgress, useRemoveEvidence, useResponses, useSaveStatus, useSetItemMet,
} from "@/hooks/useAssessment";
import { getEvidenceUrl, today, type Assessment, type AssessmentScope, type Evidence, type IndicatorScore } from "@/services/assessmentService";
import type { LevelBand, Track } from "@/services/toolService";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import PageHeader, { type Crumb } from "@/components/shared/PageHeader";
import StatusBadge from "@/components/shared/StatusBadge";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import IndicatorNav, { type IndicatorProgress } from "@/components/assessment/IndicatorNav";
import EvidencePanel from "@/components/assessment/EvidencePanel";
import SubmitAssessment from "@/components/assessment/SubmitAssessment";
import { assessmentStatusKey, deadlineCountdown, levelTone, stripOrdinal } from "@/components/assessment/indicatorUtils";

interface AssessmentWorkspaceProps {
  /** Whose assessment: the organization's own, or an organization's on its behalf (supervisor) */
  scope: AssessmentScope;
  trackNumber: number;
  /** Crumbs before the track name */
  breadcrumbs: Crumb[];
  /** Route of the dashboard the empty states link back to */
  backTo: string;
  /** Called after a successful submission */
  onSubmitted: () => void;
  /** Persistent banner above the form (proxy mode) */
  banner?: ReactNode;
}

/** Why the answers are read-only (or returned), for the banner. */
type BannerKind = "returned" | "submitted" | "approved" | "closed" | "not_open_yet" | null;

function bannerKind(a: Assessment, editable: boolean): BannerKind {
  if (a.status === "returned") return "returned";
  if (a.status === "submitted" || a.status === "under_review") return "submitted";
  if (a.status === "approved") return "approved";
  if (editable) return null;
  return a.cycle.status === "open" && today() < a.cycle.submissionStart ? "not_open_yet" : "closed";
}

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className="text-small font-hrsd-medium text-ink">{children}</dd>
  </div>
);

const Banner = ({ kind, assessment, editable }: { kind: BannerKind; assessment: Assessment; editable: boolean }) => {
  if (!kind) return null;
  if (kind === "returned") {
    return (
      <section role="status" className="rounded-lg border border-danger/30 bg-danger/5 p-5">
        <h2 className="flex items-center gap-2 text-body font-hrsd-bold text-danger">
          <RotateCcw aria-hidden className="h-4 w-4 shrink-0" />
          {t.banner_returned_title}
        </h2>
        {assessment.returnNote && (
          <div className="mt-3">
            <p className="text-caption text-muted-foreground">{t.banner_returned_note}</p>
            <p className="mt-1 whitespace-pre-line text-body text-ink">{assessment.returnNote}</p>
          </div>
        )}
        {!editable && <p className="mt-3 text-small text-ink">{t.banner_closed}</p>}
      </section>
    );
  }
  const text =
    kind === "submitted"
      ? t.banner_submitted
      : kind === "approved"
        ? t.banner_approved
        : kind === "not_open_yet"
          ? t.banner_not_open_yet(formatDate(assessment.cycle.submissionStart))
          : t.banner_closed;
  return (
    <p role="status" className="flex items-start gap-3 rounded-lg border border-border bg-section-alt px-5 py-4 text-small text-ink">
      <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
      {text}
    </p>
  );
};

/** Opens an evidence: the link directly, a file through a 10-minute signed URL. */
async function openEvidence(evidence: Evidence, onError: (message: string) => void) {
  if (evidence.kind === "link" && evidence.url) {
    window.open(evidence.url, "_blank", "noopener,noreferrer");
    return;
  }
  // Open the tab inside the click, then point it at the signed URL (popup blockers allow this)
  const tab = window.open("", "_blank");
  try {
    const url = await getEvidenceUrl(evidence);
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.assign(url);
    }
  } catch (err) {
    tab?.close();
    onError(err instanceof Error ? err.message : "");
  }
}

interface ItemRowProps {
  assessmentId: string;
  itemId: string;
  position: number;
  text: string;
  isMet: boolean;
  orgNote: string | null;
  evidences: Evidence[];
  editable: boolean;
}

/** One verification item: checkbox (saved immediately), optional note (saved on blur), evidences. */
const ItemRow = ({ assessmentId, itemId, position, text, isMet, orgNote, evidences, editable }: ItemRowProps) => {
  const { toast } = useToast();
  const setItemMet = useSetItemMet(assessmentId);
  const addFile = useAddFileEvidence(assessmentId);
  const addLink = useAddLinkEvidence(assessmentId);
  const removeEvidence = useRemoveEvidence(assessmentId);
  const [note, setNote] = useState(orgNote ?? "");
  const [noteOpen, setNoteOpen] = useState(!!orgNote);
  const [uploading, setUploading] = useState(false);

  const fail = (err: unknown) => toast({ title: err instanceof Error ? err.message : t.err_save, variant: "destructive" });
  const checkboxId = `item-${itemId}`;
  const noteId = `note-${itemId}`;

  const saveNote = () => {
    if (note.trim() === (orgNote ?? "")) return;
    setItemMet.mutate({ itemId, isMet, orgNote: note }, { onError: fail });
  };

  const attachFile = async (file: File) => {
    setUploading(true);
    try {
      await addFile.mutateAsync({ itemId, file });
      toast({ title: t.evidence_attached, description: file.name });
    } catch (err) {
      fail(err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <li className={cn("flex flex-col gap-3 px-5 py-4 transition-colors duration-micro md:px-6", isMet && "bg-primary/5")}>
      <div className="flex items-start gap-3">
        <Checkbox
          id={checkboxId}
          checked={isMet}
          disabled={!editable}
          onCheckedChange={(value) => setItemMet.mutate({ itemId, isMet: value === true }, { onError: fail })}
          className="mt-1 h-5 w-5 rounded-[4px]"
        />
        <label htmlFor={checkboxId} className={cn("min-w-0 flex-1", editable && "cursor-pointer")}>
          <span className="block text-caption text-muted-foreground">
            {t.item_label} {formatNumber(position)}
          </span>
          <span className="block text-body text-ink">{stripOrdinal(text)}</span>
        </label>
        {isMet &&
          (evidences.length > 0 ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-caption font-hrsd-medium text-success">
              <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
              {t.item_counted}
            </span>
          ) : (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-warning/15 px-2.5 py-0.5 text-caption font-hrsd-medium text-warning-ink">
              <AlertTriangle aria-hidden className="h-3.5 w-3.5" />
              {t.item_met_without_evidence}
            </span>
          ))}
      </div>

      <div className="flex flex-col gap-3 ps-8">

        <EvidencePanel
          evidences={evidences}
          editable={editable}
          uploading={uploading}
          onAttachFile={attachFile}
          onAddLink={async (url, label) => {
            await addLink.mutateAsync({ itemId, url, label });
            toast({ title: t.evidence_attached });
          }}
          onOpen={(e) => openEvidence(e, (message) => toast({ title: message, variant: "destructive" }))}
          onDelete={(e) => removeEvidence.mutate(e, { onSuccess: () => toast({ title: t.evidence_removed }), onError: fail })}
        />

        {editable && !noteOpen && (
          <button
            type="button"
            onClick={() => setNoteOpen(true)}
            className="self-start rounded-md text-small font-hrsd-medium text-primary underline-offset-4 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {t.note_add}
          </button>
        )}
        {noteOpen && (editable || orgNote) && (
          <div className="flex flex-col gap-1.5">
            <label htmlFor={noteId} className="text-caption text-muted-foreground">
              {t.item_note_label}
            </label>
            <Textarea
              id={noteId}
              rows={2}
              value={note}
              disabled={!editable}
              placeholder={t.item_note_placeholder}
              onChange={(e) => setNote(e.target.value)}
              onBlur={saveNote}
              autoFocus={!orgNote}
              className="min-h-[64px] text-small"
            />
          </div>
        )}
      </div>
    </li>
  );
};

/**
 * Indicator result from v_indicator_scores: level_label (the only result label on screen), score, and the
 * percentage range of the level's band. No client formula.
 */
const ResultBlock = ({ score, bands }: { score: IndicatorScore | undefined; bands: LevelBand[] }) => {
  const level = score?.level ?? 0;
  const tone = levelTone(level);
  const band = bands.find((b) => b.level === level);
  const range = band
    ? band.minPct === band.maxPct
      ? `${formatNumber(band.minPct)}%`
      : t.result_range_span(formatNumber(band.minPct), formatNumber(band.maxPct))
    : null;
  return (
    <footer className="flex flex-col gap-3 rounded-b-lg border-t border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between md:px-6 lg:sticky lg:bottom-0 lg:z-10" aria-live="polite">
      <p className="flex items-center gap-2 text-small">
        <span className="text-muted-foreground">{t.result_label}:</span>
        <motion.span
          key={score?.levelLabel ?? "pending"}
          initial={{ opacity: 0.3 }}
          animate={{ opacity: 1 }}
          transition={transition.ui}
          className={cn("inline-flex items-center gap-1.5 font-hrsd-medium", tone.text)}
        >
          <span aria-hidden className={cn("h-2 w-2 rounded-full", tone.dot)} />
          {score?.levelLabel ?? "…"}
        </motion.span>
      </p>
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-small">
        <div className="flex gap-2">
          <dt className="text-muted-foreground">{t.result_score}</dt>
          <dd className="tabular font-hrsd-medium text-ink">{formatNumber(score?.scorePct ?? 0)}%</dd>
        </div>
      </dl>
      {range && <p className="tabular text-small text-muted-foreground">{t.result_range(range)}</p>}
    </footer>
  );
};

/** Track minus the items excluded from the cycle; indicators and standards left empty are dropped. */
function activeTrack(track: Track, excluded: Set<string> | undefined): Track {
  if (!excluded || excluded.size === 0) return track;
  return {
    ...track,
    standards: track.standards
      .map((s) => ({
        ...s,
        indicators: s.indicators.map((i) => ({ ...i, items: i.items.filter((it) => !excluded.has(it.id)) })).filter((i) => i.items.length > 0),
      }))
      .filter((s) => s.indicators.length > 0),
  };
}

/**
 * Self-assessment of one track: indicator list on the start side, the selected indicator's items,
 * evidences and result on the end side. Works from an assessment id, so the organization and the
 * supervisor (proxy entry) use the same component.
 */
const AssessmentWorkspace = ({ scope, trackNumber, breadcrumbs, backTo, onSubmitted, banner }: AssessmentWorkspaceProps) => {
  const reduced = useReducedMotion();
  const tool = useApprovedTool();
  const current = useAssessment(scope);
  const { assessment, editable } = current;
  const id = assessment?.id;

  const responses = useResponses(id);
  const evidences = useEvidences(id);
  const scores = useIndicatorScores(id);
  const progress = useProgress(id);
  const exclusions = useExcludedItems(assessment?.cycleId);
  const { saving, savedAt } = useSaveStatus(id);

  // ?indicator={id} (dashboard indicator squares, warnings) opens that indicator first
  const [searchParams] = useSearchParams();
  const [selectedId, setSelectedId] = useState(() => searchParams.get("indicator") ?? "");
  const formTopRef = useRef<HTMLDivElement | null>(null);

  const rawTrack = tool.data?.tracks.find((tr) => tr.number === trackNumber);
  const track = useMemo(() => (rawTrack ? activeTrack(rawTrack, exclusions.data) : undefined), [rawTrack, exclusions.data]);
  const indicators = useMemo(() => track?.standards.flatMap((s) => s.indicators.map((i) => ({ ...i, standard: s }))) ?? [], [track]);

  const scoreById = useMemo(() => new Map((scores.data ?? []).map((s) => [s.indicatorId, s])), [scores.data]);
  const evidencesByItem = useMemo(() => {
    const map = new Map<string, Evidence[]>();
    for (const e of evidences.data ?? []) map.set(e.itemId, [...(map.get(e.itemId) ?? []), e]);
    return map;
  }, [evidences.data]);

  const loading = tool.isLoading || current.isLoading || (!!id && (responses.isLoading || exclusions.isLoading));
  const failed = tool.isError || current.isError || responses.isError;
  const retry = () => void Promise.all([tool.refetch(), current.refetch(), responses.refetch()]);

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <SkeletonPanel lines={3} />
        <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
          <SkeletonPanel lines={8} />
          <SkeletonPanel lines={10} />
        </div>
      </div>
    );
  }

  if (failed) {
    const message = (current.error ?? tool.error ?? responses.error) instanceof Error ? (current.error ?? tool.error ?? responses.error)!.message : t.err_load;
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState icon={AlertCircle} message={message || t.err_load} action={{ label: t.retry, onClick: retry }} />
      </div>
    );
  }

  if (!assessment) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState icon={CalendarDays} message={t.no_cycle} action={{ label: t.back_to_dashboard, to: backTo }} />
      </div>
    );
  }

  if (!track || indicators.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card">
        <EmptyState icon={AlertCircle} message={t.track_not_found} action={{ label: t.back_to_dashboard, to: backTo }} />
      </div>
    );
  }

  const selectedIndex = Math.max(0, indicators.findIndex((i) => i.id === selectedId));
  const indicator = indicators[selectedIndex];
  const score = scoreById.get(indicator.id);

  const progressOf = (indicatorId: string): IndicatorProgress => {
    const s = scoreById.get(indicatorId);
    const total = s?.itemsTotal ?? indicators.find((i) => i.id === indicatorId)?.items.length ?? 0;
    return { counted: s?.itemsCounted ?? 0, total, state: s?.isComplete ? "complete" : s?.isStarted ? "in_progress" : "not_started" };
  };

  // Track figures: sums of the view's per-indicator rows
  const trackScores = (scores.data ?? []).filter((s) => s.trackNumber === trackNumber);
  const trackTotal = trackScores.reduce((n, s) => n + s.itemsTotal, 0);
  const trackMet = trackScores.reduce((n, s) => n + s.itemsMet, 0);
  const trackWithEvidence = trackScores.reduce((n, s) => n + s.itemsWithEvidence, 0);
  const trackComplete = trackScores.filter((s) => s.isComplete).length;
  const trackPct = trackTotal > 0 ? Math.round((trackMet / trackTotal) * 100) : 0;

  const countdown = deadlineCountdown(assessment.deadline);
  const kind = bannerKind(assessment, editable);
  const title = `${t.page_title_prefix} ${track.name}`;
  const standardCount = track.standards.length;

  const progressPanel = (
    <section aria-label={t.progress_label} className="rounded-lg border border-border bg-card p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <p className="text-small font-hrsd-medium text-ink">
          {t.progress_label} <span className="tabular ms-2 text-primary">{formatNumber(trackPct)}%</span>
        </p>
        <dl className="flex flex-wrap gap-x-6 gap-y-1 text-small text-muted-foreground">
          <div className="flex gap-2">
            <dt>{t.progress_items}</dt>
            <dd className="tabular font-hrsd-medium text-ink">
              {formatNumber(trackMet)} {t.of} {formatNumber(trackTotal)}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt>{t.progress_indicators}</dt>
            <dd className="tabular font-hrsd-medium text-ink">
              {formatNumber(trackComplete)} {t.of} {formatNumber(indicators.length)}
            </dd>
          </div>
          <div className="flex gap-2">
            <dt>{t.progress_evidence}</dt>
            <dd className="tabular font-hrsd-medium text-ink">{formatNumber(trackWithEvidence)}</dd>
          </div>
        </dl>
      </div>
      <div
        role="progressbar"
        aria-label={t.progress_label}
        aria-valuemin={0}
        aria-valuemax={trackTotal}
        aria-valuenow={trackMet}
        className="mt-3 h-2 overflow-hidden rounded-full bg-section-alt"
      >
        <motion.div
          className="h-full rounded-full bg-primary"
          initial={false}
          animate={{ width: `${trackPct}%` }}
          transition={reduced ? { duration: 0 } : { duration: 0.6, ease }}
        />
      </div>
    </section>
  );

  const goTo = (index: number) => {
    const next = indicators[index];
    if (!next) return;
    setSelectedId(next.id);
    formTopRef.current?.scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  };

  // Review mode (the evaluator, scope by id): no page header, banner or submit; the host page frames it
  const reviewMode = scope.kind === "assessment";

  return (
    <>
      {reviewMode ? (
        <div className="mb-6">{progressPanel}</div>
      ) : (
        <PageHeader
          title={title}
          description={`${counted(standardCount, t.standards_forms)}، ${counted(indicators.length, t.indicators_forms)}. ${t.page_desc}`}
          breadcrumbs={[...breadcrumbs, { label: title }]}
          actions={<SubmitAssessment assessmentId={id} editable={editable} onSubmitted={onSubmitted} />}
          meta={
            <div className="flex flex-col gap-4">
              {banner}
              <dl aria-label={t.facts_label} className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-border bg-card px-5 py-4">
                <Fact label={t.status_label}>
                  <StatusBadge status={assessmentStatusKey(assessment.status, progress.data)} />
                </Fact>
                <Fact label={t.cycle_label}>{assessment.cycle.name}</Fact>
                <Fact label={t.deadline_label}>
                  <span className="tabular">{formatDate(assessment.deadline)}</span>
                  {editable && (
                    <span className={cn("ms-2 text-caption font-hrsd-regular", countdown.warning ? "text-warning-ink" : "text-muted-foreground")}>
                      ({countdown.text})
                    </span>
                  )}
                </Fact>
                <p className="ms-auto flex items-center gap-1.5 text-caption text-muted-foreground" aria-live="polite">
                  {saving ? (
                    <>
                      <Loader2 aria-hidden className="h-3.5 w-3.5 animate-spin motion-reduce:animate-none" />
                      {t.saving}
                    </>
                  ) : savedAt ? (
                    <>
                      <CheckCircle2 aria-hidden className="h-3.5 w-3.5 text-success" />
                      <span className="tabular">{t.saved_at(formatTime(savedAt))}</span>
                    </>
                  ) : null}
                </p>
              </dl>
              <Banner kind={kind} assessment={assessment} editable={editable} />
              {progressPanel}
            </div>
          }
        />
      )}

      <div className="grid items-start gap-6 lg:grid-cols-[320px_minmax(0,1fr)] lg:gap-8">
        <IndicatorNav track={track} selectedId={indicator.id} onSelect={setSelectedId} progressOf={progressOf} />

        <div ref={formTopRef} className="min-w-0 scroll-mt-24">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={indicator.id}
              initial={reduced ? { opacity: 0 } : { opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, transition: transition.micro }}
              transition={transition.ui}
              className="flex flex-col gap-6"
            >
              <article className="rounded-lg border border-border bg-card">
                <header className="flex flex-col gap-3 border-b border-border p-5 md:p-6">
                  <p className="text-caption text-muted-foreground">
                    {t.standard_label} {formatNumber(indicator.standard.number)}: {stripOrdinal(indicator.standard.name)}
                    <span aria-hidden className="mx-2">
                      ·
                    </span>
                    {t.indicator_label} {formatNumber(indicator.number)}
                  </p>
                  <h2 className="text-h3 text-ink">{stripOrdinal(indicator.text)}</h2>
                  <div className="flex flex-wrap items-center gap-3">
                    {score?.isComplete ? (
                      <span className="inline-flex h-7 items-center gap-1.5 text-small font-hrsd-medium text-success">
                        <CheckCircle2 aria-hidden className="h-4 w-4" />
                        {t.indicator_complete}
                      </span>
                    ) : (
                      <StatusBadge status={progressOf(indicator.id).state} />
                    )}
                    <span className="tabular text-small text-muted-foreground">
                      {formatNumber(score?.itemsCounted ?? 0)} {t.of} {formatNumber(score?.itemsTotal ?? indicator.items.length)} {t.items_counted}
                    </span>
                  </div>
                </header>

                <div className="px-5 pt-4 md:px-6">
                  <h3 className="text-small font-hrsd-medium text-ink">{t.items_heading}</h3>
                  <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
                    <Info aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary" />
                    {t.item_rule}
                  </p>
                </div>

                <ul className="mt-2 divide-y divide-border">
                  {indicator.items.map((item, index) => {
                    const response = responses.data?.get(item.id);
                    return (
                      <ItemRow
                        key={item.id}
                        assessmentId={assessment.id}
                        itemId={item.id}
                        position={index + 1}
                        text={item.text}
                        isMet={response?.isMet ?? false}
                        orgNote={response?.orgNote ?? null}
                        evidences={evidencesByItem.get(item.id) ?? []}
                        editable={editable}
                      />
                    );
                  })}
                </ul>

                <ResultBlock score={score} bands={tool.data?.levelBands ?? []} />
              </article>

              <nav className="flex items-center justify-between gap-3">
                <Button variant="outline" onClick={() => goTo(selectedIndex - 1)} disabled={selectedIndex === 0}>
                  <ChevronRight aria-hidden />
                  {t.prev_indicator}
                </Button>
                <Button onClick={() => goTo(selectedIndex + 1)} disabled={selectedIndex >= indicators.length - 1}>
                  {t.next_indicator}
                  <ChevronLeft aria-hidden />
                </Button>
              </nav>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default AssessmentWorkspace;
