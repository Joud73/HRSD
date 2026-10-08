import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2, type LucideIcon } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button, type ButtonProps } from "@/components/ui/button";

/** One link style for every authentication page. */
export const authLinkClass =
  "rounded-sm font-hrsd-medium text-primary underline-offset-4 transition-colors duration-micro hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Full-width action size shared by every auth button. */
export const authButtonClass = "h-12 w-full text-body font-hrsd-medium";

/** Page title and one-line subtitle. Same size on every auth page. */
export const AuthHeading = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <header className="mb-8 flex flex-col gap-2">
    <h1 className="text-h2 text-ink">{title}</h1>
    {subtitle && <p className="text-body text-muted-foreground">{subtitle}</p>}
  </header>
);

interface SubmitButtonProps extends Omit<ButtonProps, "children"> {
  loading?: boolean;
  label: string;
  loadingLabel: string;
  icon?: ReactNode;
}

/** Primary form action. While loading: disabled, label changes, small inline progress mark. */
export const SubmitButton = ({ loading, label, loadingLabel, icon, className, disabled, type = "submit", ...props }: SubmitButtonProps) => (
  <Button
    type={type}
    disabled={loading || disabled}
    aria-busy={loading || undefined}
    className={cn(authButtonClass, className)}
    {...props}
  >
    {loading ? <Loader2 aria-hidden className="animate-spin motion-reduce:animate-none" /> : icon}
    <span aria-live="polite">{loading ? loadingLabel : label}</span>
  </Button>
);

/** "Prompt? Link" line under a form. */
export const AuthPrompt = ({ prompt, to, label, className }: { prompt: string; to: string; label: string; className?: string }) => (
  <p className={cn("text-small text-muted-foreground", className)}>
    {prompt}{" "}
    <Link to={to} className={authLinkClass}>
      {label}
    </Link>
  </p>
);

/** Horizontal rule with a short centred label ("أو"). */
export const AuthDivider = ({ label }: { label: string }) => (
  <div className="my-6 flex items-center gap-4" role="separator" aria-label={label}>
    <span aria-hidden className="h-px flex-1 bg-border" />
    <span aria-hidden className="text-small text-muted-foreground">
      {label}
    </span>
    <span aria-hidden className="h-px flex-1 bg-border" />
  </div>
);

/** Confirmation notice above a form (success token). Counterpart of FormError. */
export const FormSuccess = ({ message }: { message?: string | null }) => (
  <AnimatePresence initial={false}>
    {message && (
      <motion.div
        role="status"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={transition.ui}
        className="overflow-hidden"
      >
        <div className="flex items-start gap-2 rounded-md border border-success/30 bg-success/5 px-4 py-3 text-small text-success">
          <CheckCircle2 aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{message}</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);

const toneClass = {
  primary: "bg-primary/10 text-primary",
  success: "bg-success/10 text-success",
  warning: "bg-warning/10 text-warning-ink",
} as const;

interface AuthStatusProps {
  icon: LucideIcon;
  tone?: keyof typeof toneClass;
  title: string;
  description: string;
  /** Badge or details between the text and the action */
  meta?: ReactNode;
  /** One clear action */
  children?: ReactNode;
}

/** Calm status screen in the form column: icon, title, one sentence, optional meta, one action. */
export const AuthStatus = ({ icon: Icon, tone = "primary", title, description, meta, children }: AuthStatusProps) => (
  <section className="flex flex-col gap-6" aria-live="polite">
    <span className={cn("flex h-14 w-14 items-center justify-center rounded-full", toneClass[tone])}>
      <Icon aria-hidden className="h-7 w-7" strokeWidth={1.75} />
    </span>
    <div className="flex flex-col gap-2">
      <h1 className="text-h2 text-ink">{title}</h1>
      <p className="text-body text-muted-foreground">{description}</p>
    </div>
    {meta}
    {children && <div className="flex flex-col gap-3 pt-2">{children}</div>}
  </section>
);
