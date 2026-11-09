import { useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, BadgeCheck, ClipboardCheck, Info, Undo2 } from "lucide-react";
import { assessmentCopy, copy, evaluatorCopy as t, fieldsCopy as f } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { reviewStatusKey } from "@/lib/status";
import { useToast } from "@/hooks/use-toast";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { useAssessment, useProgress, useTransitionAssessment } from "@/hooks/useAssessment";
import { useOrganization } from "@/hooks/useOrganizations";
import { today, type Assessment, type ReviewTransition } from "@/services/assessmentService";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { FieldShell, FormError } from "@/components/shared/FormField";
import { Fact, KeyFacts, Panel } from "@/components/admin/AdminParts";
import { FormDialog } from "@/components/admin/setup/SetupDialogs";
import { tabsUi } from "@/components/admin/adminUi";
import AssessmentWorkspace from "@/components/assessment/AssessmentWorkspace";

const orDash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "-" : v);

/* ── Action bar: only the transitions valid for the status, inside the review period ── */

const ReviewActions = ({ assessment }: { assessment: Assessment }) => {
  const { toast } = useToast();
  const transition = useTransitionAssessment(assessment.id);
  const [dialog, setDialog] = useState<"returned" | "approved" | null>(null);
  const [note, setNote] = useState("");
  const [noteError, setNoteError] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(null);

  const day = today();
  const beforePeriod = day < assessment.cycle.reviewStart;
  const afterPeriod = day > assessment.cycle.approvalEnd;
  const locked = beforePeriod || afterPeriod || transition.isPending;

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
  const buttons =
    status === "submitted" ? (
      <Button onClick={() => run("under_review", t.toast_started)} disabled={locked}>
        <ClipboardCheck aria-hidden /> {t.start_review}
      </Button>
    ) : status === "under_review" ? (
      <>
        <Button onClick={() => setDialog("approved")} disabled={locked}>
          <BadgeCheck aria-hidden /> {t.approve}
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            setNote("");
            setNoteError(undefined);
            setDialog("returned");
          }}
          disabled={locked}
        >
          <Undo2 aria-hidden /> {t.return}
        </Button>
      </>
    ) : null;

  const statusLine =
    status === "approved" ? t.no_actions_approved : status === "returned" ? t.no_actions_returned : status === "draft" ? t.no_actions_draft : null;

  return (
    <section aria-label={t.actions_label} className="flex flex-col gap-3 rounded-lg border border-border bg-card px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        {buttons}
        {statusLine && <p className="text-small text-muted-foreground">{statusLine}</p>}
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
            <Textarea id="return-note" rows={4} value={note} onChange={(e) => setNote(e.target.value)} className="text-body" />
          </FieldShell>
        </FormDialog>
      )}
      {dialog === "approved" && (
        <FormDialog
          open
          onOpenChange={(o) => !o && !transition.isPending && setDialog(null)}
          title={t.approve_title}
          description={t.approve_desc}
          submitLabel={t.approve_confirm}
          onSubmit={() => run("approved", t.toast_approved)}
        >
          <FormError message={error} />
        </FormDialog>
      )}
    </section>
  );
};

/* ── Organization card ── */

const OrganizationCard = ({ orgId }: { orgId: string }) => {
  const { data: org, isLoading } = useOrganization(orgId);
  if (isLoading) return <SkeletonPanel lines={4} />;
  if (!org) return null;
  const d = org.delegate;
  return (
    <Panel title={t.org_card_title}>
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label={f.org.name}>{org.name}</Fact>
        <Fact label={f.org.registration_number}>
          <span className="tabular">{org.registrationNumber}</span>
        </Fact>
        <Fact label={f.entity_type}>{org.entityType ? f.entity_types[org.entityType] : "-"}</Fact>
        <Fact label={f.org.registration_date}>
          <span className="tabular">{org.registrationDate ? formatDate(org.registrationDate) : "-"}</span>
        </Fact>
        <Fact label={f.org.sub_classification}>{orDash(org.subClassificationName)}</Fact>
        <Fact label={f.org.social_dev_center}>{orDash(org.socialDevCenterName)}</Fact>
        <Fact label={t.org_region_city}>{[org.region, org.city].filter(Boolean).join("، ") || "-"}</Fact>
        <Fact label={f.org.employees_count}>
          <span className="tabular">{org.employeesCount === null ? "-" : formatNumber(org.employeesCount)}</span>
        </Fact>
      </dl>
      <h3 className="mb-4 mt-6 border-t border-border pt-5 text-small font-hrsd-bold text-ink">{t.delegate_title}</h3>
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
        <Fact label={f.delegate.name}>{orDash(d?.fullName)}</Fact>
        <Fact label={f.delegate.mobile}>{d?.mobile ? <bdi dir="ltr" className="tabular">{d.mobile}</bdi> : "-"}</Fact>
        <Fact label={f.delegate.email}>{d?.email ? <bdi dir="ltr">{d.email}</bdi> : "-"}</Fact>
      </dl>
    </Panel>
  );
};

/* ── Page ── */

/** /evaluator/assessments/:assessmentId: the assigned evaluator reviews one assessment (read only answers, status actions). */
const EvaluatorReview = () => {
  const { assessmentId = "" } = useParams<{ assessmentId: string }>();
  const scope = { kind: "assessment" as const, id: assessmentId };
  const current = useAssessment(scope, { ensure: false });
  const tool = useApprovedTool();
  const progress = useProgress(current.assessment?.id);
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

  return (
    <>
      <OrgHeader assessment={assessment} crumbsBase={crumbsBase} progressPct={progress.data?.progressPct ?? null} />

      <div className="flex flex-col gap-6">
        <ReviewActions assessment={assessment} />
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

/** Organization name as the title, with status, cycle, submission date and progress. */
const OrgHeader = ({
  assessment,
  crumbsBase,
  progressPct,
}: {
  assessment: Assessment;
  crumbsBase: { label: string; to: string }[];
  progressPct: number | null;
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
          ]}
        />
      }
    />
  );
};

export default EvaluatorReview;
