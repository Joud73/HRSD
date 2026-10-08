import { useState } from "react";
import { useParams } from "react-router-dom";
import { Download, FileText, MessageSquare, Paperclip } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import type { StatusKey } from "@/lib/status";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import StatusBadge from "@/components/shared/StatusBadge";
import { FieldShell } from "@/components/shared/FormField";
import { Fact, KeyFacts, Panel } from "@/components/admin/AdminParts";
import { dialogUi, tabsUi } from "@/components/admin/adminUi";
import { formatDateTime } from "@/lib/format";

/* ══════════════════════════════════════════════════════
   DEMO DATA (prototype content; no Supabase source yet)
   ══════════════════════════════════════════════════════ */

const [T_ORIENTATION, T_TEAM, T_PARTNERSHIPS, T_PROGRAMS, T_IMPACT] = copy.nav_tracks_items;

const assocData: Record<string, {
  name: string; type: string; license: string; region: string; email: string;
  mobile: string; year: number; status: StatusKey; progress: number; score: number | null;
  delegate: { name: string; idNumber: string; email: string; mobile: string; role: string; date: string; active: boolean };
  tracks: { name: string; active: boolean }[];
}> = {
  a1: {
    name: "جمعية البر الخيرية", type: "جمعية", license: "1045832", region: "الرياض / الرياض",
    email: "info@albirr.org.sa", mobile: "0551234567", year: 2026, status: "in_progress",
    progress: 60, score: 72,
    delegate: {
      name: "عبدالرحمن الأحمد", idNumber: "1098765432", email: "a.alahmad@albirr.org.sa",
      mobile: "0559876543", role: "مدير الجودة", date: "2026-01-05", active: true,
    },
    tracks: [
      { name: T_ORIENTATION, active: true },
      { name: T_TEAM, active: true },
      { name: T_PARTNERSHIPS, active: false },
      { name: T_PROGRAMS, active: false },
      { name: T_IMPACT, active: true },
    ],
  },
};

interface Evidence {
  id: string; name: string; track: string; criterion: string; date: string; uploader: string; status: StatusKey;
}

const evidenceRows: Evidence[] = [
  { id: "e1", name: "وثيقة الرؤية الاستراتيجية", track: T_ORIENTATION, criterion: "الرؤية والرسالة", date: "2026-01-10", uploader: "عبدالرحمن الأحمد", status: "approved" },
  { id: "e2", name: "خطة التطوير المؤسسي", track: T_ORIENTATION, criterion: "التخطيط الاستراتيجي", date: "2026-01-12", uploader: "عبدالرحمن الأحمد", status: "returned" },
  { id: "e3", name: "هيكل فريق العمل", track: T_TEAM, criterion: "الهيكل التنظيمي", date: "2026-01-15", uploader: "عبدالرحمن الأحمد", status: "approved" },
  { id: "e4", name: "تقرير برامج التدريب", track: T_TEAM, criterion: "تطوير الكفاءات", date: "2026-01-18", uploader: "عبدالرحمن الأحمد", status: "returned" },
  { id: "e5", name: "اتفاقيات الشراكة", track: T_PARTNERSHIPS, criterion: "الشراكات المجتمعية", date: "2026-01-20", uploader: "عبدالرحمن الأحمد", status: "approved" },
  { id: "e6", name: "تقرير الأثر الاجتماعي", track: T_IMPACT, criterion: "قياس الأثر", date: "2026-01-22", uploader: "عبدالرحمن الأحمد", status: "returned" },
];

interface Criterion { criterion: string; status: StatusKey; score: number | null; note: string }

/** In track order (copy.nav_tracks_items) */
const tracksCriteria: [string, Criterion[]][] = [
  [T_ORIENTATION, [
    { criterion: "الرؤية والرسالة", status: "approved", score: 85, note: "صياغة الرؤية واضحة ومتميزة" },
    { criterion: "التخطيط الاستراتيجي", status: "returned", score: 60, note: "يحتاج إلى تفصيل أكثر" },
    { criterion: "القيم المؤسسية", status: "approved", score: 78, note: "" },
  ]],
  [T_TEAM, [
    { criterion: "الهيكل التنظيمي", status: "approved", score: 90, note: "ممتاز" },
    { criterion: "تطوير الكفاءات", status: "returned", score: 40, note: "لم يُرفق شاهد كافٍ" },
    { criterion: "بيئة العمل", status: "approved", score: 75, note: "" },
  ]],
  [T_PARTNERSHIPS, [
    { criterion: "الشراكات المجتمعية", status: "approved", score: 82, note: "" },
    { criterion: "التواصل المؤسسي", status: "returned", score: 55, note: "ضعف في التوثيق" },
  ]],
  [T_PROGRAMS, [
    { criterion: "تصميم البرامج", status: "not_started", score: null, note: "" },
    { criterion: "تنفيذ البرامج", status: "not_started", score: null, note: "" },
  ]],
  [T_IMPACT, [
    { criterion: "قياس الأثر", status: "returned", score: 50, note: "التقرير غير مكتمل" },
    { criterion: "التقارير الدورية", status: "approved", score: 70, note: "" },
  ]],
];

type Sender = "evaluator" | "association" | "supervision";
interface Comment { id: string; sender: Sender; message: string; time: string }

const senderLabel: Record<Sender, string> = {
  evaluator: adminCopy.sender_evaluator,
  association: adminCopy.sender_association,
  supervision: adminCopy.sender_supervision,
};

const initialComments: Comment[] = [
  { id: "c1", sender: "evaluator", message: "يرجى إرفاق تقرير الأثر الاجتماعي كاملاً.", time: "2026-01-22 10:30" },
  { id: "c2", sender: "association", message: "رُفع التقرير المحدّث، يرجى مراجعته.", time: "2026-01-23 14:15" },
  { id: "c3", sender: "supervision", message: "تمت الملاحظة، وستتم المتابعة مع المدقق.", time: "2026-01-24 09:00" },
];

interface AuditEntry { date: string; user: string; action: string; detail: string }

const auditLog: AuditEntry[] = [
  { date: "2026-01-05 09:00", user: "مدير النظام", action: "إنشاء ملف الجمعية", detail: "أُنشئ ملف جمعية البر الخيرية" },
  { date: "2026-01-06 11:30", user: "مدير النظام", action: "إسناد مدقق", detail: "أُسند التقييم إلى أحمد محمد" },
  { date: "2026-01-10 14:00", user: "المفوض", action: "رفع شاهد", detail: "وثيقة الرؤية الاستراتيجية" },
  { date: "2026-01-15 10:00", user: "المدقق", action: "تعديل تقييم", detail: "تحديث درجة معيار الرؤية والرسالة" },
  { date: "2026-01-20 16:45", user: "مدير النظام", action: "إضافة ملاحظة إشرافية", detail: `ملاحظة على مسار ${T_ORIENTATION}` },
  { date: "2026-01-22 10:30", user: "المدقق", action: "طلب استكمال", detail: "طلب تقرير الأثر الاجتماعي كاملاً" },
  { date: "2026-01-24 09:00", user: "مدير النظام", action: "تعليق إشرافي", detail: "متابعة طلب الاستكمال" },
];

/* ══════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════ */

type ManagerAction = "approve" | "redo" | "reopen" | "close";

const actionLabel: Record<ManagerAction, string> = {
  approve: adminCopy.eval_approve,
  redo: adminCopy.eval_redo,
  reopen: adminCopy.eval_reopen,
  close: adminCopy.eval_close,
};

const criterionColumns = (onDetails: () => void): Column<Criterion>[] => [
  { key: "criterion", header: adminCopy.eval_col_criterion, cell: (c) => <span className="font-hrsd-medium">{c.criterion}</span> },
  { key: "status", header: adminCopy.eval_col_status, cell: (c) => <StatusBadge status={c.status} /> },
  {
    key: "score",
    header: adminCopy.eval_col_score,
    cell: (c) => <span className={cn("tabular", c.score === null && "text-muted-foreground")}>{formatPercent(c.score)}</span>,
  },
  {
    key: "note",
    header: adminCopy.eval_col_note,
    cell: (c) => <span className="text-muted-foreground">{c.note || "—"}</span>,
  },
  {
    key: "details",
    header: <span className="sr-only">{adminCopy.actions_label}</span>,
    align: "end",
    cell: () => (
      <Button variant="ghost" size="sm" className="text-primary" onClick={onDetails}>
        {adminCopy.eval_view_details}
      </Button>
    ),
  },
];

const auditColumns: Column<AuditEntry>[] = [
  {
    key: "date",
    header: adminCopy.audit_date,
    cell: (a) => <span className="tabular whitespace-nowrap text-muted-foreground">{formatDateTime(a.date)}</span>,
  },
  { key: "user", header: adminCopy.audit_user, cell: (a) => <span className="font-hrsd-medium">{a.user}</span> },
  { key: "action", header: adminCopy.audit_action, cell: (a) => a.action },
  { key: "detail", header: adminCopy.audit_detail, cell: (a) => <span className="text-muted-foreground">{a.detail}</span> },
];

const AdminAssociationDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();

  const data = assocData[id ?? ""] ?? assocData.a1;

  const [supervisoryNote, setSupervisoryNote] = useState("");
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");
  const [previewEvidence, setPreviewEvidence] = useState<Evidence | null>(null);
  const [evalTrackFilter, setEvalTrackFilter] = useState("all");
  const [pendingAction, setPendingAction] = useState<ManagerAction | null>(null);

  const comingSoon = () => toast({ title: adminCopy.soon_title, description: adminCopy.soon_desc });

  const confirmAction = (action: ManagerAction) => {
    toast({ title: adminCopy.eval_done, description: `${actionLabel[action]}. ${adminCopy.demo_suffix}` });
  };

  const filteredTracks = evalTrackFilter === "all"
    ? tracksCriteria
    : tracksCriteria.filter(([t]) => t === evalTrackFilter);

  const evidenceColumns: Column<Evidence>[] = [
    { key: "name", header: adminCopy.evidence_name, cell: (e) => <span className="font-hrsd-medium">{e.name}</span> },
    { key: "track", header: adminCopy.col_track, cell: (e) => e.track },
    { key: "criterion", header: adminCopy.evidence_criterion, cell: (e) => e.criterion },
    {
      key: "date",
      header: adminCopy.evidence_date,
      cell: (e) => <span className="tabular whitespace-nowrap text-muted-foreground">{formatDate(e.date)}</span>,
    },
    { key: "uploader", header: adminCopy.evidence_uploader, cell: (e) => <span className="text-muted-foreground">{e.uploader}</span> },
    { key: "status", header: adminCopy.evidence_status, cell: (e) => <StatusBadge status={e.status} /> },
  ];

  const sendComment = () => {
    if (!newComment.trim()) return;
    setComments((prev) => [
      ...prev,
      { id: `c${prev.length + 1}`, sender: "supervision", message: newComment.trim(), time: new Date().toISOString() },
    ]);
    setNewComment("");
  };

  return (
    <>
      <PageHeader
        title={data.name}
        description={adminCopy.assoc_detail_desc}
        breadcrumbs={[
          { label: adminCopy.breadcrumb_root, to: "/admin" },
          { label: copy.nav_admin.associations, to: "/admin/associations" },
          { label: data.name },
        ]}
        meta={
          <KeyFacts
            items={[
              { label: adminCopy.assoc_fact_status, value: <StatusBadge status={data.status} /> },
              { label: adminCopy.assoc_fact_year, value: <span className="tabular">{data.year}</span> },
              { label: adminCopy.assoc_fact_progress, value: <span className="tabular">{formatPercent(data.progress)}</span> },
              { label: adminCopy.assoc_fact_score, value: <span className="tabular">{formatPercent(data.score)}</span> },
              { label: adminCopy.assoc_fact_license, value: <span className="tabular">{data.license}</span> },
            ]}
          />
        }
      />

      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className={tabsUi.list}>
          <TabsTrigger value="overview" className={tabsUi.trigger}>{adminCopy.assoc_tab_overview}</TabsTrigger>
          <TabsTrigger value="evidence" className={tabsUi.trigger}>{adminCopy.assoc_tab_evidence}</TabsTrigger>
          <TabsTrigger value="evaluation" className={tabsUi.trigger}>{adminCopy.assoc_tab_evaluation}</TabsTrigger>
          <TabsTrigger value="comments" className={tabsUi.trigger}>{adminCopy.assoc_tab_comments}</TabsTrigger>
          <TabsTrigger value="audit" className={tabsUi.trigger}>{adminCopy.assoc_tab_audit}</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className={tabsUi.content}>
          <Panel title={adminCopy.assoc_section_info}>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label={adminCopy.assoc_name}>{data.name}</Fact>
              <Fact label={adminCopy.assoc_type}>{data.type}</Fact>
              <Fact label={adminCopy.assoc_fact_license}><span className="tabular">{data.license}</span></Fact>
              <Fact label={adminCopy.assoc_region}>{data.region}</Fact>
              <Fact label={adminCopy.assoc_email}><bdi dir="ltr">{data.email}</bdi></Fact>
              <Fact label={adminCopy.assoc_mobile}><bdi dir="ltr" className="tabular">{data.mobile}</bdi></Fact>
            </dl>
          </Panel>

          <Panel title={adminCopy.assoc_section_delegate}>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label={adminCopy.delegate_name}>{data.delegate.name}</Fact>
              <Fact label={adminCopy.delegate_id}><span className="tabular">{data.delegate.idNumber}</span></Fact>
              <Fact label={adminCopy.assoc_email}><bdi dir="ltr">{data.delegate.email}</bdi></Fact>
              <Fact label={adminCopy.assoc_mobile}><bdi dir="ltr" className="tabular">{data.delegate.mobile}</bdi></Fact>
              <Fact label={adminCopy.delegate_role}>{data.delegate.role}</Fact>
              <Fact label={adminCopy.delegate_date}><span className="tabular">{formatDate(data.delegate.date)}</span></Fact>
              <Fact label={adminCopy.delegate_account}>
                {data.delegate.active ? adminCopy.users_status_active : adminCopy.users_status_disabled}
              </Fact>
            </dl>
          </Panel>

          <Panel title={adminCopy.assoc_section_tracks}>
            <ul className="flex flex-wrap gap-2">
              {data.tracks.map((t) => (
                <li
                  key={t.name}
                  className={cn(
                    "inline-flex h-9 items-center rounded-full border px-4 text-small font-hrsd-medium",
                    t.active ? "border-primary/30 bg-primary/5 text-primary" : "border-border text-muted-foreground"
                  )}
                >
                  {t.name}
                  <span className="sr-only">: {t.active ? adminCopy.track_selected : adminCopy.track_not_selected}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={adminCopy.assoc_section_note}>
            <form
              className="flex flex-col items-start gap-4"
              onSubmit={(e) => {
                e.preventDefault();
                toast({ title: adminCopy.note_saved, description: adminCopy.demo_suffix });
                setSupervisoryNote("");
              }}
            >
              <Textarea
                aria-label={adminCopy.assoc_section_note}
                placeholder={adminCopy.note_placeholder}
                value={supervisoryNote}
                onChange={(e) => setSupervisoryNote(e.target.value)}
                rows={3}
                className="w-full resize-y text-body"
              />
              <Button type="submit" disabled={!supervisoryNote.trim()}>{adminCopy.note_save}</Button>
            </form>
          </Panel>
        </TabsContent>

        {/* ── Evidence ── */}
        <TabsContent value="evidence" className={tabsUi.content}>
          <DataTable
            columns={evidenceColumns}
            rows={evidenceRows}
            getRowKey={(e) => e.id}
            onRowClick={(e) => setPreviewEvidence(e)}
            rowLabel={(e) => `${adminCopy.evidence_view}: ${e.name}`}
            caption={adminCopy.evidence_title}
            empty={<EmptyState icon={Paperclip} message={adminCopy.evidence_empty} />}
          />

          <Dialog open={!!previewEvidence} onOpenChange={(open) => !open && setPreviewEvidence(null)}>
            <DialogContent dir="rtl" className={dialogUi.content}>
              <DialogHeader className={dialogUi.header}>
                <DialogTitle className={dialogUi.title}>{previewEvidence?.name}</DialogTitle>
              </DialogHeader>
              {previewEvidence && (
                <dl className="grid grid-cols-2 gap-4">
                  <Fact label={adminCopy.col_track}>{previewEvidence.track}</Fact>
                  <Fact label={adminCopy.evidence_criterion}>{previewEvidence.criterion}</Fact>
                  <Fact label={adminCopy.evidence_date}><span className="tabular">{formatDate(previewEvidence.date)}</span></Fact>
                  <Fact label={adminCopy.evidence_status}><StatusBadge status={previewEvidence.status} /></Fact>
                </dl>
              )}
              <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border bg-section-alt px-6 py-10 text-center">
                <FileText aria-hidden className="h-8 w-8 text-muted-foreground" strokeWidth={1.5} />
                <p className="text-small text-muted-foreground">{adminCopy.evidence_preview_missing}</p>
              </div>
              <DialogFooter className={dialogUi.footer}>
                <Button onClick={comingSoon}>
                  <Download aria-hidden /> {adminCopy.evidence_download}
                </Button>
                <Button variant="outline" onClick={() => setPreviewEvidence(null)}>{adminCopy.close}</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        {/* ── Evaluation ── */}
        <TabsContent value="evaluation" className={tabsUi.content}>
          <Panel title={adminCopy.eval_actions_title}>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => setPendingAction("approve")}>{adminCopy.eval_approve}</Button>
              <Button variant="outline" onClick={() => setPendingAction("redo")}>{adminCopy.eval_redo}</Button>
              <Button variant="outline" onClick={() => setPendingAction("reopen")}>{adminCopy.eval_reopen}</Button>
              <Button
                variant="outline"
                className="border-danger/40 text-danger hover:bg-danger/5 hover:text-danger"
                onClick={() => setPendingAction("close")}
              >
                {adminCopy.eval_close}
              </Button>
            </div>
          </Panel>

          <Panel
            title={adminCopy.eval_criteria_title}
            aside={
              <SegmentedControl
                label={adminCopy.eval_track_filter}
                value={evalTrackFilter}
                onChange={setEvalTrackFilter}
                options={[
                  { value: "all", label: copy.filter_all },
                  ...tracksCriteria.map(([t]) => ({ value: t, label: t })),
                ]}
              />
            }
          >
            <Accordion type="multiple" className="flex flex-col gap-3">
              {filteredTracks.map(([track, criteria]) => (
                <AccordionItem key={track} value={track} className="rounded-lg border border-border">
                  <AccordionTrigger className="gap-3 px-5 py-4 text-start hover:no-underline">
                    <span className="flex flex-1 items-center gap-3">
                      <span className="text-body font-hrsd-bold text-ink">{track}</span>
                      <span className="text-small text-muted-foreground">
                        <span className="tabular">{formatNumber(criteria.length)}</span> {adminCopy.eval_criteria_count}
                      </span>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pb-0">
                    <DataTable
                      columns={criterionColumns(comingSoon)}
                      rows={criteria}
                      getRowKey={(c) => c.criterion}
                      caption={track}
                      className="rounded-none border-0 border-t"
                    />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Panel>
        </TabsContent>

        {/* ── Comments ── */}
        <TabsContent value="comments" className={tabsUi.content}>
          <Panel title={adminCopy.comments_title} bodyClassName="p-0">
            {comments.length === 0 ? (
              <EmptyState icon={MessageSquare} message={adminCopy.comments_empty} />
            ) : (
              <ol className="flex flex-col divide-y divide-border">
                {comments.map((c) => (
                  <li key={c.id} className="flex flex-col gap-1 px-6 py-4">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className={cn("text-small font-hrsd-bold", c.sender === "supervision" ? "text-primary" : "text-ink")}>
                        {senderLabel[c.sender]}
                      </span>
                      <time className="tabular text-caption text-muted-foreground">{formatDateTime(c.time)}</time>
                    </div>
                    <p className="text-body text-ink">{c.message}</p>
                  </li>
                ))}
              </ol>
            )}
            <form
              className="flex flex-col gap-3 border-t border-border px-6 py-5"
              onSubmit={(e) => { e.preventDefault(); sendComment(); }}
            >
              <FieldShell id="new-comment" label={adminCopy.comments_label}>
                <Textarea
                  id="new-comment"
                  placeholder={adminCopy.comments_placeholder}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                  className="resize-y text-body"
                />
              </FieldShell>
              <Button type="submit" className="self-start" disabled={!newComment.trim()}>
                {adminCopy.comments_send}
              </Button>
            </form>
          </Panel>
        </TabsContent>

        {/* ── Audit log ── */}
        <TabsContent value="audit" className={tabsUi.content}>
          <DataTable
            columns={auditColumns}
            rows={auditLog}
            getRowKey={(a, i) => `${a.date}-${i}`}
            caption={adminCopy.audit_title}
          />
        </TabsContent>
      </Tabs>

      {/* Manager action confirmation */}
      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className={dialogUi.header}>
            <AlertDialogTitle className={dialogUi.title}>{pendingAction ? actionLabel[pendingAction] : adminCopy.eval_confirm_title}</AlertDialogTitle>
            <AlertDialogDescription className={dialogUi.description}>
              {pendingAction && adminCopy.eval_confirm_desc[pendingAction]}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dialogUi.footer}>
            <AlertDialogAction
              className={cn(pendingAction === "close" && dialogUi.danger)}
              onClick={() => pendingAction && confirmAction(pendingAction)}
            >
              {pendingAction ? actionLabel[pendingAction] : adminCopy.confirm}
            </AlertDialogAction>
            <AlertDialogCancel>{adminCopy.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminAssociationDetail;
