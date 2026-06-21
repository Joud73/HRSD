import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Textarea } from "@/components/ui/textarea";
import {
  Search, Plus, Trash2, Save, Copy, ShieldCheck,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── permission model ── */
interface PermGroup {
  key: string;
  label: string;
  items: { key: string; label: string }[];
}

const permissionGroups: PermGroup[] = [
  {
    key: "dashboard", label: "لوحة التحكم والتقارير",
    items: [
      { key: "dashboard.view", label: "عرض لوحة التحكم" },
      { key: "reports.view", label: "عرض التقارير" },
      { key: "reports.export", label: "تصدير التقارير" },
      { key: "reports.share", label: "مشاركة تقرير" },
      { key: "reports.download", label: "تحميل تقرير شامل" },
    ],
  },
  {
    key: "management", label: "الإدارة",
    items: [
      { key: "users.view", label: "إدارة المستخدمين: عرض" },
      { key: "users.create", label: "إدارة المستخدمين: إنشاء" },
      { key: "users.edit", label: "إدارة المستخدمين: تعديل" },
      { key: "users.disable", label: "إدارة المستخدمين: تعطيل/حذف" },
      { key: "users.reset_password", label: "إعادة تعيين كلمة المرور" },
      { key: "roles.view", label: "إدارة الصلاحيات: عرض" },
      { key: "roles.edit", label: "إدارة الصلاحيات: تعديل" },
    ],
  },
  {
    key: "associations", label: "إدارة الجمعيات",
    items: [
      { key: "assoc.list", label: "عرض قائمة الجمعيات" },
      { key: "assoc.detail", label: "عرض تفاصيل جمعية" },
      { key: "assoc.evidence", label: "الاطلاع على الشواهد" },
      { key: "assoc.reopen", label: "إعادة فتح التقييم" },
      { key: "assoc.change_eval", label: "تغيير المقيم" },
      { key: "assoc.stop", label: "إيقاف تقييم" },
      { key: "assoc.archive", label: "أرشفة جهة" },
      { key: "assoc.export", label: "تصدير بيانات جمعية" },
      { key: "assoc.audit", label: "عرض سجل العمليات" },
    ],
  },
  {
    key: "evaluators", label: "إدارة المقيمين",
    items: [
      { key: "eval.list", label: "عرض قائمة المقيمين" },
      { key: "eval.add", label: "إضافة مقيم" },
      { key: "eval.edit", label: "تعديل بيانات مقيم" },
      { key: "eval.toggle", label: "إيقاف/تفعيل مقيم" },
      { key: "eval.distribute", label: "توزيع التقييمات" },
      { key: "eval.reassign", label: "إعادة إسناد تقييم" },
      { key: "eval.performance", label: "عرض أداء المقيم" },
    ],
  },
  {
    key: "eval_config", label: "تهيئة التقييم",
    items: [
      { key: "config.entities", label: "تعريف الجهات" },
      { key: "config.tracks", label: "تعريف المساقات" },
      { key: "config.years", label: "إدارة سنوات التقييم" },
      { key: "config.evaluate", label: "تقييم الجهات" },
    ],
  },
];

const allPermKeys = permissionGroups.flatMap((g) => g.items.map((i) => i.key));

const pageAccessList = [
  { key: "page.dashboard", label: "لوحة التحكم" },
  { key: "page.users", label: "إدارة المستخدمين" },
  { key: "page.roles", label: "إدارة الصلاحيات" },
  { key: "page.associations", label: "إدارة الجمعيات" },
  { key: "page.evaluators", label: "إدارة المقيمين" },
  { key: "page.eval_config", label: "تهيئة التقييم" },
  { key: "page.reports", label: "التقارير" },
  { key: "page.assoc_detail", label: "تفاصيل الجمعية" },
  { key: "page.eval_detail", label: "أداء المقيم" },
];

const allPageKeys = pageAccessList.map((p) => p.key);

/* ── role model ── */
interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Record<string, boolean>;
  pageAccess: Record<string, boolean>;
  lastModified: string;
}

const makePerms = (keys: string[], value: boolean) => Object.fromEntries(keys.map((k) => [k, value]));

const defaultRoles: Role[] = [
  { id: "r1", name: "مدير نظام", description: "صلاحية كاملة على جميع أجزاء النظام", permissions: makePerms(allPermKeys, true), pageAccess: makePerms(allPageKeys, true), lastModified: "2026-02-20" },
  { id: "r2", name: "مشرف مراجعة", description: "إدارة المقيمين والجمعيات ومتابعة التقييمات", permissions: { ...makePerms(allPermKeys, false), "dashboard.view": true, "reports.view": true, "assoc.list": true, "assoc.detail": true, "assoc.evidence": true, "eval.list": true, "eval.performance": true, "eval.distribute": true }, pageAccess: { ...makePerms(allPageKeys, false), "page.dashboard": true, "page.associations": true, "page.evaluators": true, "page.reports": true, "page.assoc_detail": true, "page.eval_detail": true }, lastModified: "2026-02-18" },
  { id: "r3", name: "مدقق", description: "الاطلاع على التقارير والشواهد فقط", permissions: { ...makePerms(allPermKeys, false), "dashboard.view": true, "reports.view": true, "assoc.list": true, "assoc.detail": true, "assoc.evidence": true }, pageAccess: { ...makePerms(allPageKeys, false), "page.dashboard": true, "page.reports": true, "page.associations": true, "page.assoc_detail": true }, lastModified: "2026-02-15" },
  { id: "r4", name: "منظمة", description: "وصول محدود لبيانات المنظمة فقط", permissions: { ...makePerms(allPermKeys, false), "dashboard.view": true }, pageAccess: { ...makePerms(allPageKeys, false), "page.dashboard": true }, lastModified: "2026-02-10" },
  { id: "r5", name: "فرد", description: "وصول أساسي للأفراد", permissions: makePerms(allPermKeys, false), pageAccess: { ...makePerms(allPageKeys, false), "page.dashboard": true }, lastModified: "2026-02-05" },
];

/* ── component ── */
const AdminRoles = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [selectedId, setSelectedId] = useState<string>("r1");
  const [search, setSearch] = useState("");

  /* dialogs */
  const [createOpen, setCreateOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createDesc, setCreateDesc] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);
  const [copyFromRole, setCopyFromRole] = useState("");

  const filteredRoles = useMemo(() =>
    roles.filter((r) => !search || r.name.includes(search)), [roles, search]);

  const selected = roles.find((r) => r.id === selectedId);

  /* handlers */
  const updateRole = (patch: Partial<Role>) => {
    setRoles((prev) => prev.map((r) => r.id === selectedId ? { ...r, ...patch, lastModified: new Date().toISOString().slice(0, 10) } : r));
  };

  const togglePerm = (key: string) => {
    if (!selected) return;
    updateRole({ permissions: { ...selected.permissions, [key]: !selected.permissions[key] } });
  };

  const toggleAllGroup = (group: PermGroup, value: boolean) => {
    if (!selected) return;
    const updated = { ...selected.permissions };
    group.items.forEach((i) => { updated[i.key] = value; });
    updateRole({ permissions: updated });
  };

  const togglePageAccess = (key: string) => {
    if (!selected) return;
    updateRole({ pageAccess: { ...selected.pageAccess, [key]: !selected.pageAccess[key] } });
  };

  const saveRole = () => {
    toast({ title: "تم حفظ التعديلات (تجريبيًا)" });
  };

  const createRole = () => {
    if (!createName.trim()) { toast({ title: "يرجى إدخال اسم الدور", variant: "destructive" }); return; }
    const newRole: Role = {
      id: `r${Date.now()}`, name: createName, description: createDesc,
      permissions: makePerms(allPermKeys, false), pageAccess: makePerms(allPageKeys, false),
      lastModified: new Date().toISOString().slice(0, 10),
    };
    setRoles((prev) => [...prev, newRole]);
    setSelectedId(newRole.id);
    setCreateOpen(false); setCreateName(""); setCreateDesc("");
    toast({ title: "تم إنشاء الدور (تجريبيًا)" });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.name === "مدير نظام") { toast({ title: "لا يمكن حذف دور مدير النظام", variant: "destructive" }); setDeleteTarget(null); return; }
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) setSelectedId(roles[0]?.id ?? "");
    toast({ title: "تم حذف الدور (تجريبيًا)" });
    setDeleteTarget(null);
  };

  const copyPermissions = () => {
    if (!copyFromRole || !selected) return;
    const source = roles.find((r) => r.id === copyFromRole);
    if (!source) return;
    updateRole({ permissions: { ...source.permissions }, pageAccess: { ...source.pageAccess } });
    setCopyFromRole("");
    toast({ title: `تم نسخ الصلاحيات من "${source.name}" (تجريبيًا)` });
  };

  const isGroupAllOn = (group: PermGroup) => selected ? group.items.every((i) => selected.permissions[i.key]) : false;

  return (
    <div dir="rtl" className="min-h-screen" style={{ background: "hsl(220,20%,97%)" }}>
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-6">
          {/* header */}
          <div>
            <h1 className="text-2xl font-hrsd-bold text-foreground">إدارة الصلاحيات</h1>
            <p className="text-sm text-muted-foreground font-hrsd mt-1">إنشاء الأدوار وتحديد الصلاحيات والتحكم في الوصول للصفحات</p>
          </div>

          {/* 2-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
            {/* RIGHT: Roles list */}
            <Card className="h-fit">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base font-hrsd-semibold">قائمة الأدوار</CardTitle>
                  <Badge variant="secondary" className="font-hrsd text-xs">{roles.length}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button size="sm" className="w-full gap-2 font-hrsd-medium" onClick={() => setCreateOpen(true)}>
                  إنشاء دور جديد <Plus className="h-4 w-4" />
                </Button>
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="ابحث عن دور..." className="pr-9 text-sm font-hrsd" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  {filteredRoles.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setSelectedId(r.id)}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-hrsd-medium transition-colors text-start w-full",
                        r.id === selectedId ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-muted"
                      )}
                    >
                      <ShieldCheck className="h-4 w-4 shrink-0" />
                      <span className="flex-1">{r.name}</span>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* LEFT: Role details */}
            {selected ? (
              <div className="space-y-5">
                <Tabs defaultValue="info" dir="rtl" className="space-y-5">
                  <TabsList className="bg-card border border-border h-auto p-1 gap-1 w-fit">
                    <TabsTrigger value="info" className="text-xs font-hrsd-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">بيانات الدور</TabsTrigger>
                    <TabsTrigger value="permissions" className="text-xs font-hrsd-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">الصلاحيات</TabsTrigger>
                    <TabsTrigger value="pages" className="text-xs font-hrsd-medium data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg px-4 py-2">التحكم في الوصول</TabsTrigger>
                  </TabsList>

                  {/* TAB 1: Role Info */}
                  <TabsContent value="info">
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base font-hrsd-semibold">بيانات الدور</CardTitle></CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-1.5">
                          <Label className="font-hrsd-medium text-sm">اسم الدور</Label>
                          <Input className="font-hrsd text-sm" value={selected.name} onChange={(e) => updateRole({ name: e.target.value })} />
                        </div>
                        <div className="grid gap-1.5">
                          <Label className="font-hrsd-medium text-sm">الوصف</Label>
                          <Textarea className="font-hrsd text-sm resize-none" rows={3} value={selected.description} onChange={(e) => updateRole({ description: e.target.value })} />
                        </div>
                        <p className="text-xs text-muted-foreground font-hrsd">آخر تعديل: {selected.lastModified}</p>
                        <div className="flex items-center gap-2 pt-2">
                          <Button size="sm" className="gap-2 font-hrsd-medium" onClick={saveRole}>
                            حفظ التعديلات <Save className="h-4 w-4" />
                          </Button>
                          <Button size="sm" variant="outline" className="gap-2 font-hrsd-medium text-destructive hover:text-destructive" onClick={() => setDeleteTarget(selected)}>
                            حذف الدور <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TAB 2: Permissions */}
                  <TabsContent value="permissions">
                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <CardTitle className="text-base font-hrsd-semibold">الصلاحيات</CardTitle>
                          <div className="flex items-center gap-2">
                            <Select value={copyFromRole} onValueChange={setCopyFromRole}>
                              <SelectTrigger className="w-44 text-xs font-hrsd h-8"><SelectValue placeholder="نسخ من دور آخر..." /></SelectTrigger>
                              <SelectContent align="end">
                                {roles.filter((r) => r.id !== selectedId).map((r) => (
                                  <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button size="sm" variant="outline" className="gap-1.5 font-hrsd-medium h-8 text-xs" disabled={!copyFromRole} onClick={copyPermissions}>
                              نسخ <Copy className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Accordion type="multiple" defaultValue={permissionGroups.map((g) => g.key)} className="space-y-2">
                          {permissionGroups.map((group) => (
                            <AccordionItem key={group.key} value={group.key} className="border rounded-xl px-4">
                              <AccordionTrigger className="py-3 hover:no-underline">
                                <div className="flex items-center gap-3 flex-1">
                                  <span className="text-sm font-hrsd-semibold">{group.label}</span>
                                  <Badge variant="outline" className="text-[10px] font-hrsd">
                                    {group.items.filter((i) => selected.permissions[i.key]).length}/{group.items.length}
                                  </Badge>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4 space-y-3">
                                <div className="flex items-center gap-2 pb-2 border-b border-border">
                                  <Switch
                                    checked={isGroupAllOn(group)}
                                    onCheckedChange={(v) => toggleAllGroup(group, v)}
                                    id={`all-${group.key}`}
                                  />
                                  <Label htmlFor={`all-${group.key}`} className="text-xs font-hrsd-medium text-primary cursor-pointer">تحديد الكل</Label>
                                </div>
                                {group.items.map((item) => (
                                  <div key={item.key} className="flex items-center justify-between">
                                    <Label htmlFor={item.key} className="text-sm font-hrsd cursor-pointer">{item.label}</Label>
                                    <Switch
                                      id={item.key}
                                      checked={!!selected.permissions[item.key]}
                                      onCheckedChange={() => togglePerm(item.key)}
                                    />
                                  </div>
                                ))}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                        <Button size="sm" className="mt-4 gap-2 font-hrsd-medium" onClick={saveRole}>
                          حفظ الصلاحيات <Save className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* TAB 3: Page Access */}
                  <TabsContent value="pages">
                    <Card>
                      <CardHeader className="pb-3"><CardTitle className="text-base font-hrsd-semibold">التحكم في الوصول للصفحات</CardTitle></CardHeader>
                      <CardContent className="space-y-3">
                        {pageAccessList.map((page) => (
                          <div key={page.key} className="flex items-center justify-between rounded-xl border border-border px-4 py-3">
                            <div className="flex items-center gap-3">
                              <Label htmlFor={page.key} className="text-sm font-hrsd-medium cursor-pointer">{page.label}</Label>
                              {!selected.pageAccess[page.key] && (
                                <span className="text-[10px] font-hrsd text-muted-foreground bg-muted px-2 py-0.5 rounded-full">مخفي عن هذا الدور</span>
                              )}
                            </div>
                            <Switch
                              id={page.key}
                              checked={!!selected.pageAccess[page.key]}
                              onCheckedChange={() => togglePageAccess(page.key)}
                            />
                          </div>
                        ))}
                        <Button size="sm" className="mt-2 gap-2 font-hrsd-medium" onClick={saveRole}>
                          حفظ إعدادات الوصول <Save className="h-4 w-4" />
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>
            ) : (
              <Card className="flex items-center justify-center h-64">
                <p className="text-muted-foreground font-hrsd">اختر دورًا من القائمة</p>
              </Card>
            )}
          </div>
        </main>
      </div>

      {/* Create Role Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-md font-hrsd" dir="rtl">
          <DialogHeader>
            <DialogTitle className="font-hrsd-bold">إنشاء دور جديد</DialogTitle>
            <DialogDescription>أدخل بيانات الدور الجديد</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-1.5">
              <Label className="font-hrsd-medium text-sm">اسم الدور *</Label>
              <Input className="font-hrsd text-sm" value={createName} onChange={(e) => setCreateName(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label className="font-hrsd-medium text-sm">وصف مختصر</Label>
              <Textarea className="font-hrsd text-sm resize-none" rows={2} value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} />
            </div>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCreateOpen(false)} className="font-hrsd-medium">إلغاء</Button>
            <Button onClick={createRole} className="font-hrsd-medium">حفظ</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Role AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={() => setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl" className="font-hrsd">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-hrsd-bold">حذف الدور</AlertDialogTitle>
            <AlertDialogDescription>سيتم حذف الدور "{deleteTarget?.name}" نهائيًا. هل تريد المتابعة؟</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="font-hrsd-medium">إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-hrsd-medium">حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminRoles;
