import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { adminCopy } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import type { AssociationRow } from "@/hooks/useAdminData";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { ProgressCell } from "@/components/admin/AdminParts";
import { assessmentStatus } from "@/components/admin/adminUi";

interface RecentEvaluationsProps {
  rows: AssociationRow[] | undefined;
  loading?: boolean;
  limit?: number;
}

/** Latest assigned assessments; a row opens the association detail. */
const RecentEvaluations = ({ rows, loading, limit = 6 }: RecentEvaluationsProps) => {
  const navigate = useNavigate();

  const recent = useMemo(
    () =>
      (rows ?? [])
        .filter((r) => r.assignment_id)
        .sort((a, b) => (b.assigned_at ?? "").localeCompare(a.assigned_at ?? ""))
        .slice(0, limit),
    [rows, limit]
  );

  const columns: Column<AssociationRow>[] = [
    { key: "name", header: adminCopy.col_association, cell: (r) => <span className="font-hrsd-medium">{r.name}</span> },
    { key: "status", header: adminCopy.col_status, cell: (r) => <StatusBadge status={assessmentStatus(r.status)} /> },
    { key: "progress", header: adminCopy.col_progress, cell: (r) => <ProgressCell value={r.progress} /> },
    {
      key: "evaluator",
      header: adminCopy.col_evaluator,
      cell: (r) =>
        r.evaluator_name ? (
          <span dir="ltr" className="text-muted-foreground">{r.evaluator_name}</span>
        ) : (
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "assigned",
      header: adminCopy.col_assigned_at,
      cell: (r) => <span className="tabular whitespace-nowrap text-muted-foreground">{formatDate(r.assigned_at)}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={recent}
      loading={loading}
      getRowKey={(r) => r.assignment_id ?? r.id}
      onRowClick={(r) => r.organization_id && navigate(`/admin/associations/${r.organization_id}`)}
      rowLabel={(r) => `${adminCopy.associations_view}: ${r.name}`}
      caption={adminCopy.recent_title}
      className="border-0"
      empty={
        <EmptyState
          icon={ClipboardList}
          message={adminCopy.recent_empty}
          action={{ label: adminCopy.recent_empty_action, to: "/admin/reviewers" }}
        />
      }
    />
  );
};

export default RecentEvaluations;
