import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { AlertCircle, ClipboardList, Pencil, UserCheck } from "lucide-react";
import { copy, adminCopy, fieldsCopy as fc } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { STATUS, toStatusKey, type StatusKey } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useEvaluator, useEvaluatorAssessments, useUpsertEvaluatorProfile } from "@/hooks/useEvaluators";
import type { Evaluator, EvaluatorAssessment } from "@/services/evaluatorService";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { FieldShell, FormError } from "@/components/shared/FormField";
import { EvaluatorFields } from "@/components/shared/ProfileFields";
import { validateEvaluator, type EvaluatorErrors, type EvaluatorFormValues } from "@/components/shared/profileForm";
import { Fact, KeyFacts, Panel } from "@/components/admin/AdminParts";
import { FormDialog, fieldRowClass } from "@/components/admin/setup/SetupDialogs";
import { tabsUi } from "@/components/admin/adminUi";

const crumbs = (name: string) => [
  { label: adminCopy.breadcrumb_root, to: "/admin" },
  { label: copy.nav_admin.reviewers, to: "/admin/reviewers" },
  { label: name },
];

/** Status groups counted in the header, in workflow order */
const COUNTED: StatusKey[] = ["in_progress", "submitted", "returned", "approved"];

const orDash = (v: string | null | undefined) => (v ? v : "-");

const ActiveState = ({ active }: { active: boolean }) => (
  <span className={cn("inline-flex items-center gap-2", active ? "text-ink" : "text-muted-foreground")}>
    <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary" : "bg-neutral")} />
    {active ? adminCopy.reviewer_active : adminCopy.reviewer_inactive}
  </span>
);

/* ── Profile dialog ── */

const ProfileDialog = ({ evaluator, onOpenChange }: { evaluator: Evaluator; onOpenChange: (o: boolean) => void }) => {
  const { toast } = useToast();
  const upsert = useUpsertEvaluatorProfile(evaluator.userId);
  const [form, setForm] = useState<EvaluatorFormValues>(() => ({
    idNumber: evaluator.idNumber ?? "",
    fullName: evaluator.hasProfile ? evaluator.fullName : "",
    mobile: evaluator.mobile ?? "",
    email: evaluator.email ?? evaluator.accountEmail ?? "",
    employer: evaluator.employer ?? "",
  }));
  const [isActive, setIsActive] = useState(evaluator.isActive);
  const [errors, setErrors] = useState<EvaluatorErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = () => {
    const errs = validateEvaluator(form);
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length > 0) return;
    upsert.mutate(
      { ...form, isActive },
      {
        onSuccess: () => {
          toast({ title: adminCopy.saved });
          onOpenChange(false);
        },
        onError: (e) => setServerError(e.message),
      }
    );
  };

  return (
    <FormDialog open onOpenChange={onOpenChange} title={adminCopy.reviewer_edit} description={adminCopy.assoc_edit_desc} onSubmit={submit}>
      <FormError message={serverError} />
      <EvaluatorFields idPrefix="reviewer" values={form} onChange={setForm} errors={errors} />
      <FieldShell id="reviewer-active" label={adminCopy.reviewer_status}>
        <div className={fieldRowClass}>
          <span className="text-small text-ink">{isActive ? adminCopy.reviewer_active : adminCopy.reviewer_inactive}</span>
          <Switch id="reviewer-active" checked={isActive} onCheckedChange={setIsActive} />
        </div>
      </FieldShell>
    </FormDialog>
  );
};

/* ── Page ── */

const AdminReviewerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: evaluator, isLoading, isError, refetch } = useEvaluator(id);
  const assessments = useEvaluatorAssessments(id);
  const [editOpen, setEditOpen] = useState(false);

  if (isLoading || isError || !evaluator) {
    return (
      <>
        <PageHeader title={copy.nav_admin.reviewers} breadcrumbs={crumbs(copy.nav_admin.reviewers)} />
        {isLoading ? (
          <SkeletonPanel lines={4} />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {isError ? (
              <EmptyState icon={AlertCircle} message={adminCopy.load_error} action={{ label: adminCopy.retry, onClick: () => void refetch() }} />
            ) : (
              <EmptyState icon={UserCheck} message={adminCopy.reviewer_not_found} action={{ label: adminCopy.reviewer_back, to: "/admin/reviewers" }} />
            )}
          </div>
        )}
      </>
    );
  }

  const rows = assessments.data ?? [];
  const countOf = (key: StatusKey) => rows.filter((r) => toStatusKey(r.status) === key).length;

  const columns: Column<EvaluatorAssessment>[] = [
    { key: "association", header: adminCopy.col_association, cell: (r) => <span className="font-hrsd-medium">{r.organizationName}</span> },
    { key: "cycle", header: adminCopy.col_cycle, cell: (r) => r.cycleName },
    { key: "status", header: adminCopy.col_status, cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "assigned",
      header: adminCopy.col_assigned_at,
      cell: (r) => <span className="tabular whitespace-nowrap text-muted-foreground">{formatDate(r.assignedAt)}</span>,
    },
  ];

  return (
    <>
      <PageHeader
        title={evaluator.fullName}
        description={adminCopy.reviewer_detail_desc}
        breadcrumbs={crumbs(evaluator.fullName)}
        actions={
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil aria-hidden /> {adminCopy.reviewer_edit}
          </Button>
        }
        meta={
          <KeyFacts
            items={[
              { label: adminCopy.reviewer_status, value: <ActiveState active={evaluator.isActive} /> },
              { label: adminCopy.reviewer_assigned, value: <span className="tabular">{formatNumber(rows.length)}</span> },
              ...COUNTED.map((key) => ({ label: STATUS[key].label, value: <span className="tabular">{formatNumber(countOf(key))}</span> })),
            ]}
          />
        }
      />

      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className={tabsUi.list}>
          <TabsTrigger value="overview" className={tabsUi.trigger}>{adminCopy.reviewer_tab_overview}</TabsTrigger>
          <TabsTrigger value="evaluations" className={tabsUi.trigger}>{adminCopy.reviewer_tab_evaluations}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className={tabsUi.content}>
          <Panel title={fc.section_evaluator}>
            {!evaluator.hasProfile && <p className="mb-5 text-small text-muted-foreground">{adminCopy.reviewer_profile_missing}</p>}
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label={fc.evaluator.id_number}><span className="tabular">{orDash(evaluator.idNumber)}</span></Fact>
              <Fact label={fc.evaluator.name}>{evaluator.fullName}</Fact>
              <Fact label={fc.evaluator.mobile}>{evaluator.mobile ? <bdi dir="ltr" className="tabular">{evaluator.mobile}</bdi> : "-"}</Fact>
              <Fact label={fc.evaluator.email}>{evaluator.email ? <bdi dir="ltr">{evaluator.email}</bdi> : "-"}</Fact>
              <Fact label={fc.evaluator.employer}>{orDash(evaluator.employer)}</Fact>
              <Fact label={adminCopy.reviewer_account_email}>{evaluator.accountEmail ? <bdi dir="ltr">{evaluator.accountEmail}</bdi> : "-"}</Fact>
              <Fact label={adminCopy.reviewer_status}><ActiveState active={evaluator.isActive} /></Fact>
            </dl>
          </Panel>
        </TabsContent>

        <TabsContent value="evaluations" className={tabsUi.content}>
          <DataTable
            columns={columns}
            rows={rows}
            loading={assessments.isLoading}
            getRowKey={(r) => r.assessmentId}
            onRowClick={(r) => navigate(`/admin/associations/${r.organizationId}`)}
            rowLabel={(r) => `${adminCopy.associations_view}: ${r.organizationName}`}
            caption={adminCopy.reviewer_tab_evaluations}
            empty={
              assessments.isError ? (
                <EmptyState icon={AlertCircle} message={adminCopy.load_error} action={{ label: adminCopy.retry, onClick: () => void assessments.refetch() }} />
              ) : (
                <EmptyState icon={ClipboardList} message={adminCopy.reviewer_evaluations_empty} />
              )
            }
          />
        </TabsContent>
      </Tabs>

      {editOpen && <ProfileDialog evaluator={evaluator} onOpenChange={setEditOpen} />}
    </>
  );
};

export default AdminReviewerDetail;
