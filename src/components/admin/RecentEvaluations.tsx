import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { adminCopy } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { reviewStatusKey } from "@/lib/status";
import type { OrganizationListRow } from "@/services/organizationService";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { ProgressCell } from "@/components/admin/AdminParts";

interface RecentEvaluationsProps {
  rows: OrganizationListRow[] | undefined;
  loading?: boolean;
  limit?: number;
}

/** Organizations with an assessment in the open cycle (assessments and assessment_reviews); a row opens the organization. */
const RecentEvaluations = ({ rows, loading, limit = 6 }: RecentEvaluationsProps) => {
  const navigate = useNavigate();

  const recent = useMemo(() => (rows ?? []).filter((r) => r.assessmentId).slice(0, limit), [rows, limit]);

  const columns: Column<OrganizationListRow>[] = [
    { key: "name", header: adminCopy.col_association, cell: (r) => <span className="font-hrsd-medium">{r.name}</span> },
    { key: "status", header: adminCopy.col_status, cell: (r) => <StatusBadge status={reviewStatusKey(r.assessmentStatus ?? "")} /> },
    { key: "progress", header: adminCopy.col_progress, cell: (r) => <ProgressCell value={r.progressPct} /> },
    {
      key: "evaluator",
      header: adminCopy.col_evaluator,
      cell: (r) => <span className="text-muted-foreground">{r.evaluatorName ?? adminCopy.not_assigned}</span>,
    },
    {
      key: "deadline",
      header: adminCopy.assoc_due_effective,
      cell: (r) => <span className="tabular whitespace-nowrap text-muted-foreground">{r.deadline ? formatDate(r.deadline) : "-"}</span>,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={recent}
      loading={loading}
      getRowKey={(r) => r.id}
      onRowClick={(r) => navigate(`/admin/associations/${r.id}`)}
      rowLabel={(r) => `${adminCopy.associations_view}: ${r.name}`}
      caption={adminCopy.recent_title}
      className="border-0"
      empty={<EmptyState icon={ClipboardList} message={adminCopy.recent_empty} action={{ label: adminCopy.recent_view_all, to: "/admin/associations" }} />}
    />
  );
};

export default RecentEvaluations;
