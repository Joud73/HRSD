import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { copy, adminSetupCopy as t } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useCycleMutations, useCycles } from "@/hooks/useCycles";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import SearchInput from "@/components/admin/setup/SearchInput";
import CycleStatusLabel from "@/components/admin/setup/CycleStatusLabel";
import { ConfirmDelete } from "@/components/admin/setup/SetupDialogs";
import { crumbs, CYCLES_PATH } from "@/components/admin/setup/crumbs";
import type { Cycle, CycleStatus } from "@/services/cycleService";

type StatusFilter = "all" | CycleStatus;

const STATUSES: CycleStatus[] = ["draft", "open", "closed", "archived"];

const Period = ({ start, end }: { start: string; end: string }) => (
  <span className="flex flex-col text-muted-foreground">
    <span className="whitespace-nowrap">{formatDate(start)}</span>
    <span className="whitespace-nowrap text-caption">{formatDate(end)}</span>
  </span>
);

const AdminEvaluationYears = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { data: cycles = [], isLoading, isError, refetch } = useCycles();
  const { remove } = useCycleMutations();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<Cycle | null>(null);

  const searched = useMemo(() => cycles.filter((cy) => !search || cy.name.includes(search)), [cycles, search]);
  const filtered = useMemo(
    () => searched.filter((cy) => statusFilter === "all" || cy.status === statusFilter),
    [searched, statusFilter]
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    remove.mutate(deleteTarget.id, {
      onSuccess: () => toast({ title: t.cycles_deleted }),
      onError: (e) => toast({ title: e.message, variant: "destructive" }),
    });
    setDeleteTarget(null);
  };

  const openCycle = (cy: Cycle) => navigate(`${CYCLES_PATH}/${cy.id}`);
  const addCycle = () => navigate(`${CYCLES_PATH}/new`);

  const columns: Column<Cycle>[] = [
    {
      key: "name",
      header: t.name,
      cell: (cy) => <span className="text-body font-hrsd-bold text-ink">{cy.name}</span>,
    },
    { key: "status", header: t.status, cell: (cy) => <CycleStatusLabel status={cy.status} /> },
    { key: "submission", header: t.cycles_col_submission, cell: (cy) => <Period start={cy.submissionStart} end={cy.submissionEnd} /> },
    { key: "review", header: t.cycles_col_review, cell: (cy) => <Period start={cy.reviewStart} end={cy.reviewEnd} /> },
    { key: "approval", header: t.cycles_col_approval, cell: (cy) => <Period start={cy.approvalStart} end={cy.approvalEnd} /> },
    {
      key: "actions",
      header: <span className="sr-only">{t.actions}</span>,
      align: "end",
      className: "w-28",
      cell: (cy) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" onClick={() => openCycle(cy)} aria-label={`${t.cycles_edit_aria} ${cy.name}`}>
            <Pencil aria-hidden />
          </Button>
          {cy.status === "draft" && (
            <Button
              size="icon"
              variant="ghost"
              className="text-danger hover:bg-danger/10 hover:text-danger"
              onClick={() => setDeleteTarget(cy)}
              aria-label={`${t.cycles_delete_aria} ${cy.name}`}
            >
              <Trash2 aria-hidden />
            </Button>
          )}
        </div>
      ),
    },
  ];

  const filterOptions: { value: StatusFilter; label: string; count: number }[] = [
    { value: "all", label: copy.filter_all, count: searched.length },
    ...STATUSES.map((s) => ({ value: s, label: t.cycle_status[s], count: searched.filter((cy) => cy.status === s).length })),
  ];

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  return (
    <>
      <PageHeader
        title={t.cycles_title}
        description={t.cycles_desc}
        breadcrumbs={crumbs.cycles}
        actions={
          <Button onClick={addCycle}>
            <Plus aria-hidden /> {t.cycles_add}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder={t.cycles_search} className="sm:w-64" />
        <SegmentedControl label={t.cycles_filter_label} value={statusFilter} onChange={setStatusFilter} options={filterOptions} />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        getRowKey={(cy) => cy.id}
        onRowClick={openCycle}
        rowLabel={(cy) => `${t.cycles_open_aria} ${cy.name}`}
        caption={t.cycles_title}
        empty={
          isError ? (
            <EmptyState icon={AlertCircle} message={t.cycles_load_error} action={{ label: t.retry, onClick: () => void refetch() }} />
          ) : cycles.length === 0 ? (
            <EmptyState icon={CalendarDays} message={t.cycles_empty_all} action={{ label: t.cycles_add, onClick: addCycle }} />
          ) : (
            <EmptyState icon={CalendarDays} message={t.cycles_empty} action={{ label: t.reset_filters, onClick: resetFilters }} />
          )
        }
      />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t.cycles_delete_title}
        description={`${t.cycles_delete_desc} ${deleteTarget?.name ?? ""}. ${t.delete_irreversible}`}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminEvaluationYears;
