import { forwardRef, useId, useState, type ComponentProps, type ReactNode } from "react";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { copy } from "@/lib/copy";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface FieldShellProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Rendered at the end of the label row (e.g. "forgot password" link) */
  labelAside?: ReactNode;
  required?: boolean;
  children: ReactNode;
  className?: string;
}

/** Label, control, hint and inline error. The one field style for every form. */
export const FieldShell = ({ id, label, error, hint, labelAside, required, children, className }: FieldShellProps) => (
  <div className={cn("flex flex-col gap-2", className)}>
    <div className="flex items-center justify-between gap-3">
      <label htmlFor={id} className="text-small font-hrsd-medium text-ink">
        {label}
        {required && (
          <span aria-hidden className="ms-1 text-danger">
            *
          </span>
        )}
      </label>
      {labelAside}
    </div>
    {children}
    {hint && !error && (
      <p id={`${id}-hint`} className="text-caption text-muted-foreground">
        {hint}
      </p>
    )}
    <AnimatePresence initial={false}>
      {error && (
        <motion.p
          id={`${id}-error`}
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={transition.ui}
          className="flex items-center gap-1.5 overflow-hidden text-caption text-danger"
        >
          <AlertCircle aria-hidden className="h-3.5 w-3.5 shrink-0" />
          {error}
        </motion.p>
      )}
    </AnimatePresence>
  </div>
);

type InputProps = Omit<ComponentProps<"input">, "id"> & {
  label: string;
  error?: string;
  hint?: string;
  labelAside?: ReactNode;
  id?: string;
  fieldClassName?: string;
};

const describedBy = (id: string, error?: string, hint?: string) =>
  [error ? `${id}-error` : null, hint && !error ? `${id}-hint` : null].filter(Boolean).join(" ") || undefined;

/** Text input with label and inline validation message. */
export const TextField = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, labelAside, id, required, className, fieldClassName, ...props }, ref) => {
    const auto = useId();
    const fieldId = id ?? auto;
    return (
      <FieldShell id={fieldId} label={label} error={error} hint={hint} labelAside={labelAside} required={required} className={fieldClassName}>
        <Input
          ref={ref}
          id={fieldId}
          required={required}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy(fieldId, error, hint)}
          className={cn("h-12 text-body", className)}
          {...props}
        />
      </FieldShell>
    );
  }
);
TextField.displayName = "TextField";

/** Password input with a show and hide toggle. */
export const PasswordField = forwardRef<HTMLInputElement, Omit<InputProps, "type">>(
  ({ label, error, hint, labelAside, id, required, className, fieldClassName, ...props }, ref) => {
    const auto = useId();
    const fieldId = id ?? auto;
    const [visible, setVisible] = useState(false);
    return (
      <FieldShell id={fieldId} label={label} error={error} hint={hint} labelAside={labelAside} required={required} className={fieldClassName}>
        <div className="relative">
          <Input
            ref={ref}
            id={fieldId}
            type={visible ? "text" : "password"}
            required={required}
            aria-invalid={error ? true : undefined}
            aria-describedby={describedBy(fieldId, error, hint)}
            className={cn("h-12 pe-12 text-body", className)}
            {...props}
          />
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? copy.login_hide_password : copy.login_show_password}
            aria-pressed={visible}
            className="absolute inset-y-0 end-0 flex w-12 items-center justify-center rounded-e-md text-muted-foreground transition-colors duration-micro hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
          >
            {visible ? <EyeOff aria-hidden className="h-5 w-5" /> : <Eye aria-hidden className="h-5 w-5" />}
          </button>
        </div>
      </FieldShell>
    );
  }
);
PasswordField.displayName = "PasswordField";

/** Error summary shown above a form (danger token, never an alert dialog). */
export const FormError = ({ message }: { message?: string | null }) => (
  <AnimatePresence initial={false}>
    {message && (
      <motion.div
        role="alert"
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: "auto" }}
        exit={{ opacity: 0, height: 0 }}
        transition={transition.ui}
        className="overflow-hidden"
      >
        <div className="flex items-start gap-2 rounded-md border border-danger/30 bg-danger/5 px-4 py-3 text-small text-danger">
          <AlertCircle aria-hidden className="mt-0.5 h-4 w-4 shrink-0" />
          <p>{message}</p>
        </div>
      </motion.div>
    )}
  </AnimatePresence>
);
