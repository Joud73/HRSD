import { useState, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import KpiCard from "@/components/admin/KpiCard";
import StatusBadge from "@/components/admin/StatusBadge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Search, Loader2, Eye, CheckCircle2, XCircle, Inbox, Clock, Building2,
} from "lucide-react";

interface OrgRequest {
  id: string;
  organization_name: string;
  registration_number: string;
  email: string;
  delegate_name: string | null;
  delegate_id_number: string | null;
  delegate_mobile: string | null;
  delegate_email: string | null;
  request_status: "pending" | "approved" | "rejected";
  submitted_at: string;
  notes: string | null;
}

const statusLabelMap: Record<string, string> = {
  pending: "قيد المراجعة",
  approved: "مقبول",
  rejected: "مرفوض",
};

const statusBadgeMap: Record<string, string> = {
  pending: "قيد التنفيذ",
  approved: "مكتمل",
  rejected: "لم تبدأ",
};

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

const AdminOrganizationRequests = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: requests = [], isLoading } = useOrgRequests();

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("الكل");
  const [detailTarget, setDetailTarget] = useState<OrgRequest | null>(null);
  const [approveTarget, setApproveTarget] = useState<OrgRequest | null>(null);
  const [rejectTarget, setRejectTarget] = useState<OrgRequest | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectNotes, setRejectNotes] = useState("");

  const filtered = useMemo(() =>
    requests.filter((r) => {
      if (statusFilter !== "الكل" && statusLabelMap[r.request_status] !== statusFilter) return false;
      if (search && !r.organization_name.includes(search) && !r.email.includes(search) && !r.registration_number.includes(search)) return false;
      return true;
    }), [requests, statusFilter, search]);

  const pending = requests.filter((r) => r.request_status === "pending").length;
  const approved = requests.filter((r) => r.request_status === "approved").length;
  const rejected = requests.filter((r) => r.request_status === "rejected").length;

  const handleApprove = async () => {
    if (!approveTarget) return;
    setActionLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("approve-organization", {
        body: { request_id: approveTarget.id },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "تمت الموافقة على الطلب", description: `تم إنشاء حساب ${approveTarget.organization_name} بنجاح — كلمة المرور الافتراضية: Aa123456` });
      queryClient.invalidateQueries({ queryKey: ["admin-org-requests"] });
    } catch (err: any) {
      toast({ title: "خطأ في الموافقة", description: err.message, variant: "destructive" });
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
          request_status: "rejected" as any,
          reviewed_at: new Date().toISOString(),
          notes: rejectNotes || null,
        })
        .eq("id", rejectTarget.id);
      if (error) throw error;
      toast({ title: "تم رفض الطلب" });
      queryClient.invalidateQueries({ queryKey: ["admin-org-requests"] });
    } catch (err: any) {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
    } finally {
      setActionLoading(false);
      setRejectTarget(null);
      setRejectNotes("");
    }
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "hsl(220,20%,97%)" }}>
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
          <div>
            <h1 className="text-2xl font-hrsd-bold text-foreground">طلبات تسجيل الجمعيات</h1>
            <p className="text-sm text-muted-foreground font-hrsd mt-1">مراجعة طلبات التسجيل والموافقة عليها أو رفضها</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="ابحث بالاسم أو البريد أو الرقم..." className="pr-9 w-64 text-sm font-hrsd" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-44 text-sm font-hrsd"><SelectValue /></SelectTrigger>
              <SelectContent align="end">
                <SelectItem value="الكل">الحالة: الكل</SelectItem>
                <SelectItem value="قيد المراجعة">قيد المراجعة</SelectItem>
                <SelectItem value="مقبول">مقبول</SelectItem>
                <SelectItem value="مرفوض">مرفوض</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title="قيد المراجعة" value={pending} icon={<Clock className="h-5 w-5" />} />
            <KpiCard title="مقبولة" value={approved} icon={<CheckCircle2 className="h-5 w-5" />} />
            <KpiCard title="مرفوضة" value={rejected} icon={<XCircle className="h-5 w-5" />} />
          </div>

          {/* Table */}
          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-hrsd-semibold">قائمة الطلبات</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["اسم الجمعية", "رقم التسجيل", "البريد الإلكتروني", "تاريخ التقديم", "الحالة", "الإجراءات"].map((h) => (
                        <TableHead key={h} className="text-right text-xs font-hrsd-medium whitespace-nowrap">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-10 text-muted-foreground font-hrsd">
                          <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                          لا توجد طلبات
                        </TableCell>
                      </TableRow>
                    )}
                    {filtered.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell className="text-sm font-hrsd">{r.organization_name}</TableCell>
                        <TableCell className="text-sm font-hrsd text-muted-foreground">{r.registration_number}</TableCell>
                        <TableCell className="text-sm font-hrsd ltr text-right" dir="ltr">{r.email}</TableCell>
                        <TableCell className="text-sm font-hrsd text-muted-foreground whitespace-nowrap">{new Date(r.submitted_at).toLocaleDateString("ar-SA")}</TableCell>
                        <TableCell><StatusBadge status={statusBadgeMap[r.request_status]} /></TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDetailTarget(r)} title="عرض التفاصيل">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {r.request_status === "pending" && (
                              <>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600 hover:text-green-700" onClick={() => setApproveTarget(r)} title="موافقة">
                                  <CheckCircle2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive" onClick={() => { setRejectTarget(r); setRejectNotes(""); }} title="رفض">
                                  <XCircle className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </main>
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!detailTarget} onOpenChange={() => setDetailTarget(null)}>
        <DialogContent className="sm:max-w-lg font-hrsd" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-hrsd-bold">تفاصيل الطلب</DialogTitle>
            <DialogDescription>بيانات طلب تسجيل الجمعية</DialogDescription>
          </DialogHeader>
          {detailTarget && (
            <div className="grid gap-3 py-2 text-sm">
              <Row label="اسم الجمعية" value={detailTarget.organization_name} />
              <Row label="رقم التسجيل" value={detailTarget.registration_number} />
              <Row label="البريد الإلكتروني" value={detailTarget.email} dir="ltr" />
              <Row label="تاريخ التقديم" value={new Date(detailTarget.submitted_at).toLocaleDateString("ar-SA")} />
              <Row label="الحالة" value={statusLabelMap[detailTarget.request_status]} />
              {detailTarget.delegate_name && <Row label="اسم المفوض" value={detailTarget.delegate_name} />}
              {detailTarget.delegate_id_number && <Row label="رقم هوية المفوض" value={detailTarget.delegate_id_number} />}
              {detailTarget.delegate_mobile && <Row label="جوال المفوض" value={detailTarget.delegate_mobile} dir="ltr" />}
              {detailTarget.delegate_email && <Row label="بريد المفوض" value={detailTarget.delegate_email} dir="ltr" />}
              {detailTarget.notes && <Row label="ملاحظات" value={detailTarget.notes} />}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approve Confirmation */}
      <AlertDialog open={!!approveTarget} onOpenChange={() => setApproveTarget(null)}>
        <AlertDialogContent dir="rtl" className="font-hrsd">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hrsd-bold">تأكيد الموافقة</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم إنشاء حساب جديد للجمعية <strong>{approveTarget?.organization_name}</strong> بكلمة مرور افتراضية (Aa123456). هل تريد المتابعة؟
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="font-hrsd-medium" disabled={actionLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={actionLoading} className="font-hrsd-medium gap-2">
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />} موافقة
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Confirmation */}
      <AlertDialog open={!!rejectTarget} onOpenChange={() => { setRejectTarget(null); setRejectNotes(""); }}>
        <AlertDialogContent dir="rtl" className="font-hrsd">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hrsd-bold">تأكيد الرفض</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم رفض طلب الجمعية <strong>{rejectTarget?.organization_name}</strong>. يمكنك إضافة سبب الرفض أدناه.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            placeholder="سبب الرفض (اختياري)"
            className="font-hrsd text-sm"
            value={rejectNotes}
            onChange={(e) => setRejectNotes(e.target.value)}
          />
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="font-hrsd-medium" disabled={actionLoading}>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={handleReject} disabled={actionLoading} className="font-hrsd-medium gap-2 bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />} رفض
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Row = ({ label, value, dir }: { label: string; value: string; dir?: string }) => (
  <div className="flex items-start gap-2">
    <span className="text-muted-foreground min-w-[120px] shrink-0">{label}:</span>
    <span className="font-hrsd-medium" dir={dir}>{value}</span>
  </div>
);

export default AdminOrganizationRequests;
