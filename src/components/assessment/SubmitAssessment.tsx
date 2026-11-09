import { useMemo, useState } from "react";
import { AlertCircle, AlertTriangle, Loader2, Send } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { useIndicatorScores, useProgress, useSubmitAssessment } from "@/hooks/useAssessment";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FormError } from "@/components/shared/FormField";
import { dialogUi } from "@/components/admin/adminUi";
import { stripOrdinal } from "@/components/assessment/indicatorUtils";

interface SubmitAssessmentProps {
  assessmentId: string | undefined;
  editable: boolean;
  /** Called after the database accepted the submission */
  onSubmitted: () => void;
  /** outline when it sits beside a primary action (dashboard) */
  variant?: "default" | "outline";
}

const Fact = ({ label, value, total }: { label: string; value: number; total?: number }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className="tabular text-small font-hrsd-medium text-ink">
      {formatNumber(value)}
      {total !== undefined && ` ${t.of} ${formatNumber(total)}`}
    </dd>
  </div>
);

/** Summary from v_assessment_progress, a non-blocking warning for items met without evidence, then submit. */
const SubmitDialog = ({ assessmentId, onOpenChange, onSubmitted }: { assessmentId: string; onOpenChange: (v: boolean) => void; onSubmitted: () => void }) => {
  const { toast } = useToast();
  const { data: progress } = useProgress(assessmentId);
  const { data: scores } = useIndicatorScores(assessmentId);
  const { data: tool } = useApprovedTool();
  const submit = useSubmitAssessment(assessmentId);
  const [error, setError] = useState("");

  const textOf = useMemo(() => {
    const map = new Map<string, string>();
    for (const track of tool?.tracks ?? []) for (const s of track.standards) for (const i of s.indicators) map.set(i.id, stripOrdinal(i.text));
    return map;
  }, [tool]);

  // Started indicators with items marked met that have no evidence (met but not counted)
  const withoutEvidence = (scores ?? []).filter((s) => s.isStarted && s.itemsMet > s.itemsCounted);
  // Partial submissions are allowed; an assessment with nothing marked is not
  const empty = progress?.itemsMet === 0;

  const confirm = async () => {
    setError("");
    try {
      await submit.mutateAsync();
      toast({ title: t.submit_done });
      onOpenChange(false);
      onSubmitted();
    } catch (err) {
      setError(err instanceof Error ? err.message : "");
    }
  };

  return (
    <DialogContent dir="rtl" className={dialogUi.content}>
      <DialogHeader className={dialogUi.header}>
        <DialogTitle className={dialogUi.title}>{t.submit_title}</DialogTitle>
        <DialogDescription className={dialogUi.description}>{t.submit_desc}</DialogDescription>
      </DialogHeader>

      <div className={dialogUi.body}>
        <FormError message={error} />

        {progress && (
          <dl aria-label={t.submit_summary_label} className="flex flex-col divide-y divide-border rounded-lg border border-border">
            <Fact label={t.submit_items_met} value={progress.itemsMet} total={progress.itemsTotal} />
            <Fact label={t.submit_items_evidence} value={progress.itemsWithEvidence} total={progress.itemsTotal} />
            <Fact label={t.submit_indicators_complete} value={progress.indicatorsComplete} total={progress.indicatorsTotal} />
          </dl>
        )}

        {empty && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {t.submit_empty}
          </p>
        )}

        {withoutEvidence.length > 0 && (
          <section className="rounded-lg border border-warning/40 bg-warning/5 p-4">
            <h3 className="flex items-center gap-2 text-small font-hrsd-bold text-warning-ink">
              <AlertTriangle aria-hidden className="h-4 w-4 shrink-0" />
              {t.submit_warning_title}
            </h3>
            <p className="mt-1 text-caption text-muted-foreground">{t.submit_warning_desc}</p>
            <ul className="scrollbar-thin mt-3 flex max-h-40 flex-col gap-2 overflow-y-auto">
              {withoutEvidence.map((s) => (
                <li key={s.indicatorId} className="flex items-start justify-between gap-3 text-small">
                  <span className="min-w-0 text-ink">
                    <span className="font-hrsd-medium">
                      {t.indicator_label} {formatNumber(s.indicatorNumber)}:
                    </span>{" "}
                    <span className="line-clamp-1">{textOf.get(s.indicatorId)}</span>
                  </span>
                  <span className="tabular shrink-0 text-caption text-warning-ink">
                    {t.submit_warning_count(formatNumber(s.itemsMet - s.itemsCounted))}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-small text-ink">{t.submit_freeze}</p>
      </div>

      <DialogFooter className={dialogUi.footer}>
        <Button onClick={confirm} disabled={submit.isPending || !progress || empty}>
          {submit.isPending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <Send aria-hidden />}
          {submit.isPending ? t.submit_sending : t.submit_confirm}
        </Button>
        <DialogClose asChild>
          <Button variant="outline">{t.cancel}</Button>
        </DialogClose>
      </DialogFooter>
    </DialogContent>
  );
};

/** "إرسال التقييم للمراجعة": opens the submit dialog; disabled with a tooltip when the assessment is not editable. */
const SubmitAssessment = ({ assessmentId, editable, onSubmitted, variant = "default" }: SubmitAssessmentProps) => {
  const [open, setOpen] = useState(false);

  if (!editable || !assessmentId) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* A disabled button fires no pointer events, so the wrapper carries focus and hover */}
          <span tabIndex={0} className="inline-flex rounded-md focus-ring">
            <Button variant={variant} disabled aria-describedby="submit-disabled-tip" className="pointer-events-none">
              <Send aria-hidden />
              {t.submit_action}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent id="submit-disabled-tip" side="bottom" className="max-w-xs">
          {t.submit_disabled_tip}
        </TooltipContent>
      </Tooltip>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <Button variant={variant} onClick={() => setOpen(true)}>
        <Send aria-hidden />
        {t.submit_action}
      </Button>
      {open && <SubmitDialog assessmentId={assessmentId} onOpenChange={setOpen} onSubmitted={onSubmitted} />}
    </Dialog>
  );
};

export default SubmitAssessment;
