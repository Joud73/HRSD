import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, BadgeCheck, ClipboardCheck, FileCheck2, Info, Loader2, RefreshCw, Undo2 } from "lucide-react";
import { assessmentCopy, copy, documentsCopy as d, evaluatorCopy as t } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { reviewStatusKey } from "@/lib/status";
import { useToast } from "@/hooks/use-toast";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { useAssessment, usePendingVerdicts, useProgress, useResponses, useTransitionAssessment } from "@/hooks/useAssessment";
import { useDocuments, useRegenerateDocuments } from "@/hooks/useResults";
import { useOrganization } from "@/hooks/useOrganizations";
import { today, type Assessment, type ReviewTransition } from "@/services/assessmentService";
import type { Track } from "@/services/toolService";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { FieldShell, FormError } from "@/components/shared/FormField";
import { KeyFacts } from "@/components/admin/AdminParts";
import { FormDialog } from "@/components/admin/setup/SetupDialogs";
import { dialogUi, tabsUi } from "@/components/admin/adminUi";
import AssessmentWorkspace from "@/components/assessment/AssessmentWorkspace";
import OrganizationCard from "@/components/results/OrganizationCard";
import DocumentCards from "@/components/results/DocumentCards";

/**
 * Return note pre-filled from the rejected items: one line per indicator, in tool order, with the evaluator's
 * notes on its rejected items (or "شاهد مرفوض" for a rejection without a note).
 */
function rejectedSummary(tracks: Track[], responses: Map<string, { verified: boolean | null; evaluatorNote: string | null }> | undefined): string {
  if (!responses) return "";
  const lines: string[] = [];
  for (const track of tracks)
    for (const standard of track.standards)
      for (const indicator of standard.indicators) {
        const notes = indicator.items
          .map((item) => responses.get(item.id))
          .filter((r) => r?.verified === false)
          .map((r) => r?.evaluatorNote?.trim() || t.return_prefill_rejected);
        if (notes.length > 0) lines.push(t.return_prefill_line(formatNumber(indicator.number), [...new Set(notes)].join("، ")));
      }
  return lines.join("\n");
}

/* ── Results documents (generated once every verdict is recorded) ── */

/** Both documents are drafts (the editor is open); otherwise the cards open the read-only view. */
const allDrafts = (docs: { status: string }[]) => docs.every((doc) => doc.status === "draft");

const DocumentsSection = ({ assessment }: { assessment: Assessment }) => {
  const { toast } = useToast();
  const documents = useDocuments(assessment.id);
  const regenerate = useRegenerateDocuments(assessment.id);
  const [confirming, setConfirming] = useState(false);
  const docs = documents.data ?? [];
  const editable = assessment.status === "under_review";

  return (
    <section aria-labelledby="documents-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="documents-title" className="text-h3 text-ink">
            {d.documents_title}
          </h2>
          {docs.length === 0 && <p className="text-small text-muted-foreground">{d.generated_auto}</p>}
        </div>
        {editable && docs.length > 0 && (
          <Button variant="outline" onClick={() => setConfirming(true)} disabled={regenerate.isPending}>
            {regenerate.isPending ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : <RefreshCw aria-hidden />}
            {d.regenerate}
          </Button>
        )}
      </div>

      {documents.isLoading ? (
        <SkeletonPanel lines={3} />
      ) : (
        docs.length > 0 && (
          <DocumentCards
            documents={docs}
            linkTo={(doc) => `/evaluator/assessments/${assessment.id}/documents/${doc.kind}`}
            linkLabel={editable && allDrafts(docs) ? d.open_editor : d.preview}
          />
        )
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className={dialogUi.header}>
            <AlertDialogTitle className={dialogUi.title}>{d.regenerate_title}</AlertDialogTitle>
            <AlertDialogDescription className={dialogUi.description}>{d.regenerate_desc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dialogUi.footer}>
            <AlertDialogAction
              onClick={() =>
                regenerate.mutate(undefined, {
                  onSuccess: () => toast({ title: t.toast_regenerated }),
                  onError: (e) => toast({ title: e.message, variant: "destructive" }),
                })
              }
            >
              {d.regenerate_confirm}
            </AlertDialogAction>
            <AlertDialogCancel>{t.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </section>
  );
};

/* ── Action bar: only the transitions valid for the status, inside the review period ── */

const ApproveFacts = ({ assessmentId }: { assessmentId: string }) => {
  const { data: p } = useProgress(assessmentId);
  const items: [string, string][] = [
    [t.approve_confirmed, formatNumber(p?.itemsReviewCounted ?? 0)],
    [t.approve_rejected, formatNumber(p?.itemsReviewRejected ?? 0)],
    [t.approve_self_pct, `${formatNumber(p?.scorePct ?? 0)}%`],
    [t.approve_review_pct, `${formatNumber(p?.reviewScorePct ?? 0)}%`],
  ];
  return (
    <dl className="flex flex-col divide-y divide-border rounded-lg border border-border">
      {items.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-3 px-4 py-3">
          <dt className="text-small text-muted-foreground">{label}</dt>
          <dd className="tabular text-small font-hrsd-medium text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
};

const ReviewActions = ({ assessment, pending }: { assessment: Assessment; pending: number | undefined }) => {
  const { toast } = useToast();
  const tool = useApprovedTool();
  const responses = useResponses(assessment.id);
  const documents = useDocuments(assessment.status === "issued" ? assessment.id : undefined);
  const transition = useTransitionAssessment(assessment.id);
  const [dialog, setDialog] = useState<"returned" | "approved" | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const day = today();
  const beforePeriod = day < assessment.cycle.reviewStart;
  const afterPeriod = day > assessment.cycle.approvalEnd;
  const locked = beforePeriod || afterPeriod || transition.isPending;
  const awaiting = pending ?? 0;

  const prefill = useMemo(() => rejectedSummary(tool.data?.tracks ?? [], responses.data), [tool.data, responses.data]);

  const run = (to: ReviewTransition, done: string, value?: string) => {
    setError(null);
    transition.mutate(
      { to, note: value },
      {
        onSuccess: () => {
          toast({ title: done });
          setDialog(null);
        },
        onError: (e) => setError(e.message),
      }
    );
  };

  const confirmReturn = () => {
    if (!note.trim()) {
      setNoteError(assessmentCopy.err_return_note_required);
      return;
    }
    setNoteError(undefined);
    run("returned", t.toast_returned, note);
  };

  const status = assessment.status;
  const issued = documents.data?.[0];

  const approveButton =
    awaiting > 0 || pending === undefined ? (
      <Tooltip>
        <TooltipTrigger asChild>
          {/* A disabled button fires no pointer events, so the wrapper carries focus and hover */}
          <span tabIndex={0} className="inline-flex rounded-md focus-ring">
            <Button disabled aria-describedby="approve-disabled-tip" className="pointer-events-none">
              <BadgeCheck aria-hidden /> {t.approve}
            </Button>
          </span>
        </TooltipTrigger>
        <TooltipContent id="approve-disabled-tip" side="bottom">
          {t.approve_disabled_tip(formatNumber(awaiting))}
        </TooltipContent>
      </Tooltip>
    ) : (
      <Button onClick={() => setDialog("approved")} disabled={locked}>
        <BadgeCheck aria-hidden /> {t.approve}
      </Button>
    );

  const buttons =
    status === "submitted" ? (
      <Button onClick={() => run("under_review", t.toast_started)} disabled={locked}>
        <ClipboardCheck aria-hidden /> {t.start_review}
      </Button>
    ) : status === "under_review" ? (
      <>
        {approveButton}
        <Button
          variant="outline"
          onClick={() => {
            setNote(prefill);
            setNoteError(undefined);
            setError(null);
            setDialog("returned");
          }}
          disabled={locked}
        >
          <Undo2 aria-hidden /> {t.return}
        </Button>
      </>
    ) : null;

  const statusLine =
    status === "approved"
      ? t.no_actions_approved
      : status === "issued"
        ? issued?.issuedAt && issued.number
          ? d.issued_on(formatDate(issued.issuedAt), issued.number)
          : d.issue_done
        : status === "returned"
          ? t.no_actions_returned
          : status === "draft"
            ? t.no_actions_draft
            : null;

  return (
    <section aria-label={t.actions_label} className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {buttons}
        {statusLine && (
          <p className="flex items-center gap-2 text-small text-muted-foreground">
            {status === "issued" && <FileCheck2 aria-hidden className="h-4 w-4 shrink-0 text-success" />}
            {statusLine}
          </p>
        )}
      </div>
      {buttons && (beforePeriod || afterPeriod) && (
        <p className="flex items-center gap-2 text-small text-muted-foreground">
          <Info aria-hidden className="h-4 w-4 shrink-0" />
          {beforePeriod ? t.review_period_starts(formatDate(assessment.cycle.reviewStart)) : t.review_period_ended}
        </p>
      )}
      <FormError message={dialog ? null : error} />

      {dialog === "returned" && (
        <FormDialog
          open
          onOpenChange={(o) => !o && !transition.isPending && setDialog(null)}
          title={t.return_title}
          description={t.return_desc}
          submitLabel={t.return_confirm}
          onSubmit={confirmReturn}
        >
          <FormError message={error} />
          <FieldShell id="return-note" label={t.return_note} hint={t.return_note_hint} error={noteError} required>
            <Textarea id="return-note" rows={6} value={note} onChange={(e) => setNote(e.target.value)} className="text-body" />
          </FieldShell>
        </FormDialog>
      )}
      {dialog === "approved" && (
        <FormDialog
          open
          onOpenChange={(o) => !o && !transition.isPending && setDialog(null)}
          title={t.approve_title}
          submitLabel={t.approve_confirm}
          onSubmit={() => run("approved", t.toast_approved)}
        >
          <FormError message={error} />
          <ApproveFacts assessmentId={assessment.id} />
          <p className="text-small text-ink">{t.approve_desc}</p>
        </FormDialog>
      )}
    </section>
  );
};

/* ── Page ── */

/** /evaluator/assessments/:assessmentId: the assigned evaluator verifies items, then approves or returns the assessment. */
const EvaluatorReview = () => {
  const { assessmentId = "" } = useParams<{ assessmentId: string }>();
  const scope = { kind: "assessment" as const, id: assessmentId };
  const current = useAssessment(scope, { ensure: false });
  const tool = useApprovedTool();
  const progress = useProgress(current.assessment?.id);
  const pending = usePendingVerdicts(current.assessment?.id);
  const [track, setTrack] = useState("1");

  const crumbsBase = [
    { label: copy.shell_context.evaluator, to: "/evaluator" },
    { label: t.assignments_title, to: "/evaluator/assignments" },
  ];

  if (current.isLoading) {
    return (
      <>
        <PageHeader title={t.assignments_title} breadcrumbs={crumbsBase} />
        <SkeletonPanel lines={6} />
      </>
    );
  }

  const assessment = current.assessment;
  if (current.isError || !assessment) {
    return (
      <>
        <PageHeader title={t.assignments_title} breadcrumbs={crumbsBase} />
        <div className="rounded-lg border border-border bg-card">
          {current.isError ? (
            <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void current.refetch() }} />
          ) : (
            <EmptyState icon={AlertCircle} message={t.review_not_found} action={{ label: t.review_back, to: "/evaluator/assignments" }} />
          )}
        </div>
      </>
    );
  }

  const reviewing = assessment.status === "under_review" || assessment.status === "approved" || assessment.status === "issued";

  return (
    <>
      <OrgHeader
        assessment={assessment}
        crumbsBase={crumbsBase}
        progressPct={progress.data?.progressPct ?? null}
        pending={reviewing ? pending.data ?? null : null}
      />

      <div className="flex flex-col gap-6">
        <ReviewActions assessment={assessment} pending={pending.data} />
        {reviewing && <DocumentsSection assessment={assessment} />}
        <OrganizationCard orgId={assessment.organizationId} />

        <section aria-labelledby="answers-title" className="flex flex-col gap-4">
          <div>
            <h2 id="answers-title" className="text-h3 text-ink">
              {t.answers_title}
            </h2>
            <p className="text-small text-muted-foreground">{t.answers_desc}</p>
          </div>
          <Tabs value={track} onValueChange={setTrack} dir="rtl">
            <TabsList className={tabsUi.list} aria-label={t.tracks_label}>
              {(tool.data?.tracks ?? []).map((tr) => (
                <TabsTrigger key={tr.number} value={String(tr.number)} className={tabsUi.trigger}>
                  {assessmentCopy.page_title_prefix} {tr.name}
                </TabsTrigger>
              ))}
            </TabsList>
            {(tool.data?.tracks ?? []).map((tr) => (
              <TabsContent key={tr.number} value={String(tr.number)} className={tabsUi.content}>
                <AssessmentWorkspace
                  scope={scope}
                  trackNumber={tr.number}
                  breadcrumbs={crumbsBase}
                  backTo="/evaluator/assignments"
                  onSubmitted={() => undefined}
                />
              </TabsContent>
            ))}
          </Tabs>
        </section>
      </div>
    </>
  );
};

/** Organization name as the title, with status, cycle, submission date, progress and the items awaiting a verdict. */
const OrgHeader = ({
  assessment,
  crumbsBase,
  progressPct,
  pending,
}: {
  assessment: Assessment;
  crumbsBase: { label: string; to: string }[];
  progressPct: number | null;
  /** null before the review starts */
  pending: number | null;
}) => {
  const { data: org } = useOrganization(assessment.organizationId);
  const name = org?.name ?? t.assignments_title;
  return (
    <PageHeader
      title={name}
      description={t.review_desc}
      breadcrumbs={[...crumbsBase, { label: name }]}
      meta={
        <KeyFacts
          items={[
            { label: t.col_status, value: <StatusBadge status={reviewStatusKey(assessment.status)} /> },
            { label: t.col_cycle, value: assessment.cycle.name },
            { label: t.col_submitted, value: <span className="tabular">{assessment.submittedAt ? formatDate(assessment.submittedAt) : "-"}</span> },
            { label: t.col_progress, value: <span className="tabular">{progressPct === null ? "-" : `${formatNumber(progressPct)}%`}</span> },
            ...(pending === null
              ? []
              : [
                  {
                    label: t.pending_label,
                    value: <span className={pending > 0 ? "tabular text-warning-ink" : "tabular"}>{formatNumber(pending)}</span>,
                  },
                ]),
          ]}
        />
      }
    />
  );
};

export default EvaluatorReview;
