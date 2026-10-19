import { useMemo, useState } from "react";
import { AlertCircle, ListTree } from "lucide-react";
import { adminSetupCopy as t } from "@/lib/copy";
import { counted, formatDate } from "@/lib/format";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { Skeleton } from "@/components/ui/skeleton";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import SearchInput from "@/components/admin/setup/SearchInput";
import RubricTree from "@/components/admin/setup/RubricTree";
import { crumbs } from "@/components/admin/setup/crumbs";

const SkeletonRows = () => (
  <div className="divide-y divide-border" aria-hidden>
    {Array.from({ length: 5 }, (_, i) => (
      <div key={i} className="flex items-center gap-3 px-4 py-4">
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-5 w-40" />
        <Skeleton className="h-4 w-48" />
      </div>
    ))}
  </div>
);

/** Approved assessment tool, read only. Any change to the tool is a new version. */
const AdminRubric = () => {
  const { data: tool, isLoading, isError, refetch } = useApprovedTool();
  const tracks = useMemo(() => tool?.tracks ?? [], [tool]);
  const [openIds, setOpenIds] = useState<string[] | null>(null);
  const [search, setSearch] = useState("");

  /* ── Every node id, so a search shows its matches expanded ── */
  const allIds = useMemo(
    () => tracks.flatMap((tr) => [tr.id, ...tr.standards.flatMap((s) => [s.id, ...s.indicators.map((i) => i.id)])]),
    [tracks]
  );

  const hasMatches = useMemo(() => {
    if (!search) return true;
    return tracks.some(
      (tr) =>
        tr.name.includes(search) ||
        tr.standards.some(
          (s) => s.name.includes(search) || s.indicators.some((i) => i.text.includes(search) || i.items.some((b) => b.text.includes(search)))
        )
    );
  }, [tracks, search]);

  // First track open until the admin changes it
  const expanded = openIds ?? (tracks[0] ? [tracks[0].id] : []);

  const c = t.rubric_count;
  const totals = tool?.counts;

  return (
    <>
      <PageHeader
        title={t.rubric_title}
        description={
          tool ? (
            <>
              {t.rubric_desc} {t.rubric_version(tool.code, formatDate(tool.approvedAt))}
            </>
          ) : (
            t.rubric_desc
          )
        }
        breadcrumbs={crumbs.rubric}
        meta={
          totals && totals.tracks > 0 ? (
            <p className="tabular text-small text-muted-foreground">
              {counted(totals.tracks, c.tracks)} · {counted(totals.standards, c.standards)} · {counted(totals.indicators, c.indicators)} ·{" "}
              {counted(totals.items, c.items)}
            </p>
          ) : undefined
        }
      />

      <div className="mb-4">
        <SearchInput value={search} onChange={setSearch} placeholder={t.rubric_search} className="sm:w-96" />
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card" aria-busy={isLoading || undefined}>
        {isLoading ? (
          <SkeletonRows />
        ) : isError ? (
          <EmptyState icon={AlertCircle} message={t.rubric_load_error} action={{ label: t.retry, onClick: () => void refetch() }} />
        ) : tracks.length === 0 ? (
          <EmptyState icon={ListTree} message={t.rubric_empty} />
        ) : !hasMatches ? (
          <EmptyState icon={ListTree} message={t.rubric_no_match} action={{ label: t.rubric_clear_search, onClick: () => setSearch("") }} />
        ) : (
          <RubricTree tracks={tracks} search={search} openIds={search ? allIds : expanded} onOpenChange={setOpenIds} />
        )}
      </div>
    </>
  );
};

export default AdminRubric;
