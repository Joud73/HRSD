import { useState, useMemo } from "react";
import {
  Plus, Pencil, Trash2, ChevronDown, ChevronLeft, Search, ArrowUp, ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
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
import { useToast } from "@/hooks/use-toast";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import { cn } from "@/lib/utils";

/* ── Types ── */
interface BandItem {
  id: string; name: string; description: string; evidenceType: string; isActive: boolean;
}
interface Indicator {
  id: string; name: string; isActive: boolean; items: BandItem[];
}
interface Criterion {
  id: string; name: string; isActive: boolean; indicators: Indicator[];
}
interface Masaaq {
  id: string; name: string; isActive: boolean; criteria: Criterion[];
}

type NodeLevel = "masaaq" | "criterion" | "indicator" | "item";
interface SelectedNode {
  level: NodeLevel;
  masaaqId: string;
  criterionId?: string;
  indicatorId?: string;
  itemId?: string;
}

/* ── Seed data ── */
const seedData: Masaaq[] = [
  {
    id: "m1", name: "مساق التوجه", isActive: true,
    criteria: [
      {
        id: "c1", name: "الرؤية والرسالة", isActive: true,
        indicators: [
          {
            id: "i1", name: "وضوح الرؤية", isActive: true,
            items: [
              { id: "b1", name: "وثيقة الرؤية", description: "وثيقة معتمدة", evidenceType: "ملف", isActive: true },
              { id: "b2", name: "رابط الموقع", description: "", evidenceType: "رابط", isActive: true },
            ],
          },
          { id: "i2", name: "توافق الرسالة", isActive: true, items: [] },
        ],
      },
      { id: "c2", name: "التخطيط الاستراتيجي", isActive: true, indicators: [] },
    ],
  },
  {
    id: "m2", name: "مساق الفريق", isActive: true,
    criteria: [
      { id: "c3", name: "الهيكل التنظيمي", isActive: true, indicators: [] },
    ],
  },
];

const evidenceTypes = ["ملف", "رابط", "نص"];

/* ── Component ── */
const AdminRubric = () => {
  const { toast } = useToast();
  const [masaaqat, setMasaaqat] = useState<Masaaq[]>(seedData);
  const [selectedMasaaqId, setSelectedMasaaqId] = useState<string>(seedData[0].id);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({ c1: true, i1: true });
  const [selected, setSelected] = useState<SelectedNode | null>(null);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLevel, setModalLevel] = useState<NodeLevel>("masaaq");
  const [modalParentIds, setModalParentIds] = useState<{ masaaqId?: string; criterionId?: string; indicatorId?: string }>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEvidence, setFormEvidence] = useState("ملف");
  const [formActive, setFormActive] = useState(true);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ level: NodeLevel; id: string; parentIds: typeof modalParentIds; childCount: number } | null>(null);

  const currentMasaaq = masaaqat.find((m) => m.id === selectedMasaaqId);

  /* ── Helpers ── */
  const toggle = (id: string) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const updateMasaaqat = (fn: (prev: Masaaq[]) => Masaaq[]) => setMasaaqat(fn);

  /* ── Get selected node data for details panel ── */
  const selectedData = useMemo(() => {
    if (!selected || !currentMasaaq) return null;
    if (selected.level === "masaaq") return { level: "masaaq" as const, data: currentMasaaq };
    const cr = currentMasaaq.criteria.find((c) => c.id === selected.criterionId);
    if (selected.level === "criterion") return cr ? { level: "criterion" as const, data: cr } : null;
    const ind = cr?.indicators.find((i) => i.id === selected.indicatorId);
    if (selected.level === "indicator") return ind ? { level: "indicator" as const, data: ind } : null;
    const item = ind?.items.find((b) => b.id === selected.itemId);
    if (selected.level === "item") return item ? { level: "item" as const, data: item } : null;
    return null;
  }, [selected, currentMasaaq, masaaqat]);

  /* ── CRUD ── */
  const openAddModal = (level: NodeLevel, parentIds: typeof modalParentIds) => {
    setEditId(null);
    setModalLevel(level);
    setModalParentIds(parentIds);
    setFormName("");
    setFormDesc("");
    setFormEvidence("ملف");
    setFormActive(true);
    setModalOpen(true);
  };

  const openEditModal = (level: NodeLevel, id: string, parentIds: typeof modalParentIds, data: { name: string; description?: string; evidenceType?: string; isActive: boolean }) => {
    setEditId(id);
    setModalLevel(level);
    setModalParentIds(parentIds);
    setFormName(data.name);
    setFormDesc(data.description || "");
    setFormEvidence(data.evidenceType || "ملف");
    setFormActive(data.isActive);
    setModalOpen(true);
  };

  const saveModal = () => {
    if (!formName.trim()) {
      toast({ title: "خطأ", description: "الاسم مطلوب", variant: "destructive" });
      return;
    }

    if (modalLevel === "masaaq") {
      if (editId) {
        updateMasaaqat((p) => p.map((m) => m.id === editId ? { ...m, name: formName.trim(), isActive: formActive } : m));
      } else {
        const nm: Masaaq = { id: crypto.randomUUID(), name: formName.trim(), isActive: formActive, criteria: [] };
        updateMasaaqat((p) => [...p, nm]);
        setSelectedMasaaqId(nm.id);
      }
    } else {
      updateMasaaqat((prev) =>
        prev.map((m) => {
          if (m.id !== (modalParentIds.masaaqId || selectedMasaaqId)) return m;
          if (modalLevel === "criterion") {
            if (editId) {
              return { ...m, criteria: m.criteria.map((c) => c.id === editId ? { ...c, name: formName.trim(), isActive: formActive } : c) };
            }
            return { ...m, criteria: [...m.criteria, { id: crypto.randomUUID(), name: formName.trim(), isActive: formActive, indicators: [] }] };
          }
          return {
            ...m,
            criteria: m.criteria.map((c) => {
              if (c.id !== modalParentIds.criterionId) return c;
              if (modalLevel === "indicator") {
                if (editId) {
                  return { ...c, indicators: c.indicators.map((i) => i.id === editId ? { ...i, name: formName.trim(), isActive: formActive } : i) };
                }
                return { ...c, indicators: [...c.indicators, { id: crypto.randomUUID(), name: formName.trim(), isActive: formActive, items: [] }] };
              }
              return {
                ...c,
                indicators: c.indicators.map((ind) => {
                  if (ind.id !== modalParentIds.indicatorId) return ind;
                  if (editId) {
                    return { ...ind, items: ind.items.map((b) => b.id === editId ? { ...b, name: formName.trim(), description: formDesc.trim(), evidenceType: formEvidence, isActive: formActive } : b) };
                  }
                  return { ...ind, items: [...ind.items, { id: crypto.randomUUID(), name: formName.trim(), description: formDesc.trim(), evidenceType: formEvidence, isActive: formActive }] };
                }),
              };
            }),
          };
        })
      );
    }

    toast({ title: editId ? "تم التحديث" : "تمت الإضافة" });
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { level, id, parentIds } = deleteTarget;

    if (level === "masaaq") {
      updateMasaaqat((p) => p.filter((m) => m.id !== id));
      if (selectedMasaaqId === id) {
        const remaining = masaaqat.filter((m) => m.id !== id);
        setSelectedMasaaqId(remaining[0]?.id || "");
      }
      setSelected(null);
    } else {
      updateMasaaqat((prev) =>
        prev.map((m) => {
          if (m.id !== (parentIds.masaaqId || selectedMasaaqId)) return m;
          if (level === "criterion") return { ...m, criteria: m.criteria.filter((c) => c.id !== id) };
          return {
            ...m,
            criteria: m.criteria.map((c) => {
              if (c.id !== parentIds.criterionId) return c;
              if (level === "indicator") return { ...c, indicators: c.indicators.filter((i) => i.id !== id) };
              return {
                ...c,
                indicators: c.indicators.map((ind) => {
                  if (ind.id !== parentIds.indicatorId) return ind;
                  return { ...ind, items: ind.items.filter((b) => b.id !== id) };
                }),
              };
            }),
          };
        })
      );
      if (selected && ((selected.criterionId === id) || (selected.indicatorId === id) || (selected.itemId === id))) {
        setSelected(null);
      }
    }

    toast({ title: "تم الحذف" });
    setDeleteTarget(null);
  };

  /* ── Reorder ── */
  const moveItem = (arr: any[], index: number, dir: -1 | 1) => {
    const newArr = [...arr];
    const target = index + dir;
    if (target < 0 || target >= newArr.length) return newArr;
    [newArr[index], newArr[target]] = [newArr[target], newArr[index]];
    return newArr;
  };

  const reorder = (level: NodeLevel, id: string, parentIds: typeof modalParentIds, dir: -1 | 1) => {
    updateMasaaqat((prev) =>
      prev.map((m) => {
        if (level === "criterion" && m.id === selectedMasaaqId) {
          const idx = m.criteria.findIndex((c) => c.id === id);
          return { ...m, criteria: moveItem(m.criteria, idx, dir) };
        }
        if (m.id !== selectedMasaaqId) return m;
        return {
          ...m,
          criteria: m.criteria.map((c) => {
            if (level === "indicator" && c.id === parentIds.criterionId) {
              const idx = c.indicators.findIndex((i) => i.id === id);
              return { ...c, indicators: moveItem(c.indicators, idx, dir) };
            }
            return {
              ...c,
              indicators: c.indicators.map((ind) => {
                if (level === "item" && ind.id === parentIds.indicatorId) {
                  const idx = ind.items.findIndex((b) => b.id === id);
                  return { ...ind, items: moveItem(ind.items, idx, dir) };
                }
                return ind;
              }),
            };
          }),
        };
      })
    );
  };

  /* ── Search filter ── */
  const matchesSearch = (name: string) => !search || name.includes(search);

  /* ── Level labels ── */
  const levelLabel: Record<NodeLevel, string> = { masaaq: "مساق", criterion: "معيار", indicator: "مؤشر", item: "بند" };

  /* ── Render tree ── */
  const renderTree = () => {
    if (!currentMasaaq) return <p className="text-sm font-hrsd text-muted-foreground p-4">اختر مساقاً</p>;

    const parentDisabled = !currentMasaaq.isActive;

    return (
      <div className="space-y-1">
        {/* Masaaq header */}
        <div
          className={cn(
            "flex items-center gap-2 rounded-lg px-3 py-2 cursor-pointer transition-colors",
            selected?.level === "masaaq" ? "bg-primary/10" : "hover:bg-muted"
          )}
          onClick={() => setSelected({ level: "masaaq", masaaqId: currentMasaaq.id })}
        >
          <span className="text-sm font-hrsd-semibold flex-1">{currentMasaaq.name}</span>
          {!currentMasaaq.isActive && <span className="text-[10px] font-hrsd text-destructive">موقوف</span>}
        </div>

        {/* Criteria */}
        {currentMasaaq.criteria.filter((c) => matchesSearch(c.name) || c.indicators.some((i) => matchesSearch(i.name) || i.items.some((b) => matchesSearch(b.name)))).map((cr, crIdx) => (
          <div key={cr.id} className={cn("ms-4", parentDisabled && "opacity-50 pointer-events-none")}>
            <div className="flex items-center gap-1">
              <button onClick={() => toggle(cr.id)} className="p-0.5">
                {expanded[cr.id] ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
              </button>
              <div
                className={cn(
                  "flex-1 flex items-center gap-2 rounded-lg px-2 py-1.5 cursor-pointer text-sm font-hrsd-medium transition-colors",
                  selected?.criterionId === cr.id && selected?.level === "criterion" ? "bg-primary/10" : "hover:bg-muted"
                )}
                onClick={() => setSelected({ level: "criterion", masaaqId: currentMasaaq.id, criterionId: cr.id })}
              >
                <span className="flex-1">{cr.name}</span>
                {!cr.isActive && <span className="text-[10px] font-hrsd text-destructive">موقوف</span>}
              </div>
              <div className="flex gap-0.5">
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorder("criterion", cr.id, {}, -1)}><ArrowUp className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => reorder("criterion", cr.id, {}, 1)}><ArrowDown className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => openEditModal("criterion", cr.id, { masaaqId: currentMasaaq.id }, cr)}><Pencil className="h-3 w-3" /></Button>
                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => setDeleteTarget({ level: "criterion", id: cr.id, parentIds: { masaaqId: currentMasaaq.id }, childCount: cr.indicators.length })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            </div>

            {expanded[cr.id] && (
              <div className="ms-5 mt-0.5 space-y-0.5">
                {cr.indicators.filter((i) => matchesSearch(i.name) || i.items.some((b) => matchesSearch(b.name))).map((ind, indIdx) => (
                  <div key={ind.id} className={cn(!cr.isActive && "opacity-50 pointer-events-none")}>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggle(ind.id)} className="p-0.5">
                        {expanded[ind.id] ? <ChevronDown className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
                      </button>
                      <div
                        className={cn(
                          "flex-1 flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer text-xs font-hrsd transition-colors",
                          selected?.indicatorId === ind.id && selected?.level === "indicator" ? "bg-primary/10" : "hover:bg-muted"
                        )}
                        onClick={() => setSelected({ level: "indicator", masaaqId: currentMasaaq.id, criterionId: cr.id, indicatorId: ind.id })}
                      >
                        <span className="flex-1">{ind.name}</span>
                        {!ind.isActive && <span className="text-[10px] font-hrsd text-destructive">موقوف</span>}
                      </div>
                      <div className="flex gap-0.5">
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => reorder("indicator", ind.id, { criterionId: cr.id }, -1)}><ArrowUp className="h-2.5 w-2.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => reorder("indicator", ind.id, { criterionId: cr.id }, 1)}><ArrowDown className="h-2.5 w-2.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => openEditModal("indicator", ind.id, { masaaqId: currentMasaaq.id, criterionId: cr.id }, ind)}><Pencil className="h-2.5 w-2.5" /></Button>
                        <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setDeleteTarget({ level: "indicator", id: ind.id, parentIds: { masaaqId: currentMasaaq.id, criterionId: cr.id }, childCount: ind.items.length })}><Trash2 className="h-2.5 w-2.5" /></Button>
                      </div>
                    </div>

                    {expanded[ind.id] && (
                      <div className="ms-5 mt-0.5 space-y-0.5">
                        {ind.items.filter((b) => matchesSearch(b.name)).map((band, bIdx) => (
                          <div key={band.id} className={cn("flex items-center gap-1", !ind.isActive && "opacity-50 pointer-events-none")}>
                            <div
                              className={cn(
                                "flex-1 flex items-center gap-2 rounded-lg px-2 py-1 cursor-pointer text-xs font-hrsd transition-colors",
                                selected?.itemId === band.id && selected?.level === "item" ? "bg-primary/10" : "hover:bg-muted"
                              )}
                              onClick={() => setSelected({ level: "item", masaaqId: currentMasaaq.id, criterionId: cr.id, indicatorId: ind.id, itemId: band.id })}
                            >
                              <span className="flex-1">{band.name}</span>
                              <span className="text-[10px] text-muted-foreground">{band.evidenceType}</span>
                              {!band.isActive && <span className="text-[10px] font-hrsd text-destructive">موقوف</span>}
                            </div>
                            <div className="flex gap-0.5">
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => reorder("item", band.id, { criterionId: cr.id, indicatorId: ind.id }, -1)}><ArrowUp className="h-2.5 w-2.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => reorder("item", band.id, { criterionId: cr.id, indicatorId: ind.id }, 1)}><ArrowDown className="h-2.5 w-2.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => openEditModal("item", band.id, { masaaqId: currentMasaaq.id, criterionId: cr.id, indicatorId: ind.id }, band)}><Pencil className="h-2.5 w-2.5" /></Button>
                              <Button size="icon" variant="ghost" className="h-5 w-5" onClick={() => setDeleteTarget({ level: "item", id: band.id, parentIds: { masaaqId: currentMasaaq.id, criterionId: cr.id, indicatorId: ind.id }, childCount: 0 })}><Trash2 className="h-2.5 w-2.5" /></Button>
                            </div>
                          </div>
                        ))}
                        {ind.items.length === 0 && (
                          <p className="text-[11px] font-hrsd text-muted-foreground ps-2">لا توجد بنود</p>
                        )}
                        <Button size="sm" variant="ghost" className="h-6 text-[11px] gap-1 font-hrsd" onClick={() => openAddModal("item", { masaaqId: currentMasaaq.id, criterionId: cr.id, indicatorId: ind.id })}>
                          <Plus className="h-3 w-3" /> إضافة بند
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
                {cr.indicators.length === 0 && (
                  <p className="text-[11px] font-hrsd text-muted-foreground ps-2">لا توجد مؤشرات</p>
                )}
                <Button size="sm" variant="ghost" className="h-6 text-[11px] gap-1 font-hrsd" onClick={() => openAddModal("indicator", { masaaqId: currentMasaaq.id, criterionId: cr.id })}>
                  <Plus className="h-3 w-3" /> إضافة مؤشر
                </Button>
              </div>
            )}
          </div>
        ))}
        {currentMasaaq.criteria.length === 0 && (
          <p className="text-xs font-hrsd text-muted-foreground ps-6">لا توجد معايير</p>
        )}
        <Button size="sm" variant="ghost" className="h-7 text-xs gap-1 font-hrsd ms-4" onClick={() => openAddModal("criterion", { masaaqId: currentMasaaq.id })}>
          <Plus className="h-3.5 w-3.5" /> إضافة معيار
        </Button>
      </div>
    );
  };

  /* ── Details panel ── */
  const renderDetails = () => {
    if (!selectedData) {
      return <p className="text-sm font-hrsd text-muted-foreground text-center py-10">اختر عنصراً لعرض تفاصيله</p>;
    }
    const d = selectedData.data as any;
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-hrsd-semibold">{levelLabel[selectedData.level]}: {d.name}</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-hrsd-medium mb-1">الاسم</label>
            <p className="text-sm font-hrsd bg-muted/50 rounded-lg px-3 py-2">{d.name}</p>
          </div>
          {d.description !== undefined && (
            <div>
              <label className="block text-xs font-hrsd-medium mb-1">الوصف</label>
              <p className="text-sm font-hrsd bg-muted/50 rounded-lg px-3 py-2">{d.description || "—"}</p>
            </div>
          )}
          {d.evidenceType && (
            <div>
              <label className="block text-xs font-hrsd-medium mb-1">نوع الدليل</label>
              <p className="text-sm font-hrsd bg-muted/50 rounded-lg px-3 py-2">{d.evidenceType}</p>
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="text-xs font-hrsd-medium">الحالة:</label>
            <span className={cn("text-xs font-hrsd", d.isActive ? "text-emerald-600" : "text-destructive")}>
              {d.isActive ? "مفعّل" : "موقوف"}
            </span>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button size="sm" onClick={() => {
            if (!selected) return;
            const pIds = { masaaqId: selected.masaaqId, criterionId: selected.criterionId, indicatorId: selected.indicatorId };
            const id = selected.level === "masaaq" ? selected.masaaqId : selected.level === "criterion" ? selected.criterionId! : selected.level === "indicator" ? selected.indicatorId! : selected.itemId!;
            openEditModal(selected.level, id, pIds, d);
          }}>
            <Pencil className="h-3.5 w-3.5 me-1" /> تعديل
          </Button>
          <Button size="sm" variant="outline" className="text-destructive" onClick={() => {
            if (!selected) return;
            const pIds = { masaaqId: selected.masaaqId, criterionId: selected.criterionId, indicatorId: selected.indicatorId };
            const id = selected.level === "masaaq" ? selected.masaaqId : selected.level === "criterion" ? selected.criterionId! : selected.level === "indicator" ? selected.indicatorId! : selected.itemId!;
            const cc = selected.level === "masaaq" ? currentMasaaq!.criteria.length : selected.level === "criterion" ? (currentMasaaq!.criteria.find((c) => c.id === selected.criterionId)?.indicators.length || 0) : selected.level === "indicator" ? (currentMasaaq!.criteria.find((c) => c.id === selected.criterionId)?.indicators.find((i) => i.id === selected.indicatorId)?.items.length || 0) : 0;
            setDeleteTarget({ level: selected.level, id, parentIds: pIds, childCount: cc });
          }}>
            <Trash2 className="h-3.5 w-3.5 me-1" /> حذف
          </Button>
        </div>
      </div>
    );
  };

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-[hsl(220,20%,97%)]">
      <AdminHeader />
      <div className="flex flex-1 overflow-hidden">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto px-8 py-7 space-y-7">
          <div>
            <h1 className="text-xl font-hrsd-title text-foreground">تهيئة نموذج التقييم</h1>
            <p className="text-sm font-hrsd text-muted-foreground mt-1">
              إدارة هيكل التقييم: المساقات والمعايير والمؤشرات والبنود
            </p>
          </div>

          {/* Top controls */}
          <div className="flex items-center gap-3 flex-wrap">
            <Select value={selectedMasaaqId} onValueChange={setSelectedMasaaqId}>
              <SelectTrigger className="w-52 text-sm font-hrsd-medium">
                <SelectValue placeholder="اختر مساق" />
              </SelectTrigger>
              <SelectContent>
                {masaaqat.map((m) => (
                  <SelectItem key={m.id} value={m.id}>{m.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button size="sm" className="gap-1" onClick={() => openAddModal("masaaq", {})}>
              <Plus className="h-4 w-4" /> إضافة مساق
            </Button>
            <div className="relative flex-1 max-w-xs ms-auto">
              <Search className="absolute start-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="بحث..." value={search} onChange={(e) => setSearch(e.target.value)} className="ps-9 text-sm font-hrsd" />
            </div>
          </div>

          {/* 2-column layout */}
          {masaaqat.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-10 text-center shadow-sm">
              <p className="text-sm font-hrsd text-muted-foreground mb-3">لا توجد مساقات</p>
              <Button size="sm" onClick={() => openAddModal("masaaq", {})}>إضافة مساق</Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-5">
              {/* Right (wide) — Tree */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm overflow-y-auto max-h-[70vh]">
                {renderTree()}
              </div>
              {/* Left (narrow) — Details */}
              <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
                <h3 className="text-xs font-hrsd-semibold text-muted-foreground mb-3">تفاصيل العنصر</h3>
                {renderDetails()}
              </div>
            </div>
          )}

          {/* Add / Edit Modal */}
          <Dialog open={modalOpen} onOpenChange={setModalOpen}>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="font-hrsd-semibold">
                  {editId ? `تعديل ${levelLabel[modalLevel]}` : `إضافة ${levelLabel[modalLevel]}`}
                </DialogTitle>
                <DialogDescription className="font-hrsd text-sm">
                  {editId ? "تعديل البيانات" : "أدخل بيانات العنصر الجديد"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div>
                  <label className="block text-sm font-hrsd-medium mb-1">الاسم *</label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="font-hrsd" />
                </div>
                {modalLevel === "item" && (
                  <>
                    <div>
                      <label className="block text-sm font-hrsd-medium mb-1">الوصف</label>
                      <Input value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="font-hrsd" />
                    </div>
                    <div>
                      <label className="block text-sm font-hrsd-medium mb-1">نوع الدليل</label>
                      <Select value={formEvidence} onValueChange={setFormEvidence}>
                        <SelectTrigger className="font-hrsd"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {evidenceTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </>
                )}
                <div className="flex items-center gap-3">
                  <Switch checked={formActive} onCheckedChange={setFormActive} />
                  <span className="text-sm font-hrsd">{formActive ? "مفعّل" : "موقوف"}</span>
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
                <Button onClick={saveModal}>حفظ</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>

          {/* Delete Confirm */}
          <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
            <AlertDialogContent dir="rtl">
              <AlertDialogHeader>
                <AlertDialogTitle className="font-hrsd-semibold">تأكيد الحذف</AlertDialogTitle>
                <AlertDialogDescription className="font-hrsd">
                  {deleteTarget?.childCount ? `سيتم حذف هذا العنصر وجميع العناصر الفرعية (${deleteTarget.childCount}). هل أنت متأكد؟` : "هل أنت متأكد من حذف هذا العنصر؟"}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter className="gap-2 sm:gap-0">
                <AlertDialogCancel className="font-hrsd">إلغاء</AlertDialogCancel>
                <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 font-hrsd">حذف</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </main>
      </div>
    </div>
  );
};

export default AdminRubric;
