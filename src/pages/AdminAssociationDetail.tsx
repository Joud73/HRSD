import { useState } from "react";
import { useParams } from "react-router-dom";
import { AlertCircle, Building2, ClipboardList, History, MessageSquare, Paperclip, Pencil, type LucideIcon } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useOpenCycle } from "@/hooks/useCycles";
import { useSocialDevCenters, useSubClassifications } from "@/hooks/useLookups";
import { useOrganization, useOrganizationMutations, useOrganizations } from "@/hooks/useOrganizations";
import { SAUDI_ID_RE } from "@/services/errors";
import type { DelegateInput, EntityType, OrganizationDetail, OrganizationInput } from "@/services/organizationService";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { FieldShell, FormError, TextField } from "@/components/shared/FormField";
import { Fact, KeyFacts, Panel } from "@/components/admin/AdminParts";
import { FormDialog } from "@/components/admin/setup/SetupDialogs";
import { tabsUi } from "@/components/admin/adminUi";
import AssessmentJourneyPanel from "@/components/admin/AssessmentJourneyPanel";

const ENTITY_TYPES: EntityType[] = ["association", "foundation"];

const crumbs = (name: string) => [
  { label: adminCopy.breadcrumb_root, to: "/admin" },
  { label: copy.nav_admin.associations, to: "/admin/associations" },
  { label: name },
];

const orDash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "—" : v);

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

interface SelectFieldProps {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const SelectField = ({ id, label, value, onChange, options }: SelectFieldProps) => (
  <FieldShell id={id} label={label}>
    <Select value={value ?? undefined} onValueChange={onChange} dir="rtl">
      <SelectTrigger id={id} className="h-12 text-body">
        <SelectValue placeholder={adminCopy.select_placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </FieldShell>
);

/* ── Organization profile dialog ── */

type OrgErrors = Partial<Record<"name" | "registrationNumber" | "employeesCount", string>>;

const OrganizationDialog = ({ org, open, onOpenChange }: { org: OrganizationDetail; open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { toast } = useToast();
  const { update } = useOrganizationMutations(org.id);
  const subClassifications = useSubClassifications();
  const socialDevCenters = useSocialDevCenters();
  const [form, setForm] = useState((): OrganizationInput & { employees: string } => ({
    name: org.name,
    registrationNumber: org.registrationNumber,
    entityType: org.entityType,
    registrationDate: org.registrationDate,
    subClassificationId: org.subClassificationId,
    socialDevCenterId: org.socialDevCenterId,
    region: org.region,
    city: org.city,
    district: org.district,
    address: org.address,
    employeesCount: org.employeesCount,
    email: org.email,
    website: org.website,
    employees: org.employeesCount === null ? "" : String(org.employeesCount),
  }));
  const [errors, setErrors] = useState<OrgErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const set = <K extends keyof typeof form>(key: K) => (value: (typeof form)[K]) => setForm((p) => ({ ...p, [key]: value }));
  const text = (key: "name" | "registrationNumber" | "region" | "city" | "district" | "address" | "email" | "website") =>
    ({ value: form[key] ?? "", onChange: (e: React.ChangeEvent<HTMLInputElement>) => set(key)(e.target.value) });

  const submit = () => {
    const employees = form.employees.trim();
    const errs: OrgErrors = {};
    if (!form.name.trim()) errs.name = adminCopy.error_required;
    if (!form.registrationNumber.trim()) errs.registrationNumber = adminCopy.error_required;
    if (employees && !/^\d+$/.test(employees)) errs.employeesCount = adminCopy.org_err_employees_count;
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length > 0) return;
    const { employees: _employees, ...input } = form;
    update.mutate(
      { ...input, employeesCount: employees ? Number(employees) : null },
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
      title={adminCopy.assoc_edit_info}
      description={adminCopy.assoc_edit_desc}
      onSubmit={submit}
      className="sm:max-w-2xl"
    >
      <FormError message={serverError} />
      <div className="grid gap-5 sm:grid-cols-2">
        <TextField label={adminCopy.assoc_name} required {...text("name")} error={errors.name} />
        <SelectField
          id="org-entity-type"
          label={adminCopy.assoc_type}
          value={form.entityType}
          onChange={(v) => set("entityType")(v as EntityType)}
          options={ENTITY_TYPES.map((v) => ({ value: v, label: adminCopy.entity_types[v] }))}
        />
        <TextField
          label={adminCopy.assoc_registration_number}
          required
          dir="ltr"
          inputMode="numeric"
          {...text("registrationNumber")}
          error={errors.registrationNumber}
        />
        <TextField
          label={adminCopy.assoc_registration_date}
          type="date"
          dir="ltr"
          value={form.registrationDate ?? ""}
          onChange={(e) => set("registrationDate")(e.target.value || null)}
        />
        <SelectField
          id="org-sub-classification"
          label={adminCopy.assoc_sub_classification}
          value={form.subClassificationId}
          onChange={set("subClassificationId")}
          options={(subClassifications.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <SelectField
          id="org-social-dev-center"
          label={adminCopy.assoc_social_dev_center}
          value={form.socialDevCenterId}
          onChange={set("socialDevCenterId")}
          options={(socialDevCenters.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
        />
        <TextField label={adminCopy.assoc_region} {...text("region")} />
        <TextField label={adminCopy.assoc_city} {...text("city")} />
        <TextField label={adminCopy.assoc_district} {...text("district")} />
        <TextField label={adminCopy.assoc_address} {...text("address")} />
        <TextField
          label={adminCopy.assoc_employees}
          dir="ltr"
          inputMode="numeric"
          value={form.employees}
          onChange={(e) => set("employees")(e.target.value)}
          error={errors.employeesCount}
        />
        <TextField label={adminCopy.assoc_email} type="email" dir="ltr" {...text("email")} />
        <TextField label={adminCopy.assoc_website} type="url" dir="ltr" {...text("website")} />
      </div>
    </FormDialog>
  );
};

/* ── Delegate dialog ── */

const DelegateDialog = ({ org, open, onOpenChange }: { org: OrganizationDetail; open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { toast } = useToast();
  const { saveDelegate } = useOrganizationMutations(org.id);
  const [form, setForm] = useState((): DelegateInput => ({
    fullName: org.delegate?.fullName ?? "",
    idNumber: org.delegate?.idNumber ?? "",
    mobile: org.delegate?.mobile ?? "",
    email: org.delegate?.email ?? "",
  }));
  const [idError, setIdError] = useState<string | undefined>();
  const [serverError, setServerError] = useState<string | null>(null);

  const field = (key: keyof DelegateInput) => ({
    value: form[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setForm((p) => ({ ...p, [key]: e.target.value })),
  });

  const submit = () => {
    const id = form.idNumber?.trim();
    const err = id && !SAUDI_ID_RE.test(id) ? adminCopy.err_id_number_format : undefined;
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
      <TextField label={adminCopy.delegate_name} {...field("fullName")} />
      <TextField label={adminCopy.delegate_id} dir="ltr" inputMode="numeric" maxLength={10} {...field("idNumber")} error={idError} />
      <TextField label={adminCopy.assoc_mobile} type="tel" dir="ltr" {...field("mobile")} />
      <TextField label={adminCopy.assoc_email} type="email" dir="ltr" {...field("email")} />
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
              { label: adminCopy.assoc_registration_number, value: <span className="tabular">{org.registrationNumber}</span> },
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

          <Panel title={adminCopy.assoc_section_info} aside={<EditButton label={adminCopy.edit} onClick={() => setOrgOpen(true)} />}>
            <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <Fact label={adminCopy.assoc_name}>{org.name}</Fact>
              <Fact label={adminCopy.assoc_type}>{org.entityType ? adminCopy.entity_types[org.entityType] : "—"}</Fact>
              <Fact label={adminCopy.assoc_registration_number}><span className="tabular">{org.registrationNumber}</span></Fact>
              <Fact label={adminCopy.assoc_registration_date}><span className="tabular">{formatDate(org.registrationDate)}</span></Fact>
              <Fact label={adminCopy.assoc_sub_classification}>{orDash(org.subClassificationName)}</Fact>
              <Fact label={adminCopy.assoc_social_dev_center}>{orDash(org.socialDevCenterName)}</Fact>
              <Fact label={adminCopy.assoc_region}>{orDash(org.region)}</Fact>
              <Fact label={adminCopy.assoc_city}>{orDash(org.city)}</Fact>
              <Fact label={adminCopy.assoc_district}>{orDash(org.district)}</Fact>
              <Fact label={adminCopy.assoc_address}>{orDash(org.address)}</Fact>
              <Fact label={adminCopy.assoc_employees}><span className="tabular">{formatNumber(org.employeesCount)}</span></Fact>
              <Fact label={adminCopy.assoc_email}>{org.email ? <bdi dir="ltr">{org.email}</bdi> : "—"}</Fact>
              <Fact label={adminCopy.assoc_website}>{org.website ? <bdi dir="ltr">{org.website}</bdi> : "—"}</Fact>
            </dl>
          </Panel>

          <Panel title={adminCopy.assoc_section_delegate} aside={<EditButton label={adminCopy.edit} onClick={() => setDelegateOpen(true)} />}>
            {d ? (
              <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <Fact label={adminCopy.delegate_name}>{orDash(d.fullName)}</Fact>
                <Fact label={adminCopy.delegate_id}><span className="tabular">{orDash(d.idNumber)}</span></Fact>
                <Fact label={adminCopy.assoc_mobile}>{d.mobile ? <bdi dir="ltr" className="tabular">{d.mobile}</bdi> : "—"}</Fact>
                <Fact label={adminCopy.assoc_email}>{d.email ? <bdi dir="ltr">{d.email}</bdi> : "—"}</Fact>
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
