import { useMemo, useState } from "react";
import { Building2, Pencil, Plus } from "lucide-react";
import { copy, adminSetupCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import { FieldShell, TextField } from "@/components/shared/FormField";
import SearchInput from "@/components/admin/setup/SearchInput";
import { FormDialog, fieldRowClass } from "@/components/admin/setup/SetupDialogs";
import { crumbs } from "@/components/admin/setup/crumbs";
import { entitySeed, type EntityType } from "@/components/admin/setup/entities";

type ActiveFilter = "all" | "active" | "inactive";

const AdminEntities = () => {
  const { toast } = useToast();
  const [entities, setEntities] = useState<EntityType[]>(entitySeed);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<ActiveFilter>("all");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<EntityType | null>(null);
  const [formName, setFormName] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [nameError, setNameError] = useState<string | undefined>();

  const searched = useMemo(
    () => entities.filter((e) => e.name.includes(search) || e.description.includes(search)),
    [entities, search]
  );
  const filtered = useMemo(
    () => searched.filter((e) => activeFilter === "all" || (activeFilter === "active" ? e.isActive : !e.isActive)),
    [searched, activeFilter]
  );

  const openAdd = () => {
    setEditTarget(null);
    setFormName("");
    setFormDesc("");
    setFormActive(true);
    setNameError(undefined);
    setModalOpen(true);
  };

  const openEdit = (e: EntityType) => {
    setEditTarget(e);
    setFormName(e.name);
    setFormDesc(e.description);
    setFormActive(e.isActive);
    setNameError(undefined);
    setModalOpen(true);
  };

  const save = () => {
    if (!formName.trim()) {
      setNameError(t.error_name_required);
      return;
    }
    const duplicate = entities.find((e) => e.name === formName.trim() && e.id !== editTarget?.id);
    if (duplicate) {
      setNameError(t.entities_duplicate);
      return;
    }

    if (editTarget) {
      setEntities((prev) =>
        prev.map((e) =>
          e.id === editTarget.id ? { ...e, name: formName.trim(), description: formDesc.trim(), isActive: formActive } : e
        )
      );
      toast({ title: t.toast_updated });
    } else {
      const newEntity: EntityType = {
        id: crypto.randomUUID(),
        name: formName.trim(),
        description: formDesc.trim(),
        isActive: formActive,
      };
      setEntities((prev) => [...prev, newEntity]);
      toast({ title: t.toast_added });
    }
    setModalOpen(false);
  };

  const toggleActive = (id: string) => {
    setEntities((prev) => prev.map((e) => (e.id === id ? { ...e, isActive: !e.isActive } : e)));
  };

  const columns: Column<EntityType>[] = [
    { key: "name", header: t.name, cell: (e) => <span className="font-hrsd-medium text-ink">{e.name}</span> },
    {
      key: "desc",
      header: t.description,
      cell: (e) => <span className="text-muted-foreground">{e.description || "—"}</span>,
    },
    {
      key: "status",
      header: t.status,
      cell: (e) => (
        <label className="inline-flex cursor-pointer items-center gap-3">
          <Switch checked={e.isActive} onCheckedChange={() => toggleActive(e.id)} aria-label={`${t.entities_toggle}: ${e.name}`} />
          <span className={e.isActive ? "text-ink" : "text-muted-foreground"}>{e.isActive ? t.active : t.inactive}</span>
        </label>
      ),
    },
    {
      key: "actions",
      header: <span className="sr-only">{t.actions}</span>,
      align: "end",
      className: "w-16",
      cell: (e) => (
        <Button size="icon" variant="ghost" onClick={() => openEdit(e)} aria-label={`${t.entities_edit_aria}: ${e.name}`}>
          <Pencil aria-hidden />
        </Button>
      ),
    },
  ];

  const filterOptions: { value: ActiveFilter; label: string; count: number }[] = [
    { value: "all", label: copy.filter_all, count: searched.length },
    { value: "active", label: t.active, count: searched.filter((e) => e.isActive).length },
    { value: "inactive", label: t.inactive, count: searched.filter((e) => !e.isActive).length },
  ];

  return (
    <>
      <PageHeader
        title={t.entities_title}
        description={t.entities_desc}
        breadcrumbs={crumbs.entities}
        actions={
          <Button onClick={openAdd}>
            <Plus aria-hidden /> {t.entities_add}
          </Button>
        }
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput value={search} onChange={setSearch} placeholder={t.entities_search} />
        <SegmentedControl
          label={t.entities_filter_label}
          value={activeFilter}
          onChange={setActiveFilter}
          options={filterOptions}
        />
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        getRowKey={(e) => e.id}
        caption={`${t.entities_title} (${formatNumber(filtered.length)})`}
        empty={
          entities.length === 0 ? (
            <EmptyState icon={Building2} message={t.entities_empty_all} action={{ label: t.entities_add, onClick: openAdd }} />
          ) : (
            <EmptyState icon={Building2} message={t.entities_empty} action={{ label: t.reset_filters, onClick: () => { setSearch(""); setActiveFilter("all"); } }} />
          )
        }
      />

      <FormDialog
        open={modalOpen}
        onOpenChange={setModalOpen}
        title={editTarget ? t.entities_dialog_edit : t.entities_dialog_add}
        description={t.entities_dialog_desc}
        onSubmit={save}
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
        <TextField label={t.description} value={formDesc} onChange={(e) => setFormDesc(e.target.value)} />
        <FieldShell id="entity-active" label={t.activation}>
          <div className={fieldRowClass}>
            <span className="text-small text-ink">{formActive ? t.active : t.inactive}</span>
            <Switch id="entity-active" checked={formActive} onCheckedChange={setFormActive} />
          </div>
        </FieldShell>
      </FormDialog>
    </>
  );
};

export default AdminEntities;
