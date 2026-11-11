import { useLayoutEffect, useRef, useState, type KeyboardEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { copy, authCopy } from "@/lib/copy";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, getDefaultRouteForRole } from "@/lib/roles";
import NafathIcon from "@/components/icons/NafathIcon";
import NafathStep from "@/components/auth/NafathStep";
import AuthShell from "@/components/auth/AuthShell";
import { AuthHeading, AuthHelpLinks, AuthPrompt, SubmitButton, authButtonClass, authLinkClass } from "@/components/auth/AuthParts";
import { useFieldValidation } from "@/components/auth/useFieldValidation";
import { FormError, PasswordField, TextField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "email" | "password";
type Method = "nafath" | "email";

const METHODS: { value: Method; label: string }[] = [
  { value: "nafath", label: copy.tab_nafath },
  { value: "email", label: copy.tab_email },
];

/** Animates its height to follow its content (panel switches inside the card). */
const AutoHeight = ({ children }: { children: React.ReactNode }) => {
  const inner = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState<number | "auto">("auto");
  const reduced = useReducedMotion();

  useLayoutEffect(() => {
    const el = inner.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    // Negative margin plus padding keeps focus rings visible inside the clipped area
    <motion.div
      className="-m-1 overflow-hidden"
      initial={false}
      animate={{ height }}
      transition={reduced ? { duration: 0 } : transition.ui}
    >
      <div ref={inner} className="p-1">
        {children}
      </div>
    </motion.div>
  );
};

/** Single sign-in page for every role: Nafath or email and password, in one card on the green band. */
const Login = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signIn } = useAuth();
  const reduced = useReducedMotion();
  const [step, setStep] = useState<"form" | "nafath">("form");
  const [method, setMethod] = useState<Method>("nafath");
  const [dir, setDir] = useState<1 | -1>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const { errors, check, blur } = useFieldValidation<Field>(() => ({
    email: !email.trim()
      ? copy.login_error_email_required
      : !EMAIL_RE.test(email.trim())
        ? copy.login_error_email_invalid
        : undefined,
    password: !password ? copy.login_error_password_required : undefined,
  }));

  const selectMethod = (next: Method, focus = false) => {
    const i = METHODS.findIndex((m) => m.value === next);
    setDir(i > METHODS.findIndex((m) => m.value === method) ? 1 : -1);
    setMethod(next);
    if (focus) tabRefs.current[i]?.focus();
  };

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = METHODS.findIndex((m) => m.value === method);
    // RTL: ArrowLeft moves forward in reading order
    const target: Record<string, number> = { ArrowLeft: i + 1, ArrowRight: i - 1, Home: 0, End: METHODS.length - 1 };
    if (!(e.key in target)) return;
    e.preventDefault();
    const n = (target[e.key] + METHODS.length) % METHODS.length;
    selectMethod(METHODS[n].value, true);
  };

  // Sign-in logic carried over unchanged from the former /login-local page.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!check()) return;
    setIsLoading(true);

    try {
      const { error: signInError } = await signIn(email, password);
      if (signInError) {
        setError(copy.login_error_generic);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError(copy.login_error_generic);
        return;
      }

      const role = await fetchUserRole(user.id);
      // A return path from a protected page: same-site paths only (never "//host" or a full URL)
      const next = searchParams.get("next");
      const safeNext = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
      navigate(safeNext ?? getDefaultRouteForRole(role), { replace: true });
    } catch {
      setError(copy.login_error_generic);
    } finally {
      setIsLoading(false);
    }
  };

  const panelMotion = {
    initial: reduced ? { opacity: 0 } : { opacity: 0, x: dir * 12 },
    animate: { opacity: 1, x: 0 },
    exit: reduced ? { opacity: 0 } : { opacity: 0, x: dir * -12 },
    transition: transition.ui,
  };

  return (
    <AuthShell
      crumb={copy.login_title}
      below={
        <>
          <AuthPrompt prompt={copy.register_prompt} to="/register" label={copy.register_link} />
          <AuthPrompt prompt={authCopy.individual_prompt} to="/individual-auth" label={authCopy.individual_link} className="text-small" />
          <AuthHelpLinks />
        </>
      }
    >
      <AutoHeight>
        <AnimatePresence mode="wait" initial={false}>
          {step === "nafath" ? (
            <motion.div key="nafath-step" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition.ui}>
              <NafathStep onCancel={() => setStep("form")} />
            </motion.div>
          ) : (
            <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition.ui}>
              <AuthHeading title={copy.login_title} subtitle={copy.login_subtitle} />

              {/* Method switch: segmented tablist with a sliding white pill */}
              <div role="tablist" aria-label={copy.login_method_label} className="grid h-11 grid-cols-2 rounded-[10px] bg-section-alt p-1">
                {METHODS.map((m, i) => {
                  const active = m.value === method;
                  return (
                    <button
                      key={m.value}
                      ref={(el) => (tabRefs.current[i] = el)}
                      type="button"
                      role="tab"
                      id={`login-tab-${m.value}`}
                      aria-selected={active}
                      aria-controls={`login-panel-${m.value}`}
                      tabIndex={active ? 0 : -1}
                      onClick={() => selectMethod(m.value)}
                      onKeyDown={onTabKey}
                      className={cn(
                        "relative rounded-[8px] text-small font-hrsd-medium transition-colors duration-ui focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        active ? "text-ink" : "text-muted-foreground hover:text-ink"
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="login-method-pill"
                          transition={reduced ? { duration: 0 } : transition.ui}
                          className="absolute inset-0 rounded-[8px] bg-card"
                        />
                      )}
                      <span className="relative">{m.label}</span>
                    </button>
                  );
                })}
              </div>

              <div className="mt-6">
                <AnimatePresence mode="wait" initial={false} custom={dir}>
                  {method === "nafath" ? (
                    <motion.div
                      key="nafath"
                      id="login-panel-nafath"
                      role="tabpanel"
                      aria-labelledby="login-tab-nafath"
                      {...panelMotion}
                      className="flex flex-col gap-3"
                    >
                      <Button type="button" onClick={() => setStep("nafath")} className={authButtonClass}>
                        <NafathIcon size={24} className="!size-6 text-primary-foreground" />
                        {copy.nafath_btn}
                      </Button>
                      <p className="text-small text-muted-foreground">{copy.nafath_hint}</p>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="email"
                      id="login-panel-email"
                      role="tabpanel"
                      aria-labelledby="login-tab-email"
                      {...panelMotion}
                      onSubmit={handleSubmit}
                      noValidate
                      className="flex flex-col gap-4"
                    >
                      <FormError message={error} />

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
                        fieldClassName="gap-1.5"
                      />

                      <PasswordField
                        label={copy.login_password}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        onBlur={blur("password")}
                        error={errors.password}
                        fieldClassName="gap-1.5"
                      />

                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <label className="flex cursor-pointer items-center gap-2 text-small text-ink">
                          <Checkbox checked={remember} onCheckedChange={(v) => setRemember(v === true)} />
                          {copy.login_remember}
                        </label>
                        <Link to="/forgot-password" className={`${authLinkClass} text-small`}>
                          {copy.login_forgot}
                        </Link>
                      </div>

                      <SubmitButton loading={isLoading} label={copy.login_submit} loadingLabel={copy.login_submitting} className="mt-2" />
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </AutoHeight>
    </AuthShell>
  );
};

export default Login;
