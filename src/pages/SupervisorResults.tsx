import { useState } from "react";
import { DOCUMENT_KINDS } from "@/services/resultsService";
import { useParams } from "react-router-dom";
import { AlertCircle, FileCheck2, Undo2 } from "lucide-react";
import { copy, documentsCopy as d, resultsCopy as r, supervisorCopy as t } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { reviewStatusKey } from "@/lib/status";
import { useToast } from "@/hooks/use-toast";
import { useAssessment, useReturnToEvaluator } from "@/hooks/useAssessment";
import { useDocuments, useFrozenResults } from "@/hooks/useResults";
import { useOrganization } from "@/hooks/useOrganizations";
import type { Assessment } from "@/services/assessmentService";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { FieldShell, FormError } from "@/components/shared/FormField";
import { KeyFacts } from "@/components/admin/AdminParts";
import { FormDialog } from "@/components/admin/setup/SetupDialogs";
import { tabsUi } from "@/components/admin/adminUi";
import OrganizationCard from "@/components/results/OrganizationCard";
import ResultsOverview from "@/components/results/ResultsOverview";
import IssueResults from "@/components/results/IssueResults";
import DocumentScreen from "@/components/documents/DocumentScreen";
import { KIND_LABEL } from "@/components/results/documentUtils";

/* ── Final sign-off actions: issue the results (both PDFs) or return to the evaluator ── */

const SignOffActions = ({ assessment }: { assessment: Assessment }) => {
  const { toast } = useToast();
  const returnToEvaluator = useReturnToEvaluator(assessment.id);
  const documents = useDocuments(assessment.id);
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  if (assessment.status === "issued") {
    const doc = documents.data?.[0];
    return (
      <section aria-label={t.signoff_label} className="flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-4 text-small text-ink">
        <FileCheck2 aria-hidden className="h-4 w-4 shrink-0 text-success" />
        {doc?.issuedAt && doc.number ? d.issued_on(formatDate(doc.issuedAt), doc.number) : d.issue_done}
      </section>
    );
  }
  if (assessment.status !== "approved") return null;

  const confirm = () => {
    if (!note.trim()) {
      setNoteError(t.return_note_required);
      return;
    }
    setNoteError(undefined);
    setError(null);
    returnToEvaluator.mutate(note, {
      onSuccess: () => {
        toast({ title: t.toast_returned_to_evaluator });
        setOpen(false);
      },
      onError: (e) => setError(e.message),
    });
  };

  return (
    <section aria-label={t.signoff_label} className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <IssueResults assessmentId={assessment.id} />
        <Button
          variant="outline"
          onClick={() => {
            setNote("");
            setNoteError(undefined);
            setError(null);
            setOpen(true);
          }}
          disabled={returnToEvaluator.isPending}
        >
          <Undo2 aria-hidden /> {d.return_to_evaluator}
        </Button>
        <p className="text-small text-muted-foreground">{d.awaiting_issue}</p>
      </div>
      {open && (
        <FormDialog
          open
          onOpenChange={(o) => !o && !returnToEvaluator.isPending && setOpen(false)}
          title={d.return_to_evaluator_title}
          description={d.return_to_evaluator_desc}
          submitLabel={d.return_to_evaluator}
          onSubmit={confirm}
        >
          <FormError message={error} />
          <FieldShell id="return-evaluator-note" label={d.return_to_evaluator_note} hint={t.return_note_hint} error={noteError} required>
            <Textarea id="return-evaluator-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} className="text-body" />
          </FieldShell>
        </FormDialog>
      )}
    </section>
  );
};

/* ── Page ── */

/** /supervisor/assessments/:assessmentId/results: frozen results and documents of an approved or issued assessment. */
const SupervisorResults = () => {
  const { assessmentId = "" } = useParams<{ assessmentId: string }>();
  const current = useAssessment({ kind: "assessment", id: assessmentId }, { ensure: false });
  const assessment = current.assessment;
  const frozen = assessment && (assessment.status === "approved" || assessment.status === "issued");
  const results = useFrozenResults(frozen ? assessment.id : undefined);
  const documents = useDocuments(frozen ? assessment.id : undefined);
  const [docTab, setDocTab] = useState<string>(DOCUMENT_KINDS[0]);
  const { data: org } = useOrganization(assessment?.organizationId ?? "");

  const crumbsBase = [
    { label: copy.shell_context.supervisor, to: "/supervisor" },
    { label: t.organizations_title, to: "/supervisor/organizations" },
  ];
  const title = org?.name ?? t.results_title;

  if (current.isLoading) {
    return (
      <>
        <PageHeader title={t.results_title} breadcrumbs={crumbsBase} />
        <SkeletonPanel lines={6} />
      </>
    );
  }

  if (current.isError || !assessment) {
    return (
      <>
        <PageHeader title={t.results_title} breadcrumbs={crumbsBase} />
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={AlertCircle}
            message={current.isError ? t.load_error : t.results_not_found}
            action={current.isError ? { label: t.retry, onClick: () => void current.refetch() } : { label: t.organizations_title, to: "/supervisor/organizations" }}
          />
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={title}
        description={t.results_desc}
        breadcrumbs={[...crumbsBase, { label: title }]}
        meta={
          <KeyFacts
            items={[
              { label: t.col_status, value: <StatusBadge status={reviewStatusKey(assessment.status)} /> },
              { label: t.col_cycle, value: assessment.cycle.name },
              { label: t.col_approved, value: <span className="tabular">{assessment.approvedAt ? formatDate(assessment.approvedAt) : "-"}</span> },
            ]}
          />
        }
      />

      <div className="flex flex-col gap-6">
        <SignOffActions assessment={assessment} />

        {!frozen ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState message={r.not_frozen} action={{ label: t.organizations_title, to: "/supervisor/organizations" }} />
          </div>
        ) : results.isLoading ? (
          <SkeletonPanel lines={6} />
        ) : results.isError || !results.data ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState icon={AlertCircle} message={r.load_error} action={{ label: r.retry, onClick: () => void results.refetch() }} />
          </div>
        ) : (
          <ResultsOverview results={results.data} />
        )}

        {frozen && (documents.data?.length ?? 0) > 0 && (
          <section aria-labelledby="documents-title" className="flex flex-col gap-4">
            <h2 id="documents-title" className="text-h3 text-ink">
              {d.documents_title}
            </h2>
            <Tabs value={docTab} onValueChange={setDocTab} dir="rtl">
              <TabsList className={tabsUi.list} aria-label={d.documents_title}>
                {(documents.data ?? []).map((doc) => (
                  <TabsTrigger key={doc.kind} value={doc.kind} className={tabsUi.trigger}>
                    {KIND_LABEL[doc.kind]}
                  </TabsTrigger>
                ))}
              </TabsList>
              {(documents.data ?? []).map((doc) => (
                <TabsContent key={doc.kind} value={doc.kind} className={tabsUi.content}>
                  <DocumentScreen assessmentId={assessment.id} kind={doc.kind} />
                </TabsContent>
              ))}
            </Tabs>
          </section>
        )}

        <OrganizationCard orgId={assessment.organizationId} />
      </div>
    </>
  );
};

export default SupervisorResults;
