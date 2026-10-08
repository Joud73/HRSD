import { useMemo, useState } from "react";
import { ListTree, Plus } from "lucide-react";
import { adminSetupCopy as t } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { FieldShell, TextField } from "@/components/shared/FormField";
import SearchInput from "@/components/admin/setup/SearchInput";
import RubricTree from "@/components/admin/setup/RubricTree";
import { ConfirmDelete, FormDialog, fieldRowClass } from "@/components/admin/setup/SetupDialogs";
import { crumbs } from "@/components/admin/setup/crumbs";
import { counted, rubricSeed, type NodeLevel, type ParentIds, type Track } from "@/components/admin/setup/rubric";

const evidenceTypes: readonly string[] = t.rubric_evidence_types;

const moveItem = <T,>(arr: T[], index: number, dir: -1 | 1): T[] => {
  const next = [...arr];
  const target = index + dir;
  if (index < 0 || target < 0 || target >= next.length) return next;
  [next[index], next[target]] = [next[target], next[index]];
  return next;
};

const AdminRubric = () => {
  const { toast } = useToast();
  const [tracks, setTracks] = useState<Track[]>(rubricSeed);
  const [openIds, setOpenIds] = useState<string[]>([rubricSeed[0]?.id, rubricSeed[0]?.standards[1]?.id, "i1"].filter(Boolean) as string[]);
  const [search, setSearch] = useState("");

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLevel, setModalLevel] = useState<NodeLevel>("track");
  const [modalParentIds, setModalParentIds] = useState<ParentIds>({});
  const [editId, setEditId] = useState<string | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formEvidence, setFormEvidence] = useState(evidenceTypes[0]);
  const [formActive, setFormActive] = useState(true);
  const [nameError, setNameError] = useState<string | undefined>();

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<{ level: NodeLevel; id: string; parentIds: ParentIds; childCount: number } | null>(null);

  /* ── Every node id, so a search shows its matches expanded ── */
  const allIds = useMemo(
    () => tracks.flatMap((tr) => [tr.id, ...tr.standards.flatMap((s) => [s.id, ...s.indicators.map((i) => i.id)])]),
    [tracks]
  );

  const totals = useMemo(() => {
    const standards = tracks.flatMap((tr) => tr.standards);
    const indicators = standards.flatMap((s) => s.indicators);
    return {
      tracks: tracks.length,
      standards: standards.length,
      indicators: indicators.length,
      items: indicators.reduce((n, i) => n + i.items.length, 0),
    };
  }, [tracks]);

  const hasMatches = useMemo(() => {
    if (!search) return true;
    return tracks.some(
      (tr) =>
        tr.name.includes(search) ||
        tr.standards.some(
          (s) => s.name.includes(search) || s.indicators.some((i) => i.name.includes(search) || i.items.some((b) => b.name.includes(search)))
        )
    );
  }, [tracks, search]);

  /* ── CRUD ── */
  const openAddModal = (level: NodeLevel, parentIds: ParentIds) => {
    setEditId(null);
    setModalLevel(level);
    setModalParentIds(parentIds);
    setFormName("");
    setFormDesc("");
    setFormEvidence(evidenceTypes[0]);
    setFormActive(true);
    setNameError(undefined);
    setModalOpen(true);
  };

  const openEditModal = (
    level: NodeLevel,
    id: string,
    parentIds: ParentIds,
    data: { name: string; description?: string; evidenceType?: string; isActive: boolean }
  ) => {
    setEditId(id);
    setModalLevel(level);
    setModalParentIds(parentIds);
    setFormName(data.name);
    setFormDesc(data.description || "");
    setFormEvidence(data.evidenceType || evidenceTypes[0]);
    setFormActive(data.isActive);
    setNameError(undefined);
    setModalOpen(true);
  };

  const saveModal = () => {
    if (!formName.trim()) {
      setNameError(t.error_name_required);
      return;
    }
    const name = formName.trim();

    if (modalLevel === "track") {
      if (editId) {
        setTracks((p) => p.map((m) => (m.id === editId ? { ...m, name, isActive: formActive } : m)));
      } else {
        const nt: Track = { id: crypto.randomUUID(), name, isActive: formActive, standards: [] };
        setTracks((p) => [...p, nt]);
        setOpenIds((p) => [...p, nt.id]);
      }
    } else {
      setTracks((prev) =>
        prev.map((m) => {
          if (m.id !== modalParentIds.trackId) return m;
          if (modalLevel === "standard") {
            if (editId) {
              return { ...m, standards: m.standards.map((c) => (c.id === editId ? { ...c, name, isActive: formActive } : c)) };
            }
            return { ...m, standards: [...m.standards, { id: crypto.randomUUID(), name, isActive: formActive, indicators: [] }] };
          }
          return {
            ...m,
            standards: m.standards.map((c) => {
              if (c.id !== modalParentIds.standardId) return c;
              if (modalLevel === "indicator") {
                if (editId) {
                  return { ...c, indicators: c.indicators.map((i) => (i.id === editId ? { ...i, name, isActive: formActive } : i)) };
                }
                return { ...c, indicators: [...c.indicators, { id: crypto.randomUUID(), name, isActive: formActive, items: [] }] };
              }
              return {
                ...c,
                indicators: c.indicators.map((ind) => {
                  if (ind.id !== modalParentIds.indicatorId) return ind;
                  if (editId) {
                    return {
                      ...ind,
                      items: ind.items.map((b) =>
                        b.id === editId ? { ...b, name, description: formDesc.trim(), evidenceType: formEvidence, isActive: formActive } : b
                      ),
                    };
                  }
                  return {
                    ...ind,
                    items: [...ind.items, { id: crypto.randomUUID(), name, description: formDesc.trim(), evidenceType: formEvidence, isActive: formActive }],
                  };
                }),
              };
            }),
          };
        })
      );
    }

    toast({ title: editId ? t.toast_updated : t.toast_added });
    setModalOpen(false);
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const { level, id, parentIds } = deleteTarget;

    if (level === "track") {
      setTracks((p) => p.filter((m) => m.id !== id));
    } else {
      setTracks((prev) =>
        prev.map((m) => {
          if (m.id !== parentIds.trackId) return m;
          if (level === "standard") return { ...m, standards: m.standards.filter((c) => c.id !== id) };
          return {
            ...m,
            standards: m.standards.map((c) => {
              if (c.id !== parentIds.standardId) return c;
              if (level === "indicator") return { ...c, indicators: c.indicators.filter((i) => i.id !== id) };
              return {
                ...c,
                indicators: c.indicators.map((ind) => (ind.id !== parentIds.indicatorId ? ind : { ...ind, items: ind.items.filter((b) => b.id !== id) })),
              };
            }),
          };
        })
      );
    }

    toast({ title: t.toast_deleted });
    setDeleteTarget(null);
  };

  /* ── Reorder ── */
  const reorder = (level: NodeLevel, id: string, parentIds: ParentIds, dir: -1 | 1) => {
    setTracks((prev) =>
      prev.map((m) => {
        if (m.id !== parentIds.trackId) return m;
        if (level === "standard") {
          return { ...m, standards: moveItem(m.standards, m.standards.findIndex((c) => c.id === id), dir) };
        }
        return {
          ...m,
          standards: m.standards.map((c) => {
            if (c.id !== parentIds.standardId) return c;
            if (level === "indicator") {
              return { ...c, indicators: moveItem(c.indicators, c.indicators.findIndex((i) => i.id === id), dir) };
            }
            return {
              ...c,
              indicators: c.indicators.map((ind) =>
                level === "item" && ind.id === parentIds.indicatorId
                  ? { ...ind, items: moveItem(ind.items, ind.items.findIndex((b) => b.id === id), dir) }
                  : ind
              ),
            };
          }),
        };
      })
    );
  };

  const deleteDescription = deleteTarget?.childCount
    ? `${t.rubric_delete_desc_children}. ${t.delete_irreversible}`
    : `${t.rubric_delete_desc} ${t.delete_irreversible}`;

  const c = t.rubric_count;

  return (
    <>
      <PageHeader
        title={t.rubric_title}
        description={t.rubric_desc}
        breadcrumbs={crumbs.rubric}
        actions={
          <Button onClick={() => openAddModal("track", {})}>
            <Plus aria-hidden /> {t.rubric_add_track}
          </Button>
        }
        meta={
          tracks.length > 0 ? (
            <p className="tabular text-small text-muted-foreground">
              {counted(totals.tracks, c.tracks)} · {counted(totals.standards, c.standards)} · {counted(totals.indicators, c.indicators)} ·{" "}
              {counted(totals.items, c.items)}
            </p>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={t.rubric_search} className="sm:w-96" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {tracks.length === 0 ? (
          <EmptyState icon={ListTree} message={t.rubric_empty} action={{ label: t.rubric_add_track, onClick: () => openAddModal("track", {}) }} />
        ) : !hasMatches ? (
          <EmptyState icon={ListTree} message={t.rubric_no_match} action={{ label: t.rubric_clear_search, onClick: () => setSearch("") }} />
        ) : (
          <RubricTree
            tracks={tracks}
            search={search}
            openIds={search ? allIds : openIds}
            onOpenChange={setOpenIds}
            onAdd={openAddModal}
            onEdit={openEditModal}
            onDelete={(level, id, parentIds, childCount) => setDeleteTarget({ level, id, parentIds, childCount })}
            onMove={reorder}
          />
        )}
      </div>

      <FormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editId ? t.rubric_edit[modalLevel] : t.rubric_add[modalLevel]}
        description={editId ? t.rubric_dialog_desc_edit : t.rubric_dialog_desc_add}
        onSubmit={saveModal}
      >
        <TextField
          label={t.name}
          required
          value={formName}
          onChange={(e) => {
            setFormName(e.target.value);
            if (nameError) setNameError(undefined);
          }}
          error={nameError}
          autoFocus
        />
        {modalLevel === "item" && (
          <>
            <TextField label={t.description} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
            <FieldShell id="rubric-evidence" label={t.rubric_evidence_type}>
              <Select value={formEvidence} onValueChange={setFormEvidence} dir="rtl">
                <SelectTrigger id="rubric-evidence" className="h-12 text-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {evidenceTypes.map((et) => (
                    <SelectItem key={et} value={et}>
                      {et}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
          </>
        )}
        <FieldShell id="rubric-active" label={t.activation}>
          <div className={fieldRowClass}>
            <span className="text-small text-ink">{formActive ? t.active : t.inactive}</span>
            <Switch id="rubric-active" checked={formActive} onCheckedChange={setFormActive} />
          </div>
        </FieldShell>
      </FormDialog>

      <ConfirmDelete
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={t.rubric_delete_title}
        description={deleteDescription}
        onConfirm={confirmDelete}
      />
    </>
  );
};

export default AdminRubric;
