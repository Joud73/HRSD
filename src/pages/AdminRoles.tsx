import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search, ShieldCheck, Trash2 } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
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
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { FieldShell, TextField } from "@/components/shared/FormField";
import { Panel } from "@/components/admin/AdminParts";
import { dialogUi, tabsUi } from "@/components/admin/adminUi";

/* ── permission model ── */
interface PermGroup {
  key: keyof typeof adminCopy.perm_groups;
  label: string;
  items: { key: string; label: string }[];
}

const group = (key: PermGroup["key"], itemKeys: string[]): PermGroup => ({
  key,
  label: adminCopy.perm_groups[key],
  items: itemKeys.map((k) => ({ key: k, label: adminCopy.perms[k] })),
});

const permissionGroups: PermGroup[] = [
  group("dashboard", ["dashboard.view", "reports.view", "reports.export", "reports.share", "reports.download"]),
  group("management", ["users.view", "users.create", "users.edit", "users.disable", "users.reset_password", "roles.view", "roles.edit"]),
  group("associations", ["assoc.list", "assoc.detail", "assoc.evidence", "assoc.reopen", "assoc.change_eval", "assoc.stop", "assoc.archive", "assoc.export", "assoc.audit"]),
  group("evaluators", ["eval.list", "eval.add", "eval.edit", "eval.toggle", "eval.distribute", "eval.reassign", "eval.performance"]),
  group("eval_config", ["config.entities", "config.tracks", "config.years", "config.evaluate"]),
];

const allPermKeys = permissionGroups.flatMap((g) => g.items.map((i) => i.key));

const pageAccessList = Object.entries(adminCopy.pages_access).map(([key, label]) => ({ key, label }));

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

const seed = adminCopy.seed_roles;

const defaultRoles: Role[] = [
  { id: "r1", ...seed.r1, permissions: makePerms(allPermKeys, true), pageAccess: makePerms(allPageKeys, true), lastModified: "2026-02-20" },
  { id: "r2", ...seed.r2, permissions: { ...makePerms(allPermKeys, false), "dashboard.view": true, "reports.view": true, "assoc.list": true, "assoc.detail": true, "assoc.evidence": true, "eval.list": true, "eval.performance": true, "eval.distribute": true }, pageAccess: { ...makePerms(allPageKeys, false), "page.dashboard": true, "page.associations": true, "page.evaluators": true, "page.reports": true, "page.assoc_detail": true, "page.eval_detail": true }, lastModified: "2026-02-18" },
  { id: "r3", ...seed.r3, permissions: { ...makePerms(allPermKeys, false), "dashboard.view": true, "reports.view": true, "assoc.list": true, "assoc.detail": true, "assoc.evidence": true }, pageAccess: { ...makePerms(allPageKeys, false), "page.dashboard": true, "page.reports": true, "page.associations": true, "page.assoc_detail": true }, lastModified: "2026-02-15" },
  { id: "r4", ...seed.r4, permissions: { ...makePerms(allPermKeys, false), "dashboard.view": true }, pageAccess: { ...makePerms(allPageKeys, false), "page.dashboard": true }, lastModified: "2026-02-10" },
  { id: "r5", ...seed.r5, permissions: makePerms(allPermKeys, false), pageAccess: { ...makePerms(allPageKeys, false), "page.dashboard": true }, lastModified: "2026-02-05" },
];

/** Switch row: label at the start, switch at the end. */
const SwitchRow = ({ id, label, checked, onChange, aside }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void; aside?: ReactNode }) => (
  <div className="flex min-h-12 items-center justify-between gap-4 py-2">
    <div className="flex min-w-0 flex-wrap items-center gap-2">
      <Label htmlFor={id} className="cursor-pointer text-small font-hrsd-regular text-ink">{label}</Label>
      {aside}
    </div>
    <Switch id={id} checked={checked} onCheckedChange={onChange} />
  </div>
);

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
  const [createError, setCreateError] = useState<string | undefined>();
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

  const toggleAllGroup = (g: PermGroup, value: boolean) => {
    if (!selected) return;
    const updated = { ...selected.permissions };
    g.items.forEach((i) => { updated[i.key] = value; });
    updateRole({ permissions: updated });
  };

  const togglePageAccess = (key: string) => {
    if (!selected) return;
    updateRole({ pageAccess: { ...selected.pageAccess, [key]: !selected.pageAccess[key] } });
  };

  const saveRole = () => {
    toast({ title: adminCopy.roles_saved, description: adminCopy.demo_suffix });
  };

  const openCreate = () => { setCreateError(undefined); setCreateOpen(true); };

  const createRole = () => {
    if (!createName.trim()) { setCreateError(adminCopy.roles_error_name); return; }
    const newRole: Role = {
      id: `r${Date.now()}`, name: createName, description: createDesc,
      permissions: makePerms(allPermKeys, false), pageAccess: makePerms(allPageKeys, false),
      lastModified: new Date().toISOString().slice(0, 10),
    };
    setRoles((prev) => [...prev, newRole]);
    setSelectedId(newRole.id);
    setCreateOpen(false); setCreateName(""); setCreateDesc(""); setCreateError(undefined);
    toast({ title: adminCopy.roles_created, description: adminCopy.demo_suffix });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    if (deleteTarget.name === seed.r1.name) { toast({ title: adminCopy.roles_delete_blocked, variant: "destructive" }); setDeleteTarget(null); return; }
    setRoles((prev) => prev.filter((r) => r.id !== deleteTarget.id));
    if (selectedId === deleteTarget.id) setSelectedId(roles[0]?.id ?? "");
    toast({ title: adminCopy.roles_deleted, description: adminCopy.demo_suffix });
    setDeleteTarget(null);
  };

  const copyPermissions = () => {
    if (!copyFromRole || !selected) return;
    const source = roles.find((r) => r.id === copyFromRole);
    if (!source) return;
    updateRole({ permissions: { ...source.permissions }, pageAccess: { ...source.pageAccess } });
    setCopyFromRole("");
    toast({ title: `${adminCopy.roles_copied} ${source.name}`, description: adminCopy.demo_suffix });
  };

  const isGroupAllOn = (g: PermGroup) => selected ? g.items.every((i) => selected.permissions[i.key]) : false;

  return (
    <>
      <PageHeader
        title={copy.nav_admin.roles}
        description={adminCopy.roles_desc}
        breadcrumbs={[{ label: adminCopy.breadcrumb_root, to: "/admin" }, { label: copy.nav_admin.roles }]}
        actions={
          <Button onClick={openCreate}>
            <Plus aria-hidden /> {adminCopy.roles_add}
          </Button>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Roles list */}
        <Panel
          title={adminCopy.roles_list_title}
          aside={<span className="tabular text-small text-muted-foreground">{formatNumber(roles.length)}</span>}
          bodyClassName="flex flex-col gap-3 p-4"
        >
          <div className="relative">
            <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              placeholder={adminCopy.roles_search}
              aria-label={adminCopy.roles_search}
              className="h-10 ps-9 text-small"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {filteredRoles.length === 0 ? (
            <p className="px-2 py-4 text-small text-muted-foreground">{adminCopy.roles_empty}</p>
          ) : (
            <ul className="flex flex-col gap-1">
              {filteredRoles.map((r) => {
                const active = r.id === selectedId;
                return (
                  <li key={r.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(r.id)}
                      aria-current={active ? "true" : undefined}
                      className={cn(
                        "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-small transition-colors duration-micro active:scale-[0.98]",
                        active ? "bg-primary/10 font-hrsd-bold text-primary" : "font-hrsd-medium text-ink hover:bg-section-alt"
                      )}
                    >
                      <ShieldCheck aria-hidden className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                      <span className="flex-1 truncate">{r.name}</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* Role details */}
        {selected ? (
          <div className="flex min-w-0 flex-col">
            <div className="mb-2 flex flex-col gap-1">
              <h2 className="text-h2 text-ink">{selected.name}</h2>
              {selected.description && <p className="text-body text-muted-foreground">{selected.description}</p>}
            </div>
            <Tabs defaultValue="info" dir="rtl">
              <TabsList className={tabsUi.list}>
                <TabsTrigger value="info" className={tabsUi.trigger}>{adminCopy.roles_tab_info}</TabsTrigger>
                <TabsTrigger value="permissions" className={tabsUi.trigger}>{adminCopy.roles_tab_permissions}</TabsTrigger>
                <TabsTrigger value="pages" className={tabsUi.trigger}>{adminCopy.roles_tab_pages}</TabsTrigger>
              </TabsList>

              {/* Role info */}
              <TabsContent value="info" className={tabsUi.content}>
                <Panel>
                  <div className="flex flex-col gap-5">
                    <TextField
                      label={adminCopy.roles_name}
                      value={selected.name}
                      onChange={(e) => updateRole({ name: e.target.value })}
                    />
                    <FieldShell id="role-description" label={adminCopy.roles_description}>
                      <Textarea
                        id="role-description"
                        className="resize-none text-body"
                        rows={3}
                        value={selected.description}
                        onChange={(e) => updateRole({ description: e.target.value })}
                      />
                    </FieldShell>
                    <p className="text-caption text-muted-foreground">
                      {adminCopy.roles_last_modified}: <span className="tabular">{formatDate(selected.lastModified)}</span>
                    </p>
                    <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
                      <Button onClick={saveRole}>{adminCopy.roles_save}</Button>
                      <Button
                        variant="outline"
                        className="border-danger/40 text-danger hover:bg-danger/5 hover:text-danger"
                        onClick={() => setDeleteTarget(selected)}
                      >
                        <Trash2 aria-hidden /> {adminCopy.roles_delete}
                      </Button>
                    </div>
                  </div>
                </Panel>
              </TabsContent>

              {/* Permissions */}
              <TabsContent value="permissions" className={tabsUi.content}>
                <Panel
                  title={adminCopy.roles_tab_permissions}
                  aside={
                    <div className="flex flex-wrap items-center gap-2">
                      <Select value={copyFromRole} onValueChange={setCopyFromRole} dir="rtl">
                        <SelectTrigger className="h-10 w-48 text-small" aria-label={adminCopy.roles_copy_from}>
                          <SelectValue placeholder={adminCopy.roles_copy_from} />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.filter((r) => r.id !== selectedId).map((r) => (
                            <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button variant="outline" disabled={!copyFromRole} onClick={copyPermissions}>
                        {adminCopy.roles_copy_action}
                      </Button>
                    </div>
                  }
                >
                  <Accordion type="multiple" defaultValue={permissionGroups.map((g) => g.key)} className="flex flex-col gap-3">
                    {permissionGroups.map((g) => {
                      const on = g.items.filter((i) => selected.permissions[i.key]).length;
                      return (
                        <AccordionItem key={g.key} value={g.key} className="rounded-lg border border-border">
                          <AccordionTrigger className="gap-3 px-5 py-4 text-start hover:no-underline">
                            <span className="flex flex-1 items-center gap-3">
                              <span className="text-body font-hrsd-bold text-ink">{g.label}</span>
                              <span className="tabular text-small text-muted-foreground">
                                {formatNumber(on)} / {formatNumber(g.items.length)}
                              </span>
                            </span>
                          </AccordionTrigger>
                          <AccordionContent className="px-5 pb-3">
                            <div className="flex flex-col divide-y divide-border">
                              <SwitchRow
                                id={`all-${g.key}`}
                                label={adminCopy.roles_select_all}
                                checked={isGroupAllOn(g)}
                                onChange={(v) => toggleAllGroup(g, v)}
                              />
                              {g.items.map((item) => (
                                <SwitchRow
                                  key={item.key}
                                  id={item.key}
                                  label={item.label}
                                  checked={!!selected.permissions[item.key]}
                                  onChange={() => togglePerm(item.key)}
                                />
                              ))}
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      );
                    })}
                  </Accordion>
                  <div className="mt-6 border-t border-border pt-5">
                    <Button onClick={saveRole}>{adminCopy.roles_save_permissions}</Button>
                  </div>
                </Panel>
              </TabsContent>

              {/* Page access */}
              <TabsContent value="pages" className={tabsUi.content}>
                <Panel title={adminCopy.roles_tab_pages}>
                  <div className="flex flex-col divide-y divide-border">
                    {pageAccessList.map((page) => (
                      <SwitchRow
                        key={page.key}
                        id={page.key}
                        label={page.label}
                        checked={!!selected.pageAccess[page.key]}
                        onChange={() => togglePageAccess(page.key)}
                        aside={
                          !selected.pageAccess[page.key] && (
                            <span className="text-caption text-muted-foreground">{adminCopy.roles_hidden}</span>
                          )
                        }
                      />
                    ))}
                  </div>
                  <div className="mt-6 border-t border-border pt-5">
                    <Button onClick={saveRole}>{adminCopy.roles_save_pages}</Button>
                  </div>
                </Panel>
              </TabsContent>
            </Tabs>
          </div>
        ) : (
          <Panel>
            <EmptyState icon={ShieldCheck} message={adminCopy.roles_select} />
          </Panel>
        )}
      </div>

      {/* Create role */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className={dialogUi.content} dir="rtl">
          <DialogHeader className={dialogUi.header}>
            <DialogTitle className={dialogUi.title}>{adminCopy.roles_create_title}</DialogTitle>
            <DialogDescription className={dialogUi.description}>{adminCopy.roles_create_desc}</DialogDescription>
          </DialogHeader>
          <form
            id="create-role-form"
            className={dialogUi.body}
            noValidate
            onSubmit={(e) => { e.preventDefault(); createRole(); }}
          >
            <TextField
              label={adminCopy.roles_name}
              required
              value={createName}
              error={createError}
              onChange={(e) => setCreateName(e.target.value)}
            />
            <FieldShell id="create-role-desc" label={adminCopy.roles_create_desc_label}>
              <Textarea
                id="create-role-desc"
                className="resize-none text-body"
                rows={2}
                value={createDesc}
                onChange={(e) => setCreateDesc(e.target.value)}
              />
            </FieldShell>
          </form>
          <DialogFooter className={dialogUi.footer}>
            <Button type="submit" form="create-role-form">{adminCopy.roles_create_submit}</Button>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>{adminCopy.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete role */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className={dialogUi.header}>
            <AlertDialogTitle className={dialogUi.title}>{adminCopy.roles_delete_title}</AlertDialogTitle>
            <AlertDialogDescription className={dialogUi.description}>
              {adminCopy.roles_delete_desc}
              <span className="mt-2 block font-hrsd-medium text-ink">{deleteTarget?.name}</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dialogUi.footer}>
            <AlertDialogAction onClick={confirmDelete} className={dialogUi.danger}>{adminCopy.roles_delete_confirm}</AlertDialogAction>
            <AlertDialogCancel>{adminCopy.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminRoles;
