import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { copy, authCopy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
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
import { FieldShell, FormError, PasswordField, TextField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** 0 organization, 1 sign-in data (creates the account), 2 representative, 3 done */
type Step = 0 | 1 | 2 | 3;

type Field =
  | "organizationName"
  | "email"
  | "signupPassword"
  | "fullName"
  | "idNumber"
  | "mobile"
  | "delegateEmail"
  | "confirmPassword";

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

const Register = () => {
  const navigate = useNavigate();
  const { signUp, updateProfileStatus, user } = useAuth();
  const [step, setStep] = useState<Step>(0);
  const [organizationName, setOrganizationName] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("1000");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Sign-in data (step 2), used for signUp
  const [email, setEmail] = useState("");
  const [signupPassword, setSignupPassword] = useState("");

  // Representative (step 3)
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [mobile, setMobile] = useState("");
  const [delegateEmail, setDelegateEmail] = useState("");
  const [loginName, setLoginName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const { errors, check, blur, reset } = useFieldValidation<Field>(() => {
    if (step === 0) {
      return { organizationName: organizationName ? undefined : authCopy.error_org_required };
    }
    if (step === 1) {
      return {
        email: !email.trim()
          ? copy.login_error_email_required
          : !EMAIL_RE.test(email.trim())
            ? copy.login_error_email_invalid
            : undefined,
        signupPassword: !signupPassword
          ? copy.login_error_password_required
          : signupPassword.length < 6
            ? authCopy.error_password_short
            : undefined,
      };
    }
    return {
      fullName: fullName ? undefined : authCopy.error_full_name_required,
      idNumber: idNumber ? undefined : authCopy.error_id_required,
      mobile: mobile ? undefined : authCopy.error_mobile_required,
      delegateEmail: !delegateEmail
        ? copy.login_error_email_required
        : !EMAIL_RE.test(delegateEmail.trim())
          ? copy.login_error_email_invalid
          : undefined,
      confirmPassword: password !== confirmPassword ? authCopy.error_password_mismatch : undefined,
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

  // A selection clears the error immediately
  const orgError = organizationName ? undefined : errors.organizationName;

  const goTo = (next: Step) => {
    setError("");
    reset();
    setStep(next);
  };

  const handleOrganizationNext = (e: React.FormEvent) => {
    e.preventDefault();
    if (!check()) return;
    goTo(1);
  };

  // Account creation: same calls as before (signUp, then profile_incomplete)
  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!check()) return;
    setIsLoading(true);

    const { error: signUpError } = await signUp(email, signupPassword, organizationName, registrationNumber);

    if (signUpError) {
      setError(signUpError);
      setIsLoading(false);
      return;
    }

    // Auto-confirm is enabled: go straight to the representative step
    const { error: updateError } = await updateProfileStatus("profile_incomplete");

    if (updateError) {
      setError(updateError);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    goTo(2);
  };

  // Representative data: same insert and status update as before
  const handleSaveRepresentative = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!check()) return;
    setIsLoading(true);

    if (user) {
      const { error: delegateError } = await supabase.from("delegates").insert({
        user_id: user.id,
        full_name: fullName,
        id_number: idNumber,
        mobile: mobile,
        email: delegateEmail,
        login_name: loginName,
      });

      if (delegateError) {
        console.error("Delegate save failed");
        setError(authCopy.error_save_failed);
        setIsLoading(false);
        return;
      }

      const { error: updateError } = await updateProfileStatus("active");

      if (updateError) {
        setError(updateError);
        setIsLoading(false);
        return;
      }
    }

    setIsLoading(false);
    goTo(3);
  };

  if (step === 3) {
    return (
      <AuthShell crumb={authCopy.register_title} width="lg" below={<AuthHelpLinks />}>
        <AuthStatus
          icon={CheckCircle2}
          tone="success"
          title={authCopy.register_success_title}
          description={authCopy.register_success_desc}
        >
          <Button type="button" onClick={() => navigate("/dashboard")} className={authButtonClass}>
            {authCopy.register_success_action}
            <ArrowLeft aria-hidden />
          </Button>
        </AuthStatus>
      </AuthShell>
    );
  }

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
              <form onSubmit={handleOrganizationNext} noValidate className="flex flex-col gap-6">
                <FormError message={error} />

                <div className="grid gap-4 md:grid-cols-2">
                  <FieldShell id="reg-org" label={authCopy.org_name} error={orgError} required>
                    <Select
                      dir="rtl"
                      value={organizationName}
                      onValueChange={(v) => setOrganizationName(v)}
                    >
                      <SelectTrigger
                        id="reg-org"
                        aria-invalid={orgError ? true : undefined}
                        aria-describedby={orgError ? "reg-org-error" : undefined}
                        className="h-12 text-body aria-[invalid=true]:border-danger"
                      >
                        <SelectValue placeholder={authCopy.org_name_placeholder} />
                      </SelectTrigger>
                      <SelectContent>
                        {authCopy.org_options.map((name) => (
                          <SelectItem key={name} value={name} className="text-body">
                            {name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FieldShell>

                  <TextField
                    label={authCopy.reg_number}
                    inputMode="numeric"
                    dir="ltr"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                  />
                </div>

                <Button type="submit" className={cn(authButtonClass, "md:w-auto md:self-start md:px-8")}>
                  {authCopy.register_next}
                  <ArrowLeft aria-hidden />
                </Button>
              </form>
            )}

            {step === 1 && (
              <form onSubmit={handleCreateAccount} noValidate className="flex flex-col gap-6">
                <FormError message={error} />

                <div className="grid gap-4 md:grid-cols-2">
                  <TextField
                    label={copy.login_email}
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    dir="ltr"
                    placeholder={authCopy.email_placeholder}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={blur("email")}
                    error={errors.email}
                    required
                  />

                  <PasswordField
                    label={copy.login_password}
                    autoComplete="new-password"
                    hint={authCopy.password_hint}
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    onBlur={blur("signupPassword")}
                    error={errors.signupPassword}
                    required
                  />
                </div>

                <div className="flex flex-col-reverse gap-3 sm:flex-row">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => goTo(0)}
                    disabled={isLoading}
                    className={cn(authButtonClass, "sm:w-auto sm:px-6")}
                  >
                    <ArrowRight aria-hidden />
                    {authCopy.register_back}
                  </Button>
                  <SubmitButton
                    loading={isLoading}
                    label={authCopy.register_create}
                    loadingLabel={authCopy.register_creating}
                    className="sm:flex-1"
                  />
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleSaveRepresentative} noValidate className="flex flex-col gap-6">
                <FormError message={error} />
                {!error && <p className="text-small text-muted-foreground">{authCopy.account_created_note}</p>}

                <div className="grid gap-4 md:grid-cols-2">

                  <TextField
                    label={authCopy.rep_full_name}
                    autoComplete="name"
                    placeholder={authCopy.rep_full_name_placeholder}
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    onBlur={blur("fullName")}
                    error={errors.fullName}
                    required
                  />

                  <TextField
                    label={authCopy.rep_id_number}
                    inputMode="numeric"
                    dir="ltr"
                    value={idNumber}
                    onChange={(e) => setIdNumber(e.target.value)}
                    onBlur={blur("idNumber")}
                    error={errors.idNumber}
                    required
                  />

                  <TextField
                    label={authCopy.rep_mobile}
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
                    label={authCopy.rep_email}
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

                  <TextField
                    label={authCopy.rep_login_name}
                    autoComplete="username"
                    dir="ltr"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                  />

                  <PasswordField
                    label={copy.login_password}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />

                  <PasswordField
                    label={authCopy.confirm_password}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={blur("confirmPassword")}
                    error={errors.confirmPassword}
                  />
                </div>

                <SubmitButton
                  loading={isLoading}
                  label={authCopy.register_save}
                  loadingLabel={authCopy.register_saving}
                  className="md:w-auto md:self-start md:px-8"
                />
              </form>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

    </AuthShell>
  );
};

export default Register;
