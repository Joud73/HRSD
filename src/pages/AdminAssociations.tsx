import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronLeft } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { STATUS, type StatusKey } from "@/lib/status";
import { useAdminAssociations, type AssociationRow } from "@/hooks/useAdminData";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { ProgressCell, SearchField, Toolbar } from "@/components/admin/AdminParts";
import ExportMenu from "@/components/admin/ExportMenu";
import { assessmentStatus } from "@/components/admin/adminUi";

const STATUS_ORDER: StatusKey[] = ["not_started", "in_progress", "submitted", "returned", "approved"];
type StatusFilter = "all" | "unassigned" | StatusKey;

const AdminAssociations = () => {
  const navigate = useNavigate();
  const { data: associations, isLoading } = useAdminAssociations();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");

  const filtered = useMemo(() => {
    return (associations || []).filter((r) => {
      if (statusFilter === "unassigned" && r.assignment_id) return false;
      if (statusFilter !== "all" && statusFilter !== "unassigned" && (!r.assignment_id || assessmentStatus(r.status) !== statusFilter)) return false;
      if (yearFilter !== "all" && String(r.year) !== yearFilter) return false;
      if (search && !r.name.includes(search)) return false;
      return true;
    });
  }, [associations, statusFilter, yearFilter, search]);

  const years = useMemo(() => {
    const ySet = new Set((associations || []).map((a) => a.year));
    return [...ySet].sort((a, b) => b - a);
  }, [associations]);

  const filtersOn = search !== "" || statusFilter !== "all" || yearFilter !== "all";
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); setYearFilter("all"); };

  const columns: Column<AssociationRow>[] = [
    { key: "name", header: adminCopy.col_association, cell: (r) => <span className="font-hrsd-medium">{r.name}</span> },
    { key: "year", header: adminCopy.col_year, cell: (r) => <span className="tabular">{r.year}</span> },
    {
      key: "progress",
      header: adminCopy.col_progress,
      cell: (r) => (r.assignment_id ? <ProgressCell value={r.progress} /> : <span className="text-muted-foreground">—</span>),
    },
    {
      key: "status",
      header: adminCopy.col_status,
      cell: (r) => <StatusBadge status={assessmentStatus(r.status)} />,
    },
    {
      key: "evaluator",
      header: adminCopy.col_evaluator,
      cell: (r) =>
        r.evaluator_name ? (
          <span dir="ltr" className="text-muted-foreground">{r.evaluator_name}</span>
        ) : (
          <span className="text-muted-foreground">{adminCopy.not_assigned}</span>
        ),
    },
    {
      key: "open",
      header: <span className="sr-only">{adminCopy.actions_label}</span>,
      align: "end",
      className: "w-12",
      cell: () => (
        <ChevronLeft
          aria-hidden
          className="ms-auto h-4 w-4 text-muted-foreground transition-[color,transform] duration-micro group-hover:-translate-x-0.5 group-hover:text-primary"
        />
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={copy.nav_admin.associations}
        description={adminCopy.associations_desc}
        breadcrumbs={[{ label: adminCopy.breadcrumb_root, to: "/admin" }, { label: copy.nav_admin.associations }]}
        actions={<ExportMenu />}
      />

      <Toolbar>
        <SearchField value={search} onChange={setSearch} placeholder={adminCopy.associations_search} />
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} dir="rtl">
          <SelectTrigger className="h-10 w-full text-small sm:w-48" aria-label={adminCopy.status_label}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{adminCopy.status_all}</SelectItem>
            {STATUS_ORDER.map((key) => (
              <SelectItem key={key} value={key}>{STATUS[key].label}</SelectItem>
            ))}
            <SelectItem value="unassigned">{adminCopy.unassigned}</SelectItem>
          </SelectContent>
        </Select>
        {years.length > 0 && (
          <Select value={yearFilter} onValueChange={setYearFilter} dir="rtl">
            <SelectTrigger className="h-10 w-full text-small sm:w-40" aria-label={adminCopy.year_label}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{adminCopy.year_all}</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={String(y)}>{y}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        getRowKey={(r, idx) => `${r.id}-${r.assignment_id}-${idx}`}
        onRowClick={(r) => navigate(`/admin/associations/${r.id}`)}
        rowLabel={(r) => `${adminCopy.associations_view}: ${r.name}`}
        caption={copy.nav_admin.associations}
        empty={
          filtersOn ? (
            <EmptyState message={adminCopy.no_results} action={{ label: adminCopy.clear_filters, onClick: clearFilters }} />
          ) : (
            <EmptyState
              icon={Building2}
              message={adminCopy.associations_empty}
              action={{ label: adminCopy.associations_empty_action, to: "/admin/organization-requests" }}
            />
          )
        }
      />
    </>
  );
};

export default AdminAssociations;
