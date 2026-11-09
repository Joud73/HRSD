import { useState, type FormEvent, type ReactNode } from "react";
import { AlertCircle, Building2, UserCircle } from "lucide-react";
import { motion } from "motion/react";
import { copy, fieldsCopy, pagesCopy } from "@/lib/copy";
import { transition } from "@/lib/motion";
import { useToast } from "@/hooks/use-toast";
import { useMyOrganization, useOrganizationMutations } from "@/hooks/useOrganizations";
import type { OrganizationDetail } from "@/services/organizationService";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { FormError } from "@/components/shared/FormField";
import { DelegateFields, OrganizationFields } from "@/components/shared/ProfileFields";
import {
  toDelegateForm, toOrganizationForm, validateDelegateId, validateOrganization, type OrganizationErrors,
} from "@/components/shared/profileForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";

const tabTrigger =
  "relative h-12 shrink-0 gap-2 rounded-none bg-transparent px-4 text-small font-hrsd-medium text-muted-foreground transition-colors duration-micro hover:text-ink data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-ui after:ease-standard data-[state=active]:after:scale-x-100 focus-visible:ring-offset-0 [&_svg]:h-4 [&_svg]:w-4";

const crumbs = [{ label: copy.account_dashboard, to: "/dashboard" }, { label: pagesCopy.settings_title }];

/** Organization settings: HRSD profile (identity fields read only) and the delegate, on the database. */
const Settings = () => {
  const { data: org, isLoading, isError, refetch } = useMyOrganization();

  return (
    <>
      <PageHeader title={pagesCopy.settings_title} description={pagesCopy.settings_desc} breadcrumbs={crumbs} />

      {isLoading ? (
        <SkeletonPanel lines={8} />
      ) : isError || !org ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState
            icon={AlertCircle}
            message={isError ? pagesCopy.settings_load_error : pagesCopy.settings_no_org}
            action={isError ? { label: pagesCopy.settings_retry, onClick: () => void refetch() } : undefined}
          />
        </div>
      ) : (
        <Tabs defaultValue="organization" dir="rtl" className="flex flex-col gap-6">
          <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
            <TabsTrigger value="organization" className={tabTrigger}>
              <Building2 aria-hidden />
              {fieldsCopy.section_org}
            </TabsTrigger>
            <TabsTrigger value="delegate" className={tabTrigger}>
              <UserCircle aria-hidden />
              {fieldsCopy.section_delegate}
            </TabsTrigger>
          </TabsList>

          {/* Keyed by the saved row, so a refetch after saving restarts each form from the stored values */}
          <TabsContent value="organization" className="mt-0">
            <OrganizationForm key={`org:${JSON.stringify(toOrganizationForm(org))}`} org={org} />
          </TabsContent>
          <TabsContent value="delegate" className="mt-0">
            <DelegateForm key={`delegate:${JSON.stringify(org.delegate)}`} org={org} />
          </TabsContent>
        </Tabs>
      )}
    </>
  );
};

const OrganizationForm = ({ org }: { org: OrganizationDetail }) => {
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
      onSuccess: () => toast({ title: pagesCopy.settings_saved }),
      onError: (e) => setServerError(e.message),
    });
  };

  return (
    <SettingsPanel title={fieldsCopy.section_org} description={pagesCopy.settings_org_desc} onSubmit={submit} saving={update.isPending} error={serverError}>
      <OrganizationFields idPrefix="settings-org" values={form} onChange={setForm} errors={errors} identityLocked />
    </SettingsPanel>
  );
};

const DelegateForm = ({ org }: { org: OrganizationDetail }) => {
  const { toast } = useToast();
  const { saveDelegate } = useOrganizationMutations(org.id);
  const [form, setForm] = useState(() => toDelegateForm(org));
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
        onSuccess: () => toast({ title: pagesCopy.settings_saved }),
        onError: (e) => setServerError(e.message),
      }
    );
  };

  return (
    <SettingsPanel
      title={fieldsCopy.section_delegate}
      description={pagesCopy.settings_rep_desc}
      onSubmit={submit}
      saving={saveDelegate.isPending}
      error={serverError}
    >
      <DelegateFields idPrefix="settings-delegate" values={form} onChange={setForm} idError={idError} idLocked={!!org.delegate?.idNumber} />
    </SettingsPanel>
  );
};

interface SettingsPanelProps {
  title: string;
  description: string;
  onSubmit: () => void;
  saving: boolean;
  error: string | null;
  children: ReactNode;
}

/** One white panel per tab: heading, two-column fields, save action. */
const SettingsPanel = ({ title, description, onSubmit, saving, error, children }: SettingsPanelProps) => {
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transition.ui}
      onSubmit={handleSubmit}
      noValidate
      className="rounded-lg border border-border bg-card"
    >
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-h3 text-ink">{title}</h2>
        <p className="mt-1 text-small text-muted-foreground">{description}</p>
      </div>
      <div className="flex flex-col gap-6 p-6">
        <FormError message={error} />
        <div className="grid gap-6 md:grid-cols-2">{children}</div>
      </div>
      <div className="flex justify-start border-t border-border px-6 py-4">
        <Button type="submit" disabled={saving} className="h-12 w-full px-8 text-body sm:w-auto">
          {pagesCopy.settings_save}
        </Button>
      </div>
    </motion.form>
  );
};

export default Settings;
