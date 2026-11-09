import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LinkIcon, Loader2 } from "lucide-react";
import { copy, authCopy } from "@/lib/copy";
import { fetchUserRole, getDefaultRouteForRole } from "@/lib/roles";
import { getLinkSessionUserId, setPassword } from "@/services/accountService";
import { AuthHeading, AuthHelpLinks, AuthStatus, SubmitButton, authButtonClass } from "@/components/auth/AuthParts";
import AuthShell from "@/components/auth/AuthShell";
import { useFieldValidation } from "@/components/auth/useFieldValidation";
import { FormError, PasswordField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";

type LinkState = "checking" | "ready" | "invalid";

/** Landing page of invite and password-recovery links: the link opens a session, the user sets a password. */
const SetPassword = () => {
  const navigate = useNavigate();
  const [linkState, setLinkState] = useState<LinkState>("checking");
  const [userId, setUserId] = useState<string | null>(null);
  const [password, setPasswordValue] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let active = true;
    getLinkSessionUserId()
      .then((id) => {
        if (!active) return;
        setUserId(id);
        setLinkState(id ? "ready" : "invalid");
      })
      .catch(() => active && setLinkState("invalid"));
    return () => {
      active = false;
    };
  }, []);

  const { errors, check, blur } = useFieldValidation<"password" | "confirm">(() => ({
    password: !password
      ? copy.login_error_password_required
      : password.length < 6
        ? authCopy.error_password_short
        : undefined,
    confirm: !confirm ? authCopy.error_confirm_required : confirm !== password ? authCopy.error_password_mismatch : undefined,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (!check() || !userId) return;
    setIsLoading(true);
    try {
      await setPassword(password);
      const role = await fetchUserRole(userId);
      navigate(getDefaultRouteForRole(role), { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : authCopy.set_password_failed);
      setIsLoading(false);
    }
  };

  if (linkState === "checking") {
    return (
      <AuthShell crumb={authCopy.set_password_title} below={<AuthHelpLinks />}>
        <p className="flex items-center gap-3 text-body text-muted-foreground" aria-live="polite">
          <Loader2 aria-hidden className="h-5 w-5 animate-spin motion-reduce:animate-none" />
          {authCopy.set_password_checking}
        </p>
      </AuthShell>
    );
  }

  if (linkState === "invalid") {
    return (
      <AuthShell crumb={authCopy.set_password_title} below={<AuthHelpLinks />}>
        <AuthStatus icon={LinkIcon} tone="warning" title={authCopy.set_password_invalid_title} description={authCopy.set_password_invalid_desc}>
          <Button asChild className={authButtonClass}>
            <Link to="/forgot-password">{authCopy.set_password_request_new}</Link>
          </Button>
        </AuthStatus>
      </AuthShell>
    );
  }

  return (
    <AuthShell crumb={authCopy.set_password_title} below={<AuthHelpLinks />}>
      <AuthHeading title={authCopy.set_password_title} subtitle={authCopy.set_password_subtitle} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormError message={error} />

        <PasswordField
          label={authCopy.set_password_new}
          autoComplete="new-password"
          hint={authCopy.password_hint}
          value={password}
          onChange={(e) => setPasswordValue(e.target.value)}
          onBlur={blur("password")}
          error={errors.password}
          required
        />

        <PasswordField
          label={authCopy.confirm_password}
          autoComplete="new-password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          onBlur={blur("confirm")}
          error={errors.confirm}
          required
        />

        <SubmitButton loading={isLoading} label={authCopy.set_password_submit} loadingLabel={authCopy.set_password_submitting} className="mt-2" />
      </form>
    </AuthShell>
  );
};

export default SetPassword;
