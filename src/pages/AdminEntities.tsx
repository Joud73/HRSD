import { useState, useMemo } from "react";
import { Plus, Pencil, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";

interface EntityType {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
}

const seed: EntityType[] = [
  { id: "1", name: "جمعية", description: "جمعية أهلية مسجلة", isActive: true },
  { id: "2", name: "مؤسسة أهلية", description: "مؤسسة أهلية غير ربحية", isActive: true },
  { id: "3", name: "جمعية تعاونية", description: "", isActive: false },
];

const AdminEntities = () => {
  const { toast } = useToast();
  const [entities, setEntities] = useState<EntityType[]>(seed);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EntityType | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);

  const filtered = useMemo(
    () => entities.filter((e) => e.name.includes(search) || e.description.includes(search)),
    [entities, search]
  );

  const openAdd = () => {
    setEditTarget(null);
    setFormName("");
    setFormDesc("");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEdit = (e: EntityType) => {
    setEditTarget(e);
    setFormName(e.name);
    setFormDesc(e.description);
    setFormActive(e.isActive);
    setModalOpen(true);
  };

  const save = () => {
    if (!formName.trim()) {
      toast({ title: "خطأ", description: "اسم الكيان مطلوب", variant: "destructive" });
      return;
    }
    const duplicate = entities.find(
      (e) => e.name === formName.trim() && e.id !== editTarget?.id
    );
    if (duplicate) {
      toast({ title: "خطأ", description: "يوجد كيان بهذا الاسم", variant: "destructive" });
      return;
    }

    if (editTarget) {
      setEntities((prev) =>
        prev.map((e) =>
          e.id === editTarget.id
            ? { ...e, name: formName.trim(), description: formDesc.trim(), isActive: formActive }
            : e
        )
      );
      toast({ title: "تم التحديث" });
    } else {
      const newEntity: EntityType = {
        id: crypto.randomUUID(),
        name: formName.trim(),
        description: formDesc.trim(),
        isActive: formActive,
      };
      setEntities((prev) => [...prev, newEntity]);
      toast({ title: "تمت الإضافة" });
    }
    setModalOpen(false);
  };

  const toggleActive = (id: string) => {
    setEntities((prev) =>
      prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e))
    );
  };

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          <div>
            <h1 className="text-xl font-hrsd-title text-foreground">تعريف الكيانات الأهلية</h1>
            <p className="text-sm font-hrsd text-muted-foreground mt-1">
              إدارة أنواع الكيانات المستخدمة في عملية التقييم
            </p>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between gap-3">
            <div className="relative w-64">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ابحث عن كيان..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="ps-9 text-sm font-hrsd"
              />
            </div>
            <Button size="sm" onClick={openAdd} className="gap-2">
              <Plus className="h-4 w-4" /> إضافة كيان
            </Button>
          </div>

          {/* Table */}
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            {filtered.length === 0 ? (
              <div className="p-10 text-center text-sm font-hrsd text-muted-foreground">
                لا توجد كيانات
                <br />
                <Button size="sm" variant="outline" className="mt-3" onClick={openAdd}>
                  إضافة كيان جديد
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right font-hrsd-medium">الاسم</TableHead>
                    <TableHead className="text-right font-hrsd-medium">الوصف</TableHead>
                    <TableHead className="text-right font-hrsd-medium">الحالة</TableHead>
                    <TableHead className="text-right font-hrsd-medium">إجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((e) => (
                    <TableRow key={e.id}>
                      <TableCell className="font-hrsd-medium text-sm">{e.name}</TableCell>
                      <TableCell className="text-sm font-hrsd text-muted-foreground">
                        {e.description || "—"}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={e.isActive}
                          onCheckedChange={() => toggleActive(e.id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Button size="icon" variant="ghost" onClick={() => openEdit(e)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {/* Add / Edit Modal */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="font-hrsd-semibold">
                  {editTarget ? "تعديل كيان" : "إضافة كيان جديد"}
                </DialogTitle>
                <DialogDescription className="font-hrsd text-sm">
                  {editTarget ? "تعديل بيانات الكيان" : "أدخل بيانات الكيان الجديد"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-hrsd-medium mb-1">الاسم *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="font-hrsd" />
                </div>
                <div>
                  <label className="block text-sm font-hrsd-medium mb-1">الوصف</label>
                  <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="font-hrsd" />
                </div>
                <div className="flex items-center gap-3">
                  <Switch checked={formActive} onCheckedChange={setFormActive} />
                  <span className="text-sm font-hrsd">{formActive ? "مفعّل" : "موقوف"}</span>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
                <Button onClick={save}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </main>
      </div>
    </div>
  );
};

export default AdminEntities;
