import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft } from "lucide-react";
import { assessmentCopy, orgCopy as t } from "@/lib/copy";
import { counted, formatDate, formatNumber } from "@/lib/format";
import { transition } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { today, type Assessment, type AssessmentProgress } from "@/services/assessmentService";
import { Button } from "@/components/ui/button";
import SubmitAssessment from "@/components/assessment/SubmitAssessment";

export interface TrackSummary {
  number: number;
  name: string;
  itemsMet: number;
  itemsTotal: number;
}

interface NextActionProps {
  assessment: Assessment | null;
  editable: boolean;
  progress: AssessmentProgress | undefined;
  tracks: TrackSummary[];
}

type Kind = "no_cycle" | "start" | "progress" | "all_ticked" | "returned" | "in_review" | "approved" | "closed" | "not_open";

function kindOf(assessment: Assessment | null, editable: boolean, progress: AssessmentProgress | undefined): Kind {
  if (!assessment) return "no_cycle";
  switch (assessment.status) {
    case "submitted":
    case "under_review":
      return "in_review";
    case "approved":
      return "approved";
    case "returned":
      return editable ? "returned" : "closed";
    default:
      if (!editable) return today() < assessment.cycle.submissionStart ? "not_open" : "closed";
      if (!progress || progress.itemsMet === 0) return "start";
      return progress.itemsTotal > 0 && progress.itemsMet >= progress.itemsTotal ? "all_ticked" : "progress";
  }
}

/** One sentence and one primary action for the assessment's state. Overlaps the identity band by 32px. */
const NextAction = ({ assessment, editable, progress, tracks }: NextActionProps) => {
  const navigate = useNavigate();
  const reduced = useReducedMotion();
  const kind = kindOf(assessment, editable, progress);
  const incomplete = tracks.filter((tr) => tr.itemsMet < tr.itemsTotal);
  const firstOpen = incomplete[0] ?? tracks[0];
  const submit = (variant: "default" | "outline") => (
    <SubmitAssessment assessmentId={assessment?.id} editable={editable} variant={variant} onSubmitted={() => navigate("/under-review")} />
  );
  const goTo = (track: TrackSummary | undefined, label: string) =>
    track ? (
      <Button asChild>
        <Link to={`/assessment/${track.number}`}>
          {label}
          <ArrowLeft aria-hidden />
        </Link>
      </Button>
    ) : null;

  let sentence: React.ReactNode = null;
  let actions: React.ReactNode = null;
  switch (kind) {
    case "no_cycle":
      sentence = t.no_cycle;
      break;
    case "start":
      sentence = t.next_start(tracks[0]?.name ?? "");
      actions = goTo(tracks[0], t.next_start_action);
      break;
    case "progress":
      sentence = t.next_progress(
        formatNumber(progress?.itemsMet ?? 0),
        counted(progress?.itemsTotal ?? 0, assessmentCopy.items_forms),
        incomplete.map((tr) => tr.name).join(t.list_separator)
      );
      actions = (
        <>
          {goTo(firstOpen, t.next_progress_action(firstOpen?.name ?? ""))}
          {submit("outline")}
        </>
      );
      break;
    case "all_ticked":
      sentence = t.next_all_ticked;
      actions = submit("default");
      break;
    case "returned":
      sentence = (
        <span className="flex flex-col gap-1">
          <span className="font-hrsd-bold">{t.next_returned_title}</span>
          {assessment?.returnNote && <span className="text-small text-muted-foreground">{assessment.returnNote}</span>}
        </span>
      );
      actions = goTo(firstOpen, t.next_returned_action);
      break;
    case "in_review":
      sentence = t.next_in_review(assessment?.submittedAt ? formatDate(assessment.submittedAt) : "-");
      break;
    case "approved":
      sentence = t.next_approved;
      actions = <Button disabled>{t.next_approved_action}</Button>;
      break;
    case "closed":
      sentence = t.next_closed;
      break;
    case "not_open":
      sentence = t.next_not_open(assessment ? formatDate(assessment.cycle.submissionStart) : "-");
      break;
  }

  return (
    <section aria-label={t.next_label} aria-live="polite" className="relative z-10 -mt-8 rounded-lg border border-border bg-card px-5 py-5 md:px-6">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={kind}
          initial={reduced ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? undefined : { opacity: 0 }}
          transition={transition.ui}
          className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between"
        >
          <p className="text-body text-ink">{sentence}</p>
          {actions && <div className="flex shrink-0 flex-wrap gap-3">{actions}</div>}
        </motion.div>
      </AnimatePresence>
    </section>
  );
};

export default NextAction;
