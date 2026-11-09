import { useState } from "react";
import { Loader2 } from "lucide-react";
import { adminCopy } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useAssessment, useSetSubmissionDue } from "@/hooks/useAssessment";
import { useAssignEvaluator, useEvaluators } from "@/hooks/useEvaluators";
import type { Cycle } from "@/services/cycleService";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldShell, TextField } from "@/components/shared/FormField";
import { Panel } from "@/components/admin/AdminParts";

interface AssessmentJourneyPanelProps {
  orgId: string;
  /** The open cycle, or null */
  cycle: Cycle | null | undefined;
  /** Evaluator currently assigned in the open cycle */
  evaluatorId: string | null;
}

/**
 * Admin controls for one organization in the open cycle (MoM points 7 and 12): assign the evaluator and
 * extend the self-assessment deadline. Reading never opens an assessment; saving opens it when missing.
 */
const AssessmentJourneyPanel = ({ orgId, cycle, evaluatorId }: AssessmentJourneyPanelProps) => {
  const { toast } = useToast();
  const { assessment } = useAssessment({ kind: "org", orgId }, { ensure: false });
  const { data: evaluators } = useEvaluators();
  const assign = useAssignEvaluator();
  const setDue = useSetSubmissionDue();
  const [due, setDueValue] = useState<string | null>(null);
  const [dueError, setDueError] = useState("");

  const fail = (err: unknown) => toast({ title: err instanceof Error ? err.message : adminCopy.err_save_generic, variant: "destructive" });

  if (!cycle) {
    return (
      <Panel title={adminCopy.assoc_section_journey}>
        <p className="text-small text-muted-foreground">{adminCopy.assoc_journey_no_cycle}</p>
      </Panel>
    );
  }

  const active = (evaluators ?? []).filter((e) => e.isActive);
  const dueValue = due ?? assessment?.submissionDue ?? "";
  const effective = assessment?.deadline ?? cycle.submissionEnd;
  const extended = !!assessment?.submissionDue;

  const saveDue = (value: string | null) => {
    setDueError("");
    if (value !== null && !value) {
      setDueError(adminCopy.assoc_due_required);
      return;
    }
    setDue.mutate(
      { orgId, assessment, due: value },
      {
        onSuccess: () => {
          setDueValue(null);
          toast({ title: adminCopy.assoc_due_saved });
        },
        onError: (err) => setDueError(err instanceof Error ? err.message : adminCopy.err_save_generic),
      }
    );
  };

  return (
    <Panel title={adminCopy.assoc_section_journey} description={cycle.name}>
      <div className="grid gap-8 lg:grid-cols-2">
        {/* Evaluator assignment */}
        <FieldShell id="assign-evaluator" label={adminCopy.assoc_assign_label} hint={active.length === 0 ? adminCopy.assoc_assign_none : undefined}>
          <div className="flex items-center gap-3">
            <Select
              value={evaluatorId ?? undefined}
              disabled={assign.isPending || active.length === 0}
              onValueChange={(evaluatorId) =>
                assign.mutate(
                  { orgId, assessmentId: assessment?.id ?? null, evaluatorId },
                  { onSuccess: () => toast({ title: adminCopy.assoc_assign_saved }), onError: fail }
                )
              }
              dir="rtl"
            >
              <SelectTrigger id="assign-evaluator" className="h-12 text-body">
                <SelectValue placeholder={adminCopy.assoc_assign_placeholder} />
              </SelectTrigger>
              <SelectContent>
                {active.map((e) => (
                  <SelectItem key={e.userId} value={e.userId}>
                    {e.fullName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {assign.isPending && <Loader2 aria-hidden className="h-4 w-4 shrink-0 animate-spin text-muted-foreground motion-reduce:animate-none" />}
          </div>
        </FieldShell>

        {/* Deadline extension */}
        <div className="flex flex-col gap-3">
          <TextField
            label={adminCopy.assoc_due_label}
            type="date"
            dir="ltr"
            min={cycle.submissionStart}
            value={dueValue}
            onChange={(e) => setDueValue(e.target.value)}
            error={dueError || undefined}
            hint={adminCopy.assoc_due_hint(formatDate(cycle.submissionStart))}
          />
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => saveDue(dueValue)} disabled={setDue.isPending}>
              {setDue.isPending && <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" />}
              {adminCopy.assoc_due_save}
            </Button>
            {extended && (
              <Button variant="outline" onClick={() => saveDue(null)} disabled={setDue.isPending}>
                {adminCopy.assoc_due_clear}
              </Button>
            )}
          </div>
          <p className="text-small text-muted-foreground">
            {adminCopy.assoc_due_effective}: <span className="tabular font-hrsd-medium text-ink">{formatDate(effective)}</span>
            {extended && <span className="ms-2 text-caption text-warning-ink">({adminCopy.assoc_due_extended(formatDate(cycle.submissionEnd))})</span>}
          </p>
        </div>
      </div>
    </Panel>
  );
};

export default AssessmentJourneyPanel;
