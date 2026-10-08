import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CalendarDays, CalendarIcon, Trash2 } from "lucide-react";
import { adminSetupCopy as t } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { FieldShell, FormError, TextField } from "@/components/shared/FormField";
import YearStateLabel from "@/components/admin/setup/YearStateLabel";
import { ConfirmDelete } from "@/components/admin/setup/SetupDialogs";
import { crumbs, YEARS_PATH } from "@/components/admin/setup/crumbs";
import { getYearState, yearSeed, type EvaluationYear } from "@/components/admin/setup/evaluationYears";

type DateKey = "submissionStart" | "submissionEnd" | "evaluationStart" | "evaluationEnd";
type Errors = Partial<Record<DateKey, string>>;

const toDate = (s: string) => new Date(s + "T00:00:00");
const toStr = (d: Date) => d.toISOString().slice(0, 10);

interface DateFieldProps {
  id: string;
  label: string;
  value?: Date;
  onChange: (d?: Date) => void;
  error?: string;
}

const DateField = ({ id, label, value, onChange, error }: DateFieldProps) => (
  <FieldShell id={id} label={label} error={error} required>
    <Popover>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className={cn(
            "h-12 w-full justify-start gap-3 text-body font-hrsd-regular",
            !value && "text-muted-foreground",
            error && "border-danger"
          )}
        >
          <CalendarIcon aria-hidden className="text-muted-foreground" />
          {value ? formatDate(value) : t.year_pick_date}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-lg p-0 shadow-float" align="start">
        <Calendar mode="single" selected={value} onSelect={(d) => onChange(d ?? undefined)} initialFocus className="pointer-events-auto p-3" />
      </PopoverContent>
    </Popover>
  </FieldShell>
);

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex min-w-0 flex-col gap-1 bg-card px-5 py-4">
    <dt className="text-caption text-muted-foreground">{label}</dt>
    <dd className="text-small font-hrsd-medium text-ink">{children}</dd>
  </div>
);

const Panel = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="rounded-lg border border-border bg-card p-6">
    <h2 className="mb-5 text-h3 text-ink">{title}</h2>
    {children}
  </section>
);

const AdminEvaluationYearDetail = () => {
  const { yearId } = useParams<{ yearId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isNew = yearId === "new";

  const existing = !isNew ? yearSeed.find((y) => y.id === yearId) : null;

  const [yearNumber, setYearNumber] = useState(existing?.yearNumber ?? new Date().getFullYear());
  const [submissionStart, setSubmissionStart] = useState<Date | undefined>(existing ? toDate(existing.submissionStart) : undefined);
  const [submissionEnd, setSubmissionEnd] = useState<Date | undefined>(existing ? toDate(existing.submissionEnd) : undefined);
  const [evaluationStart, setEvaluationStart] = useState<Date | undefined>(existing ? toDate(existing.evaluationStart) : undefined);
  const [evaluationEnd, setEvaluationEnd] = useState<Date | undefined>(existing ? toDate(existing.evaluationEnd) : undefined);
  const [errors, setErrors] = useState<Errors>({});
  const [deleteOpen, setDeleteOpen] = useState(false);

  const currentYear: EvaluationYear | null =
    submissionStart && submissionEnd && evaluationStart && evaluationEnd
      ? {
          id: yearId ?? "new",
          yearNumber,
          submissionStart: toStr(submissionStart),
          submissionEnd: toStr(submissionEnd),
          evaluationStart: toStr(evaluationStart),
          evaluationEnd: toStr(evaluationEnd),
          updatedAt: new Date().toISOString().slice(0, 10),
        }
      : null;
  const state = currentYear ? getYearState(currentYear) : null;

  /** Same rules as before, attached to the field they concern */
  const validate = (): Errors => {
    const errs: Errors = {};
    if (!submissionStart) errs.submissionStart = t.year_err_submission_start;
    if (!submissionEnd) errs.submissionEnd = t.year_err_submission_end;
    if (!evaluationStart) errs.evaluationStart = t.year_err_evaluation_start;
    if (!evaluationEnd) errs.evaluationEnd = t.year_err_evaluation_end;
    if (submissionStart && submissionEnd && submissionEnd < submissionStart) errs.submissionEnd = t.year_err_submission_order;
    if (evaluationStart && evaluationEnd && evaluationEnd < evaluationStart) errs.evaluationEnd = t.year_err_evaluation_order;
    if (evaluationStart && submissionStart && evaluationStart < submissionStart) errs.evaluationStart = t.year_err_evaluation_after;
    return errs;
  };

  const save = () => {
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;
    toast({ title: isNew ? t.year_added : t.year_saved });
    navigate(YEARS_PATH);
  };

  const handleDelete = () => {
    toast({ title: t.years_deleted });
    navigate(YEARS_PATH);
  };

  const setDate = (key: DateKey, setter: (d?: Date) => void) => (d?: Date) => {
    setter(d);
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  if (!isNew && !existing) {
    return (
      <>
        <PageHeader title={t.year_title} breadcrumbs={crumbs.year(t.year_title)} />
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={CalendarDays} message={t.year_not_found} action={{ label: t.year_back, to: YEARS_PATH }} />
        </div>
      </>
    );
  }

  const title = isNew ? t.year_new_title : `${t.year_title} ${existing?.yearNumber ?? ""}`;
  const hasErrors = Object.values(errors).some(Boolean);

  const meta = existing ? (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
      <Fact label={t.status}>{state ? <YearStateLabel state={state} /> : "—"}</Fact>
      <Fact label={t.year_submission_group}>
        {formatDate(existing.submissionStart)} – {formatDate(existing.submissionEnd)}
      </Fact>
      <Fact label={t.year_evaluation_group}>
        {formatDate(existing.evaluationStart)} – {formatDate(existing.evaluationEnd)}
      </Fact>
      <Fact label={t.years_col_updated}>{formatDate(existing.updatedAt)}</Fact>
    </dl>
  ) : undefined;

  return (
    <>
      <PageHeader
        title={title}
        description={isNew ? t.year_new_desc : t.year_desc}
        breadcrumbs={crumbs.year(title)}
        meta={meta}
        actions={
          <>
            <Button onClick={save}>{isNew ? t.year_save_new : t.year_save}</Button>
            {!isNew && (
              <Button variant="outline" className="border-danger/40 text-danger hover:bg-danger/5 hover:text-danger" onClick={() => setDeleteOpen(true)}>
                <Trash2 aria-hidden /> {t.year_delete}
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <FormError message={hasErrors ? t.year_form_error : null} />

        <Panel title={t.year_info}>
          <TextField
            label={t.year_field_year}
            type="number"
            inputMode="numeric"
            value={yearNumber}
            onChange={(e) => setYearNumber(Number(e.target.value))}
            disabled={!isNew}
            fieldClassName="max-w-[240px]"
            className="tabular"
          />
        </Panel>

        <Panel title={t.year_periods}>
          <div className="flex flex-col gap-6">
            <fieldset>
              <legend className="mb-4 text-small font-hrsd-bold text-ink">{t.year_submission_group}</legend>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <DateField id="submission-start" label={t.year_submission_start} value={submissionStart} onChange={setDate("submissionStart", setSubmissionStart)} error={errors.submissionStart} />
                <DateField id="submission-end" label={t.year_submission_end} value={submissionEnd} onChange={setDate("submissionEnd", setSubmissionEnd)} error={errors.submissionEnd} />
              </div>
            </fieldset>
            <div className="border-t border-border pt-6">
              <fieldset>
                <legend className="mb-4 text-small font-hrsd-bold text-ink">{t.year_evaluation_group}</legend>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <DateField id="evaluation-start" label={t.year_evaluation_start} value={evaluationStart} onChange={setDate("evaluationStart", setEvaluationStart)} error={errors.evaluationStart} />
                  <DateField id="evaluation-end" label={t.year_evaluation_end} value={evaluationEnd} onChange={setDate("evaluationEnd", setEvaluationEnd)} error={errors.evaluationEnd} />
                </div>
              </fieldset>
            </div>
          </div>
        </Panel>
      </div>

      <ConfirmDelete
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t.years_delete_title}
        description={`${t.years_delete_desc} ${yearNumber}. ${t.delete_irreversible}`}
        onConfirm={handleDelete}
      />
    </>
  );
};

export default AdminEvaluationYearDetail;
