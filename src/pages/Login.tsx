import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { copy, authCopy } from "@/lib/copy";
import { transition } from "@/lib/motion";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, getDefaultRouteForRole } from "@/lib/roles";
import NafathIcon from "@/components/icons/NafathIcon";
import NafathStep from "@/components/auth/NafathStep";
import {
  AuthDivider,
  AuthHeading,
  AuthPrompt,
  SubmitButton,
  authButtonClass,
  authLinkClass,
} from "@/components/auth/AuthParts";
import { useFieldValidation } from "@/components/auth/useFieldValidation";
import { FormError, PasswordField, TextField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Field = "email" | "password";

/** Single sign-in page for every role: Nafath, or email and password. */
const Login = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const [step, setStep] = useState<"form" | "nafath">("form");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { errors, check, blur } = useFieldValidation<Field>(() => ({
    email: !email.trim()
      ? copy.login_error_email_required
      : !EMAIL_RE.test(email.trim())
        ? copy.login_error_email_invalid
        : undefined,
    password: !password ? copy.login_error_password_required : undefined,
  }));

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
      navigate(getDefaultRouteForRole(role), { replace: true });
    } catch {
      setError(copy.login_error_generic);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence mode="wait" initial={false}>
      {step === "nafath" ? (
        <motion.div key="nafath" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition.ui}>
          <NafathStep onCancel={() => setStep("form")} />
        </motion.div>
      ) : (
        <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition.ui}>
          <AuthHeading title={copy.login_title} subtitle={copy.login_subtitle} />

          <Button type="button" variant="outline" onClick={() => setStep("nafath")} className={`${authButtonClass} border-primary text-primary hover:text-primary`}>
            <NafathIcon size={22} className="!size-[22px]" />
            {copy.nafath_btn}
          </Button>

          <AuthDivider label={copy.login_or} />

          <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
            <FormError message={error} />

            <TextField
              label={copy.login_email}
              type="email"
              autoComplete="email"
              inputMode="email"
              dir="ltr"
              className="text-end"
              placeholder={authCopy.email_placeholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={blur("email")}
              error={errors.email}
            />

            <PasswordField
              label={copy.login_password}
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={blur("password")}
              error={errors.password}
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

            <SubmitButton loading={isLoading} label={copy.login_submit} loadingLabel={copy.login_submitting} className="mt-1" />
          </form>

          <div className="mt-8 flex flex-col gap-2 border-t border-border pt-6">
            <AuthPrompt prompt={copy.register_prompt} to="/register" label={copy.register_link} />
            <AuthPrompt prompt={authCopy.individual_prompt} to="/individual-auth" label={authCopy.individual_link} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default Login;
