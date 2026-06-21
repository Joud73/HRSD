import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdminUsers, AdminUserRow } from "@/hooks/useAdminData";
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
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import {
  Search, Plus, FileDown, MoreHorizontal, Users, UserCheck, UserX,
  Pencil, Ban, CheckCircle2, KeyRound, Loader2,
} from "lucide-react";

type DbRole = "admin" | "evaluator" | "organization";

const roleOptions: { value: DbRole; label: string }[] = [
  { value: "evaluator", label: "مقيم" },
  { value: "organization", label: "جمعية" },
  { value: "admin", label: "مدير النظام" },
];

const emptyForm = { email: "", role: "evaluator" as DbRole, organization_name: "", registration_number: "" };

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useAdminUsers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("الكل");
  const [statusFilter, setStatusFilter] = useState("الكل");

  const [formOpen, setFormOpen] = useState(false);
  const [formFields, setFormFields] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<AdminUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);

  const filtered = useMemo(() =>
    users.filter((u) => {
      if (roleFilter !== "الكل" && u.roleAr !== roleFilter) return false;
      if (statusFilter === "نشط" && u.status !== "active") return false;
      if (statusFilter === "معطل" && u.status === "active") return false;
      if (search && !u.email.includes(search) && !u.organization_name?.includes(search)) return false;
      return true;
    }), [users, roleFilter, statusFilter, search]);

  const total = users.length;
  const active = users.filter((u) => u.status === "active").length;
  const disabled = total - active;

  const openAdd = () => { setFormFields(emptyForm); setFormOpen(true); };

  const saveForm = async () => {
    if (!formFields.email) {
      toast({ title: "يرجى إدخال البريد الإلكتروني", variant: "destructive" });
      return;
    }
    if (formFields.role === "organization" && !formFields.organization_name.trim()) {
      toast({ title: "يرجى إدخال اسم الجهة", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: formFields.email,
          role: formFields.role,
          organization_name: formFields.role === "organization" ? formFields.organization_name || null : null,
          registration_number: formFields.role === "organization" ? formFields.registration_number || null : null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: "تم إنشاء المستخدم بنجاح", description: `كلمة المرور الافتراضية: Aa123456` });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setFormOpen(false);
    } catch (err: any) {
      toast({ title: "خطأ في إنشاء المستخدم", description: err.message, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === "active" ? "profile_incomplete" : "active";
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", toggleTarget.id);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "active" ? "تم تفعيل المستخدم" : "تم تعطيل المستخدم" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
    setToggleTarget(null);
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    const { error } = await supabase.auth.resetPasswordForEmail(resetTarget.email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "تم إرسال رابط إعادة التعيين" });
    }
    setResetTarget(null);
  };

  const statusBadge = (status: string) => {
    if (status === "active") return "مكتمل";
    return "لم تبدأ";
  };

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "hsl(220,20%,97%)" }}>
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
          <div>
            <h1 className="text-2xl font-hrsd-bold text-foreground">إدارة المستخدمين</h1>
            <p className="text-sm text-muted-foreground font-hrsd mt-1">إضافة المستخدمين وإدارة بياناتهم وصلاحياتهم</p>
          </div>

          <div className="flex flex-wrap items-center gap-3 justify-between">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث بالبريد أو اسم الجهة..." className="pr-9 w-56 text-sm font-hrsd" value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-40 text-sm font-hrsd"><SelectValue /></SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="الكل">الدور: الكل</SelectItem>
                  {roleOptions.map((r) => <SelectItem key={r.value} value={r.label}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 text-sm font-hrsd"><SelectValue /></SelectTrigger>
                <SelectContent align="end">
                  <SelectItem value="الكل">الحالة: الكل</SelectItem>
                  <SelectItem value="نشط">نشط</SelectItem>
                  <SelectItem value="معطل">معطل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-2 font-hrsd-medium" onClick={() => toast({ title: "سيتم توفير هذه الميزة لاحقًا" })}>
                تصدير Excel <FileDown className="h-4 w-4" />
              </Button>
              <Button size="sm" className="gap-2 font-hrsd-medium" onClick={openAdd}>
                إنشاء مستخدم جديد <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <KpiCard title="إجمالي المستخدمين" value={total} icon={<Users className="h-5 w-5" />} />
            <KpiCard title="المستخدمون النشطون" value={active} icon={<UserCheck className="h-5 w-5" />} />
            <KpiCard title="المستخدمون المعطلون" value={disabled} icon={<UserX className="h-5 w-5" />} />
          </div>

          <Card>
            <CardHeader className="pb-3"><CardTitle className="text-base font-hrsd-semibold">قائمة المستخدمين</CardTitle></CardHeader>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {["البريد الإلكتروني", "الدور", "الجهة / الجمعية", "الحالة", "تاريخ الإنشاء", "الإجراءات"].map((h) => (
                        <TableHead key={h} className="text-right text-xs font-hrsd-medium whitespace-nowrap">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.length === 0 && (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground font-hrsd">لا توجد نتائج</TableCell></TableRow>
                    )}
                    {filtered.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell className="text-sm font-hrsd ltr text-right" dir="ltr">{u.email}</TableCell>
                        <TableCell className="text-sm font-hrsd">{u.roleAr}</TableCell>
                        <TableCell className="text-sm font-hrsd text-muted-foreground">{u.organization_name || "—"}</TableCell>
                        <TableCell><StatusBadge status={statusBadge(u.status)} /><span className="sr-only">{u.statusAr}</span></TableCell>
                        <TableCell className="text-sm font-hrsd text-muted-foreground whitespace-nowrap">{new Date(u.created_at).toLocaleDateString("ar-SA")}</TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8"><MoreHorizontal className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="font-hrsd text-sm min-w-[180px]">
                              <DropdownMenuItem className="gap-2" onClick={() => setToggleTarget(u)}>
                                {u.status === "active" ? <><Ban className="h-3.5 w-3.5" /> تعطيل المستخدم</> : <><CheckCircle2 className="h-3.5 w-3.5" /> تفعيل المستخدم</>}
                              </DropdownMenuItem>
                              <DropdownMenuItem className="gap-2" onClick={() => setResetTarget(u)}><KeyRound className="h-3.5 w-3.5" /> إعادة تعيين كلمة المرور</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
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

      {/* Create User Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-lg font-hrsd" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-hrsd-bold">إنشاء مستخدم جديد</DialogTitle>
            <DialogDescription>أدخل بيانات المستخدم الجديد — كلمة المرور الافتراضية: Aa123456</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label className="font-hrsd-medium text-sm">البريد الإلكتروني *</Label>
              <Input className="font-hrsd text-sm" type="email" dir="ltr" value={formFields.email} onChange={(e) => setFormFields((p) => ({ ...p, email: e.target.value }))} />
            </div>
            <div className="grid gap-1.5">
              <Label className="font-hrsd-medium text-sm">الدور</Label>
              <Select value={formFields.role} onValueChange={(v) => setFormFields((p) => ({ ...p, role: v as DbRole }))}>
                <SelectTrigger className="font-hrsd text-sm"><SelectValue /></SelectTrigger>
                <SelectContent align="end">
                  {roleOptions.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {formFields.role === "organization" && (
              <>
                <div className="grid gap-1.5">
                  <Label className="font-hrsd-medium text-sm">اسم الجهة *</Label>
                  <Input className="font-hrsd text-sm" value={formFields.organization_name} onChange={(e) => setFormFields((p) => ({ ...p, organization_name: e.target.value }))} />
                </div>
                <div className="grid gap-1.5">
                  <Label className="font-hrsd-medium text-sm">رقم التسجيل (اختياري)</Label>
                  <Input className="font-hrsd text-sm" value={formFields.registration_number} onChange={(e) => setFormFields((p) => ({ ...p, registration_number: e.target.value }))} />
                </div>
              </>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setFormOpen(false)} className="font-hrsd-medium">إلغاء</Button>
            <Button onClick={saveForm} disabled={saving} className="font-hrsd-medium gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} إنشاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Toggle AlertDialog */}
      <AlertDialog open={!!toggleTarget} onOpenChange={() => setToggleTarget(null)}>
        <AlertDialogContent dir="rtl" className="font-hrsd">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hrsd-bold">{toggleTarget?.status === "active" ? "تعطيل المستخدم" : "تفعيل المستخدم"}</AlertDialogTitle>
            <AlertDialogDescription>{toggleTarget?.status === "active" ? "هل أنت متأكد من تعطيل المستخدم؟" : "هل تريد تفعيل المستخدم؟"}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="font-hrsd-medium">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmToggle} className="font-hrsd-medium">تأكيد</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={!!resetTarget} onOpenChange={() => setResetTarget(null)}>
        <DialogContent className="sm:max-w-md font-hrsd" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-hrsd-bold">إعادة تعيين كلمة المرور</DialogTitle>
            <DialogDescription>سيتم إرسال رابط إعادة تعيين كلمة المرور إلى البريد الإلكتروني.</DialogDescription>
          </DialogHeader>
          <p className="text-sm font-hrsd-medium py-2">{resetTarget?.email}</p>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setResetTarget(null)} className="font-hrsd-medium">إلغاء</Button>
            <Button onClick={confirmReset} className="font-hrsd-medium">إرسال الرابط</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
