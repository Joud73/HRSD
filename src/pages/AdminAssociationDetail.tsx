import { useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Building2, ClipboardList, History, MessageSquare, Paperclip, Pencil, type LucideIcon } from "lucide-react";
import { copy, adminCopy, fieldsCopy as fc } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useOpenCycle } from "@/hooks/useCycles";
import { useOrganization, useOrganizationMutations, useOrganizations } from "@/hooks/useOrganizations";
import type { DelegateInput, OrganizationDetail } from "@/services/organizationService";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { FormError } from "@/components/shared/FormField";
import { DelegateFields, OrganizationFields } from "@/components/shared/ProfileFields";
import {
  toDelegateForm, toOrganizationForm, validateDelegateId, validateOrganization, type OrganizationErrors,
} from "@/components/shared/profileForm";
import { Fact, KeyFacts, Panel } from "@/components/admin/AdminParts";
import { FormDialog } from "@/components/admin/setup/SetupDialogs";
import { tabsUi } from "@/components/admin/adminUi";
import AssessmentJourneyPanel from "@/components/admin/AssessmentJourneyPanel";

const crumbs = (name: string) => [
  { label: adminCopy.breadcrumb_root, to: "/admin" },
  { label: copy.nav_admin.associations, to: "/admin/associations" },
  { label: name },
];

const orDash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "-" : v);

/** Tabs whose data arrives with the assessment work in phase 4 */
const Phase4 = ({ icon }: { icon: LucideIcon }) => (
  <div className="rounded-lg border border-border bg-card">
    <EmptyState icon={icon} message={adminCopy.phase4_notice} />
  </div>
);

const EditButton = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <Button variant="outline" size="sm" onClick={onClick}>
    <Pencil aria-hidden /> {label}
  </Button>
);

/* ── Organization profile dialog ── */

const OrganizationDialog = ({ org, open, onOpenChange }: { org: OrganizationDetail; open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { toast } = useToast();
  const { update } = useOrganizationMutations(org.id);
  const [form, setForm] = useState(() => toOrganizationForm(org));
  const [errors, setErrors] = useState<OrganizationErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = () => {
    const { errors: errs, input } = validateOrganization(form);
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length > 0) return;
    update.mutate(input, {
      onSuccess: () => {
        toast({ title: adminCopy.saved });
        onOpenChange(false);
      },
      onError: (e) => setServerError(e.message),
    });
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminCopy.assoc_edit_info}
      description={adminCopy.assoc_edit_desc}
      onSubmit={submit}
      className="sm:max-w-2xl"
    >
      <FormError message={serverError} />
      <div className="grid gap-5 sm:grid-cols-2">
        <OrganizationFields idPrefix="org" values={form} onChange={setForm} errors={errors} />
      </div>
    </FormDialog>
  );
};

/* ── Delegate dialog ── */

const DelegateDialog = ({ org, open, onOpenChange }: { org: OrganizationDetail; open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { toast } = useToast();
  const { saveDelegate } = useOrganizationMutations(org.id);
  const [form, setForm] = useState((): DelegateInput => toDelegateForm(org));
  const [idError, setIdError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = () => {
    const err = validateDelegateId(form);
    setIdError(err);
    setServerError(null);
    if (err) return;
    saveDelegate.mutate(
      { delegateId: org.delegate?.id ?? null, input: form },
      {
        onSuccess: () => {
          toast({ title: adminCopy.saved });
          onOpenChange(false);
        },
        onError: (e) => setServerError(e.message),
      }
    );
  };

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={adminCopy.assoc_edit_delegate}
      description={adminCopy.assoc_edit_desc}
      onSubmit={submit}
    >
      <FormError message={serverError} />
      <DelegateFields idPrefix="delegate" values={form} onChange={setForm} idError={idError} />
    </FormDialog>
  );
};

/* ── Page ── */

const AdminAssociationDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { data: org, isLoading, isError, refetch } = useOrganization(id);
  const { data: list } = useOrganizations();
  const { data: openCycle } = useOpenCycle();
  const [orgOpen, setOrgOpen] = useState(false);
  const [delegateOpen, setDelegateOpen] = useState(false);

  if (isLoading || isError || !org) {
    return (
      <>
        <PageHeader title={copy.nav_admin.associations} breadcrumbs={crumbs(copy.nav_admin.associations)} />
        {isLoading ? (
          <SkeletonPanel lines={6} />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {isError ? (
              <EmptyState icon={AlertCircle} message={adminCopy.load_error} action={{ label: adminCopy.retry, onClick: () => void refetch() }} />
            ) : (
              <EmptyState icon={Building2} message={adminCopy.assoc_not_found} action={{ label: adminCopy.assoc_back, to: "/admin/associations" }} />
            )}
          </div>
        )}
      </>
    );
  }

  const row = list?.find((r) => r.id === org.id);
  const d = org.delegate;

  return (
    <>
      <PageHeader
        title={org.name}
        description={adminCopy.assoc_detail_desc}
        breadcrumbs={crumbs(org.name)}
        meta={
          <KeyFacts
            items={[
              { label: adminCopy.assoc_fact_status, value: <StatusBadge status={row?.assessmentStatus ?? "not_started"} /> },
              { label: adminCopy.assoc_fact_cycle, value: orDash(openCycle?.name) },
              { label: adminCopy.assoc_fact_evaluator, value: row?.evaluatorName ?? adminCopy.not_assigned },
              { label: fc.org.registration_number, value: <span className="tabular">{org.registrationNumber}</span> },
            ]}
          />
        }
      />

      <Tabs defaultValue="overview" dir="rtl">
        <TabsList className={tabsUi.list}>
          <TabsTrigger value="overview" className={tabsUi.trigger}>{adminCopy.assoc_tab_overview}</TabsTrigger>
          <TabsTrigger value="evidence" className={tabsUi.trigger}>{adminCopy.assoc_tab_evidence}</TabsTrigger>
          <TabsTrigger value="evaluation" className={tabsUi.trigger}>{adminCopy.assoc_tab_evaluation}</TabsTrigger>
          <TabsTrigger value="comments" className={tabsUi.trigger}>{adminCopy.assoc_tab_comments}</TabsTrigger>
          <TabsTrigger value="audit" className={tabsUi.trigger}>{adminCopy.assoc_tab_audit}</TabsTrigger>
        </TabsList>

        {/* ── Overview ── */}
        <TabsContent value="overview" className={tabsUi.content}>
          <AssessmentJourneyPanel orgId={org.id} cycle={openCycle} evaluatorId={row?.evaluatorId ?? null} />

          <Panel title={fc.section_org} aside={<EditButton label={adminCopy.edit} onClick={() => setOrgOpen(true)} />}>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label={fc.entity_type}>{org.entityType ? fc.entity_types[org.entityType] : "-"}</Fact>
              <Fact label={fc.org.registration_number}><span className="tabular">{org.registrationNumber}</span></Fact>
              <Fact label={fc.org.registration_date}><span className="tabular">{org.registrationDate ? formatDate(org.registrationDate) : "-"}</span></Fact>
              <Fact label={fc.org.name}>{org.name}</Fact>
              <Fact label={fc.org.sub_classification}>{orDash(org.subClassificationName)}</Fact>
              <Fact label={fc.org.social_dev_center}>{orDash(org.socialDevCenterName)}</Fact>
              <Fact label={fc.org.region}>{orDash(org.region)}</Fact>
              <Fact label={fc.org.city}>{orDash(org.city)}</Fact>
              <Fact label={fc.org.district}>{orDash(org.district)}</Fact>
              <Fact label={fc.org.address}>{orDash(org.address)}</Fact>
              <Fact label={fc.org.employees_count}><span className="tabular">{org.employeesCount === null ? "-" : formatNumber(org.employeesCount)}</span></Fact>
              <Fact label={fc.org.email}>{org.email ? <bdi dir="ltr">{org.email}</bdi> : "-"}</Fact>
              <Fact label={fc.org.website}>{org.website ? <bdi dir="ltr">{org.website}</bdi> : "-"}</Fact>
            </dl>
          </Panel>

          <Panel title={fc.section_delegate} aside={<EditButton label={adminCopy.edit} onClick={() => setDelegateOpen(true)} />}>
            {d ? (
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <Fact label={fc.delegate.id_number}><span className="tabular">{orDash(d.idNumber)}</span></Fact>
                <Fact label={fc.delegate.name}>{orDash(d.fullName)}</Fact>
                <Fact label={fc.delegate.mobile}>{d.mobile ? <bdi dir="ltr" className="tabular">{d.mobile}</bdi> : "-"}</Fact>
                <Fact label={fc.delegate.email}>{d.email ? <bdi dir="ltr">{d.email}</bdi> : "-"}</Fact>
              </dl>
            ) : (
              <p className="text-small text-muted-foreground">{adminCopy.assoc_delegate_empty}</p>
            )}
          </Panel>
        </TabsContent>

        <TabsContent value="evidence" className={tabsUi.content}>
          <Phase4 icon={Paperclip} />
        </TabsContent>
        <TabsContent value="evaluation" className={tabsUi.content}>
          <Phase4 icon={ClipboardList} />
        </TabsContent>
        <TabsContent value="comments" className={tabsUi.content}>
          <Phase4 icon={MessageSquare} />
        </TabsContent>
        <TabsContent value="audit" className={tabsUi.content}>
          <Phase4 icon={History} />
        </TabsContent>
      </Tabs>

      {/* Mounted while open, so each opening starts from the saved values */}
      {orgOpen && <OrganizationDialog org={org} open onOpenChange={setOrgOpen} />}
      {delegateOpen && <DelegateDialog org={org} open onOpenChange={setDelegateOpen} />}
    </>
  );
};

export default AdminAssociationDetail;
