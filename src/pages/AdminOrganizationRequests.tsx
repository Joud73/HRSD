import { useMemo, useState, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Eye, Inbox, XCircle } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import StatusBadge from "@/components/shared/StatusBadge";
import { FieldShell } from "@/components/shared/FormField";
import { RowActionsTrigger, SearchField, Toolbar } from "@/components/admin/AdminParts";
import { dialogUi } from "@/components/admin/adminUi";

type RequestStatus = Database["public"]["Enums"]["request_status"];

interface OrgRequest {
  id: string;
  organization_name: string;
  registration_number: string;
  email: string;
  delegate_name: string | null;
  delegate_id_number: string | null;
  delegate_mobile: string | null;
  delegate_email: string | null;
  request_status: RequestStatus;
  submitted_at: string;
  notes: string | null;
}

type Filter = "all" | RequestStatus;

function useOrgRequests() {
  return useQuery({
    queryKey: ["admin-org-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("organization_requests")
        .select("*")
        .order("submitted_at", { ascending: false });
      if (error) throw error;
      return data as OrgRequest[];
    },
  });
}

/**
 * Request states are not assessment states. pending -> submitted (مرسل للمراجعة) and
 * approved -> approved (معتمد) read correctly; a rejection is final, so it is plain muted text.
 */
const RequestStatusLabel = ({ status }: { status: RequestStatus }) =>
  status === "rejected" ? (
    <span className="inline-flex items-center gap-2 text-small text-muted-foreground">
      <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-neutral" />
      {adminCopy.requests_rejected_one}
    </span>
  ) : (
    <StatusBadge status={status === "pending" ? "submitted" : "approved"} />
  );

const DetailRow = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="grid grid-cols-1 gap-1 border-b border-border py-3 last:border-0 sm:grid-cols-[160px_1fr] sm:gap-4">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className="text-small font-hrsd-medium text-ink">{children}</dd>
  </div>
);

const AdminOrganizationRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading } = useOrgRequests();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<Filter>("all");
  const [detailTarget, setDetailTarget] = useState<OrgRequest | null>(null);
  const [approveTarget, setApproveTarget] = useState<OrgRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OrgRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const filtered = useMemo(() =>
    requests.filter((r) => {
      if (statusFilter !== "all" && r.request_status !== statusFilter) return false;
      if (search && !r.organization_name.includes(search) && !r.email.includes(search) && !r.registration_number.includes(search)) return false;
      return true;
    }), [requests, statusFilter, search]);

  const count = (s: RequestStatus) => requests.filter((r) => r.request_status === s).length;
  const filtersOn = search !== "" || statusFilter !== "all";

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("approve-organization", {
        body: { request_id: approveTarget.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: adminCopy.requests_approved_toast, description: `${approveTarget.organization_name}. ${adminCopy.default_password_note}` });
      queryClient.invalidateQueries({ queryKey: ["admin-org-requests"] });
    } catch (err: unknown) {
      toast({ title: adminCopy.error_title, description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setActionLoading(false);
      setApproveTarget(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    setActionLoading(true);
    try {
      const { error } = await supabase
        .from("organization_requests")
        .update({
          request_status: "rejected" satisfies RequestStatus,
          reviewed_at: new Date().toISOString(),
          notes: rejectNotes || null,
        })
        .eq("id", rejectTarget.id);
      if (error) throw error;
      toast({ title: adminCopy.requests_rejected_toast });
      queryClient.invalidateQueries({ queryKey: ["admin-org-requests"] });
    } catch (err: unknown) {
      toast({ title: adminCopy.error_title, description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setActionLoading(false);
      setRejectTarget(null);
      setRejectNotes("");
    }
  };

  const columns: Column<OrgRequest>[] = [
    { key: "name", header: adminCopy.col_association, cell: (r) => <span className="font-hrsd-medium">{r.organization_name}</span> },
    { key: "reg", header: adminCopy.col_registration, cell: (r) => <span className="tabular text-muted-foreground">{r.registration_number || "—"}</span> },
    { key: "email", header: adminCopy.col_email, cell: (r) => <span dir="ltr" className="text-muted-foreground">{r.email}</span> },
    {
      key: "submitted",
      header: adminCopy.col_submitted_at,
      cell: (r) => <span className="tabular whitespace-nowrap text-muted-foreground">{formatDate(r.submitted_at)}</span>,
    },
    { key: "status", header: adminCopy.col_request_status, cell: (r) => <RequestStatusLabel status={r.request_status} /> },
    {
      key: "actions",
      header: <span className="sr-only">{adminCopy.actions_label}</span>,
      align: "end",
      className: "w-16",
      cell: (r) => (
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <RowActionsTrigger />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[184px]">
            <DropdownMenuItem className="gap-2 text-small" onSelect={() => setDetailTarget(r)}>
              <Eye aria-hidden className="h-4 w-4" /> {adminCopy.requests_view}
            </DropdownMenuItem>
            {r.request_status === "pending" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="gap-2 text-small" onSelect={() => setApproveTarget(r)}>
                  <CheckCircle2 aria-hidden className="h-4 w-4 text-success" /> {adminCopy.requests_approve}
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="gap-2 text-small text-danger focus:text-danger"
                  onSelect={() => { setRejectTarget(r); setRejectNotes(""); }}
                >
                  <XCircle aria-hidden className="h-4 w-4" /> {adminCopy.requests_reject}
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title={copy.nav_admin.requests}
        description={adminCopy.requests_desc}
        breadcrumbs={[{ label: adminCopy.breadcrumb_root, to: "/admin" }, { label: copy.nav_admin.requests }]}
      />

      <Toolbar>
        <SearchField value={search} onChange={setSearch} placeholder={adminCopy.requests_search} className="sm:w-96" />
        <SegmentedControl
          label={adminCopy.requests_filter}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: copy.filter_all, count: requests.length },
            { value: "pending", label: adminCopy.requests_pending, count: count("pending") },
            { value: "approved", label: adminCopy.requests_approved, count: count("approved") },
            { value: "rejected", label: adminCopy.requests_rejected, count: count("rejected") },
          ]}
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        getRowKey={(r) => r.id}
        onRowClick={(r) => setDetailTarget(r)}
        rowLabel={(r) => `${adminCopy.requests_view}: ${r.organization_name}`}
        caption={copy.nav_admin.requests}
        empty={
          filtersOn ? (
            <EmptyState
              message={adminCopy.no_results}
              action={{ label: adminCopy.clear_filters, onClick: () => { setSearch(""); setStatusFilter("all"); } }}
            />
          ) : (
            <EmptyState icon={Inbox} message={adminCopy.requests_empty} />
          )
        }
      />

      {/* Request detail */}
      <Dialog open={!!detailTarget} onOpenChange={(open) => !open && setDetailTarget(null)}>
        <DialogContent className={dialogUi.content} dir="rtl">
          <DialogHeader className={dialogUi.header}>
            <DialogTitle className={dialogUi.title}>{detailTarget?.organization_name ?? adminCopy.requests_detail_title}</DialogTitle>
            <DialogDescription className={dialogUi.description}>{adminCopy.requests_detail_desc}</DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <dl className="flex flex-col">
              <DetailRow label={adminCopy.col_request_status}><RequestStatusLabel status={detailTarget.request_status} /></DetailRow>
              <DetailRow label={adminCopy.col_registration}><span className="tabular">{detailTarget.registration_number || "—"}</span></DetailRow>
              <DetailRow label={adminCopy.col_email}><bdi dir="ltr">{detailTarget.email}</bdi></DetailRow>
              <DetailRow label={adminCopy.col_submitted_at}><span className="tabular">{formatDate(detailTarget.submitted_at)}</span></DetailRow>
              {detailTarget.delegate_name && <DetailRow label={adminCopy.requests_delegate_name}>{detailTarget.delegate_name}</DetailRow>}
              {detailTarget.delegate_id_number && (
                <DetailRow label={adminCopy.requests_delegate_id}><span className="tabular">{detailTarget.delegate_id_number}</span></DetailRow>
              )}
              {detailTarget.delegate_mobile && (
                <DetailRow label={adminCopy.requests_delegate_mobile}><bdi dir="ltr" className="tabular">{detailTarget.delegate_mobile}</bdi></DetailRow>
              )}
              {detailTarget.delegate_email && (
                <DetailRow label={adminCopy.requests_delegate_email}><bdi dir="ltr">{detailTarget.delegate_email}</bdi></DetailRow>
              )}
              {detailTarget.notes && <DetailRow label={adminCopy.requests_notes}>{detailTarget.notes}</DetailRow>}
            </dl>
          )}
          {detailTarget?.request_status === "pending" && (
            <DialogFooter className={dialogUi.footer}>
              <Button onClick={() => { setApproveTarget(detailTarget); setDetailTarget(null); }}>
                {adminCopy.requests_approve}
              </Button>
              <Button
                variant="outline"
                className="border-danger/40 text-danger hover:bg-danger/5 hover:text-danger"
                onClick={() => { setRejectTarget(detailTarget); setRejectNotes(""); setDetailTarget(null); }}
              >
                {adminCopy.requests_reject}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve */}
      <AlertDialog open={!!approveTarget} onOpenChange={(open) => !open && setApproveTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className={dialogUi.header}>
            <AlertDialogTitle className={dialogUi.title}>{adminCopy.requests_approve_title}</AlertDialogTitle>
            <AlertDialogDescription className={dialogUi.description}>
              {adminCopy.requests_approve_desc}
              <span className="mt-2 block font-hrsd-medium text-ink">{approveTarget?.organization_name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dialogUi.footer}>
            <AlertDialogAction onClick={handleApprove} disabled={actionLoading}>
              {adminCopy.requests_approve_confirm}
            </AlertDialogAction>
            <AlertDialogCancel disabled={actionLoading}>{adminCopy.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject */}
      <AlertDialog open={!!rejectTarget} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectNotes(""); } }}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className={dialogUi.header}>
            <AlertDialogTitle className={dialogUi.title}>{adminCopy.requests_reject_title}</AlertDialogTitle>
            <AlertDialogDescription className={dialogUi.description}>
              {adminCopy.requests_reject_desc}
              <span className="mt-2 block font-hrsd-medium text-ink">{rejectTarget?.organization_name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <FieldShell id="reject-reason" label={adminCopy.requests_reject_reason} hint={adminCopy.requests_reject_hint}>
            <Textarea
              id="reject-reason"
              aria-describedby="reject-reason-hint"
              rows={3}
              className="resize-none text-body"
              value={rejectNotes}
              onChange={(e) => setRejectNotes(e.target.value)}
            />
          </FieldShell>
          <AlertDialogFooter className={dialogUi.footer}>
            <AlertDialogAction onClick={handleReject} disabled={actionLoading} className={dialogUi.danger}>
              {adminCopy.requests_reject_confirm}
            </AlertDialogAction>
            <AlertDialogCancel disabled={actionLoading}>{adminCopy.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminOrganizationRequests;
