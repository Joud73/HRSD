import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { copy, authCopy, fieldsCopy as f } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useSocialDevCenters, useSubClassifications } from "@/hooks/useLookups";
import { SAUDI_ID_RE } from "@/services/errors";
import { submitOrganizationRequest, type EntityType } from "@/services/organizationService";
import {
  AuthHeading,
  AuthHelpLinks,
  AuthPrompt,
  AuthStatus,
  SubmitButton,
  authButtonClass,
} from "@/components/auth/AuthParts";
import AuthShell from "@/components/auth/AuthShell";
import { useFieldValidation } from "@/components/auth/useFieldValidation";
import { FieldShell, FormError, TextField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 0 organization, 1 sign-in email, 2 representative (sends the request), 3 done */
type Step = 0 | 1 | 2 | 3;

type Field =
  | "entityType"
  | "registrationNumber"
  | "registrationDate"
  | "organizationName"
  | "subClassificationId"
  | "socialDevCenterId"
  | "region"
  | "city"
  | "employeesCount"
  | "organizationEmail"
  | "email"
  | "fullName"
  | "idNumber"
  | "mobile"
  | "delegateEmail";

const ENTITY_TYPES: EntityType[] = ["association", "foundation"];

const emailError = (value: string) =>
  !value.trim() ? copy.login_error_email_required : !EMAIL_RE.test(value.trim()) ? copy.login_error_email_invalid : undefined;

const StepIndicator = ({ current }: { current: number }) => {
  const steps = authCopy.register_steps;
  return (
    <nav aria-label={authCopy.register_steps_label} className="mb-6 flex flex-col gap-3">
      <p className="text-small text-muted-foreground">
        {authCopy.register_step_counter} <span className="tabular font-hrsd-medium text-ink">{formatNumber(current + 1)}</span>{" "}
        {authCopy.register_step_of} <span className="tabular">{formatNumber(steps.length)}</span>
      </p>
      <ol className="grid grid-cols-3 gap-2">
        {steps.map((label, i) => {
          const state = i < current ? "done" : i === current ? "current" : "upcoming";
          return (
            <li key={label} aria-current={state === "current" ? "step" : undefined} className="flex min-w-0 flex-col gap-2">
              <span
                aria-hidden
                className={cn(
                  "h-1 rounded-full transition-colors duration-ui",
                  state === "upcoming" ? "bg-border" : "bg-primary"
                )}
              />
              <span
                className={cn(
                  "text-caption",
                  state === "current" ? "font-hrsd-medium text-ink" : "text-muted-foreground"
                )}
              >
                {label}
              </span>
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

interface SelectFieldProps {
  id: string;
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  error?: string;
}

/** Required select with the same error wiring as TextField */
const SelectField = ({ id, label, placeholder, value, onChange, options, error }: SelectFieldProps) => (
  <FieldShell id={id} label={label} error={error} required>
    <Select dir="rtl" value={value} onValueChange={onChange}>
      <SelectTrigger
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? `${id}-error` : undefined}
        className="h-12 text-body aria-[invalid=true]:border-danger"
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value} className="text-body">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </FieldShell>
);

const Register = () => {
  const navigate = useNavigate();
  const subClassifications = useSubClassifications();
  const socialDevCenters = useSocialDevCenters();
  const [step, setStep] = useState<Step>(0);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Organization (step 1)
  const [entityType, setEntityType] = useState<EntityType | "">("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [registrationDate, setRegistrationDate] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [subClassificationId, setSubClassificationId] = useState("");
  const [socialDevCenterId, setSocialDevCenterId] = useState("");
  const [region, setRegion] = useState("");
  const [regionPrefilled, setRegionPrefilled] = useState(false);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [address, setAddress] = useState("");
  const [employeesCount, setEmployeesCount] = useState("");
  const [organizationEmail, setOrganizationEmail] = useState("");
  const [website, setWebsite] = useState("");

  // Sign-in email (step 2): the account is created with it when the request is approved
  const [email, setEmail] = useState("");

  // Representative (step 3)
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [delegateEmail, setDelegateEmail] = useState("");

  const { errors, check, blur, reset } = useFieldValidation<Field>(() => {
    if (step === 0) {
      const employees = employeesCount.trim();
      return {
        entityType: entityType ? undefined : authCopy.error_entity_type_required,
        registrationNumber: registrationNumber.trim() ? undefined : authCopy.error_reg_number_required,
        registrationDate: registrationDate ? undefined : authCopy.error_reg_date_required,
        organizationName: organizationName.trim() ? undefined : authCopy.error_org_name_required,
        subClassificationId: subClassificationId ? undefined : authCopy.error_sub_classification_required,
        socialDevCenterId: socialDevCenterId ? undefined : authCopy.error_social_dev_center_required,
        region: region.trim() ? undefined : authCopy.error_region_required,
        city: city.trim() ? undefined : authCopy.error_city_required,
        employeesCount: employees && !/^\d+$/.test(employees) ? authCopy.error_employees_invalid : undefined,
        organizationEmail: emailError(organizationEmail),
      };
    }
    if (step === 1) {
      return { email: emailError(email) };
    }
    return {
      fullName: fullName.trim() ? undefined : authCopy.error_full_name_required,
      idNumber: !idNumber.trim()
        ? authCopy.error_id_required
        : !SAUDI_ID_RE.test(idNumber.trim())
          ? authCopy.error_id_invalid
          : undefined,
      mobile: mobile.trim() ? undefined : authCopy.error_mobile_required,
      delegateEmail: emailError(delegateEmail),
    };
  });

  // Move focus to the step content when the step changes (not on first render)
  const stepRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    const el = stepRef.current;
    if (!el) return;
    el.focus({ preventScroll: true });
    if (el.getBoundingClientRect().top < 0) el.scrollIntoView({ block: "start" });
  }, [step]);

  // Choosing a center prefills المنطقة from social_dev_centers.region; the field stays editable
  const chooseCenter = (id: string) => {
    setSocialDevCenterId(id);
    const centerRegion = socialDevCenters.data?.find((c) => c.id === id)?.region;
    if (centerRegion) {
      setRegion(centerRegion);
      setRegionPrefilled(true);
    }
  };

  // A selection clears its error immediately
  const selectError = (value: string, field: Field) => (value ? undefined : errors[field]);

  const goTo = (next: Step) => {
    setError("");
    reset();
    setStep(next);
  };

  const handleNext = (next: Step) => (e: React.FormEvent) => {
    e.preventDefault();
    if (!check()) return;
    goTo(next);
  };

  // Sends the complete request; the account is created when an administrator approves it
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!check() || !entityType) return;
    setIsLoading(true);
    try {
      await submitOrganizationRequest({
        entityType,
        registrationNumber,
        registrationDate,
        organizationName,
        subClassificationId,
        socialDevCenterId,
        region,
        city,
        district,
        address,
        employeesCount: employeesCount.trim() ? Number(employeesCount) : null,
        organizationEmail,
        website,
        email,
        delegateName: fullName,
        delegateIdNumber: idNumber,
        delegateMobile: mobile,
        delegateEmail,
      });
      goTo(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : authCopy.error_save_failed);
    } finally {
      setIsLoading(false);
    }
  };

  if (step === 3) {
    return (
      <AuthShell crumb={authCopy.register_title} width="lg" below={<AuthHelpLinks />}>
        <AuthStatus icon={CheckCircle2} tone="success" title={authCopy.pending_title} description={authCopy.pending_desc}>
          <Button type="button" onClick={() => navigate("/login")} className={authButtonClass}>
            {authCopy.back_to_login}
            <ArrowLeft aria-hidden />
          </Button>
        </AuthStatus>
      </AuthShell>
    );
  }

  const lookupsFailed = subClassifications.isError || socialDevCenters.isError;

  const backButton = (to: Step) => (
    <Button
      type="button"
      variant="outline"
      onClick={() => goTo(to)}
      disabled={isLoading}
      className={cn(authButtonClass, "sm:w-auto sm:px-6")}
    >
      <ArrowRight aria-hidden />
      {authCopy.register_back}
    </Button>
  );

  return (
    <AuthShell
      crumb={authCopy.register_title}
      width="lg"
      below={
        <>
          {step === 0 && <AuthPrompt prompt={authCopy.login_prompt} to="/login" label={copy.login} />}
          <AuthHelpLinks />
        </>
      }
    >
      <AuthHeading title={authCopy.register_title} subtitle={authCopy.register_subtitle} />
      <StepIndicator current={step} />

      <div ref={stepRef} tabIndex={-1} className="scroll-mt-6 focus:outline-none">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div key={step} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition.ui}>
            {step === 0 && (
              <form onSubmit={handleNext(1)} noValidate className="flex flex-col gap-6">
                <FormError message={error || (lookupsFailed ? authCopy.error_lookups_failed : null)} />

                <div className="grid gap-4 md:grid-cols-2">
                  <SelectField
                    id="reg-entity-type"
                    label={f.entity_type}
                    placeholder={authCopy.entity_type_placeholder}
                    value={entityType}
                    onChange={(v) => setEntityType(v as EntityType)}
                    options={ENTITY_TYPES.map((v) => ({ value: v, label: f.entity_types[v] }))}
                    error={selectError(entityType, "entityType")}
                  />

                  <TextField
                    label={f.org.registration_number}
                    inputMode="numeric"
                    dir="ltr"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    onBlur={blur("registrationNumber")}
                    error={errors.registrationNumber}
                    required
                  />

                  <TextField
                    label={f.org.registration_date}
                    type="date"
                    dir="ltr"
                    value={registrationDate}
                    onChange={(e) => setRegistrationDate(e.target.value)}
                    onBlur={blur("registrationDate")}
                    error={errors.registrationDate}
                    required
                  />

                  <TextField
                    label={f.org.name}
                    value={organizationName}
                    onChange={(e) => setOrganizationName(e.target.value)}
                    onBlur={blur("organizationName")}
                    error={errors.organizationName}
                    required
                  />

                  <SelectField
                    id="reg-sub-classification"
                    label={f.org.sub_classification}
                    placeholder={authCopy.sub_classification_placeholder}
                    value={subClassificationId}
                    onChange={setSubClassificationId}
                    options={(subClassifications.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    error={selectError(subClassificationId, "subClassificationId")}
                  />

                  <SelectField
                    id="reg-social-dev-center"
                    label={f.org.social_dev_center}
                    placeholder={authCopy.social_dev_center_placeholder}
                    value={socialDevCenterId}
                    onChange={chooseCenter}
                    options={(socialDevCenters.data ?? []).map((c) => ({ value: c.id, label: c.name }))}
                    error={selectError(socialDevCenterId, "socialDevCenterId")}
                  />

                  <TextField
                    label={f.org.region}
                    hint={regionPrefilled ? f.region_prefilled : undefined}
                    value={region}
                    onChange={(e) => {
                      setRegion(e.target.value);
                      setRegionPrefilled(false);
                    }}
                    onBlur={blur("region")}
                    error={errors.region}
                    required
                  />

                  <TextField
                    label={f.org.city}
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onBlur={blur("city")}
                    error={errors.city}
                    required
                  />

                  <TextField
                    label={f.org.district}
                    hint={authCopy.optional_hint}
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                  />

                  <TextField
                    label={f.org.address}
                    hint={authCopy.optional_hint}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                  />

                  <TextField
                    label={f.org.employees_count}
                    hint={authCopy.optional_hint}
                    inputMode="numeric"
                    dir="ltr"
                    value={employeesCount}
                    onChange={(e) => setEmployeesCount(e.target.value)}
                    onBlur={blur("employeesCount")}
                    error={errors.employeesCount}
                  />

                  <TextField
                    label={f.org.email}
                    type="email"
                    inputMode="email"
                    dir="ltr"
                    placeholder={authCopy.email_placeholder}
                    value={organizationEmail}
                    onChange={(e) => setOrganizationEmail(e.target.value)}
                    onBlur={blur("organizationEmail")}
                    error={errors.organizationEmail}
                    required
                  />

                  <TextField
                    label={f.org.website}
                    hint={authCopy.optional_hint}
                    type="url"
                    inputMode="url"
                    dir="ltr"
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                  />
                </div>

                <Button type="submit" className={cn(authButtonClass, "md:w-auto md:self-start md:px-8")}>
                  {authCopy.register_next}
                  <ArrowLeft aria-hidden />
                </Button>
              </form>
            )}

            {step === 1 && (
              <form onSubmit={handleNext(2)} noValidate className="flex flex-col gap-6">
                <FormError message={error} />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label={authCopy.login_email}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    dir="ltr"
                    placeholder={authCopy.email_placeholder}
                    hint={authCopy.login_email_note}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={blur("email")}
                    error={errors.email}
                    required
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  {backButton(0)}
                  <Button type="submit" className={cn(authButtonClass, "sm:flex-1")}>
                    {authCopy.register_next}
                    <ArrowLeft aria-hidden />
                  </Button>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSubmitRequest} noValidate className="flex flex-col gap-6">
                <FormError message={error} />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label={f.delegate.id_number}
                    inputMode="numeric"
                    dir="ltr"
                    maxLength={10}
                    hint={authCopy.rep_id_hint}
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    onBlur={blur("idNumber")}
                    error={errors.idNumber}
                    required
                  />

                  <TextField
                    label={f.delegate.name}
                    autoComplete="name"
                    placeholder={authCopy.rep_full_name_placeholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={blur("fullName")}
                    error={errors.fullName}
                    required
                  />

                  <TextField
                    label={f.delegate.mobile}
                    type="tel"
                    autoComplete="tel"
                    dir="ltr"
                    placeholder={authCopy.rep_mobile_placeholder}
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                    onBlur={blur("mobile")}
                    error={errors.mobile}
                    required
                  />

                  <TextField
                    label={f.delegate.email}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    dir="ltr"
                    placeholder={authCopy.email_placeholder}
                    value={delegateEmail}
                    onChange={(e) => setDelegateEmail(e.target.value)}
                    onBlur={blur("delegateEmail")}
                    error={errors.delegateEmail}
                    required
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  {backButton(1)}
                  <SubmitButton
                    loading={isLoading}
                    label={authCopy.register_submit}
                    loadingLabel={authCopy.register_submitting}
                    className="sm:flex-1"
                  />
                </div>
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </AuthShell>
  );
};

export default Register;
