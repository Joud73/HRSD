import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  ShieldCheck,
  Send,
  Download,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import StatusBadge from "@/components/admin/StatusBadge";

/* ══════════════════════════════════════════════════════
   MOCK DATA
   ══════════════════════════════════════════════════════ */

const assocData: Record<string, {
  name: string; type: string; license: string; region: string; email: string;
  mobile: string; year: number; status: string; progress: number; score: number | null;
  delegate: { name: string; idNumber: string; email: string; mobile: string; role: string; date: string; accountStatus: string };
  tracks: { name: string; active: boolean }[];
}> = {
  a1: {
    name: "جمعية البر الخيرية", type: "جمعية", license: "1045832", region: "الرياض / الرياض",
    email: "info@albirr.org.sa", mobile: "0551234567", year: 2026, status: "قيد التقييم",
    progress: 60, score: 72,
    delegate: {
      name: "عبدالرحمن الأحمد", idNumber: "1098765432", email: "a.alahmad@albirr.org.sa",
      mobile: "0559876543", role: "مدير الجودة", date: "2026-01-05", accountStatus: "نشط",
    },
    tracks: [
      { name: "مساق التوجه", active: true },
      { name: "مساق الفريق", active: true },
      { name: "مساق الشراكات", active: false },
      { name: "مساق التأثير", active: true },
      { name: "مساق البرامج", active: false },
    ],
  },
};

const evidenceRows = [
  { id: "e1", name: "وثيقة الرؤية الاستراتيجية", track: "مساق التوجه", criterion: "الرؤية والرسالة", date: "2026-01-10", uploader: "عبدالرحمن الأحمد", status: "مقبول" },
  { id: "e2", name: "خطة التطوير المؤسسي", track: "مساق التوجه", criterion: "التخطيط الاستراتيجي", date: "2026-01-12", uploader: "عبدالرحمن الأحمد", status: "بحاجة توضيح" },
  { id: "e3", name: "هيكل فريق العمل", track: "مساق الفريق", criterion: "الهيكل التنظيمي", date: "2026-01-15", uploader: "عبدالرحمن الأحمد", status: "مقبول" },
  { id: "e4", name: "تقرير برامج التدريب", track: "مساق الفريق", criterion: "تطوير الكفاءات", date: "2026-01-18", uploader: "عبدالرحمن الأحمد", status: "مرفوض" },
  { id: "e5", name: "اتفاقيات الشراكة", track: "مساق الشراكات", criterion: "الشراكات المجتمعية", date: "2026-01-20", uploader: "عبدالرحمن الأحمد", status: "مقبول" },
  { id: "e6", name: "تقرير الأثر الاجتماعي", track: "مساق التأثير", criterion: "قياس الأثر", date: "2026-01-22", uploader: "عبدالرحمن الأحمد", status: "بحاجة توضيح" },
];

const evidenceStatusColor: Record<string, string> = {
  "مقبول": "bg-emerald-50 text-emerald-700 border-emerald-200",
  "مرفوض": "bg-red-50 text-red-700 border-red-200",
  "بحاجة توضيح": "bg-amber-50 text-amber-700 border-amber-200",
};

const tracksCriteria: Record<string, { criterion: string; status: string; score: number | null; note: string }[]> = {
  "مساق التوجه": [
    { criterion: "الرؤية والرسالة", status: "مكتمل", score: 85, note: "متميز في صياغة الرؤية" },
    { criterion: "التخطيط الاستراتيجي", status: "بحاجة مراجعة", score: 60, note: "يحتاج تفصيل أكثر" },
    { criterion: "القيم المؤسسية", status: "مكتمل", score: 78, note: "" },
  ],
  "مساق الفريق": [
    { criterion: "الهيكل التنظيمي", status: "مكتمل", score: 90, note: "ممتاز" },
    { criterion: "تطوير الكفاءات", status: "ناقص", score: 40, note: "لم يُرفق دليل كافٍ" },
    { criterion: "بيئة العمل", status: "مكتمل", score: 75, note: "" },
  ],
  "مساق الشراكات": [
    { criterion: "الشراكات المجتمعية", status: "مكتمل", score: 82, note: "" },
    { criterion: "التواصل المؤسسي", status: "بحاجة مراجعة", score: 55, note: "ضعف في التوثيق" },
  ],
  "مساق التأثير": [
    { criterion: "قياس الأثر", status: "بحاجة مراجعة", score: 50, note: "تقرير غير مكتمل" },
    { criterion: "التقارير الدورية", status: "مكتمل", score: 70, note: "" },
  ],
  "مساق البرامج": [
    { criterion: "تصميم البرامج", status: "ناقص", score: null, note: "لم يبدأ" },
    { criterion: "تنفيذ البرامج", status: "ناقص", score: null, note: "لم يبدأ" },
  ],
};

const criterionStatusColor: Record<string, string> = {
  "مكتمل": "bg-emerald-50 text-emerald-700",
  "ناقص": "bg-red-50 text-red-700",
  "بحاجة مراجعة": "bg-amber-50 text-amber-700",
};

const initialComments = [
  { id: "c1", sender: "المقيم", message: "يرجى إرفاق تقرير الأثر الاجتماعي الكامل", time: "2026-01-22 10:30" },
  { id: "c2", sender: "الجمعية", message: "تم رفع التقرير المحدّث، يرجى المراجعة", time: "2026-01-23 14:15" },
  { id: "c3", sender: "إشراف", message: "تمت الملاحظة، سيتم المتابعة مع المقيم", time: "2026-01-24 09:00" },
];

const senderColor: Record<string, string> = {
  "المقيم": "bg-primary/10 text-primary",
  "الجمعية": "bg-amber-50 text-amber-700",
  "إشراف": "bg-purple-50 text-purple-700",
};

const auditLog = [
  { date: "2026-01-05 09:00", user: "مدير النظام", action: "إنشاء ملف الجمعية", detail: "تم إنشاء ملف جمعية البر الخيرية" },
  { date: "2026-01-06 11:30", user: "مدير النظام", action: "تعيين مقيم", detail: "تم تعيين أحمد محمد كمقيم" },
  { date: "2026-01-10 14:00", user: "المفوض", action: "رفع شاهد", detail: "وثيقة الرؤية الاستراتيجية" },
  { date: "2026-01-15 10:00", user: "المقيم", action: "تعديل تقييم", detail: "تحديث درجة معيار الرؤية والرسالة" },
  { date: "2026-01-20 16:45", user: "مدير النظام", action: "إضافة ملاحظة إشرافية", detail: "ملاحظة على مساق التوجه" },
  { date: "2026-01-22 10:30", user: "المقيم", action: "طلب توضيح", detail: "طلب تقرير الأثر الاجتماعي الكامل" },
  { date: "2026-01-24 09:00", user: "مدير النظام", action: "تعليق إشرافي", detail: "متابعة طلب التوضيح" },
];

/* ══════════════════════════════════════════════════════
   COMPONENT
   ══════════════════════════════════════════════════════ */

const AdminAssociationDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const data = assocData[id ?? ""] ?? assocData.a1;

  // Supervisory note
  const [supervisoryNote, setSupervisoryNote] = useState("");

  // Comments
  const [comments, setComments] = useState(initialComments);
  const [newComment, setNewComment] = useState("");

  // Evidence modal
  const [previewEvidence, setPreviewEvidence] = useState<typeof evidenceRows[0] | null>(null);

  // Evaluation track filter
  const [evalTrackFilter, setEvalTrackFilter] = useState("all");

  const comingSoon = () => toast({ title: "قريبًا", description: "سيتم توفير هذه الميزة لاحقًا" });

  const confirmAction = (label: string) => {
    toast({ title: "تم", description: `${label} (تجريبيًا)` });
  };

  const filteredTracks = evalTrackFilter === "all"
    ? Object.entries(tracksCriteria)
    : Object.entries(tracksCriteria).filter(([t]) => t === evalTrackFilter);

  /* ── Field helper ── */
  const Field = ({ label, value, children }: { label: string; value?: string; children?: React.ReactNode }) => (
    <div>
      <p className="text-xs font-hrsd text-muted-foreground mb-1">{label}</p>
      {children ?? <p className="text-sm font-hrsd-medium text-foreground">{value ?? "—"}</p>}
    </div>
  );

  /* ── Manager action button with confirm dialog ── */
  const ConfirmButton = ({ label, variant = "outline" }: { label: string; variant?: "outline" | "default" | "destructive" }) => (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant={variant} size="sm" className="text-xs font-hrsd-medium">
          {label}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent dir="rtl">
        <AlertDialogHeader>
          <AlertDialogTitle className="font-hrsd-semibold">تأكيد الإجراء</AlertDialogTitle>
          <AlertDialogDescription className="font-hrsd">
            هل أنت متأكد من تنفيذ: "{label}"؟
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2">
          <AlertDialogCancel className="font-hrsd-medium">إلغاء</AlertDialogCancel>
          <AlertDialogAction className="font-hrsd-medium" onClick={() => confirmAction(label)}>
            تأكيد
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
          {/* ── Title area ── */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/admin/associations")}
                className="rounded-xl"
              >
                <ArrowRight className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-xl font-hrsd-title text-foreground">تفاصيل الجمعية</h1>
                <p className="text-sm font-hrsd text-muted-foreground mt-0.5">
                  عرض شامل لبيانات الجهة وتفاصيل التقييم
                </p>
              </div>
            </div>
            <Badge variant="outline" className="gap-1.5 px-3 py-1 text-xs font-hrsd-medium border-primary/30 text-primary">
              <ShieldCheck className="h-3.5 w-3.5" />
              صلاحيات المدير: اطلاع كامل
            </Badge>
          </div>

          {/* ── Tabs ── */}
          <Tabs defaultValue="overview" dir="rtl" className="space-y-5">
            <TabsList className="bg-card border border-border h-auto p-1 gap-1 w-fit ms-auto flex-row-reverse">
              {[
                { value: "overview", label: "نظرة عامة" },
                { value: "evidence", label: "الشواهد" },
                { value: "evaluation", label: "التقييم" },
                { value: "comments", label: "التعليقات" },
                { value: "audit", label: "سجل التعديلات" },
              ].map((t) => (
                <TabsTrigger key={t.value} value={t.value} className="text-xs font-hrsd-medium px-4 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg">
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* ═══════════════════  TAB 1: نظرة عامة  ═══════════════════ */}
            <TabsContent value="overview" className="space-y-5">
              {/* A) بيانات الجمعية */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-hrsd-semibold text-foreground">بيانات الجمعية</h3>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                  <Field label="اسم الجمعية" value={data.name} />
                  <Field label="نوع الجهة" value={data.type} />
                  <Field label="رقم الترخيص" value={data.license} />
                  <Field label="المنطقة / المدينة" value={data.region} />
                  <Field label="البريد الإلكتروني" value={data.email} />
                  <Field label="رقم الجوال" value={data.mobile} />
                  <Field label="سنة التقييم" value={String(data.year)} />
                  <Field label="حالة التقييم">
                    <StatusBadge status={data.status} />
                  </Field>
                  <Field label="نسبة الإنجاز">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-hrsd-medium">{data.progress}%</span>
                      <Progress value={data.progress} className="h-1.5 w-24" />
                    </div>
                  </Field>
                  <Field label="الدرجة الحالية" value={data.score !== null ? `${data.score}%` : "—"} />
                </div>
              </div>

              {/* B) بيانات المفوض */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-hrsd-semibold text-foreground">بيانات المفوض</h3>
                </div>
                <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-5">
                  <Field label="الاسم" value={data.delegate.name} />
                  <Field label="رقم الهوية" value={data.delegate.idNumber} />
                  <Field label="البريد الإلكتروني" value={data.delegate.email} />
                  <Field label="رقم الجوال" value={data.delegate.mobile} />
                  <Field label="الصفة / المنصب" value={data.delegate.role} />
                  <Field label="تاريخ التفويض" value={data.delegate.date} />
                  <Field label="حالة الحساب">
                    <Badge variant="outline" className="text-xs border-emerald-200 text-emerald-700 bg-emerald-50">
                      {data.delegate.accountStatus}
                    </Badge>
                  </Field>
                </div>
              </div>

              {/* C) المسارات المختارة */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-hrsd-semibold text-foreground">المسارات المختارة</h3>
                </div>
                <div className="p-6 flex flex-wrap gap-2">
                  {data.tracks.map((t) => (
                    <Badge
                      key={t.name}
                      variant="outline"
                      className={`text-xs font-hrsd-medium px-3 py-1.5 ${
                        t.active
                          ? "border-primary/30 text-primary bg-primary/5"
                          : "border-border text-muted-foreground bg-muted/50 opacity-60"
                      }`}
                    >
                      {t.name}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Supervisory note */}
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-hrsd-semibold text-foreground">إضافة ملاحظة إشرافية</h3>
                </div>
                <div className="p-6 space-y-3">
                  <Textarea
                    placeholder="اكتب ملاحظة إشرافية..."
                    value={supervisoryNote}
                    onChange={(e) => setSupervisoryNote(e.target.value)}
                    className="font-hrsd text-sm min-h-[80px]"
                  />
                  <Button
                    size="sm"
                    className="text-xs font-hrsd-medium"
                    onClick={() => {
                      toast({ title: "تم", description: "تم حفظ الملاحظة (تجريبيًا)" });
                      setSupervisoryNote("");
                    }}
                  >
                    حفظ الملاحظة
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════════════  TAB 2: الشواهد  ═══════════════════ */}
            <TabsContent value="evidence" className="space-y-5">
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-hrsd-semibold text-foreground">جميع الشواهد المرفقة</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      {["اسم الشاهد", "المسار", "المعيار", "تاريخ الرفع", "المرفوع بواسطة", "الحالة", "إجراء"].map((h) => (
                         <TableHead key={h} className="text-right font-hrsd-medium text-xs">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {evidenceRows.map((e) => (
                      <TableRow key={e.id} className="text-sm font-hrsd">
                        <TableCell className="font-hrsd-medium text-right">{e.name}</TableCell>
                        <TableCell>{e.track}</TableCell>
                        <TableCell>{e.criterion}</TableCell>
                        <TableCell>{e.date}</TableCell>
                        <TableCell>{e.uploader}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-hrsd-medium ${evidenceStatusColor[e.status] ?? ""}`}>
                            {e.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Button variant="ghost" size="sm" className="text-xs font-hrsd-medium text-primary" onClick={() => setPreviewEvidence(e)}>
                            عرض
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Evidence preview modal */}
              <Dialog open={!!previewEvidence} onOpenChange={() => setPreviewEvidence(null)}>
                <DialogContent dir="rtl" className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="font-hrsd-semibold text-base">{previewEvidence?.name}</DialogTitle>
                  </DialogHeader>
                  <div className="rounded-lg border border-border bg-muted/30 flex items-center justify-center h-48">
                    <p className="text-sm font-hrsd text-muted-foreground">معاينة الملف غير متوفرة حاليًا</p>
                  </div>
                  <Button variant="outline" size="sm" className="gap-2 text-xs font-hrsd-medium w-fit" onClick={comingSoon}>
                    <Download className="h-3.5 w-3.5" />
                    تحميل الملف
                  </Button>
                </DialogContent>
              </Dialog>
            </TabsContent>

            {/* ═══════════════════  TAB 3: التقييم  ═══════════════════ */}
            <TabsContent value="evaluation" className="space-y-5">
              {/* Manager actions */}
              <div className="flex flex-wrap items-center gap-2">
                <ConfirmButton label="اعتماد نهائي للتقييم" variant="default" />
                <ConfirmButton label="إعادة التقييم" />
                <ConfirmButton label="إغلاق الملف" />
                <ConfirmButton label="إعادة فتح التقييم" />
              </div>

              {/* Track filter */}
              <Select value={evalTrackFilter} onValueChange={setEvalTrackFilter}>
                <SelectTrigger className="w-48 text-sm font-hrsd-medium">
                  <SelectValue placeholder="المسار" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">الكل</SelectItem>
                  {Object.keys(tracksCriteria).map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Criteria accordion */}
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-hrsd-semibold text-foreground">حالة كل معيار وتقييم المقيم</h3>
                </div>
                <div className="p-4">
                  <Accordion type="multiple" className="space-y-2">
                    {filteredTracks.map(([track, criteria]) => (
                      <AccordionItem key={track} value={track} className="border rounded-lg px-4">
                        <AccordionTrigger className="text-sm font-hrsd-semibold hover:no-underline py-3">
                          {track}
                          <span className="text-xs font-hrsd text-muted-foreground me-auto ms-3">
                            ({criteria.length} معايير)
                          </span>
                        </AccordionTrigger>
                        <AccordionContent>
                          <Table>
                            <TableHeader>
                              <TableRow className="bg-muted/20">
                                {["المعيار / البند", "حالة المعيار", "تقييم المقيم", "ملاحظة المقيم", "إجراء"].map((h) => (
                                   <TableHead key={h} className="text-right font-hrsd-medium text-xs">{h}</TableHead>
                                 ))}
                               </TableRow>
                             </TableHeader>
                            <TableBody>
                              {criteria.map((c) => (
                                <TableRow key={c.criterion} className="text-sm font-hrsd">
                                  <TableCell className="font-hrsd-medium">{c.criterion}</TableCell>
                                  <TableCell>
                                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-hrsd-medium ${criterionStatusColor[c.status] ?? ""}`}>
                                      {c.status}
                                    </span>
                                  </TableCell>
                                  <TableCell>{c.score !== null ? `${c.score}%` : "—"}</TableCell>
                                  <TableCell className="text-muted-foreground text-xs max-w-[200px] truncate">{c.note || "—"}</TableCell>
                                  <TableCell>
                                    <Button variant="ghost" size="sm" className="text-xs font-hrsd-medium text-primary" onClick={comingSoon}>
                                      عرض التفاصيل
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════════════  TAB 4: التعليقات  ═══════════════════ */}
            <TabsContent value="comments" className="space-y-5">
              <div className="rounded-xl border border-border bg-card shadow-sm">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-hrsd-semibold text-foreground">التعليقات بين المقيم والجمعية</h3>
                </div>
                <div className="p-6 space-y-4 max-h-[400px] overflow-y-auto">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-3">
                      <Badge variant="outline" className={`shrink-0 h-fit text-[10px] font-hrsd-medium px-2 py-0.5 ${senderColor[c.sender] ?? ""}`}>
                        {c.sender}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-sm font-hrsd text-foreground">{c.message}</p>
                        <p className="text-[10px] font-hrsd text-muted-foreground mt-1">{c.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-6 py-4 border-t border-border flex gap-3">
                  <Textarea
                    placeholder="اكتب تعليقًا..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    className="font-hrsd text-sm min-h-[60px] flex-1"
                  />
                  <Button
                    size="sm"
                    className="gap-1.5 text-xs font-hrsd-medium self-end"
                    onClick={() => {
                      if (!newComment.trim()) return;
                      setComments((prev) => [
                        ...prev,
                        { id: `c${prev.length + 1}`, sender: "إشراف", message: newComment.trim(), time: new Date().toLocaleString("ar-SA") },
                      ]);
                      setNewComment("");
                    }}
                  >
                    <Send className="h-3.5 w-3.5" />
                    إرسال
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* ═══════════════════  TAB 5: سجل التعديلات  ═══════════════════ */}
            <TabsContent value="audit" className="space-y-5">
              <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-border">
                  <h3 className="text-sm font-hrsd-semibold text-foreground">سجل التعديلات</h3>
                </div>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                       {["التاريخ والوقت", "المستخدم", "الإجراء", "تفاصيل مختصرة"].map((h) => (
                         <TableHead key={h} className="text-right font-hrsd-medium text-xs">{h}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {auditLog.map((a, i) => (
                      <TableRow key={i} className="text-sm font-hrsd">
                        <TableCell className="text-xs text-muted-foreground">{a.date}</TableCell>
                        <TableCell className="font-hrsd-medium">{a.user}</TableCell>
                        <TableCell>{a.action}</TableCell>
                        <TableCell className="text-muted-foreground text-xs">{a.detail}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default AdminAssociationDetail;
