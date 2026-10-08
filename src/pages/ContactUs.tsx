import { useState, type FormEvent } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { copy, pagesCopy } from "@/lib/copy";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import Section from "@/components/layout/Section";
import { FieldShell, TextField } from "@/components/shared/FormField";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

const MAIL_TO = "joudAldhuwaihi@aol.edu.sa";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type FormData = { name: string; email: string; phone: string; organizationName: string; message: string };
type Errors = Partial<Record<"name" | "email" | "message", string>>;

const EMPTY: FormData = { name: "", email: "", phone: "", organizationName: "", message: "" };

const validate = (data: FormData): Errors => {
  const errors: Errors = {};
  if (!data.name.trim()) errors.name = pagesCopy.contact_error_name;
  if (!data.email.trim()) errors.email = copy.login_error_email_required;
  else if (!EMAIL_PATTERN.test(data.email.trim())) errors.email = copy.login_error_email_invalid;
  if (!data.message.trim()) errors.message = pagesCopy.contact_error_message;
  return errors;
};

const ContactUs = () => {
  const [formData, setFormData] = useState<FormData>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});
  const [submitted, setSubmitted] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (field: keyof FormData, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    if (submitted) setErrors(validate(next));
  };

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setSubmitted(true);
    const found = validate(formData);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setIsLoading(true);

    // Fallback to mailto since no edge function is configured
    const labels = pagesCopy.contact_mail_body;
    const subject = encodeURIComponent(pagesCopy.contact_mail_subject);
    const body = encodeURIComponent(
      `${labels.name}: ${formData.name}\n${labels.email}: ${formData.email}\n${labels.phone}: ${formData.phone}\n${labels.org}: ${formData.organizationName}\n\n${labels.message}:\n${formData.message}`
    );
    window.open(`mailto:${MAIL_TO}?subject=${subject}&body=${body}`, "_blank");

    setTimeout(() => {
      setIsLoading(false);
      setIsSent(true);
      setSubmitted(false);
      setFormData(EMPTY);
    }, 500);
  };

  const handleDirectEmail = () => {
    const labels = pagesCopy.contact_mail_body;
    const subject = encodeURIComponent(pagesCopy.contact_mail_subject);
    const body = encodeURIComponent(`${labels.name}: \n${labels.email}: \n${labels.org}: \n\n${labels.message}:\n`);
    window.open(`mailto:${MAIL_TO}?subject=${subject}&body=${body}`, "_blank");
  };

  // No published contact details yet: each row shows a muted dash until real values exist.
  const details: { label: string; value: string | null }[] = [
    { label: pagesCopy.contact_detail_email, value: null },
    { label: pagesCopy.contact_detail_phone, value: null },
    { label: pagesCopy.contact_detail_hours, value: null },
    { label: pagesCopy.contact_detail_address, value: null },
  ];

  return (
    <Section id="contact">
      <header className="mb-8 max-w-[720px] md:mb-12">
        <h1 className="text-h1 text-primary">{copy.nav_contact}</h1>
        <p className="mt-2 text-body text-muted-foreground">{pagesCopy.contact_subtitle}</p>
      </header>
      <div className="grid gap-8 lg:grid-cols-12 lg:gap-12">
        <div className="rounded-lg border border-border bg-card p-6 md:p-8 lg:col-span-7">
          <AnimatePresence mode="wait" initial={false}>
            {isSent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition.ui}
                role="status"
                className="flex flex-col items-start gap-4 py-8"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-success/10 text-success">
                  <CheckCircle2 aria-hidden className="h-6 w-6" />
                </span>
                <div>
                  <h3 className="text-h3 text-ink">{pagesCopy.contact_success_title}</h3>
                  <p className="mt-1 text-body text-muted-foreground">{pagesCopy.contact_success_desc}</p>
                </div>
                <Button variant="outline" className="h-12 px-6 text-body" onClick={() => setIsSent(false)}>
                  {pagesCopy.contact_success_again}
                </Button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={transition.ui}
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-6"
              >
                <h3 className="text-h3 text-ink">{pagesCopy.contact_form_title}</h3>

                <TextField
                  label={pagesCopy.contact_name}
                  placeholder={pagesCopy.contact_name_ph}
                  autoComplete="name"
                  required
                  value={formData.name}
                  error={errors.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <TextField
                    label={copy.login_email}
                    type="email"
                    dir="ltr"
                    placeholder={pagesCopy.contact_email_ph}
                    autoComplete="email"
                    required
                    value={formData.email}
                    error={errors.email}
                    className="text-end"
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                  <TextField
                    label={pagesCopy.contact_phone}
                    type="tel"
                    dir="ltr"
                    autoComplete="tel"
                    hint={pagesCopy.contact_optional}
                    value={formData.phone}
                    className="text-end"
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>

                <TextField
                  label={pagesCopy.contact_org}
                  autoComplete="organization"
                  hint={pagesCopy.contact_optional}
                  value={formData.organizationName}
                  onChange={(e) => handleInputChange("organizationName", e.target.value)}
                />

                <FieldShell id="contact-message" label={pagesCopy.contact_message} required error={errors.message}>
                  <Textarea
                    id="contact-message"
                    placeholder={pagesCopy.contact_message_ph}
                    required
                    rows={6}
                    value={formData.message}
                    aria-invalid={errors.message ? true : undefined}
                    aria-describedby={errors.message ? "contact-message-error" : undefined}
                    onChange={(e) => handleInputChange("message", e.target.value)}
                    className="min-h-[160px] resize-y px-4 py-3 text-body transition-[border-color,box-shadow] duration-micro ease-standard hover:border-ink/30 aria-[invalid=true]:border-danger"
                  />
                </FieldShell>

                <div>
                  <Button type="submit" disabled={isLoading} aria-busy={isLoading} className="h-12 w-full px-8 text-body sm:w-auto">
                    {isLoading ? pagesCopy.contact_submitting : pagesCopy.contact_submit}
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <aside className="lg:col-span-5" aria-labelledby="contact-details-title">
          <h3 id="contact-details-title" className="text-h3 text-ink">
            {pagesCopy.contact_details_title}
          </h3>
          <dl className="mt-4 flex flex-col divide-y divide-border border-y border-border">
            {details.map((item) => (
              <div key={item.label} className="flex flex-wrap items-center justify-between gap-3 py-4">
                <dt className="text-small text-muted-foreground">{item.label}</dt>
                <dd className={cn("text-small", item.value ? "font-hrsd-medium text-ink" : "text-muted-foreground")}>
                  {item.value ?? "—"}
                </dd>
              </div>
            ))}
          </dl>
          <Button variant="outline" className="mt-6 h-12 px-6 text-body" onClick={handleDirectEmail}>
            <Mail aria-hidden />
            {pagesCopy.contact_direct_email}
          </Button>
        </aside>
      </div>
    </Section>
  );
};

export default ContactUs;
