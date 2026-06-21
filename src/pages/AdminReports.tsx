import { useState, useMemo } from "react";
import {
  TrendingUp,
  TrendingDown,
  Award,
  AlertTriangle,
  FileText,
  FileSpreadsheet,
  Download,
  Share2,
  Filter,
  Copy,
  Check } from
"lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend } from
"recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue } from
"@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle } from
"@/components/ui/dialog";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger } from
"@/components/ui/collapsible";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow } from
"@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger } from
"@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import KpiCard from "@/components/admin/KpiCard";

/* ── Mock Data ── */

interface AssocReport {
  id: string;
  name: string;
  year: number;
  track: string;
  progress: number;
  avgScore: number;
  compliance: number;
  status: string;
}

interface EvaluatorReport {
  id: string;
  name: string;
  assignedCount: number;
  avgDuration: number;
  avgScore: number;
  compliance: number;
}

const tracks = ["التوجه", "الفريق", "الشراكات", "التأثير", "البرامج"];

const assocReports2026: AssocReport[] = [
{ id: "a1", name: "جمعية البر الخيرية", year: 2026, track: "التوجه", progress: 85, avgScore: 78, compliance: 90, status: "قيد التقييم" },
{ id: "a2", name: "جمعية إنسان", year: 2026, track: "الفريق", progress: 100, avgScore: 92, compliance: 95, status: "تسليم كامل" },
{ id: "a3", name: "جمعية تكافل", year: 2026, track: "الشراكات", progress: 45, avgScore: 61, compliance: 55, status: "تسليم جزئي" },
{ id: "a4", name: "مؤسسة العطاء", year: 2026, track: "التأثير", progress: 0, avgScore: 0, compliance: 20, status: "لم تبدأ" },
{ id: "a5", name: "جمعية رعاية", year: 2026, track: "البرامج", progress: 60, avgScore: 70, compliance: 75, status: "قيد التقييم" },
{ id: "a6", name: "جمعية إحسان", year: 2026, track: "التوجه", progress: 100, avgScore: 95, compliance: 98, status: "تسليم كامل" },
{ id: "a7", name: "مؤسسة الأمل", year: 2026, track: "الفريق", progress: 30, avgScore: 50, compliance: 40, status: "قيد التقييم" },
{ id: "a8", name: "جمعية الوفاء", year: 2026, track: "الشراكات", progress: 75, avgScore: 82, compliance: 80, status: "تسليم جزئي" },
{ id: "a9", name: "جمعية السلام", year: 2026, track: "التأثير", progress: 90, avgScore: 88, compliance: 92, status: "تسليم كامل" },
{ id: "a10", name: "مؤسسة التنمية", year: 2026, track: "البرامج", progress: 20, avgScore: 35, compliance: 30, status: "قيد التقييم" }];


const assocReports2025: AssocReport[] = [
{ id: "a1", name: "جمعية البر الخيرية", year: 2025, track: "التوجه", progress: 100, avgScore: 88, compliance: 95, status: "تسليم كامل" },
{ id: "a2", name: "جمعية إنسان", year: 2025, track: "الفريق", progress: 100, avgScore: 79, compliance: 85, status: "تسليم كامل" },
{ id: "a3", name: "جمعية تكافل", year: 2025, track: "الشراكات", progress: 100, avgScore: 71, compliance: 78, status: "تسليم كامل" },
{ id: "a4", name: "مؤسسة العطاء", year: 2025, track: "التأثير", progress: 78, avgScore: 65, compliance: 60, status: "تسليم جزئي" },
{ id: "a5", name: "جمعية رعاية", year: 2025, track: "البرامج", progress: 100, avgScore: 67, compliance: 70, status: "تسليم كامل" }];


const evalReports: EvaluatorReport[] = [
{ id: "e1", name: "أحمد محمد", assignedCount: 12, avgDuration: 5, avgScore: 82, compliance: 90 },
{ id: "e2", name: "سارة علي", assignedCount: 10, avgDuration: 3, avgScore: 91, compliance: 95 },
{ id: "e3", name: "خالد عمر", assignedCount: 8, avgDuration: 7, avgScore: 74, compliance: 80 },
{ id: "e4", name: "نورة سعد", assignedCount: 15, avgDuration: 4, avgScore: 88, compliance: 92 },
{ id: "e5", name: "فهد ناصر", assignedCount: 6, avgDuration: 9, avgScore: 65, compliance: 70 },
{ id: "e6", name: "ريم خالد", assignedCount: 11, avgDuration: 4, avgScore: 85, compliance: 88 },
{ id: "e7", name: "عمر يوسف", assignedCount: 9, avgDuration: 6, avgScore: 77, compliance: 82 }];


const yearCompData = [
{ metric: "متوسط الدرجات", "2025": 74, "2026": 68 },
{ metric: "نسبة الالتزام", "2025": 78, "2026": 72 },
{ metric: "نسبة الإنجاز", "2025": 91, "2026": 64 }];


const trackCompData2025 = tracks.map((t, i) => ({ track: t, "2025": [88, 79, 71, 92, 67][i] }));
const trackCompData2026 = tracks.map((t, i) => ({ track: t, "2026": [78, 65, 58, 80, 45][i] }));
const trackCompDataBoth = tracks.map((t, i) => ({
  track: t,
  "2025": [88, 79, 71, 92, 67][i],
  "2026": [78, 65, 58, 80, 45][i]
}));

/* ── Status Badge ── */
const statusColors: Record<string, string> = {
  "تسليم كامل": "bg-emerald-100 text-emerald-700",
  "قيد التقييم": "bg-blue-100 text-blue-700",
  "تسليم جزئي": "bg-amber-100 text-amber-700",
  "لم تبدأ": "bg-gray-100 text-gray-500"
};

const chartStyle = {
  fontFamily: "HRSDGov-Medium",
  fontSize: 12,
  borderRadius: 10,
  border: "1px solid hsl(210,15%,90%)"
};

/* ── Component ── */

const AdminReports = () => {
  const { toast } = useToast();
  const [year, setYear] = useState<number>(2026);
  const [trackFilter, setTrackFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [scoreRange, setScoreRange] = useState([0, 100]);
  const [progressRange, setProgressRange] = useState([0, 100]);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportModal, setReportModal] = useState<AssocReport | null>(null);
  const [evalModal, setEvalModal] = useState<EvaluatorReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [trackCompMode, setTrackCompMode] = useState<"single" | "dual">("dual");

  const comingSoon = () =>
  toast({ title: "قريبًا", description: "سيتم توفير هذه الميزة لاحقًا" });

  const allAssocReports = year === 2026 ? assocReports2026 : assocReports2025;

  const filteredAssoc = useMemo(() => {
    return allAssocReports.filter((r) => {
      if (trackFilter !== "all" && r.track !== trackFilter) return false;
      if (typeFilter === "جمعية" && !r.name.includes("جمعية")) return false;
      if (typeFilter === "مؤسسة" && !r.name.includes("مؤسسة")) return false;
      if (statusFilter !== "all" && r.status !== statusFilter) return false;
      if (r.avgScore < scoreRange[0] || r.avgScore > scoreRange[1]) return false;
      if (r.progress < progressRange[0] || r.progress > progressRange[1]) return false;
      return true;
    });
  }, [allAssocReports, trackFilter, typeFilter, statusFilter, scoreRange, progressRange]);

  // KPIs
  const avgCompliance = filteredAssoc.length ?
  Math.round(filteredAssoc.reduce((s, r) => s + r.compliance, 0) / filteredAssoc.length) :
  0;
  const avgScore = filteredAssoc.length ?
  Math.round(filteredAssoc.reduce((s, r) => s + r.avgScore, 0) / filteredAssoc.length) :
  0;
  const topPerformer = [...filteredAssoc].sort((a, b) => b.avgScore - a.avgScore)[0];
  const bottomPerformer = [...filteredAssoc].sort((a, b) => a.avgScore - b.avgScore)[0];

  // Chart data
  const trackPerfData = tracks.map((t) => {
    const subset = filteredAssoc.filter((r) => r.track === t);
    return {
      name: t,
      value: subset.length ? Math.round(subset.reduce((s, r) => s + r.avgScore, 0) / subset.length) : 0
    };
  });

  const top5 = [...filteredAssoc].sort((a, b) => b.avgScore - a.avgScore).slice(0, 5);
  const bottom5 = [...filteredAssoc].sort((a, b) => a.avgScore - b.avgScore).slice(0, 5);

  const evalDurationData = evalReports.map((e) => ({ name: e.name, value: e.avgDuration }));
  const evalScoreData = evalReports.map((e) => ({ name: e.name, value: e.avgScore }));

  const handleCopyLink = () => {
    navigator.clipboard.writeText("https://tamkeen.hrsd.gov.sa/reports/shared/abc123");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const currentTrackComp =
  trackCompMode === "dual" ?
  trackCompDataBoth :
  year === 2026 ?
  trackCompData2026 :
  trackCompData2025;

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          {/* Title */}
          <div>
            <h1 className="text-xl font-hrsd-title text-foreground">التقارير والتحليلات</h1>
            <p className="text-sm font-hrsd text-muted-foreground mt-1">
              لوحة تقارير شاملة لمتابعة الأداء واتخاذ القرار
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
                <SelectTrigger className="w-28 text-sm font-hrsd-medium"><SelectValue placeholder="السنة" /></SelectTrigger>
                <SelectContent><SelectItem value="2026">2026</SelectItem><SelectItem value="2025">2025</SelectItem></SelectContent>
              </Select>
              <Select value={trackFilter} onValueChange={setTrackFilter}>
                <SelectTrigger className="w-36 text-sm font-hrsd-medium"><SelectValue placeholder="المسار" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {tracks.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-32 text-sm font-hrsd-medium"><SelectValue placeholder="نوع الجهة" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="جمعية">جمعية</SelectItem>
                  <SelectItem value="مؤسسة">مؤسسة</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-36 text-sm font-hrsd-medium"><SelectValue placeholder="حالة التقييم" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  <SelectItem value="لم تبدأ">لم تبدأ</SelectItem>
                  <SelectItem value="قيد التقييم">قيد التقييم</SelectItem>
                  <SelectItem value="تسليم جزئي">تسليم جزئي</SelectItem>
                  <SelectItem value="تسليم كامل">تسليم كامل</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={comingSoon} className="gap-2 text-xs font-hrsd-medium">
                تصدير PDF <FileText className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={comingSoon} className="gap-2 text-xs font-hrsd-medium">
                تصدير Excel <FileSpreadsheet className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={comingSoon} className="gap-2 text-xs font-hrsd-medium">
                تحميل تقرير شامل <Download className="h-3.5 w-3.5" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShareOpen(true)} className="gap-2 text-xs font-hrsd-medium">
                مشاركة تقرير <Share2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-xs font-hrsd-medium text-muted-foreground">
                <Filter className="h-3.5 w-3.5" /> فلترة متقدمة
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <Card className="p-5 mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-hrsd-medium text-muted-foreground">نطاق الدرجات ({scoreRange[0]} - {scoreRange[1]})</label>
                  <Slider min={0} max={100} step={5} value={scoreRange} onValueChange={setScoreRange} />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-hrsd-medium text-muted-foreground">نطاق نسبة الإنجاز ({progressRange[0]} - {progressRange[1]})</label>
                  <Slider min={0} max={100} step={5} value={progressRange} onValueChange={setProgressRange} />
                </div>
              </Card>
            </CollapsibleContent>
          </Collapsible>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <KpiCard
              title="نسبة الالتزام"
              value={`${avgCompliance}%`}
              icon={<TrendingUp className="h-5 w-5" />}
              highlight
              showProgress
              progressValue={avgCompliance} />

            <KpiCard title="متوسط الدرجات" value={`${avgScore}%`} icon={<Award className="h-5 w-5" />} />
            <KpiCard
              title="أعلى أداء"
              value={topPerformer ? `${topPerformer.avgScore}%` : "-"}
              icon={<TrendingUp className="h-5 w-5" />} />

            <KpiCard
              title="أدنى أداء"
              value={bottomPerformer ? `${bottomPerformer.avgScore}%` : "-"}
              icon={<AlertTriangle className="h-5 w-5" />} />

          </div>

          {/* Tabs */}
          <Tabs defaultValue="associations" dir="rtl" className="space-y-5">
            <TabsList className="bg-card border border-border h-auto p-1 gap-1 w-fit ms-auto flex-row-reverse">
              <TabsTrigger value="associations" className="text-xs font-hrsd-medium px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                أداء الجمعيات
              </TabsTrigger>
              <TabsTrigger value="evaluators" className="text-xs font-hrsd-medium px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                أداء المقيمين
              </TabsTrigger>
              <TabsTrigger value="comparisons" className="text-xs font-hrsd-medium px-5 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                مقارنات
              </TabsTrigger>
            </TabsList>

            {/* TAB 1: أداء الجمعيات */}
            <TabsContent value="associations" className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* Track performance bar */}
                <Card className="p-6">
                  <h3 className="text-sm font-hrsd-semibold text-foreground mb-5">توزيع الأداء حسب المسارات</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={trackPerfData} barSize={28}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,93%)" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11, fontFamily: "HRSDGov-Regular" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartStyle} formatter={(v: number) => [`${v}%`, "متوسط الأداء"]} />
                      <Bar dataKey="value" fill="hsl(175,75%,30%)" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                {/* Top / bottom */}
                <Card className="p-6">
                  <h3 className="text-sm font-hrsd-semibold text-foreground mb-5">أعلى / أدنى أداء</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs font-hrsd-medium text-emerald-600 mb-3">أعلى 5</p>
                      {top5.map((r) =>
                      <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                          <span className="text-xs font-hrsd">{r.name}</span>
                          <span className="text-xs font-hrsd-bold text-primary">{r.avgScore}%</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs font-hrsd-medium text-red-500 mb-3">أدنى 5</p>
                      {bottom5.map((r) =>
                      <div key={r.id} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                          <span className="text-xs font-hrsd">{r.name}</span>
                          <span className="text-xs font-hrsd-bold text-destructive">{r.avgScore}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Card>
              </div>
              {/* Assoc Table */}
              <Card className="p-6">
                <h3 className="text-sm font-hrsd-semibold text-foreground mb-5">تقارير أداء الجمعيات</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right font-hrsd-medium">الجمعية</TableHead>
                        <TableHead className="text-right font-hrsd-medium">السنة</TableHead>
                        <TableHead className="text-right font-hrsd-medium">المسار</TableHead>
                        <TableHead className="text-right font-hrsd-medium">نسبة الإنجاز</TableHead>
                        <TableHead className="text-right font-hrsd-medium">متوسط الدرجة</TableHead>
                        <TableHead className="text-right font-hrsd-medium">نسبة الالتزام</TableHead>
                        <TableHead className="text-right font-hrsd-medium">الحالة</TableHead>
                        <TableHead className="text-right font-hrsd-medium">الإجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAssoc.map((r) =>
                      <TableRow key={r.id}>
                          <TableCell className="font-hrsd-medium text-sm">{r.name}</TableCell>
                          <TableCell className="text-sm">{r.year}</TableCell>
                          <TableCell className="text-sm">{r.track}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${r.progress}%` }} />
                              </div>
                              <span className="text-xs font-hrsd-medium">{r.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm font-hrsd-medium">{r.avgScore}%</TableCell>
                          <TableCell className="text-sm">{r.compliance}%</TableCell>
                          <TableCell>
                            <span className={`inline-block rounded-full px-3 py-1 text-[10px] font-hrsd-medium ${statusColors[r.status] || ""}`}>
                              {r.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-xs font-hrsd-medium text-primary" onClick={() => setReportModal(r)}>
                              عرض التقرير
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 2: أداء المقيمين */}
            <TabsContent value="evaluators" className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="p-6">
                  <h3 className="text-sm font-hrsd-semibold text-foreground mb-5">متوسط مدة التقييم حسب المقيم</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={evalDurationData} barSize={28} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,93%)" horizontal={false} />
                      <XAxis type="number" tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit=" يوم" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "HRSDGov-Regular" }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={chartStyle} formatter={(v: number) => [`${v} يوم`, "المدة"]} />
                      <Bar dataKey="value" fill="hsl(175,75%,30%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
                <Card className="p-6">
                  <h3 className="text-sm font-hrsd-semibold text-foreground mb-5">متوسط درجات المقيمين</h3>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={evalScoreData} barSize={28} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,93%)" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} axisLine={false} tickLine={false} unit="%" />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontFamily: "HRSDGov-Regular" }} axisLine={false} tickLine={false} width={80} />
                      <Tooltip contentStyle={chartStyle} formatter={(v: number) => [`${v}%`, "الدرجة"]} />
                      <Bar dataKey="value" fill="hsl(35,91%,54%)" radius={[0, 6, 6, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
              <Card className="p-6">
                <h3 className="text-sm font-hrsd-semibold text-foreground mb-5">تقارير أداء المقيمين</h3>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right font-hrsd-medium">اسم المقيم</TableHead>
                        <TableHead className="text-right font-hrsd-medium">عدد التقييمات</TableHead>
                        <TableHead className="text-right font-hrsd-medium">متوسط مدة التقييم</TableHead>
                        <TableHead className="text-right font-hrsd-medium">متوسط الدرجات</TableHead>
                        <TableHead className="text-right font-hrsd-medium">نسبة الالتزام</TableHead>
                        <TableHead className="text-right font-hrsd-medium">الإجراء</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evalReports.map((e) =>
                      <TableRow key={e.id}>
                          <TableCell className="font-hrsd-medium text-sm">{e.name}</TableCell>
                          <TableCell className="text-sm">{e.assignedCount}</TableCell>
                          <TableCell className="text-sm">{e.avgDuration} يوم</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-hrsd-medium">{e.avgScore}%</span>
                              <div className="h-1.5 w-12 rounded-full bg-muted overflow-hidden">
                                <div className="h-full bg-primary rounded-full" style={{ width: `${e.avgScore}%` }} />
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">{e.compliance}%</TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm" className="text-xs font-hrsd-medium text-primary" onClick={() => setEvalModal(e)}>
                              عرض الأداء
                            </Button>
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              </Card>
            </TabsContent>

            {/* TAB 3: مقارنات */}
            <TabsContent value="comparisons" className="space-y-5">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <Card className="p-6">
                  <h3 className="text-sm font-hrsd-semibold text-foreground mb-5">مقارنة بين السنوات</h3>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={yearCompData} barSize={22}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,93%)" vertical={false} />
                      <XAxis dataKey="metric" tick={{ fontSize: 11, fontFamily: "HRSDGov-Regular" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartStyle} />
                      <Legend wrapperStyle={{ fontFamily: "HRSDGov-Medium", fontSize: 11 }} />
                      <Bar dataKey="2025" fill="hsl(210,15%,80%)" radius={[6, 6, 0, 0]} name="2025" />
                      <Bar dataKey="2026" fill="hsl(175,75%,30%)" radius={[6, 6, 0, 0]} name="2026" />
                    </BarChart>
                  </ResponsiveContainer>
                  <div className="mt-3 flex gap-4 text-xs font-hrsd text-muted-foreground">
                    <span>متوسط الدرجات: <span className="text-red-500 font-hrsd-medium">تراجع بنسبة 8%</span></span>
                    <span>نسبة الالتزام: <span className="text-red-500 font-hrsd-medium">تراجع بنسبة 8%</span></span>
                  </div>
                </Card>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-sm font-hrsd-semibold text-foreground">مقارنة بين المساقات</h3>
                    <div className="flex items-center gap-1 rounded-lg border border-border overflow-hidden">
                      <button
                        className={`px-3 py-1 text-[10px] font-hrsd-medium transition-colors ${trackCompMode === "single" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                        onClick={() => setTrackCompMode("single")}>

                        سنة واحدة
                      </button>
                      <button
                        className={`px-3 py-1 text-[10px] font-hrsd-medium transition-colors ${trackCompMode === "dual" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"}`}
                        onClick={() => setTrackCompMode("dual")}>

                        سنتين
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={currentTrackComp} barSize={20}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(210,15%,93%)" vertical={false} />
                      <XAxis dataKey="track" tick={{ fontSize: 11, fontFamily: "HRSDGov-Regular" }} axisLine={false} tickLine={false} />
                      <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" axisLine={false} tickLine={false} />
                      <Tooltip contentStyle={chartStyle} />
                      <Legend wrapperStyle={{ fontFamily: "HRSDGov-Medium", fontSize: 11 }} />
                      {(trackCompMode === "dual" || year === 2025) &&
                      <Bar dataKey="2025" fill="hsl(210,15%,80%)" radius={[6, 6, 0, 0]} name="2025" />
                      }
                      {(trackCompMode === "dual" || year === 2026) &&
                      <Bar dataKey="2026" fill="hsl(175,75%,30%)" radius={[6, 6, 0, 0]} name="2026" />
                      }
                    </BarChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* Share Modal */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-hrsd-title">مشاركة التقرير</DialogTitle>
          </DialogHeader>
          <p className="text-sm font-hrsd text-muted-foreground mb-3">انسخ الرابط أدناه لمشاركة التقرير</p>
          <div className="flex items-center gap-2 rounded-lg border border-border p-2">
            <span className="flex-1 text-xs font-hrsd text-muted-foreground truncate" dir="ltr">
              https://tamkeen.hrsd.gov.sa/reports/shared/abc123
            </span>
            <Button size="sm" variant="outline" onClick={handleCopyLink} className="gap-1.5 text-xs font-hrsd-medium">
              {copied ? <><Check className="h-3.5 w-3.5" /> تم النسخ</> : <><Copy className="h-3.5 w-3.5" /> نسخ</>}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assoc Report Modal */}
      <Dialog open={!!reportModal} onOpenChange={() => setReportModal(null)}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-hrsd-title">ملخص تقرير الجمعية</DialogTitle>
          </DialogHeader>
          {reportModal &&
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground font-hrsd">الجمعية:</span> <span className="font-hrsd-medium">{reportModal.name}</span></div>
                <div><span className="text-muted-foreground font-hrsd">السنة:</span> <span className="font-hrsd-medium">{reportModal.year}</span></div>
                <div><span className="text-muted-foreground font-hrsd">المسار:</span> <span className="font-hrsd-medium">{reportModal.track}</span></div>
                <div><span className="text-muted-foreground font-hrsd">الحالة:</span> <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-hrsd-medium ${statusColors[reportModal.status]}`}>{reportModal.status}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
              { label: "نسبة الإنجاز", val: `${reportModal.progress}%` },
              { label: "متوسط الدرجة", val: `${reportModal.avgScore}%` },
              { label: "نسبة الالتزام", val: `${reportModal.compliance}%` }].
              map((k) =>
              <div key={k.label} className="rounded-lg border border-border p-3 text-center">
                    <p className="text-[10px] font-hrsd text-muted-foreground">{k.label}</p>
                    <p className="text-lg font-hrsd-bold text-foreground mt-1">{k.val}</p>
                  </div>
              )}
              </div>
              <Button variant="outline" size="sm" onClick={comingSoon} className="gap-2 text-xs font-hrsd-medium w-full">
                تحميل التقرير <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          }
        </DialogContent>
      </Dialog>

      {/* Evaluator Report Modal */}
      <Dialog open={!!evalModal} onOpenChange={() => setEvalModal(null)}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-hrsd-title">ملخص أداء المقيم</DialogTitle>
          </DialogHeader>
          {evalModal &&
          <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><span className="text-muted-foreground font-hrsd">المقيم:</span> <span className="font-hrsd-medium">{evalModal.name}</span></div>
                <div><span className="text-muted-foreground font-hrsd">عدد التقييمات:</span> <span className="font-hrsd-medium">{evalModal.assignedCount}</span></div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
              { label: "متوسط المدة", val: `${evalModal.avgDuration} يوم` },
              { label: "متوسط الدرجات", val: `${evalModal.avgScore}%` },
              { label: "نسبة الالتزام", val: `${evalModal.compliance}%` }].
              map((k) =>
              <div key={k.label} className="rounded-lg border border-border p-3 text-center">
                    <p className="text-[10px] font-hrsd text-muted-foreground">{k.label}</p>
                    <p className="text-lg font-hrsd-bold text-foreground mt-1">{k.val}</p>
                  </div>
              )}
              </div>
              <Button variant="outline" size="sm" onClick={comingSoon} className="gap-2 text-xs font-hrsd-medium w-full">
                تحميل <Download className="h-3.5 w-3.5" />
              </Button>
            </div>
          }
        </DialogContent>
      </Dialog>
    </div>);

};

export default AdminReports;