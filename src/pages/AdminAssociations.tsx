import { useState, useMemo } from "react";
import {
  Building2, ClipboardList, CheckCircle2, TrendingUp,
  FileSpreadsheet, FileText, Printer, Search,
  MoreHorizontal, Eye, UserCog, Loader2,
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
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatusBadge from "@/components/admin/StatusBadge";
import { useAdminAssociations } from "@/hooks/useAdminData";

const AdminAssociations = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: associations, isLoading } = useAdminAssociations();

  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [yearFilter, setYearFilter] = useState("all");

  const filtered = useMemo(() => {
    return (associations || []).filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (yearFilter !== "all" && String(r.year) !== yearFilter) return false;
      if (search && !r.name.includes(search)) return false;
      return true;
    });
  }, [associations, statusFilter, yearFilter, search]);

  const totalOrgs = filtered.length;
  const ongoing = filtered.filter((r) => r.status === "قيد التقييم").length;
  const complete = filtered.filter((r) => r.status === "مكتمل").length;
  const avgProgress = totalOrgs > 0 ? Math.round(filtered.reduce((s, r) => s + r.progress, 0) / totalOrgs) : 0;

  const comingSoon = () =>
    toast({ title: "قريبًا", description: "سيتم توفير هذه الميزة لاحقًا" });

  // Unique years
  const years = useMemo(() => {
    const ySet = new Set((associations || []).map((a) => a.year));
    return [...ySet].sort((a, b) => b - a);
  }, [associations]);

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          <div>
            <h1 className="text-xl font-hrsd-title text-foreground">إدارة الجمعيات</h1>
            <p className="text-sm font-hrsd text-muted-foreground mt-1">نظرة شاملة على أداء الجهات وحالة التقييم</p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              {years.length > 0 && (
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger className="w-32 text-sm font-hrsd-medium"><SelectValue placeholder="السنة" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">الكل</SelectItem>
                    {years.map((y) => (
                      <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40 text-sm font-hrsd-medium"><SelectValue placeholder="حالة التقييم" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="لم تبدأ">لم تبدأ</SelectItem>
                  <SelectItem value="قيد التقييم">قيد التقييم</SelectItem>
                  <SelectItem value="بانتظار الرد">بانتظار الرد</SelectItem>
                  <SelectItem value="مكتمل">مكتمل</SelectItem>
                  <SelectItem value="غير مُسندة">غير مُسندة</SelectItem>
                </SelectContent>
              </Select>

              <div className="relative">
                <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="ابحث عن جمعية..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 w-52 text-sm font-hrsd" />
              </div>
            </div>

            <div className="flex items-center gap-0 rounded-[10px] border border-border overflow-hidden">
              <Button variant="ghost" size="sm" onClick={comingSoon} className="rounded-none border-e border-border gap-2 text-xs font-hrsd-medium px-4 h-9">
                تصدير Excel <FileSpreadsheet className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={comingSoon} className="rounded-none border-e border-border gap-2 text-xs font-hrsd-medium px-4 h-9">
                تصدير PDF <FileText className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={comingSoon} className="rounded-none gap-2 text-xs font-hrsd-medium px-4 h-9">
                طباعة <Printer className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* KPI Strip */}
          <div className="flex flex-wrap gap-4">
            {[
              { label: "إجمالي الجهات", value: totalOrgs, icon: Building2 },
              { label: "قيد التقييم", value: ongoing, icon: ClipboardList },
              { label: "مكتمل", value: complete, icon: CheckCircle2 },
              { label: "متوسط نسبة الإنجاز", value: `${avgProgress}%`, icon: TrendingUp },
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
              <h3 className="text-sm font-hrsd-semibold text-foreground">قائمة الجمعيات</h3>
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                <Building2 className="h-10 w-10 mb-3 opacity-40" />
                <p className="text-sm font-hrsd">لا توجد جمعيات مطابقة</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    {["اسم الجمعية", "السنة", "نسبة الإنجاز", "حالة التقييم", "المقيم", "الإجراءات"].map((h) => (
                      <TableHead key={h} className="text-start font-hrsd-medium text-xs">{h}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((r, idx) => (
                    <TableRow key={`${r.id}-${r.assignment_id}-${idx}`} className="text-sm font-hrsd">
                      <TableCell className="font-hrsd-medium">{r.name}</TableCell>
                      <TableCell>{r.year}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xs w-10">{r.progress}%</span>
                          <Progress value={r.progress} className="h-1.5 w-20" />
                        </div>
                      </TableCell>
                      <TableCell><StatusBadge status={r.status} /></TableCell>
                      <TableCell>{r.evaluator_name || "—"}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button className="rounded-lg p-1.5 text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                              <MoreHorizontal className="h-4 w-4" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start" className="w-56 font-hrsd text-sm">
                            <DropdownMenuItem className="gap-2" onClick={() => navigate(`/admin/associations/${r.id}`)}>
                              <Eye className="h-4 w-4" /> عرض تفاصيل الجمعية
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
    </div>
  );
};

export default AdminAssociations;
