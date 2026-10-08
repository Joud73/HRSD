import { useId, type FormEvent, type ReactNode } from "react";
import { Building2, UserCircle } from "lucide-react";
import { motion } from "motion/react";
import { copy, pagesCopy } from "@/lib/copy";
import { transition } from "@/lib/motion";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import { FieldShell, TextField } from "@/components/shared/FormField";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

const f = pagesCopy.settings_fields;

const tabTrigger =
  "relative h-12 shrink-0 gap-2 rounded-none bg-transparent px-4 text-small font-hrsd-medium text-muted-foreground transition-colors duration-micro hover:text-ink data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-ui after:ease-standard data-[state=active]:after:scale-x-100 focus-visible:ring-offset-0 [&_svg]:h-4 [&_svg]:w-4";

const Settings = () => (
  <>
    <PageHeader
      title={pagesCopy.settings_title}
      description={pagesCopy.settings_desc}
      breadcrumbs={[{ label: copy.account_dashboard, to: "/dashboard" }, { label: pagesCopy.settings_title }]}
    />

    <Tabs defaultValue="organization" dir="rtl" className="flex flex-col gap-6">
      <TabsList className="h-auto w-full justify-start gap-2 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
        <TabsTrigger value="organization" className={tabTrigger}>
          <Building2 aria-hidden />
          {pagesCopy.settings_tab_org}
        </TabsTrigger>
        <TabsTrigger value="representative" className={tabTrigger}>
          <UserCircle aria-hidden />
          {pagesCopy.settings_tab_rep}
        </TabsTrigger>
      </TabsList>

      <TabsContent value="organization" className="mt-0">
        <SettingsPanel title={pagesCopy.settings_tab_org} description={pagesCopy.settings_org_desc}>
          <TextField label={f.org_name} autoComplete="organization" fieldClassName="md:col-span-2" />
          <SelectField label={f.city} options={pagesCopy.settings_cities} />
          <SelectField label={f.specialty} options={pagesCopy.settings_specialties} />
          <TextField label={f.address} placeholder={f.address_ph} autoComplete="street-address" fieldClassName="md:col-span-2" />
          <SelectField label={f.employees} options={pagesCopy.settings_employee_ranges} />
          <TextField label={f.org_email} type="email" dir="ltr" autoComplete="email" className="text-end" />
          <TextField label={f.website} type="url" dir="ltr" autoComplete="url" className="text-end" />
        </SettingsPanel>
      </TabsContent>

      <TabsContent value="representative" className="mt-0">
        <SettingsPanel title={pagesCopy.settings_tab_rep} description={pagesCopy.settings_rep_desc}>
          <TextField label={f.full_name} autoComplete="name" fieldClassName="md:col-span-2" />
          <TextField label={f.national_id} inputMode="numeric" dir="ltr" className="text-end" />
          <TextField label={f.mobile} type="tel" dir="ltr" autoComplete="tel" className="text-end" />
          <TextField label={f.email} type="email" dir="ltr" autoComplete="email" className="text-end" />
          <TextField label={f.username} dir="ltr" autoComplete="username" className="text-end" />
        </SettingsPanel>
      </TabsContent>
    </Tabs>
  </>
);

/** One white panel per tab: heading, two-column fields, save action. */
const SettingsPanel = ({ title, description, children }: { title: string; description: string; children: ReactNode }) => {
  const { toast } = useToast();
  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    toast({ title: pagesCopy.settings_saved });
  };

  return (
    <motion.form
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={transition.ui}
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-card"
    >
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-h3 text-ink">{title}</h2>
        <p className="mt-1 text-small text-muted-foreground">{description}</p>
      </div>
      <div className="grid gap-6 p-6 md:grid-cols-2">{children}</div>
      <div className="flex justify-start border-t border-border px-6 py-4">
        <Button type="submit" className="h-12 w-full px-8 text-body sm:w-auto">
          {pagesCopy.settings_save}
        </Button>
      </div>
    </motion.form>
  );
};

const SelectField = ({ label, options }: { label: string; options: readonly string[] }) => {
  const id = useId();
  return (
    <FieldShell id={id} label={label}>
      <Select dir="rtl">
        <SelectTrigger id={id} className="h-12 px-4 text-body transition-[border-color,box-shadow] duration-micro hover:border-ink/30">
          <SelectValue placeholder={pagesCopy.settings_select} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option} value={option}>
              {option}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </FieldShell>
  );
};

export default Settings;
