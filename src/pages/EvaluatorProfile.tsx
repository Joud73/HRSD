import { useState, type FormEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { evaluatorCopy as t, fieldsCopy } from "@/lib/copy";
import { useToast } from "@/hooks/use-toast";
import { useEvaluator, useUpdateMyContact } from "@/hooks/useEvaluators";
import type { Evaluator } from "@/services/evaluatorService";
import { Button } from "@/components/ui/button";
import AccountProfile from "@/components/shared/AccountProfile";
import { FormError } from "@/components/shared/FormField";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { EvaluatorFields } from "@/components/shared/ProfileFields";
import { validateEvaluator, type EvaluatorErrors, type EvaluatorFormValues } from "@/components/shared/profileForm";

/** المقيم edits their contact fields and employer; the ID and name are read only (set by the admin). */
const ContactForm = ({ evaluator }: { evaluator: Evaluator }) => {
  const { toast } = useToast();
  const save = useUpdateMyContact(evaluator.userId);
  const [form, setForm] = useState<EvaluatorFormValues>(() => ({
    idNumber: evaluator.idNumber ?? "",
    fullName: evaluator.fullName,
    mobile: evaluator.mobile ?? "",
    email: evaluator.email ?? "",
    employer: evaluator.employer ?? "",
  }));
  const [errors, setErrors] = useState<EvaluatorErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const errs = validateEvaluator(form);
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length > 0) return;
    save.mutate(form, {
      onSuccess: () => toast({ title: t.profile_saved }),
      onError: (err) => setServerError(err.message),
    });
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-6 p-6">
      <FormError message={serverError} />
      <div className="grid gap-6 md:grid-cols-2">
        <EvaluatorFields idPrefix="my-evaluator" values={form} onChange={setForm} errors={errors} locked={["idNumber", "fullName"]} />
      </div>
      <Button type="submit" disabled={save.isPending} className="h-12 w-full px-8 text-body sm:w-auto sm:self-start">
        {t.profile_save}
      </Button>
    </form>
  );
};

const EvaluatorData = () => {
  const { user } = useAuth();
  const { data: evaluator, isLoading, isError, refetch } = useEvaluator(user?.id);

  return (
    <section className="mt-6 max-w-3xl rounded-lg border border-border bg-card">
      <div className="border-b border-border px-6 py-4">
        <h2 className="text-h3 text-ink">{fieldsCopy.section_evaluator}</h2>
        <p className="mt-1 text-small text-muted-foreground">{t.profile_data_desc}</p>
      </div>
      {isLoading ? (
        <div className="p-6">
          <SkeletonPanel lines={5} />
        </div>
      ) : isError ? (
        <div className="flex flex-col items-start gap-3 p-6">
          <p className="text-small text-danger">{t.profile_load_error}</p>
          <Button variant="outline" size="sm" onClick={() => void refetch()}>
            {t.profile_retry}
          </Button>
        </div>
      ) : !evaluator?.hasProfile ? (
        <p className="p-6 text-small text-muted-foreground">{t.profile_missing}</p>
      ) : (
        <ContactForm key={JSON.stringify(evaluator)} evaluator={evaluator} />
      )}
    </section>
  );
};

const EvaluatorProfile = () => (
  <AccountProfile role="evaluator" home="/evaluator">
    <EvaluatorData />
  </AccountProfile>
);

export default EvaluatorProfile;
