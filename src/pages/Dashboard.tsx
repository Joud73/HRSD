import { useMemo } from "react";
import { AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { orgCopy } from "@/lib/copy";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { useAssessment, useEvidences, useIndicatorScores, useProgress, useTrackScores } from "@/hooks/useAssessment";
import { useMyOrganization } from "@/hooks/useOrganizations";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel, SkeletonProgressRows } from "@/components/shared/Skeletons";
import { scoreLevel } from "@/components/assessment/indicatorUtils";
import IdentityBand from "@/components/dashboard/IdentityBand";
import NextAction from "@/components/dashboard/NextAction";
import SummaryPanel from "@/components/dashboard/SummaryPanel";
import TracksPanel, { type TrackRow } from "@/components/dashboard/TracksPanel";
import { HistoryTable, HowCalculated } from "@/components/dashboard/ResultsSections";

const SCOPE = { kind: "mine" } as const;

/**
 * Organization dashboard. In order: where am I (identity band and journey), what do I do next,
 * how far am I and what is my estimated result, where are my gaps (tracks and indicator squares).
 */
const Dashboard = () => {
  const { organizationName } = useAuth();
  const org = useMyOrganization();
  const tool = useApprovedTool();
  const current = useAssessment(SCOPE);
  const { assessment, editable } = current;
  const id = assessment?.id;
  const progress = useProgress(id);
  const trackScores = useTrackScores(id);
  const indicatorScores = useIndicatorScores(id);
  const evidences = useEvidences(id);

  const bands = useMemo(() => tool.data?.levelBands ?? [], [tool.data]);
  const labels = useMemo(() => tool.data?.levelLabels ?? {}, [tool.data]);

  const tracks: TrackRow[] = useMemo(() => {
    const byTrack = new Map((trackScores.data ?? []).map((s) => [s.trackNumber, s]));
    const indicators = indicatorScores.data ?? [];
    return (tool.data?.tracks ?? []).map((tr) => ({
      number: tr.number,
      name: tr.name,
      score: byTrack.get(tr.number),
      indicators: indicators.filter((i) => i.trackNumber === tr.number).sort((a, b) => a.indicatorNumber - b.indicatorNumber),
    }));
  }, [tool.data, trackScores.data, indicatorScores.data]);

  const firstUncounted = useMemo(
    () =>
      [...(indicatorScores.data ?? [])]
        .sort((a, b) => a.trackNumber - b.trackNumber || a.indicatorNumber - b.indicatorNumber)
        .find((s) => s.itemsMet > s.itemsCounted),
    [indicatorScores.data]
  );

  const loading = current.isLoading || tool.isLoading || (!!id && (progress.isLoading || trackScores.isLoading || indicatorScores.isLoading));
  const failed = current.isError || tool.isError;
  const p = progress.data;

  return (
    <div className="flex flex-col gap-6">
      <IdentityBand
        name={org.data?.name ?? organizationName ?? orgCopy.dashboard_title_fallback}
        registrationNumber={org.data?.registrationNumber ?? null}
        assessment={assessment}
      />

      {loading ? (
        <>
          <SkeletonPanel lines={1} className="relative z-10 -mt-8" />
          <SkeletonPanel lines={4} />
          <SkeletonProgressRows />
        </>
      ) : failed ? (
        <div className="relative z-10 -mt-8 rounded-lg border border-border bg-card">
          <EmptyState
            icon={AlertCircle}
            message={current.error?.message || orgCopy.load_error}
            action={{ label: orgCopy.retry, onClick: () => void Promise.all([current.refetch(), tool.refetch()]) }}
          />
        </div>
      ) : (
        <>
          <NextAction
            assessment={assessment}
            editable={editable}
            progress={p}
            tracks={tracks.map((tr) => ({ number: tr.number, name: tr.name, itemsMet: tr.score?.itemsMet ?? 0, itemsTotal: tr.score?.itemsTotal ?? 0 }))}
          />
          {assessment && p && (
            <>
              <SummaryPanel progress={p} evidenceCount={evidences.data?.length ?? 0} level={scoreLevel(p.scorePct, bands, labels)} firstUncounted={firstUncounted} />
              <TracksPanel tracks={tracks} levelLabels={labels} editable={editable} />
              <HowCalculated bands={bands} labels={labels} />
            </>
          )}
          <HistoryTable bands={bands} labels={labels} />
        </>
      )}
    </div>
  );
};

export default Dashboard;
