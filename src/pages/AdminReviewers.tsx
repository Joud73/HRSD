import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeftRight, Eye, Shuffle, UserCheck } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAdminAssociations, useAdminEvaluators, type EvaluatorRow } from "@/hooks/useAdminData";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import PageHeader from "@/components/shared/PageHeader";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import SegmentedControl from "@/components/shared/SegmentedControl";
import { FieldShell, FormError } from "@/components/shared/FormField";
import { RowActionsTrigger, SearchField, Toolbar } from "@/components/admin/AdminParts";
import ExportMenu from "@/components/admin/ExportMenu";
import { dialogUi } from "@/components/admin/adminUi";

type LoadFilter = "all" | "with" | "without";

const AdminReviewers = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: evaluators, isLoading } = useAdminEvaluators();
  const { data: associations } = useAdminAssociations();

  const [search, setSearch] = useState("");
  const [loadFilter, setLoadFilter] = useState<LoadFilter>("all");

  // Dialogs
  const [distOpen, setDistOpen] = useState(false);
  const [reassignOpen, setReassignOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Distribution form
  const [distEvaluator, setDistEvaluator] = useState("");
  const [distAssociation, setDistAssociation] = useState("");
  const [distYear, setDistYear] = useState(String(new Date().getFullYear()));
  const [distLoading, setDistLoading] = useState(false);

  // Reassign form
  const [reassignAssignment, setReassignAssignment] = useState("");
  const [reassignTo, setReassignTo] = useState("");
  const [reassignLoading, setReassignLoading] = useState(false);

  const searched = useMemo(() => {
    return (evaluators || []).filter((r) => {
      if (search && !r.email.includes(search) && !(r.organization_name || "").includes(search)) return false;
      return true;
    });
  }, [evaluators, search]);

  const withCount = searched.filter((r) => r.assignedCount > 0).length;
  const filtered = searched.filter((r) =>
    loadFilter === "all" ? true : loadFilter === "with" ? r.assignedCount > 0 : r.assignedCount === 0
  );
  const filtersOn = search !== "" || loadFilter !== "all";

  const openAssign = () => { setFormError(null); setDistOpen(true); };
  const openReassign = () => { setFormError(null); setReassignOpen(true); };

  const createAssignment = async () => {
    if (!distEvaluator || !distAssociation || !distYear) {
      setFormError(adminCopy.assign_error);
      return;
    }
    setFormError(null);
    setDistLoading(true);
    // Look up organization_id from profile
    const { data: prof } = await supabase
      .from("profiles")
      .select("organization_id")
      .eq("id", distAssociation)
      .single();
    const { error } = await supabase.from("evaluator_assignments").insert({
      evaluator_id: distEvaluator,
      association_id: distAssociation,
      organization_id: prof?.organization_id || null,
      year: Number(distYear),
      status: "not_started",
      completion_percentage: 0,
    });
    setDistLoading(false);
    if (error) {
      toast({ title: adminCopy.error_title, description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-evaluators"] });
    queryClient.invalidateQueries({ queryKey: ["admin-associations"] });
    queryClient.invalidateQueries({ queryKey: ["admin-dashboard-stats"] });
    setDistOpen(false);
    setDistEvaluator("");
    setDistAssociation("");
    toast({ title: adminCopy.assign_done });
  };

  const executeReassign = async () => {
    if (!reassignAssignment || !reassignTo) {
      setFormError(adminCopy.reassign_error);
      return;
    }
    setFormError(null);
    setReassignLoading(true);
    const { error } = await supabase
      .from("evaluator_assignments")
      .update({ evaluator_id: reassignTo })
      .eq("id", reassignAssignment);
    setReassignLoading(false);
    if (error) {
      toast({ title: adminCopy.error_title, description: error.message, variant: "destructive" });
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["admin-evaluators"] });
    queryClient.invalidateQueries({ queryKey: ["admin-associations"] });
    setReassignOpen(false);
    setReassignAssignment("");
    setReassignTo("");
    toast({ title: adminCopy.reassign_done });
  };

  // Unassigned associations for the distribution dialog
  const unassignedAssociations = useMemo(() => {
    return (associations || []).filter((a) => !a.assignment_id);
  }, [associations]);

  // Active assignments for reassign dialog
  const activeAssignments = useMemo(() => {
    return (associations || []).filter((a) => a.assignment_id);
  }, [associations]);

  const columns: Column<EvaluatorRow>[] = [
    {
      key: "email",
      header: adminCopy.col_evaluator,
      cell: (r) => (
        <div className="flex flex-col items-start">
          <span dir="ltr" className="font-hrsd-medium">{r.email}</span>
          {r.organization_name && <span className="text-caption text-muted-foreground">{r.organization_name}</span>}
        </div>
      ),
    },
    { key: "assigned", header: adminCopy.col_assigned_count, cell: (r) => <span className="tabular">{formatNumber(r.assignedCount)}</span> },
    { key: "completed", header: adminCopy.col_completed_count, cell: (r) => <span className="tabular">{formatNumber(r.completedCount)}</span> },
    { key: "progress", header: adminCopy.col_in_progress_count, cell: (r) => <span className="tabular">{formatNumber(r.inProgressCount)}</span> },
    {
      key: "actions",
      header: <span className="sr-only">{adminCopy.actions_label}</span>,
      align: "end",
      className: "w-16",
      cell: (r) => (
        <DropdownMenu dir="rtl">
          <DropdownMenuTrigger asChild>
            <RowActionsTrigger />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[200px]">
            <DropdownMenuItem className="gap-2 text-small" onSelect={() => navigate(`/admin/reviewers/${r.id}`)}>
              <Eye aria-hidden className="h-4 w-4" /> {adminCopy.reviewers_view}
            </DropdownMenuItem>
            <DropdownMenuItem className="gap-2 text-small" onSelect={openReassign}>
              <ArrowLeftRight aria-hidden className="h-4 w-4" /> {adminCopy.reviewers_reassign}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const evaluatorOptions = (evaluators || []).map((r) => (
    <SelectItem key={r.id} value={r.id}><bdi dir="ltr">{r.email}</bdi></SelectItem>
  ));

  return (
    <>
      <PageHeader
        title={copy.nav_admin.reviewers}
        description={adminCopy.reviewers_desc}
        breadcrumbs={[{ label: adminCopy.breadcrumb_root, to: "/admin" }, { label: copy.nav_admin.reviewers }]}
        actions={
          <>
            <Button onClick={openAssign}>
              <Shuffle aria-hidden /> {adminCopy.reviewers_assign}
            </Button>
            <ExportMenu print={false} />
          </>
        }
      />

      <Toolbar>
        <SearchField value={search} onChange={setSearch} placeholder={adminCopy.reviewers_search} />
        <SegmentedControl
          label={adminCopy.reviewers_filter}
          value={loadFilter}
          onChange={setLoadFilter}
          options={[
            { value: "all", label: copy.filter_all, count: searched.length },
            { value: "with", label: adminCopy.reviewers_with, count: withCount },
            { value: "without", label: adminCopy.reviewers_without, count: searched.length - withCount },
          ]}
        />
      </Toolbar>

      <DataTable
        columns={columns}
        rows={filtered}
        loading={isLoading}
        getRowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/admin/reviewers/${r.id}`)}
        rowLabel={(r) => `${adminCopy.reviewers_view}: ${r.email}`}
        caption={copy.nav_admin.reviewers}
        empty={
          filtersOn ? (
            <EmptyState
              message={adminCopy.no_results}
              action={{ label: adminCopy.clear_filters, onClick: () => { setSearch(""); setLoadFilter("all"); } }}
            />
          ) : (
            <EmptyState icon={UserCheck} message={adminCopy.reviewers_empty} action={{ label: adminCopy.reviewers_empty_action, to: "/admin/users" }} />
          )
        }
      />

      {/* Assign */}
      <Dialog open={distOpen} onOpenChange={setDistOpen}>
        <DialogContent dir="rtl" className={dialogUi.content}>
          <DialogHeader className={dialogUi.header}>
            <DialogTitle className={dialogUi.title}>{adminCopy.assign_title}</DialogTitle>
            <DialogDescription className={dialogUi.description}>{adminCopy.assign_desc}</DialogDescription>
          </DialogHeader>
          <div className={dialogUi.body}>
            <FormError message={formError} />
            <FieldShell id="assign-evaluator" label={adminCopy.assign_evaluator} required>
              <Select value={distEvaluator} onValueChange={setDistEvaluator} dir="rtl">
                <SelectTrigger id="assign-evaluator" className="h-12 text-body">
                  <SelectValue placeholder={adminCopy.assign_evaluator_placeholder} />
                </SelectTrigger>
                <SelectContent>{evaluatorOptions}</SelectContent>
              </Select>
            </FieldShell>
            <FieldShell id="assign-association" label={adminCopy.assign_association} required>
              <Select value={distAssociation} onValueChange={setDistAssociation} dir="rtl">
                <SelectTrigger id="assign-association" className="h-12 text-body">
                  <SelectValue placeholder={adminCopy.assign_association_placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {unassignedAssociations.length > 0
                    ? unassignedAssociations.map((a) => (
                        <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>
                      ))
                    : // Show all associations if none unassigned
                      (associations || []).map((a) => (
                        <SelectItem key={`${a.id}-${a.assignment_id}`} value={a.id}>{a.name}</SelectItem>
                      ))}
                </SelectContent>
              </Select>
            </FieldShell>
            <FieldShell id="assign-year" label={adminCopy.assign_year} required>
              <Select value={distYear} onValueChange={setDistYear} dir="rtl">
                <SelectTrigger id="assign-year" className="h-12 text-body"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="2026">2026</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                </SelectContent>
              </Select>
            </FieldShell>
          </div>
          <DialogFooter className={dialogUi.footer}>
            <Button onClick={createAssignment} disabled={distLoading}>{adminCopy.assign_submit}</Button>
            <DialogClose asChild><Button variant="outline">{adminCopy.cancel}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reassign */}
      <Dialog open={reassignOpen} onOpenChange={setReassignOpen}>
        <DialogContent dir="rtl" className={dialogUi.content}>
          <DialogHeader className={dialogUi.header}>
            <DialogTitle className={dialogUi.title}>{adminCopy.reassign_title}</DialogTitle>
            <DialogDescription className={dialogUi.description}>{adminCopy.reassign_desc}</DialogDescription>
          </DialogHeader>
          <div className={dialogUi.body}>
            <FormError message={formError} />
            <FieldShell id="reassign-assignment" label={adminCopy.reassign_assignment} required>
              <Select value={reassignAssignment} onValueChange={setReassignAssignment} dir="rtl">
                <SelectTrigger id="reassign-assignment" className="h-12 text-body">
                  <SelectValue placeholder={adminCopy.reassign_assignment_placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {activeAssignments.map((a) => (
                    <SelectItem key={a.assignment_id} value={a.assignment_id!}>
                      {a.name} ({a.year})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
            <FieldShell id="reassign-to" label={adminCopy.reassign_to} required>
              <Select value={reassignTo} onValueChange={setReassignTo} dir="rtl">
                <SelectTrigger id="reassign-to" className="h-12 text-body">
                  <SelectValue placeholder={adminCopy.assign_evaluator_placeholder} />
                </SelectTrigger>
                <SelectContent>{evaluatorOptions}</SelectContent>
              </Select>
            </FieldShell>
          </div>
          <DialogFooter className={dialogUi.footer}>
            <Button onClick={executeReassign} disabled={reassignLoading}>{adminCopy.reassign_submit}</Button>
            <DialogClose asChild><Button variant="outline">{adminCopy.cancel}</Button></DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminReviewers;
