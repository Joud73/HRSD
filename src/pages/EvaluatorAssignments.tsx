import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { copy, evaluatorCopy as t } from "@/lib/copy";
import { formatDate, formatPercent } from "@/lib/format";
import { STATUS, toStatusKey, type StatusKey } from "@/lib/status";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import StatusBadge from "@/components/shared/StatusBadge";
import { useEvaluatorAssignments, type AssignmentRow } from "@/hooks/useEvaluatorAssignments";

/** Assignment codes that src/lib/status.ts does not know yet */
const statusOf = (raw: string) => toStatusKey(raw);

const STATUS_KEYS = Object.keys(STATUS) as StatusKey[];
type Filter = "all" | StatusKey;

const columns: Column<AssignmentRow>[] = [
  {
    key: "association",
    header: t.col_association,
    cell: (r) => <span className="font-hrsd-medium">{r.association_name || t.unknown_association}</span>,
  },
  { key: "year", header: t.col_year, cell: (r) => <span className="tabular">{r.year ?? "—"}</span> },
  { key: "status", header: t.col_status, cell: (r) => <StatusBadge status={statusOf(r.status)} /> },
  {
    key: "completion",
    header: t.col_completion,
    cell: (r) => {
      const pct = r.completion_percentage;
      const known = pct !== null && pct !== undefined;
      return (
        <div className="flex items-center gap-3">
          <div aria-hidden className="h-1.5 w-20 overflow-hidden rounded-full bg-section-alt">
            <div className="h-full rounded-full bg-primary" style={{ width: `${known ? Math.min(100, pct) : 0}%` }} />
          </div>
          <span className="tabular text-small text-muted-foreground">{formatPercent(known ? pct : null)}</span>
        </div>
      );
    },
  },
  { key: "assigned", header: t.col_assigned, cell: (r) => <span className="text-muted-foreground">{formatDate(r.assigned_at)}</span> },
  { key: "updated", header: t.col_updated, cell: (r) => <span className="text-muted-foreground">{formatDate(r.updated_at)}</span> },
  {
    key: "open",
    header: <span className="sr-only">{t.open_assignment}</span>,
    align: "end",
    cell: () => (
      <ChevronLeft aria-hidden className="ms-auto h-4 w-4 text-muted-foreground transition-transform duration-micro group-hover:-translate-x-0.5 group-hover:text-primary" />
    ),
  },
];

const EvaluatorAssignments = () => {
  const navigate = useNavigate();
  const { data: assignments, isLoading } = useEvaluatorAssignments();
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [yearFilter, setYearFilter] = useState("all");

  const years = useMemo(() => {
    if (!assignments) return [];
    const set = new Set(assignments.map((a) => a.year));
    return Array.from(set).sort((a, b) => b - a);
  }, [assignments]);

  const byYear = useMemo(
    () => (assignments ?? []).filter((a) => yearFilter === "all" || a.year === Number(yearFilter)),
    [assignments, yearFilter]
  );

  const filtered = useMemo(
    () => byYear.filter((a) => statusFilter === "all" || statusOf(a.status) === statusFilter),
    [byYear, statusFilter]
  );

  const options = [
    { value: "all" as Filter, label: copy.filter_all, count: byYear.length },
    ...STATUS_KEYS.map((k) => ({
      value: k as Filter,
      label: STATUS[k].label,
      count: byYear.filter((a) => statusOf(a.status) === k).length,
    })),
  ];

  const hasAny = (assignments?.length ?? 0) > 0;

  return (
    <>
      <PageHeader
        title={t.assignments_title}
        description={t.assignments_desc}
        breadcrumbs={[{ label: copy.shell_context.evaluator, to: "/evaluator" }, { label: t.assignments_title }]}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SegmentedControl<Filter> label={t.filter_status_label} value={statusFilter} onChange={setStatusFilter} options={options} />
          {years.length > 1 && (
            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger aria-label={t.filter_year_label} className="h-11 w-36 text-small">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{copy.filter_all}</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <DataTable
          columns={columns}
          rows={filtered}
          getRowKey={(r) => r.id}
          loading={isLoading}
          onRowClick={(r) => navigate(`/evaluator/assignment/${r.id}`)}
          rowLabel={(r) => `${t.open_assignment} ${r.association_name || t.unknown_association}`}
          caption={t.assignments_title}
          empty={
            hasAny ? (
              <EmptyState
                message={t.empty_filtered}
                action={{
                  label: t.clear_filter,
                  onClick: () => {
                    setStatusFilter("all");
                    setYearFilter("all");
                  },
                }}
              />
            ) : (
              <EmptyState message={t.empty_assignments} action={{ label: copy.nav_evaluator.dashboard, to: "/evaluator" }} />
            )
          }
        />
      </div>
    </>
  );
};

export default EvaluatorAssignments;
