import { useState, useMemo } from "react";
import {
  Users, UserPlus, Shuffle, FileSpreadsheet, Search,
  MoreHorizontal, Eye, Pencil, Ban, ArrowLeftRight,
  Clock, TrendingUp, UserCheck, Loader2,
} from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminEvaluators, useAdminAssociations } from "@/hooks/useAdminData";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const AdminReviewers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: evaluators, isLoading } = useAdminEvaluators();
  const { data: associations } = useAdminAssociations();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Dialogs
  const [distOpen, setDistOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);

  // Distribution form
  const [distEvaluator, setDistEvaluator] = useState("");
  const [distAssociation, setDistAssociation] = useState("");
  const [distYear, setDistYear] = useState(String(new Date().getFullYear()));
  const [distLoading, setDistLoading] = useState(false);

  // Reassign form
  const [reassignAssignment, setReassignAssignment] = useState("");
  const [reassignTo, setReassignTo] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);

  const filtered = useMemo(() => {
    return (evaluators || []).filter((r) => {
      if (search && !r.email.includes(search) && !(r.organization_name || "").includes(search)) return false;
      return true;
    });
  }, [evaluators, search]);

  const totalReviewers = filtered.length;
  const activeReviewers = filtered.filter((r) => r.assignedCount > 0).length;

  const comingSoon = () => toast({ title: "قريبًا", description: "سيتم توفير هذه الميزة لاحقًا" });

  // Real assignment creation
  const createAssignment = async () => {
    if (!distEvaluator || !distAssociation || !distYear) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    setDistLoading(true);
    // Look up organization_id from profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", distAssociation)
      .single();
    const { error } = await supabase.from("evaluator_assignments").insert({
      evaluator_id: distEvaluator,
      association_id: distAssociation,
      organization_id: prof?.organization_id || null,
      year: Number(distYear),
      status: "not_started",
      completion_percentage: 0,
    });
    setDistLoading(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-evaluators"] });
    queryClient.invalidateQueries({ queryKey: ["admin-associations"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    setDistOpen(false);
    setDistEvaluator("");
    setDistAssociation("");
    toast({ title: "تم إسناد التقييم بنجاح" });
  };

  // Real reassignment
  const executeReassign = async () => {
    if (!reassignAssignment || !reassignTo) {
      toast({ title: "خطأ", description: "يرجى ملء جميع الحقول", variant: "destructive" });
      return;
    }
    setReassignLoading(true);
    const { error } = await supabase
      .from("evaluator_assignments")
      .update({ evaluator_id: reassignTo })
      .eq("id", reassignAssignment);
    setReassignLoading(false);
    if (error) {
      toast({ title: "خطأ", description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-evaluators"] });
    queryClient.invalidateQueries({ queryKey: ["admin-associations"] });
    setReassignOpen(false);
    setReassignAssignment("");
    setReassignTo("");
    toast({ title: "تم إعادة الإسناد بنجاح" });
  };

  // Unassigned associations for the distribution dialog
  const unassignedAssociations = useMemo(() => {
    return (associations || []).filter((a) => a.status === "غير مُسندة");
  }, [associations]);

  // Active assignments for reassign dialog
  const activeAssignments = useMemo(() => {
    return (associations || []).filter((a) => a.assignment_id);
  }, [associations]);

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          <div>
            <h1 className="text-xl font-hrsd-title text-foreground">إدارة المقيمين</h1>
            <p className="text-sm font-hrsd text-muted-foreground mt-1">متابعة أداء المقيمين وتوزيع التقييمات بكفاءة</p>
          </div>

          {/* Filters + Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث عن مقيم..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-52 text-sm font-hrsd" />
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" className="gap-2 text-xs font-hrsd-medium h-9" onClick={() => setDistOpen(true)}>
                إسناد تقييم <Shuffle className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" className="gap-2 text-xs font-hrsd-medium h-9" onClick={comingSoon}>
                تصدير Excel <FileSpreadsheet className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="flex flex-wrap gap-4">
            {[
              { label: "إجمالي المقيمين", value: totalReviewers, icon: Users },
              { label: "لديهم تقييمات", value: activeReviewers, icon: UserCheck },
            ].map((kpi) => (
              <div key={kpi.label} className="flex items-center gap-3 rounded-xl border border-border bg-card px-5 py-3 shadow-sm">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <kpi.icon className="h-4.5 w-4.5" />
                </div>
                <div>
                  <p className="text-xs font-hrsd text-muted-foreground">{kpi.label}</p>
                  <p className="text-base font-hrsd-bold text-foreground">{kpi.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h3 className="text-sm font-hrsd-semibold text-foreground">قائمة المقيمين</h3>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Users className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-hrsd">لا يوجد مقيمون حاليًا</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    {["البريد الإلكتروني", "عدد التقييمات", "مكتمل", "قيد التقييم", "الإجراءات"].map((h) => (
                      <TableHead key={h} className="text-start font-hrsd-medium text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r) => (
                    <TableRow key={r.id} className="text-sm font-hrsd">
                      <TableCell className="font-hrsd-medium">{r.email}</TableCell>
                      <TableCell>{r.assignedCount}</TableCell>
                      <TableCell>{r.completedCount}</TableCell>
                      <TableCell>{r.inProgressCount}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56 font-hrsd text-sm">
                            <DropdownMenuItem className="gap-2" onClick={() => navigate(`/admin/reviewers/${r.id}`)}>
                              <Eye className="h-4 w-4" /> عرض أداء المقيم
                            </DropdownMenuItem>
                            <DropdownMenuItem className="gap-2" onClick={() => setReassignOpen(true)}>
                              <ArrowLeftRight className="h-4 w-4" /> إعادة إسناد تقييم
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </main>
      </div>

      {/* ── Assignment Dialog ── */}
      <Dialog open={distOpen} onOpenChange={setDistOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md font-hrsd">
          <DialogHeader><DialogTitle className="font-hrsd-semibold">إسناد تقييم جديد</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-hrsd-medium text-sm">المقيم</Label>
              <Select value={distEvaluator} onValueChange={setDistEvaluator}>
                <SelectTrigger className="font-hrsd text-sm"><SelectValue placeholder="اختر مقيمًا" /></SelectTrigger>
                <SelectContent>
                  {(evaluators || []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-hrsd-medium text-sm">الجمعية</Label>
              <Select value={distAssociation} onValueChange={setDistAssociation}>
                <SelectTrigger className="font-hrsd text-sm"><SelectValue placeholder="اختر جمعية" /></SelectTrigger>
                <SelectContent>
                  {unassignedAssociations.length > 0 ? unassignedAssociations.map((a) => (
                    <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                  )) : (
                    // Show all associations if none unassigned
                    (associations || []).map((a) => (
                      <SelectItem key={`${a.id}-${a.assignment_id}`} value={a.id}>{a.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-hrsd-medium text-sm">سنة التقييم</Label>
              <Select value={distYear} onValueChange={setDistYear}>
                <SelectTrigger className="font-hrsd text-sm"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild><Button variant="outline" className="font-hrsd-medium text-sm">إلغاء</Button></DialogClose>
            <Button className="font-hrsd-medium text-sm" onClick={createAssignment} disabled={distLoading}>
              {distLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "إسناد"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Reassign Dialog ── */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md font-hrsd">
          <DialogHeader><DialogTitle className="font-hrsd-semibold">إعادة إسناد تقييم</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label className="font-hrsd-medium text-sm">التقييم</Label>
              <Select value={reassignAssignment} onValueChange={setReassignAssignment}>
                <SelectTrigger className="font-hrsd text-sm"><SelectValue placeholder="اختر تقييمًا" /></SelectTrigger>
                <SelectContent>
                  {activeAssignments.map((a) => (
                    <SelectItem key={a.assignment_id} value={a.assignment_id!}>
                      {a.name} - {a.year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-hrsd-medium text-sm">المقيم الجديد</Label>
              <Select value={reassignTo} onValueChange={setReassignTo}>
                <SelectTrigger className="font-hrsd text-sm"><SelectValue placeholder="اختر مقيمًا" /></SelectTrigger>
                <SelectContent>
                  {(evaluators || []).map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.email}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <DialogClose asChild><Button variant="outline" className="font-hrsd-medium text-sm">إلغاء</Button></DialogClose>
            <Button className="font-hrsd-medium text-sm" onClick={executeReassign} disabled={reassignLoading}>
              {reassignLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "تنفيذ"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminReviewers;
