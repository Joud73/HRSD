import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { copy, authCopy } from "@/lib/copy";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { fetchUserRole, getDefaultRouteForRole } from "@/lib/roles";
import {
  AuthHeading,
  AuthPrompt,
  FormSuccess,
  SubmitButton,
  authLinkClass,
} from "@/components/auth/AuthParts";
import { useFieldValidation } from "@/components/auth/useFieldValidation";
import { FormError, PasswordField, TextField } from "@/components/shared/FormField";
import SegmentedControl from "@/components/shared/SegmentedControl";

type AuthMode = "login" | "register";
type Field = "email" | "password" | "confirmPassword";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const IndividualAuth = () => {
  const navigate = useNavigate();
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { errors, check, blur, reset } = useFieldValidation<Field>(() => ({
    email: !email.trim()
      ? copy.login_error_email_required
      : !EMAIL_RE.test(email.trim())
        ? copy.login_error_email_invalid
        : undefined,
    password: !password
      ? copy.login_error_password_required
      : mode === "register" && password.length < 6
        ? authCopy.error_password_short
        : undefined,
    confirmPassword:
      mode !== "register"
        ? undefined
        : !confirmPassword
          ? authCopy.error_confirm_required
          : confirmPassword !== password
            ? authCopy.error_password_mismatch
            : undefined,
  }));

  const switchMode = (next: AuthMode) => {
    setMode(next);
    setError("");
    setSuccess("");
    reset();
  };

  const handleLogin = async (e: React.FormEvent) => {
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
        data: { user: authUser },
      } = await supabase.auth.getUser();
      const role = authUser ? await fetchUserRole(authUser.id) : null;
      if (role && role !== "individual") {
        await supabase.auth.signOut();
        setError(authCopy.individual_only_error);
        return;
      }
      navigate(getDefaultRouteForRole(role), { replace: true });
    } catch {
      setError(copy.login_error_generic);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!check()) return;
    setIsLoading(true);
    try {
      const { error: signUpError } = await signUp(email, password);
      if (signUpError) {
        setError(signUpError);
        return;
      }
      setSuccess(authCopy.individual_register_success);
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      reset();
    } catch {
      setError(authCopy.individual_register_error);
    } finally {
      setIsLoading(false);
    }
  };

  const isLogin = mode === "login";

  return (
    <>
      <SegmentedControl<AuthMode>
        label={authCopy.individual_mode_label}
        value={mode}
        onChange={switchMode}
        options={[
          { value: "login", label: authCopy.individual_mode_login },
          { value: "register", label: authCopy.individual_mode_register },
        ]}
        className="mb-8"
      />

      <AuthHeading
        title={isLogin ? authCopy.individual_login_title : authCopy.individual_register_title}
        subtitle={isLogin ? authCopy.individual_login_subtitle : authCopy.individual_register_subtitle}
      />

      <form onSubmit={isLogin ? handleLogin : handleRegister} noValidate className="flex flex-col gap-5">
        <FormError message={error} />
        <FormSuccess message={success} />

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
          autoComplete={isLogin ? "current-password" : "new-password"}
          hint={isLogin ? undefined : authCopy.password_hint}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onBlur={blur("password")}
          error={errors.password}
          labelAside={
            isLogin ? (
              <Link to="/forgot-password" className={`${authLinkClass} text-small`}>
                {copy.login_forgot}
              </Link>
            ) : undefined
          }
        />

        {!isLogin && (
          <PasswordField
            label={authCopy.confirm_password}
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onBlur={blur("confirmPassword")}
            error={errors.confirmPassword}
          />
        )}

        <SubmitButton
          loading={isLoading}
          label={isLogin ? copy.login_submit : authCopy.individual_register_submit}
          loadingLabel={isLogin ? copy.login_submitting : authCopy.individual_register_submitting}
          className="mt-1"
        />
      </form>

      <div className="mt-8 border-t border-border pt-6">
        <AuthPrompt prompt={authCopy.org_prompt} to="/login" label={authCopy.org_link} />
      </div>
    </>
  );
};

export default IndividualAuth;
