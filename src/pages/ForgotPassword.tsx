import { useState } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { copy, authCopy } from "@/lib/copy";
import { supabase } from "@/integrations/supabase/client";
import { AuthHeading, AuthHelpLinks, AuthStatus, SubmitButton, authButtonClass, authLinkClass } from "@/components/auth/AuthParts";
import AuthShell from "@/components/auth/AuthShell";
import { useFieldValidation } from "@/components/auth/useFieldValidation";
import { TextField } from "@/components/shared/FormField";
import { Button } from "@/components/ui/button";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const { errors, check, blur } = useFieldValidation<"email">(() => ({
    email: !email.trim()
      ? copy.login_error_email_required
      : !EMAIL_RE.test(email.trim())
        ? copy.login_error_email_invalid
        : undefined,
  }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!check()) return;

    setIsLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/set-password`,
      });

      // Always show success for security (don't reveal if the email exists)
      if (resetError) {
        console.error("Password reset request failed");
      }

      setIsSubmitted(true);
    } catch {
      console.error("Password reset error");
      setIsSubmitted(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <AuthShell crumb={authCopy.forgot_title} below={<AuthHelpLinks />}>
        <AuthStatus icon={MailCheck} tone="success" title={authCopy.forgot_sent_title} description={authCopy.forgot_sent_desc}>
          <Button asChild className={authButtonClass}>
            <Link to="/login">{authCopy.back_to_login}</Link>
          </Button>
        </AuthStatus>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      crumb={authCopy.forgot_title}
      below={
        <>
          <Link to="/login" className={`${authLinkClass} text-body`}>
            {authCopy.back_to_login}
          </Link>
          <AuthHelpLinks />
        </>
      }
    >
      <AuthHeading title={authCopy.forgot_title} subtitle={authCopy.forgot_subtitle} />

      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
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
        />

        <SubmitButton loading={isLoading} label={authCopy.forgot_submit} loadingLabel={authCopy.forgot_submitting} className="mt-2" />
      </form>
    </AuthShell>
  );
};

export default ForgotPassword;
