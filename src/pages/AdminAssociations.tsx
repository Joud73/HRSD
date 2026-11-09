import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Building2, ChevronLeft } from "lucide-react";
import { copy, adminCopy, fieldsCopy } from "@/lib/copy";
import { STATUS, toStatusKey, type StatusKey } from "@/lib/status";
import { useOrganizations } from "@/hooks/useOrganizations";
import type { OrganizationListRow } from "@/services/organizationService";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SearchField, Toolbar } from "@/components/admin/AdminParts";
import ExportMenu from "@/components/admin/ExportMenu";

const STATUS_ORDER: StatusKey[] = ["not_started", "in_progress", "submitted", "returned", "approved"];
type StatusFilter = "all" | "unassigned" | StatusKey;

const AdminAssociations = () => {
  const navigate = useNavigate();
  const { data: associations, isLoading } = useOrganizations();

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return (associations || []).filter((r) => {
      if (statusFilter === "unassigned" && r.evaluatorId) return false;
      if (statusFilter !== "all" && statusFilter !== "unassigned" && toStatusKey(r.assessmentStatus) !== statusFilter) return false;
      if (search && !r.name.includes(search) && !r.registrationNumber.includes(search)) return false;
      return true;
    });
  }, [associations, statusFilter, search]);

  const filtersOn = search !== "" || statusFilter !== "all";
  const clearFilters = () => { setSearch(""); setStatusFilter("all"); };

  const columns: Column<OrganizationListRow>[] = [
    { key: "name", header: adminCopy.col_association, cell: (r) => <span className="font-hrsd-medium">{r.name}</span> },
    { key: "registration", header: adminCopy.col_registration, cell: (r) => <span className="tabular">{r.registrationNumber}</span> },
    {
      key: "type",
      header: fieldsCopy.entity_type,
      cell: (r) => <span className="text-muted-foreground">{r.entityType ? fieldsCopy.entity_types[r.entityType] : "-"}</span>,
    },
    {
      key: "status",
      header: adminCopy.col_status,
      cell: (r) => <StatusBadge status={r.assessmentStatus ?? "not_started"} />,
    },
    {
      key: "evaluator",
      header: adminCopy.col_evaluator,
      cell: (r) => <span className="text-muted-foreground">{r.evaluatorName ?? adminCopy.not_assigned}</span>,
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
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        getRowKey={(r) => r.id}
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
