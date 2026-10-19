import { useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { format } from "date-fns";
import { AlertCircle, CalendarDays, CalendarIcon, Trash2 } from "lucide-react";
import { adminSetupCopy as t } from "@/lib/copy";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useCycle, useCycleMutations } from "@/hooks/useCycles";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { FieldShell, FormError, TextField } from "@/components/shared/FormField";
import CycleStatusLabel from "@/components/admin/setup/CycleStatusLabel";
import { ConfirmDelete } from "@/components/admin/setup/SetupDialogs";
import { crumbs, CYCLES_PATH } from "@/components/admin/setup/crumbs";
import type { Cycle, CycleInput, CycleStatus } from "@/services/cycleService";

type DateKey = "submissionStart" | "submissionEnd" | "reviewStart" | "reviewEnd" | "approvalStart" | "approvalEnd";
type Dates = Record<DateKey, string>;
type Errors = Partial<Record<DateKey | "name", string>>;

/** Periods in their required order; each must start on or after the previous one ends (cycle_periods_ordered). */
const PERIODS: { legend: string; start: DateKey; end: DateKey; startLabel: string; endLabel: string; id: string }[] = [
  { legend: t.cycle_submission_group, start: "submissionStart", end: "submissionEnd", startLabel: t.cycle_submission_start, endLabel: t.cycle_submission_end, id: "submission" },
  { legend: t.cycle_review_group, start: "reviewStart", end: "reviewEnd", startLabel: t.cycle_review_start, endLabel: t.cycle_review_end, id: "review" },
  { legend: t.cycle_approval_group, start: "approvalStart", end: "approvalEnd", startLabel: t.cycle_approval_start, endLabel: t.cycle_approval_end, id: "approval" },
];

/** Statuses an admin sets from the form; archived is shown only when the cycle already has it. */
const FORM_STATUSES: CycleStatus[] = ["draft", "open", "closed"];

const EMPTY_DATES: Dates = { submissionStart: "", submissionEnd: "", reviewStart: "", reviewEnd: "", approvalStart: "", approvalEnd: "" };

/** yyyy-mm-dd <-> local calendar day (no UTC shift) */
const toDate = (s: string) => (s ? new Date(`${s}T00:00:00`) : undefined);
const toStr = (d: Date) => format(d, "yyyy-MM-dd");

/** Same rules as the database constraint, attached to the field they concern. Dates compare as yyyy-mm-dd strings. */
const validate = (name: string, dates: Dates): Errors => {
  const errs: Errors = {};
  if (!name.trim()) errs.name = t.error_name_required;
  PERIODS.forEach((p, i) => {
    const start = dates[p.start];
    const end = dates[p.end];
    if (!start) errs[p.start] = t.cycle_err_date_required;
    if (!end) errs[p.end] = t.cycle_err_date_required;
    if (start && end && end < start) errs[p.end] = t.cycle_err_end_before_start;
    const prevEnd = i > 0 ? dates[PERIODS[i - 1].end] : "";
    if (start && prevEnd && start < prevEnd) errs[p.start] = t.cycle_err_period_order;
  });
  return errs;
};

interface DateFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
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
          {value ? formatDate(value) : t.cycle_pick_date}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto rounded-lg p-0 shadow-float" align="start">
        <Calendar
          mode="single"
          selected={toDate(value)}
          defaultMonth={toDate(value)}
          onSelect={(d) => onChange(d ? toStr(d) : "")}
          initialFocus
          className="pointer-events-auto p-3"
        />
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

/** New / edit form. `existing` is null for a new cycle. */
const CycleForm = ({ existing }: { existing: Cycle | null }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { create, update, remove } = useCycleMutations();
  const isNew = !existing;

  const [name, setName] = useState(existing?.name ?? "");
  const [status, setStatus] = useState<CycleStatus>(existing?.status ?? "draft");
  const [dates, setDates] = useState<Dates>(() =>
    existing
      ? {
          submissionStart: existing.submissionStart,
          submissionEnd: existing.submissionEnd,
          reviewStart: existing.reviewStart,
          reviewEnd: existing.reviewEnd,
          approvalStart: existing.approvalStart,
          approvalEnd: existing.approvalEnd,
        }
      : EMPTY_DATES
  );
  const [errors, setErrors] = useState<Errors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const saving = create.isPending || update.isPending;

  const save = () => {
    const errs = validate(name, dates);
    setErrors(errs);
    setServerError(null);
    if (Object.keys(errs).length > 0) return;
    const input: CycleInput = { name, status, ...dates };
    const options = {
      onSuccess: () => {
        toast({ title: isNew ? t.cycle_added : t.cycle_saved });
        navigate(CYCLES_PATH);
      },
      onError: (e: Error) => setServerError(e.message),
    };
    if (existing) update.mutate({ id: existing.id, input }, options);
    else create.mutate(input, options);
  };

  const handleDelete = () => {
    if (!existing) return;
    remove.mutate(existing.id, {
      onSuccess: () => {
        toast({ title: t.cycles_deleted });
        navigate(CYCLES_PATH);
      },
      onError: (e) => setServerError(e.message),
    });
  };

  const setDate = (key: DateKey) => (value: string) => {
    setDates((prev) => ({ ...prev, [key]: value }));
    if (errors[key]) setErrors((prev) => ({ ...prev, [key]: undefined }));
  };

  const title = isNew ? t.cycle_new_title : `${t.cycle_title} ${existing.name}`;
  const hasErrors = Object.values(errors).some(Boolean);
  const statusOptions = existing?.status === "archived" ? [...FORM_STATUSES, "archived" as const] : FORM_STATUSES;

  const meta = existing ? (
    <dl className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-5">
      <Fact label={t.status}>
        <CycleStatusLabel status={existing.status} />
      </Fact>
      {PERIODS.map((p) => (
        <Fact key={p.id} label={p.legend}>
          {formatDate(existing[p.start])} – {formatDate(existing[p.end])}
        </Fact>
      ))}
      <Fact label={t.cycle_updated_at}>{formatDate(existing.updatedAt)}</Fact>
    </dl>
  ) : undefined;

  return (
    <>
      <PageHeader
        title={title}
        description={isNew ? t.cycle_new_desc : t.cycle_desc}
        breadcrumbs={crumbs.cycle(title)}
        meta={meta}
        actions={
          <>
            <Button onClick={save} disabled={saving}>
              {isNew ? t.cycle_save_new : t.cycle_save}
            </Button>
            {existing?.status === "draft" && (
              <Button
                variant="outline"
                className="border-danger/40 text-danger hover:bg-danger/5 hover:text-danger"
                onClick={() => setDeleteOpen(true)}
                disabled={remove.isPending}
              >
                <Trash2 aria-hidden /> {t.cycle_delete}
              </Button>
            )}
          </>
        }
      />

      <div className="flex flex-col gap-6">
        <FormError message={serverError ?? (hasErrors ? t.cycle_form_error : null)} />

        <Panel title={t.cycle_info}>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <TextField
              label={t.name}
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
              }}
              error={errors.name}
            />
            <FieldShell id="cycle-status" label={t.status} required>
              <Select value={status} onValueChange={(v) => setStatus(v as CycleStatus)} dir="rtl">
                <SelectTrigger id="cycle-status" className="h-12 text-body">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((s) => (
                    <SelectItem key={s} value={s} disabled={s === "archived"}>
                      {t.cycle_status[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
          </div>
        </Panel>

        <Panel title={t.cycle_periods}>
          <div className="flex flex-col gap-6">
            {PERIODS.map((p, i) => (
              <fieldset key={p.id} className={cn(i > 0 && "border-t border-border pt-6")}>
                <legend className="mb-4 text-small font-hrsd-bold text-ink">{p.legend}</legend>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <DateField id={`${p.id}-start`} label={p.startLabel} value={dates[p.start]} onChange={setDate(p.start)} error={errors[p.start]} />
                  <DateField id={`${p.id}-end`} label={p.endLabel} value={dates[p.end]} onChange={setDate(p.end)} error={errors[p.end]} />
                </div>
              </fieldset>
            ))}
          </div>
        </Panel>
      </div>

      <ConfirmDelete
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={t.cycles_delete_title}
        description={`${t.cycles_delete_desc} ${existing?.name ?? ""}. ${t.delete_irreversible}`}
        onConfirm={handleDelete}
      />
    </>
  );
};

const AdminEvaluationYearDetail = () => {
  const { cycleId } = useParams<{ cycleId: string }>();
  const isNew = cycleId === "new";
  const { data: cycle, isLoading, isError, refetch } = useCycle(isNew ? undefined : cycleId);

  if (isNew) return <CycleForm existing={null} />;

  if (isLoading || isError || !cycle) {
    return (
      <>
        <PageHeader title={t.cycle_title} breadcrumbs={crumbs.cycle(t.cycle_title)} />
        {isLoading ? (
          <SkeletonPanel lines={6} />
        ) : (
          <div className="rounded-lg border border-border bg-card">
            {isError ? (
              <EmptyState icon={AlertCircle} message={t.cycles_load_error} action={{ label: t.retry, onClick: () => void refetch() }} />
            ) : (
              <EmptyState icon={CalendarDays} message={t.cycle_not_found} action={{ label: t.cycle_back, to: CYCLES_PATH }} />
            )}
          </div>
        )}
      </>
    );
  }

  return <CycleForm key={cycle.id} existing={cycle} />;
};

export default AdminEvaluationYearDetail;
