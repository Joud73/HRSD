import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import type { ReactNode } from "react";
import { evaluatorCopy as t } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { reviewStatusKey } from "@/lib/status";
import type { ReviewRow } from "@/services/evaluatorService";
import DataTable, { type Column } from "@/components/shared/DataTable";
import StatusBadge from "@/components/shared/StatusBadge";

interface ReviewsTableProps {
  rows: ReviewRow[];
  loading?: boolean;
  caption: string;
  empty: ReactNode;
}

/** Assigned assessments; a row opens /evaluator/assessments/:id. Shared by the dashboard and the full list. */
const ReviewsTable = ({ rows, loading, caption, empty }: ReviewsTableProps) => {
  const navigate = useNavigate();

  const columns: Column<ReviewRow>[] = [
    {
      key: "organization",
      header: t.col_organization,
      cell: (r) => (
        <div className="flex flex-col items-start">
          <span className="font-hrsd-medium">{r.organizationName}</span>
          <span className="tabular text-caption text-muted-foreground">{r.registrationNumber}</span>
        </div>
      ),
    },
    { key: "cycle", header: t.col_cycle, cell: (r) => <span className="text-muted-foreground">{r.cycleName}</span> },
    { key: "status", header: t.col_status, cell: (r) => <StatusBadge status={reviewStatusKey(r.status)} /> },
    { key: "progress", header: t.col_progress, cell: (r) => <span className="tabular">{formatNumber(r.progressPct)}%</span> },
    {
      key: "score",
      header: t.col_score,
      cell: (r) => <span className="tabular font-hrsd-medium">{formatNumber(r.scorePct)}%</span>,
    },
    {
      key: "submitted",
      header: t.col_submitted,
      cell: (r) => <span className="tabular whitespace-nowrap text-muted-foreground">{r.submittedAt ? formatDate(r.submittedAt) : "-"}</span>,
    },
    {
      key: "open",
      header: <span className="sr-only">{t.open_assessment}</span>,
      align: "end",
      cell: () => <ChevronLeft aria-hidden className="ms-auto h-4 w-4 text-muted-foreground group-hover:text-primary" />,
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rows}
      loading={loading}
      getRowKey={(r) => r.assessmentId}
      onRowClick={(r) => navigate(`/evaluator/assessments/${r.assessmentId}`)}
      rowLabel={(r) => `${t.open_assessment}: ${r.organizationName}`}
      caption={caption}
      empty={empty}
    />
  );
};

export default ReviewsTable;
