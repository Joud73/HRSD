import { useState } from "react";
import { AlertCircle, Loader2, Send } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useProgress, useSubmitAssessment } from "@/hooks/useAssessment";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { FormError } from "@/components/shared/FormField";
import { dialogUi } from "@/components/admin/adminUi";

interface SubmitAssessmentProps {
  assessmentId: string | undefined;
  editable: boolean;
  /** Called after the database accepted the submission */
  onSubmitted: () => void;
  /** outline when it sits beside a primary action (dashboard) */
  variant?: "default" | "outline";
}

const Fact = ({ label, value, total, suffix }: { label: string; value: number; total?: number; suffix?: string }) => (
  <div className="flex items-center justify-between gap-3 px-4 py-3">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className="tabular text-small font-hrsd-medium text-ink">
      {formatNumber(value)}
      {suffix}
      {total !== undefined && ` ${t.of} ${formatNumber(total)}`}
    </dd>
  </div>
);

/** Summary from v_assessment_progress, then submit. Items are met only through evidence, so nothing else to warn about. */
const SubmitDialog = ({ assessmentId, onOpenChange, onSubmitted }: { assessmentId: string; onOpenChange: (v: boolean) => void; onSubmitted: () => void }) => {
  const { toast } = useToast();
  const { data: progress } = useProgress(assessmentId);
  const submit = useSubmitAssessment(assessmentId);
  const [error, setError] = useState("");

  // Partial submissions are allowed; an assessment with no evidence at all is not
  const empty = progress?.itemsCounted === 0;

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
            <Fact label={t.submit_items_counted} value={progress.itemsCounted} total={progress.itemsTotal} />
            <Fact label={t.submit_indicators_complete} value={progress.indicatorsComplete} total={progress.indicatorsTotal} />
            <Fact label={t.submit_score} value={progress.scorePct} suffix="%" />
          </dl>
        )}

        {empty && (
          <p role="alert" className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
            <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
            {t.submit_empty}
          </p>
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
