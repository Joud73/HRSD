import { useState } from "react";
import { adminCopy, fieldsCopy as f } from "@/lib/copy";
import { useSocialDevCenters, useSubClassifications } from "@/hooks/useLookups";
import type { DelegateInput, EntityType } from "@/services/organizationService";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FieldShell, TextField } from "@/components/shared/FormField";
import type {
  EvaluatorErrors, EvaluatorField, EvaluatorFormValues, OrganizationErrors, OrganizationFormValues,
} from "@/components/shared/profileForm";

/**
 * The HRSD organization and delegate fields, in the ministry's order with its labels (fieldsCopy).
 * Shared by the admin edit dialogs and the organization settings page.
 */

const ENTITY_TYPES: EntityType[] = ["association", "foundation"];

/* ── Organization ── */

interface LookupSelectProps {
  id: string;
  label: string;
  value: string | null;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  disabled?: boolean;
  hint?: string;
}

const LookupSelect = ({ id, label, value, onChange, options, disabled, hint }: LookupSelectProps) => (
  <FieldShell id={id} label={label} hint={hint}>
    <Select value={value ?? undefined} onValueChange={onChange} disabled={disabled} dir="rtl">
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

interface OrganizationFieldsProps {
  idPrefix: string;
  values: OrganizationFormValues;
  onChange: (values: OrganizationFormValues) => void;
  errors?: OrganizationErrors;
  /** نوع الكيان، رقم التسجيل، تاريخ التسجيل: read only outside the admin (the database enforces it too) */
  identityLocked?: boolean;
}

export const OrganizationFields = ({ idPrefix, values, onChange, errors = {}, identityLocked = false }: OrganizationFieldsProps) => {
  const subClassifications = useSubClassifications();
  const socialDevCenters = useSocialDevCenters();
  const [regionPrefilled, setRegionPrefilled] = useState(false);
  const lockedHint = identityLocked ? f.identity_locked : undefined;

  const set = <K extends keyof OrganizationFormValues>(key: K, value: OrganizationFormValues[K]) => onChange({ ...values, [key]: value });
  const text = (key: "name" | "registrationNumber" | "region" | "city" | "district" | "address" | "email" | "website") => ({
    value: values[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      set(key, e.target.value);
      if (key === "region") setRegionPrefilled(false);
    },
  });

  // Choosing a center prefills المنطقة from social_dev_centers.region; the field stays editable
  const chooseCenter = (id: string) => {
    const centerRegion = socialDevCenters.data?.find((c) => c.id === id)?.region;
    onChange({ ...values, socialDevCenterId: id, region: centerRegion ?? values.region });
    if (centerRegion) setRegionPrefilled(true);
  };

  return (
    <>
      <LookupSelect
        id={`${idPrefix}-entity-type`}
        label={f.entity_type}
        value={values.entityType}
        onChange={(v) => set("entityType", v as EntityType)}
        options={ENTITY_TYPES.map((v) => ({ value: v, label: f.entity_types[v] }))}
        disabled={identityLocked}
        hint={lockedHint}
      />
      <TextField
        id={`${idPrefix}-registration-number`}
        label={f.org.registration_number}
        required={!identityLocked}
        disabled={identityLocked}
        hint={lockedHint}
        dir="ltr"
        inputMode="numeric"
        {...text("registrationNumber")}
        error={errors.registrationNumber}
      />
      <TextField
        id={`${idPrefix}-registration-date`}
        label={f.org.registration_date}
        type="date"
        dir="ltr"
        disabled={identityLocked}
        hint={lockedHint}
        value={values.registrationDate ?? ""}
        onChange={(e) => set("registrationDate", e.target.value || null)}
      />
      <TextField id={`${idPrefix}-name`} label={f.org.name} required autoComplete="organization" {...text("name")} error={errors.name} />
      <LookupSelect
        id={`${idPrefix}-sub-classification`}
        label={f.org.sub_classification}
        value={values.subClassificationId}
        onChange={(v) => set("subClassificationId", v)}
        options={(subClassifications.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
      />
      <LookupSelect
        id={`${idPrefix}-social-dev-center`}
        label={f.org.social_dev_center}
        value={values.socialDevCenterId}
        onChange={chooseCenter}
        options={(socialDevCenters.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
      />
      <TextField id={`${idPrefix}-region`} label={f.org.region} hint={regionPrefilled ? f.region_prefilled : undefined} {...text("region")} />
      <TextField id={`${idPrefix}-city`} label={f.org.city} {...text("city")} />
      <TextField id={`${idPrefix}-district`} label={f.org.district} {...text("district")} />
      <TextField id={`${idPrefix}-address`} label={f.org.address} autoComplete="street-address" {...text("address")} />
      <TextField
        id={`${idPrefix}-employees`}
        label={f.org.employees_count}
        dir="ltr"
        inputMode="numeric"
        value={values.employees}
        onChange={(e) => set("employees", e.target.value)}
        error={errors.employeesCount}
      />
      <TextField id={`${idPrefix}-email`} label={f.org.email} type="email" dir="ltr" {...text("email")} />
      <TextField id={`${idPrefix}-website`} label={f.org.website} type="url" dir="ltr" {...text("website")} />
    </>
  );
};

/* ── Delegate ── */

interface DelegateFieldsProps {
  idPrefix: string;
  values: DelegateInput;
  onChange: (values: DelegateInput) => void;
  idError?: string;
  /** The ID is read only once recorded, outside the admin (the database enforces it too) */
  idLocked?: boolean;
}

export const DelegateFields = ({ idPrefix, values, onChange, idError, idLocked = false }: DelegateFieldsProps) => {
  const field = (key: keyof DelegateInput) => ({
    value: values[key] ?? "",
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [key]: e.target.value }),
  });
  return (
    <>
      <TextField
        id={`${idPrefix}-id-number`}
        label={f.delegate.id_number}
        dir="ltr"
        inputMode="numeric"
        maxLength={10}
        disabled={idLocked}
        hint={idLocked ? f.id_locked : undefined}
        {...field("idNumber")}
        error={idError}
      />
      <TextField id={`${idPrefix}-name`} label={f.delegate.name} autoComplete="name" {...field("fullName")} />
      <TextField id={`${idPrefix}-mobile`} label={f.delegate.mobile} type="tel" dir="ltr" autoComplete="tel" {...field("mobile")} />
      <TextField id={`${idPrefix}-email`} label={f.delegate.email} type="email" dir="ltr" autoComplete="email" {...field("email")} />
    </>
  );
};

/* ── Evaluator (المقيم) ── */

interface EvaluatorFieldsProps {
  idPrefix: string;
  values: EvaluatorFormValues;
  onChange: (values: EvaluatorFormValues) => void;
  errors?: EvaluatorErrors;
  /** Fields shown read only (the evaluator's own profile: ID and name) */
  locked?: EvaluatorField[];
  requireEmail?: boolean;
}

export const EvaluatorFields = ({ idPrefix, values, onChange, errors = {}, locked = [], requireEmail = false }: EvaluatorFieldsProps) => {
  const field = (key: EvaluatorField) => ({
    id: `${idPrefix}-${key}`,
    value: values[key],
    error: errors[key],
    disabled: locked.includes(key),
    hint: locked.includes(key) ? f.identity_locked : undefined,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => onChange({ ...values, [key]: e.target.value }),
  });
  return (
    <>
      <TextField label={f.evaluator.id_number} dir="ltr" inputMode="numeric" maxLength={10} {...field("idNumber")} />
      <TextField label={f.evaluator.name} required={!locked.includes("fullName")} autoComplete="name" {...field("fullName")} />
      <TextField label={f.evaluator.mobile} type="tel" dir="ltr" autoComplete="tel" {...field("mobile")} />
      <TextField label={f.evaluator.email} type="email" dir="ltr" autoComplete="email" required={requireEmail} {...field("email")} />
      <TextField label={f.evaluator.employer} autoComplete="organization" {...field("employer")} />
    </>
  );
};
