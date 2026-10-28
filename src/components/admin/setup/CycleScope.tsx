import { useMemo, useState } from "react";
import { AlertCircle, Info, ListTree } from "lucide-react";
import { adminSetupCopy as t } from "@/lib/copy";
import { counted, formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { useCycleExclusions, useCycleScopeMutations } from "@/hooks/useCycles";
import type { Cycle } from "@/services/cycleService";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import EmptyState from "@/components/shared/EmptyState";
import { FieldShell, FormError } from "@/components/shared/FormField";
import SearchInput from "@/components/admin/setup/SearchInput";
import RubricTree, { type RubricSelection } from "@/components/admin/setup/RubricTree";
import { FormDialog } from "@/components/admin/setup/SetupDialogs";

const c = t.rubric_count;

/** Exclusion waiting for its optional reason */
interface Pending {
  itemIds: string[];
  label: string;
}

/**
 * "نطاق التقييم في الدورة": the approved tool tree with a tri-state checkbox per node. Checked = included.
 * Unchecking a node excludes every item under it in one insert (after an optional reason); checking includes
 * them again in one delete. Editable while the cycle is draft or open (the database enforces it too).
 */
const CycleScope = ({ cycle }: { cycle: Cycle }) => {
  const { toast } = useToast();
  const tool = useApprovedTool();
  const exclusions = useCycleExclusions(cycle.id);
  const { exclude, include } = useCycleScopeMutations(cycle.id);

  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<string[] | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const tracks = useMemo(() => tool.data?.tracks ?? [], [tool.data]);
  const reasons = useMemo(() => new Map((exclusions.data ?? []).map((x) => [x.itemId, x.reason])), [exclusions.data]);
  const allIds = useMemo(
    () => tracks.flatMap((tr) => [tr.id, ...tr.standards.flatMap((s) => [s.id, ...s.indicators.map((i) => i.id)])]),
    [tracks]
  );

  const editable = cycle.status === "draft" || cycle.status === "open";
  const busy = exclude.isPending || include.isPending;
  const total = tool.data?.counts.items ?? 0;
  const excludedInTool = useMemo(
    () => tracks.reduce((n, tr) => n + tr.standards.reduce((m, s) => m + s.indicators.reduce((k, i) => k + i.items.filter((b) => reasons.has(b.id)).length, 0), 0), 0),
    [tracks, reasons]
  );

  const toggle = (itemIds: string[], label: string, included: boolean | "indeterminate") => {
    setError(null);
    if (included === true) {
      // Uncheck: exclude the items still included, after the optional reason
      setReason("");
      setPending({ itemIds: itemIds.filter((id) => !reasons.has(id)), label });
      return;
    }
    // Unchecked or partly checked: include everything under the node
    const ids = itemIds.filter((id) => reasons.has(id));
    include.mutate(ids, {
      onSuccess: () => toast({ title: t.scope_included_toast(counted(ids.length, c.items)) }),
      onError: (e) => setError(e.message),
    });
  };

  const confirmExclude = () => {
    if (!pending || busy) return;
    const count = pending.itemIds.length;
    exclude.mutate(
      { itemIds: pending.itemIds, reason: reason || null },
      {
        onSuccess: () => {
          toast({ title: t.scope_excluded_toast(counted(count, c.items)) });
          setPending(null);
        },
        onError: (e) => setError(e.message),
      }
    );
  };

  const selection: RubricSelection = {
    control: (itemIds, label) => {
      const excluded = itemIds.filter((id) => reasons.has(id)).length;
      const state = excluded === 0 ? true : excluded === itemIds.length ? false : "indeterminate";
      return (
        <Checkbox
          checked={state}
          disabled={!editable || busy || itemIds.length === 0}
          onCheckedChange={() => toggle(itemIds, label, state)}
          aria-label={t.scope_include_label(label)}
          className="h-5 w-5 shrink-0"
        />
      );
    },
    isMuted: (itemId) => reasons.has(itemId),
    itemNote: (itemId) => {
      if (!reasons.has(itemId)) return null;
      const why = reasons.get(itemId);
      return (
        <span className="rounded-full bg-section-alt px-2 py-0.5 text-caption text-muted-foreground">
          {why ? t.scope_excluded_reason(why) : t.scope_excluded}
        </span>
      );
    },
  };

  const loading = tool.isLoading || exclusions.isLoading;
  const failed = tool.isError || exclusions.isError;
  const mismatch = !!tool.data && tool.data.id !== cycle.toolVersionId;
  const expanded = search ? allIds : openIds ?? (tracks[0] ? [tracks[0].id] : []);

  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 rounded-lg border border-border bg-card p-6">
        <p className="text-small text-muted-foreground">{t.scope_desc}</p>
        <p role="status" aria-live="polite" className="tabular text-body font-hrsd-bold text-ink">
          {t.scope_active(formatNumber(total - excludedInTool), formatNumber(total))}
        </p>
        {!editable && (
          <p className="flex items-center gap-2 text-small text-muted-foreground">
            <Info aria-hidden className="h-4 w-4 shrink-0" />
            {t.scope_locked}
          </p>
        )}
        <FormError message={pending ? null : error} />
      </div>

      <SearchInput value={search} onChange={setSearch} placeholder={t.rubric_search} className="sm:w-96" />

      <div className="overflow-hidden rounded-lg border border-border bg-card" aria-busy={loading || busy || undefined}>
        {loading ? (
          <div className="flex flex-col gap-3 p-4" aria-hidden>
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-6 w-2/3" />
            ))}
          </div>
        ) : failed ? (
          <EmptyState
            icon={AlertCircle}
            message={t.scope_load_error}
            action={{ label: t.retry, onClick: () => void Promise.all([tool.refetch(), exclusions.refetch()]) }}
          />
        ) : mismatch ? (
          <EmptyState icon={ListTree} message={t.scope_tool_mismatch} />
        ) : tracks.length === 0 ? (
          <EmptyState icon={ListTree} message={t.rubric_empty} />
        ) : (
          <RubricTree tracks={tracks} search={search} openIds={expanded} onOpenChange={setOpenIds} selection={selection} />
        )}
      </div>

      {pending && (
        <FormDialog
          open
          onOpenChange={(open) => !open && !busy && setPending(null)}
          title={t.scope_dialog_title}
          description={t.scope_dialog_desc(counted(pending.itemIds.length, c.items), pending.label)}
          submitLabel={t.scope_confirm}
          onSubmit={confirmExclude}
        >
          <FormError message={error} />
          {cycle.status === "open" && <p className="text-small text-warning">{t.scope_dialog_open_note}</p>}
          <FieldShell id="scope-reason" label={t.scope_reason} hint={t.scope_reason_hint}>
            <Textarea id="scope-reason" value={reason} onChange={(e) => setReason(e.target.value)} rows={3} className="text-body" />
          </FieldShell>
        </FormDialog>
      )}
    </section>
  );
};

export default CycleScope;
