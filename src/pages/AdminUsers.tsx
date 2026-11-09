import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Ban, CheckCircle2, KeyRound, Plus, Users } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminUsers, type AdminUserRow } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import { FieldShell, TextField } from "@/components/shared/FormField";
import { RowActionsTrigger, SearchField, Toolbar } from "@/components/admin/AdminParts";
import { dialogUi } from "@/components/admin/adminUi";

type DbRole = "admin" | "supervisor" | "evaluator" | "organization";
type StatusFilter = "all" | "active" | "disabled";

const roleOptions: DbRole[] = ["admin", "supervisor", "evaluator", "organization"];

const emptyForm = { email: "", role: "evaluator" as DbRole, organization_name: "", registration_number: "" };

const roleLabel = (role: string) => adminCopy.roles_map[role] ?? adminCopy.role_unknown;

const AdminUsers = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading } = useAdminUsers();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formFields, setFormFields] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState<{ email?: string; org?: string; registration?: string }>({});
  const [saving, setSaving] = useState(false);

  const [toggleTarget, setToggleTarget] = useState<AdminUserRow | null>(null);
  const [resetTarget, setResetTarget] = useState<AdminUserRow | null>(null);

  const filtered = useMemo(() =>
    users.filter((u) => {
      if (roleFilter !== "all" && u.role !== roleFilter) return false;
      if (statusFilter === "active" && u.status !== "active") return false;
      if (statusFilter === "disabled" && u.status === "active") return false;
      if (search && !u.email.includes(search) && !u.organization_name?.includes(search)) return false;
      return true;
    }), [users, roleFilter, statusFilter, search]);

  const active = users.filter((u) => u.status === "active").length;
  const filtersOn = search !== "" || roleFilter !== "all" || statusFilter !== "all";
  const clearFilters = () => { setSearch(""); setRoleFilter("all"); setStatusFilter("all"); };

  const openAdd = () => { setFormFields(emptyForm); setFormErrors({}); setFormOpen(true); };

  const saveForm = async () => {
    if (!formFields.email) {
      setFormErrors({ email: adminCopy.users_error_email });
      return;
    }
    if (formFields.role === "organization" && !formFields.organization_name.trim()) {
      setFormErrors({ org: adminCopy.users_error_org });
      return;
    }
    if (formFields.role === "organization" && !formFields.registration_number.trim()) {
      setFormErrors({ registration: adminCopy.users_error_registration });
      return;
    }
    setFormErrors({});
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-user", {
        body: {
          email: formFields.email,
          role: formFields.role,
          organization_name: formFields.role === "organization" ? formFields.organization_name || null : null,
          registration_number: formFields.role === "organization" ? formFields.registration_number || null : null,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast({ title: adminCopy.users_created, description: adminCopy.invite_sent_note });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setFormOpen(false);
    } catch (err: unknown) {
      toast({ title: adminCopy.users_create_failed, description: err instanceof Error ? err.message : undefined, variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const confirmToggle = async () => {
    if (!toggleTarget) return;
    const newStatus = toggleTarget.status === "active" ? "profile_incomplete" : "active";
    const { error } = await supabase.from("profiles").update({ status: newStatus }).eq("id", toggleTarget.id);
    if (error) {
      toast({ title: adminCopy.error_title, description: error.message, variant: "destructive" });
    } else {
      toast({ title: newStatus === "active" ? adminCopy.users_enabled : adminCopy.users_disabled });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
    setToggleTarget(null);
  };

  const confirmReset = async () => {
    if (!resetTarget) return;
    const { error } = await supabase.auth.resetPasswordForEmail(resetTarget.email, {
      redirectTo: `${window.location.origin}/set-password`,
    });
    if (error) {
      toast({ title: adminCopy.error_title, description: error.message, variant: "destructive" });
    } else {
      toast({ title: adminCopy.users_reset_sent });
    }
    setResetTarget(null);
  };

  const columns: Column<AdminUserRow>[] = [
    {
      key: "email",
      header: adminCopy.col_email,
      cell: (u) => <span dir="ltr" className="font-hrsd-medium">{u.email}</span>,
    },
    { key: "role", header: adminCopy.col_role, cell: (u) => roleLabel(u.role) },
    {
      key: "org",
      header: adminCopy.col_org,
      cell: (u) => <span className="text-muted-foreground">{u.organization_name || "—"}</span>,
    },
    {
      key: "status",
      header: adminCopy.col_account_status,
      // Account state is not an assessment state: plain text, not a status badge
      cell: (u) => (
        <span className={cn("inline-flex items-center gap-2", u.status === "active" ? "text-ink" : "text-muted-foreground")}>
          <span aria-hidden className={cn("h-1.5 w-1.5 rounded-full", u.status === "active" ? "bg-primary" : "bg-neutral")} />
          {u.statusAr}
        </span>
      ),
    },
    {
      key: "created",
      header: adminCopy.col_created_at,
      cell: (u) => <span className="tabular whitespace-nowrap text-muted-foreground">{formatDate(u.created_at)}</span>,
    },
    {
      key: "actions",
      header: <span className="sr-only">{adminCopy.actions_label}</span>,
      align: "end",
      className: "w-16",
      cell: (u) => (
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <RowActionsTrigger />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem className="gap-2 text-small" onSelect={() => setToggleTarget(u)}>
              {u.status === "active" ? (
                <><Ban aria-hidden className="h-4 w-4" /> {adminCopy.users_disable}</>
              ) : (
                <><CheckCircle2 aria-hidden className="h-4 w-4" /> {adminCopy.users_enable}</>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-small" onSelect={() => setResetTarget(u)}>
              <KeyRound aria-hidden className="h-4 w-4" /> {adminCopy.users_reset}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const disabling = toggleTarget?.status === "active";

  return (
    <>
      <PageHeader
        title={copy.nav_admin.users}
        description={adminCopy.users_desc}
        breadcrumbs={[{ label: adminCopy.breadcrumb_root, to: "/admin" }, { label: copy.nav_admin.users }]}
        actions={
          <Button onClick={openAdd}>
            <Plus aria-hidden /> {adminCopy.users_add}
          </Button>
        }
      />

      <Toolbar>
        <SearchField value={search} onChange={setSearch} placeholder={adminCopy.users_search} />
        <Select value={roleFilter} onValueChange={setRoleFilter} dir="rtl">
          <SelectTrigger className="h-10 w-full text-small sm:w-44" aria-label={adminCopy.users_role_filter}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{adminCopy.users_role_all}</SelectItem>
            {roleOptions.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
          </SelectContent>
        </Select>
        <SegmentedControl
          label={adminCopy.users_status_filter}
          value={statusFilter}
          onChange={setStatusFilter}
          options={[
            { value: "all", label: copy.filter_all, count: users.length },
            { value: "active", label: adminCopy.users_status_active, count: active },
            { value: "disabled", label: adminCopy.users_status_disabled, count: users.length - active },
          ]}
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        getRowKey={(u) => u.id}
        caption={copy.nav_admin.users}
        empty={
          filtersOn ? (
            <EmptyState message={adminCopy.no_results} action={{ label: adminCopy.clear_filters, onClick: clearFilters }} />
          ) : (
            <EmptyState icon={Users} message={adminCopy.users_empty} action={{ label: adminCopy.users_add, onClick: openAdd }} />
          )
        }
      />

      {/* Create user */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className={dialogUi.content} dir="rtl">
          <DialogHeader className={dialogUi.header}>
            <DialogTitle className={dialogUi.title}>{adminCopy.users_form_title}</DialogTitle>
            <DialogDescription className={dialogUi.description}>{adminCopy.users_form_desc}</DialogDescription>
          </DialogHeader>
          <form
            id="create-user-form"
            className={dialogUi.body}
            noValidate
            onSubmit={(e) => { e.preventDefault(); saveForm(); }}
          >
            <TextField
              label={adminCopy.users_form_email}
              type="email"
              dir="ltr"
              required
              autoComplete="off"
              placeholder="name@example.com"
              value={formFields.email}
              error={formErrors.email}
              onChange={(e) => setFormFields((p) => ({ ...p, email: e.target.value }))}
            />
            <FieldShell id="create-user-role" label={adminCopy.users_form_role}>
              <Select value={formFields.role} onValueChange={(v) => setFormFields((p) => ({ ...p, role: v as DbRole }))} dir="rtl">
                <SelectTrigger id="create-user-role" className="h-12 text-body"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => <SelectItem key={r} value={r}>{roleLabel(r)}</SelectItem>)}
                </SelectContent>
              </Select>
            </FieldShell>
            {formFields.role === "organization" && (
              <>
                <TextField
                  label={adminCopy.users_form_org}
                  required
                  value={formFields.organization_name}
                  error={formErrors.org}
                  onChange={(e) => setFormFields((p) => ({ ...p, organization_name: e.target.value }))}
                />
                <TextField
                  label={adminCopy.users_form_registration}
                  required
                  error={formErrors.registration}
                  inputMode="numeric"
                  value={formFields.registration_number}
                  onChange={(e) => setFormFields((p) => ({ ...p, registration_number: e.target.value }))}
                />
              </>
            )}
          </form>
          <DialogFooter className={dialogUi.footer}>
            <Button type="submit" form="create-user-form" disabled={saving}>
              {adminCopy.users_form_submit}
            </Button>
            <Button variant="outline" onClick={() => setFormOpen(false)}>{adminCopy.cancel}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Enable / disable */}
      <AlertDialog open={!!toggleTarget} onOpenChange={(open) => !open && setToggleTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className={dialogUi.header}>
            <AlertDialogTitle className={dialogUi.title}>
              {disabling ? adminCopy.users_disable_title : adminCopy.users_enable_title}
            </AlertDialogTitle>
            <AlertDialogDescription className={dialogUi.description}>
              {disabling ? adminCopy.users_disable_desc : adminCopy.users_enable_desc}
              <span className="mt-2 block font-hrsd-medium text-ink"><bdi dir="ltr">{toggleTarget?.email}</bdi></span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dialogUi.footer}>
            <AlertDialogAction onClick={confirmToggle} className={cn(disabling && dialogUi.danger)}>
              {disabling ? adminCopy.users_disable_confirm : adminCopy.users_enable_confirm}
            </AlertDialogAction>
            <AlertDialogCancel>{adminCopy.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset password */}
      <AlertDialog open={!!resetTarget} onOpenChange={(open) => !open && setResetTarget(null)}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader className={dialogUi.header}>
            <AlertDialogTitle className={dialogUi.title}>{adminCopy.users_reset_title}</AlertDialogTitle>
            <AlertDialogDescription className={dialogUi.description}>
              {adminCopy.users_reset_desc}
              <span className="mt-2 block font-hrsd-medium text-ink"><bdi dir="ltr">{resetTarget?.email}</bdi></span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className={dialogUi.footer}>
            <AlertDialogAction onClick={confirmReset}>{adminCopy.users_reset_confirm}</AlertDialogAction>
            <AlertDialogCancel>{adminCopy.cancel}</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminUsers;
