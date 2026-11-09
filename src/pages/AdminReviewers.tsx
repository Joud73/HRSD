import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, UserCheck, UserPlus } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useCreateEvaluator, useEvaluators } from "@/hooks/useEvaluators";
import type { EvaluatorListRow } from "@/services/evaluatorService";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import { FormError } from "@/components/shared/FormField";
import { RowActionsTrigger, SearchField, Toolbar } from "@/components/admin/AdminParts";
import ExportMenu from "@/components/admin/ExportMenu";
import { FormDialog } from "@/components/admin/setup/SetupDialogs";
import { EvaluatorFields } from "@/components/shared/ProfileFields";
import { validateEvaluator, type EvaluatorErrors, type EvaluatorFormValues } from "@/components/shared/profileForm";

const EMPTY_EVALUATOR: EvaluatorFormValues = { idNumber: "", fullName: "", mobile: "", email: "", employer: "" };

/** New evaluator: the HRSD fields; the account is invited by email (create-user), then the profile is saved. */
const CreateEvaluatorDialog = ({ onOpenChange }: { onOpenChange: (open: boolean) => void }) => {
  const { toast } = useToast();
  const create = useCreateEvaluator();
  const [form, setForm] = useState<EvaluatorFormValues>(EMPTY_EVALUATOR);
  const [errors, setErrors] = useState<EvaluatorErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = () => {
    if (create.isPending) return;
    const errs = validateEvaluator(form, { requireEmail: true });
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length > 0) return;
    create.mutate(form, {
      onSuccess: () => {
        toast({ title: adminCopy.reviewers_created, description: adminCopy.invite_sent_note });
        onOpenChange(false);
      },
      onError: (e) => setServerError(e.message),
    });
  };

  return (
    <FormDialog
      open
      onOpenChange={onOpenChange}
      title={adminCopy.reviewers_create_title}
      description={adminCopy.reviewers_create_desc}
      submitLabel={adminCopy.reviewers_create_submit}
      onSubmit={submit}
    >
      <FormError message={serverError} />
      <EvaluatorFields idPrefix="new-reviewer" values={form} onChange={setForm} errors={errors} requireEmail />
    </FormDialog>
  );
};

type LoadFilter = "all" | "with" | "without";

const AdminReviewers = () => {
  const navigate = useNavigate();

  const { data: evaluators, isLoading } = useEvaluators();

  const [search, setSearch] = useState("");
  const [loadFilter, setLoadFilter] = useState<LoadFilter>("all");
  const [createOpen, setCreateOpen] = useState(false);

  const searched = useMemo(() => {
    return (evaluators || []).filter((r) => {
      if (search && !r.fullName.includes(search) && !(r.accountEmail || "").includes(search) && !(r.email || "").includes(search)) return false;
      return true;
    });
  }, [evaluators, search]);

  const withCount = searched.filter((r) => r.counts.total > 0).length;
  const filtered = searched.filter((r) =>
    loadFilter === "all" ? true : loadFilter === "with" ? r.counts.total > 0 : r.counts.total === 0
  );
  const filtersOn = search !== "" || loadFilter !== "all";

  const columns: Column<EvaluatorListRow>[] = [
    {
      key: "name",
      header: adminCopy.col_evaluator,
      cell: (r) => (
        <div className="flex flex-col items-start">
          <span className="font-hrsd-medium">{r.fullName}</span>
          {r.accountEmail && r.accountEmail !== r.fullName && (
            <span dir="ltr" className="text-caption text-muted-foreground">{r.accountEmail}</span>
          )}
        </div>
      ),
    },
    { key: "status", header: adminCopy.reviewer_status, cell: (r) => (r.isActive ? adminCopy.reviewer_active : adminCopy.reviewer_inactive) },
    { key: "assigned", header: adminCopy.col_assigned_count, cell: (r) => <span className="tabular">{formatNumber(r.counts.total)}</span> },
    { key: "completed", header: adminCopy.col_completed_count, cell: (r) => <span className="tabular">{formatNumber(r.counts.approved)}</span> },
    {
      key: "progress",
      header: adminCopy.col_in_progress_count,
      cell: (r) => <span className="tabular">{formatNumber(r.counts.submitted + r.counts.under_review)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">{adminCopy.actions_label}</span>,
      align: "end",
      className: "w-16",
      cell: (r) => (
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <RowActionsTrigger />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem className="gap-2 text-small" onSelect={() => navigate(`/admin/reviewers/${r.userId}`)}>
              <Eye aria-hidden className="h-4 w-4" /> {adminCopy.reviewers_view}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={copy.nav_admin.reviewers}
        description={adminCopy.reviewers_desc}
        breadcrumbs={[{ label: adminCopy.breadcrumb_root, to: "/admin" }, { label: copy.nav_admin.reviewers }]}
        actions={
          <>
            <Button onClick={() => setCreateOpen(true)}>
              <UserPlus aria-hidden /> {adminCopy.reviewers_create}
            </Button>
            <ExportMenu print={false} />
          </>
        }
      />

      <Toolbar>
        <SearchField value={search} onChange={setSearch} placeholder={adminCopy.reviewers_search} />
        <SegmentedControl
          label={adminCopy.reviewers_filter}
          value={loadFilter}
          onChange={setLoadFilter}
          options={[
            { value: "all", label: copy.filter_all, count: searched.length },
            { value: "with", label: adminCopy.reviewers_with, count: withCount },
            { value: "without", label: adminCopy.reviewers_without, count: searched.length - withCount },
          ]}
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        getRowKey={(r) => r.userId}
        onRowClick={(r) => navigate(`/admin/reviewers/${r.userId}`)}
        rowLabel={(r) => `${adminCopy.reviewers_view}: ${r.fullName}`}
        caption={copy.nav_admin.reviewers}
        empty={
          filtersOn ? (
            <EmptyState
              message={adminCopy.no_results}
              action={{ label: adminCopy.clear_filters, onClick: () => { setSearch(""); setLoadFilter("all"); } }}
            />
          ) : (
            <EmptyState icon={UserCheck} message={adminCopy.reviewers_empty} action={{ label: adminCopy.reviewers_create, onClick: () => setCreateOpen(true) }} />
          )
        }
      />

      {/* Mounted while open, so each opening starts empty */}
      {createOpen && <CreateEvaluatorDialog onOpenChange={setCreateOpen} />}
    </>
  );
};

export default AdminReviewers;
