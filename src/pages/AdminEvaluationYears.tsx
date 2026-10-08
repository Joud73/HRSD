import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CalendarDays, Pencil, Plus, Trash2 } from "lucide-react";
import { copy, adminSetupCopy as t } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import SearchInput from "@/components/admin/setup/SearchInput";
import YearStateLabel from "@/components/admin/setup/YearStateLabel";
import { ConfirmDelete } from "@/components/admin/setup/SetupDialogs";
import { crumbs, YEARS_PATH } from "@/components/admin/setup/crumbs";
import { getYearState, yearSeed, type EvaluationYear, type YearState } from "@/components/admin/setup/evaluationYears";

type StateFilter = "all" | YearState;

const Period = ({ start, end }: { start: string; end: string }) => (
  <span className="flex flex-col text-muted-foreground">
    <span className="whitespace-nowrap">{formatDate(start)}</span>
    <span className="whitespace-nowrap text-caption">{formatDate(end)}</span>
  </span>
);

const AdminEvaluationYears = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [years, setYears] = useState<EvaluationYear[]>(yearSeed);
  const [search, setSearch] = useState("");
  const [stateFilter, setStateFilter] = useState<StateFilter>("all");
  const [deleteTarget, setDeleteTarget] = useState<EvaluationYear | null>(null);

  const searched = useMemo(
    () => years.filter((y) => !search || String(y.yearNumber).includes(search)),
    [years, search]
  );
  const filtered = useMemo(
    () => searched.filter((y) => stateFilter === "all" || getYearState(y) === stateFilter),
    [searched, stateFilter]
  );

  const handleDelete = () => {
    if (!deleteTarget) return;
    setYears((prev) => prev.filter((y) => y.id !== deleteTarget.id));
    toast({ title: t.years_deleted });
    setDeleteTarget(null);
  };

  const openYear = (y: EvaluationYear) => navigate(`${YEARS_PATH}/${y.id}`);
  const addYear = () => navigate(`${YEARS_PATH}/new`);

  const columns: Column<EvaluationYear>[] = [
    {
      key: "year",
      header: t.years_col_year,
      cell: (y) => <span className="tabular text-body font-hrsd-bold text-ink">{y.yearNumber}</span>,
    },
    { key: "submission", header: t.years_col_submission, cell: (y) => <Period start={y.submissionStart} end={y.submissionEnd} /> },
    { key: "evaluation", header: t.years_col_evaluation, cell: (y) => <Period start={y.evaluationStart} end={y.evaluationEnd} /> },
    { key: "state", header: t.status, cell: (y) => <YearStateLabel state={getYearState(y)} /> },
    {
      key: "updated",
      header: t.years_col_updated,
      cell: (y) => <span className="whitespace-nowrap text-muted-foreground">{formatDate(y.updatedAt)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">{t.actions}</span>,
      align: "end",
      className: "w-28",
      cell: (y) => (
        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()} onKeyDown={(e) => e.stopPropagation()}>
          <Button size="icon" variant="ghost" onClick={() => openYear(y)} aria-label={`${t.years_edit_aria} ${y.yearNumber}`}>
            <Pencil aria-hidden />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="text-danger hover:bg-danger/10 hover:text-danger"
            onClick={() => setDeleteTarget(y)}
            aria-label={`${t.years_delete_aria} ${y.yearNumber}`}
          >
            <Trash2 aria-hidden />
          </Button>
        </div>
      ),
    },
  ];

  const count = (s: YearState) => searched.filter((y) => getYearState(y) === s).length;
  const filterOptions: { value: StateFilter; label: string; count: number }[] = [
    { value: "all", label: copy.filter_all, count: searched.length },
    { value: "upcoming", label: t.year_state.upcoming, count: count("upcoming") },
    { value: "open", label: t.year_state.open, count: count("open") },
    { value: "closed", label: t.year_state.closed, count: count("closed") },
  ];

  return (
    <>
      <PageHeader
        title={t.years_title}
        description={t.years_desc}
        breadcrumbs={crumbs.years}
        actions={
          <Button onClick={addYear}>
            <Plus aria-hidden /> {t.years_add}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder={t.years_search} className="sm:w-64" />
        <SegmentedControl label={t.years_filter_label} value={stateFilter} onChange={setStateFilter} options={filterOptions} />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(y) => y.id}
        onRowClick={openYear}
        rowLabel={(y) => `${t.years_open_aria} ${y.yearNumber}`}
        caption={t.years_title}
        empty={
          years.length === 0 ? (
            <EmptyState icon={CalendarDays} message={t.years_empty_all} action={{ label: t.years_add, onClick: addYear }} />
          ) : (
            <EmptyState
              icon={CalendarDays}
              message={t.years_empty}
              action={{ label: t.reset_filters, onClick: () => { setSearch(""); setStateFilter("all"); } }}
            />
          )
        }
      />

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t.years_delete_title}
        description={`${t.years_delete_desc} ${deleteTarget?.yearNumber ?? ""}. ${t.delete_irreversible}`}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminEvaluationYears;
