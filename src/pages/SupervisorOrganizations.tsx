import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Building2, PenLine } from "lucide-react";
import { copy, supervisorCopy as t } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { STATUS, toStatusKey, type StatusKey } from "@/lib/status";
import { useOrganizations } from "@/hooks/useOrganizations";
import type { OrganizationListRow } from "@/services/organizationService";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SearchField, Toolbar } from "@/components/admin/AdminParts";

const STATUS_ORDER: StatusKey[] = ["not_started", "in_progress", "submitted", "returned", "approved"];
type StatusFilter = "all" | StatusKey;

/** Status shown for a row: a draft with nothing marked yet has not started. */
const rowStatus = (r: OrganizationListRow): StatusKey =>
  r.assessmentStatus === "draft" && !r.progressPct ? "not_started" : toStatusKey(r.assessmentStatus);

const Progress = ({ value }: { value: number | null }) =>
  value === null ? (
    <span className="text-muted-foreground">{formatNumber(0)}%</span>
  ) : (
    <div className="flex min-w-[120px] items-center gap-3">
      <div role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={value} className="h-1.5 flex-1 overflow-hidden rounded-full bg-section-alt">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
      </div>
      <span className="tabular text-small text-ink">{formatNumber(value)}%</span>
    </div>
  );

/** المشرف الفني: every organization in the open cycle, read only, with proxy entry. */
const SupervisorOrganizations = () => {
  const { data: organizations, isLoading } = useOrganizations();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(
    () =>
      (organizations ?? []).filter((r) => {
        if (statusFilter !== "all" && rowStatus(r) !== statusFilter) return false;
        if (search && !r.name.includes(search) && !r.registrationNumber.includes(search)) return false;
        return true;
      }),
    [organizations, statusFilter, search]
  );

  const filtersOn = search !== "" || statusFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
  };

  const columns: Column<OrganizationListRow>[] = [
    { key: "name", header: t.col_organization, cell: (r) => <span className="font-hrsd-medium">{r.name}</span> },
    { key: "registration", header: t.col_registration, cell: (r) => <span className="tabular">{r.registrationNumber}</span> },
    { key: "status", header: t.col_status, cell: (r) => <StatusBadge status={rowStatus(r)} /> },
    { key: "progress", header: t.col_progress, cell: (r) => <Progress value={r.progressPct} /> },
    { key: "deadline", header: t.col_deadline, cell: (r) => <span className="tabular whitespace-nowrap">{r.deadline ? formatDate(r.deadline) : "-"}</span> },
    { key: "evaluator", header: t.col_evaluator, cell: (r) => <span className="text-muted-foreground">{r.evaluatorName ?? t.not_assigned}</span> },
    {
      key: "actions",
      header: <span className="sr-only">{t.col_actions}</span>,
      align: "end",
      cell: (r) => (
        <Button asChild variant="outline" size="sm" className="whitespace-nowrap">
          <Link to={`/supervisor/organizations/${r.id}/assessment/1`} aria-label={`${t.proxy_action}: ${r.name}`}>
            <PenLine aria-hidden />
            {t.proxy_action}
          </Link>
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={t.organizations_title}
        description={t.organizations_desc}
        breadcrumbs={[{ label: copy.shell_context.supervisor, to: "/supervisor" }, { label: t.organizations_title }]}
      />

      <Toolbar>
        <SearchField value={search} onChange={setSearch} placeholder={t.search} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} dir="rtl">
          <SelectTrigger className="h-10 w-full text-small sm:w-48" aria-label={t.status_label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t.status_all}</SelectItem>
            {STATUS_ORDER.map((key) => (
              <SelectItem key={key} value={key}>
                {STATUS[key].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        getRowKey={(r) => r.id}
        caption={t.organizations_title}
        empty={
          filtersOn ? (
            <EmptyState message={t.no_results} action={{ label: t.clear_filters, onClick: clearFilters }} />
          ) : (
            <EmptyState icon={Building2} message={t.empty} />
          )
        }
      />
    </>
  );
};

export default SupervisorOrganizations;
