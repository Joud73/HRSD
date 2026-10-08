import { useParams } from "react-router-dom";
import { ClipboardList } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { Fact, KeyFacts, Panel, ProgressCell } from "@/components/admin/AdminParts";
import { tabsUi } from "@/components/admin/adminUi";

/* ── Demo data (mirrors the reviewers page prototype) ── */
const reviewersMap: Record<string, { name: string; email: string; phone: string; active: boolean; assignedCount: number; avgDurationDays: number; avgScorePercent: number }> = {
  r1: { name: "أحمد محمد العتيبي", email: "ahmed@hrsd.gov.sa", phone: "0501234567", active: true, assignedCount: 12, avgDurationDays: 5, avgScorePercent: 85 },
  r2: { name: "سارة علي القحطاني", email: "sara@hrsd.gov.sa", phone: "0559876543", active: true, assignedCount: 9, avgDurationDays: 4, avgScorePercent: 91 },
  r3: { name: "خالد عمر الشهري", email: "khaled@hrsd.gov.sa", phone: "0541112233", active: true, assignedCount: 7, avgDurationDays: 6, avgScorePercent: 78 },
  r4: { name: "نورة سعد المالكي", email: "noura@hrsd.gov.sa", phone: "0533344556", active: false, assignedCount: 3, avgDurationDays: 8, avgScorePercent: 65 },
  r5: { name: "فهد ناصر الدوسري", email: "fahad@hrsd.gov.sa", phone: "0567788990", active: true, assignedCount: 15, avgDurationDays: 3, avgScorePercent: 92 },
};

interface Evaluation {
  id: string;
  association: string;
  year: number;
  track: string;
  status: string;
  completion: number;
  assignedDate: string;
}

const [T_ORIENTATION, T_TEAM] = copy.nav_tracks_items;

const mockEvaluations: Evaluation[] = [
  { id: "e1", association: "جمعية البر الخيرية", year: 2026, track: T_ORIENTATION, status: "in_progress", completion: 60, assignedDate: "2026-01-15" },
  { id: "e2", association: "جمعية إنسان", year: 2026, track: T_TEAM, status: "submitted", completion: 100, assignedDate: "2026-01-12" },
  { id: "e3", association: "جمعية تكافل", year: 2026, track: T_ORIENTATION, status: "in_progress", completion: 45, assignedDate: "2026-01-10" },
  { id: "e4", association: "مؤسسة العطاء", year: 2025, track: T_TEAM, status: "approved", completion: 100, assignedDate: "2025-11-20" },
  { id: "e5", association: "جمعية رعاية", year: 2025, track: T_ORIENTATION, status: "approved", completion: 100, assignedDate: "2025-10-05" },
];

const AccountState = ({ active }: { active: boolean }) => (
  <span className={cn("inline-flex items-center gap-2", active ? "text-ink" : "text-muted-foreground")}>
    <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", active ? "bg-primary" : "bg-neutral")} />
    {active ? adminCopy.users_status_active : adminCopy.users_status_disabled}
  </span>
);

const columns: Column<Evaluation>[] = [
  { key: "association", header: adminCopy.col_association, cell: (ev) => <span className="font-hrsd-medium">{ev.association}</span> },
  { key: "year", header: adminCopy.col_year, cell: (ev) => <span className="tabular">{ev.year}</span> },
  { key: "track", header: adminCopy.col_track, cell: (ev) => ev.track },
  { key: "status", header: adminCopy.col_status, cell: (ev) => <StatusBadge status={ev.status} /> },
  { key: "completion", header: adminCopy.col_progress, cell: (ev) => <ProgressCell value={ev.completion} /> },
  {
    key: "assigned",
    header: adminCopy.col_assigned_at,
    cell: (ev) => <span className="tabular whitespace-nowrap text-muted-foreground">{formatDate(ev.assignedDate)}</span>,
  },
];

const AdminReviewerDetail = () => {
  const { id } = useParams<{ id: string }>();
  const reviewer = reviewersMap[id || ""] ?? reviewersMap.r1;

  return (
    <>
      <PageHeader
        title={reviewer.name}
        description={adminCopy.reviewer_detail_desc}
        breadcrumbs={[
          { label: adminCopy.breadcrumb_root, to: "/admin" },
          { label: copy.nav_admin.reviewers, to: "/admin/reviewers" },
          { label: reviewer.name },
        ]}
        meta={
          <KeyFacts
            items={[
              { label: adminCopy.reviewer_status, value: <AccountState active={reviewer.active} /> },
              { label: adminCopy.reviewer_assigned, value: <span className="tabular">{formatNumber(reviewer.assignedCount)}</span> },
              {
                label: adminCopy.reviewer_avg_duration,
                value: <span className="tabular">{formatNumber(reviewer.avgDurationDays)}{adminCopy.days_suffix}</span>,
              },
              { label: adminCopy.reviewer_avg_score, value: <span className="tabular">{formatPercent(reviewer.avgScorePercent)}</span> },
            ]}
          />
        }
      />

      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className={tabsUi.list}>
          <TabsTrigger value="overview" className={tabsUi.trigger}>{adminCopy.reviewer_tab_overview}</TabsTrigger>
          <TabsTrigger value="evaluations" className={tabsUi.trigger}>{adminCopy.reviewer_tab_evaluations}</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className={tabsUi.content}>
          <Panel title={adminCopy.reviewer_info_title}>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <Fact label={adminCopy.reviewer_name}>{reviewer.name}</Fact>
              <Fact label={adminCopy.reviewer_email}><bdi dir="ltr">{reviewer.email}</bdi></Fact>
              <Fact label={adminCopy.reviewer_phone}><bdi dir="ltr" className="tabular">{reviewer.phone}</bdi></Fact>
              <Fact label={adminCopy.reviewer_status}><AccountState active={reviewer.active} /></Fact>
            </dl>
          </Panel>
        </TabsContent>

        <TabsContent value="evaluations" className={tabsUi.content}>
          <DataTable
            columns={columns}
            rows={mockEvaluations}
            getRowKey={(ev) => ev.id}
            caption={adminCopy.reviewer_tab_evaluations}
            empty={<EmptyState icon={ClipboardList} message={adminCopy.reviewer_evaluations_empty} />}
          />
        </TabsContent>
      </Tabs>
    </>
  );
};

export default AdminReviewerDetail;
