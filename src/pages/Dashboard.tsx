import { useMemo, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, CheckCircle2, FileCheck, ListChecks, PieChart } from "lucide-react";
import { motion } from "motion/react";
import { useAuth } from "@/context/AuthContext";
import { copy, orgCopy, TRACKS, TRACK_INDICATORS } from "@/lib/copy";
import { revealGroup, revealItem, inViewOnce } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useOpenCycle } from "@/hooks/useCycles";
import { formatDate } from "@/lib/format";
import type { StatusKey } from "@/lib/status";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import KpiCard from "@/components/shared/KpiCard";
import ProgressRow from "@/components/shared/ProgressRow";
import StatusBadge from "@/components/shared/StatusBadge";

/** Track id -> assessment route slug used by /technical-indicators/:courseSlug */
const TRACK_SLUG: Record<string, string> = {
  "track-orientation": "altawajuh",
  "track-team": "alfariq",
  "track-partnerships": "alsharakat",
  "track-programs": "albaramij",
  "track-impact": "altaathir",
};

interface StoredEvidence {
  indicatorId?: string;
  hidden?: boolean;
}

/**
 * Evidence the organization uploaded on the assessment page (persisted there in
 * localStorage as `evidence-<slug>`). Read only; the assessment page owns the data.
 */
function readEvidence(slug: string): StoredEvidence[] {
  try {
    const raw = localStorage.getItem(`evidence-${slug}`);
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? (parsed as StoredEvidence[]).filter((e) => e && !e.hidden) : [];
  } catch {
    return [];
  }
}

interface TrackProgress {
  id: string;
  name: string;
  slug: string;
  total: number;
  completed: number;
  evidence: number;
  status: StatusKey;
}

const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex items-center gap-3">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className="text-small font-hrsd-medium text-ink">{children}</dd>
  </div>
);

const Dash = () => <span className="text-muted-foreground">—</span>;

const Dashboard = () => {
  const { organizationName } = useAuth();
  const reduced = useReducedMotion();
  const { data: openCycle } = useOpenCycle();

  const tracks = useMemo<TrackProgress[]>(
    () =>
      TRACKS.map((t) => {
        const slug = TRACK_SLUG[t.id];
        const total = TRACK_INDICATORS[t.id] ?? 0;
        const evidence = readEvidence(slug);
        const answered = new Set(evidence.map((e) => e.indicatorId).filter(Boolean)).size;
        const completed = Math.min(answered, total);
        const status: StatusKey = completed === 0 ? "not_started" : "in_progress";
        return { id: t.id, name: t.name, slug, total, completed, evidence: evidence.length, status };
      }),
    []
  );

  const totalIndicators = tracks.reduce((s, t) => s + t.total, 0);
  const completedIndicators = tracks.reduce((s, t) => s + t.completed, 0);
  const evidenceCount = tracks.reduce((s, t) => s + t.evidence, 0);
  const completedTracks = tracks.filter((t) => t.total > 0 && t.completed >= t.total).length;
  const completion = totalIndicators > 0 ? Math.round((completedIndicators / totalIndicators) * 100) : null;
  const overallStatus: StatusKey = completedIndicators > 0 ? "in_progress" : "not_started";

  // Continue where the organization left off: first track that is not complete
  const next = tracks.find((t) => t.completed < t.total) ?? tracks[0];

  return (
    <>
      <PageHeader
        title={organizationName || orgCopy.dashboard_title_fallback}
        description={orgCopy.dashboard_desc}
        breadcrumbs={[{ label: copy.shell_context.organization, to: "/dashboard" }, { label: orgCopy.dashboard_crumb }]}
        actions={
          <Button asChild>
            <Link to={`/technical-indicators/${next.slug}`}>
              {orgCopy.dashboard_continue}
              <ArrowLeft aria-hidden />
            </Link>
          </Button>
        }
        meta={
          <dl
            aria-label={orgCopy.summary_label}
            className="flex flex-wrap items-center gap-x-8 gap-y-3 rounded-lg border border-border bg-card px-5 py-4"
          >
            <Fact label={orgCopy.summary_status}>
              <StatusBadge status={overallStatus} />
            </Fact>
            <Fact label={orgCopy.summary_cycle}>
              {openCycle ? openCycle.name : <Dash />}
            </Fact>
            <Fact label={orgCopy.summary_deadline}>
              {openCycle ? formatDate(openCycle.submissionEnd) : <Dash />}
            </Fact>
          </dl>
        }
      />

      <motion.div
        variants={revealGroup}
        initial={reduced ? false : "hidden"}
        whileInView="visible"
        viewport={inViewOnce}
        className="flex flex-col gap-8"
      >
        <motion.div variants={revealItem} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard label={orgCopy.kpi_indicators} value={completedIndicators} icon={ListChecks} hint={orgCopy.kpi_indicators_hint} />
          <KpiCard label={orgCopy.kpi_evidence} value={evidenceCount} icon={FileCheck} hint={orgCopy.kpi_evidence_hint} />
          <KpiCard label={orgCopy.kpi_tracks} value={completedTracks} icon={CheckCircle2} hint={orgCopy.kpi_tracks_hint} />
          <KpiCard label={orgCopy.kpi_completion} value={completion} suffix="%" icon={PieChart} hint={orgCopy.kpi_completion_hint} />
        </motion.div>

        <motion.section variants={revealItem} aria-labelledby="tracks-title" className="rounded-lg border border-border bg-card">
          <div className="flex flex-col gap-1 border-b border-border px-5 py-4">
            <h2 id="tracks-title" className="text-h3 text-ink">
              {orgCopy.tracks_panel_title}
            </h2>
            <p className="text-small text-muted-foreground">{orgCopy.tracks_panel_note}</p>
          </div>
          <ul className="divide-y divide-border [&>li:last-child>a]:rounded-b-lg">
            {tracks.map((t) => (
              <li key={t.id}>
                <ProgressRow
                  name={t.name}
                  completed={t.completed}
                  total={t.total}
                  status={t.status}
                  to={`/technical-indicators/${t.slug}`}
                  linkLabel={t.completed === 0 ? orgCopy.track_start : orgCopy.track_continue}
                />
              </li>
            ))}
          </ul>
        </motion.section>
      </motion.div>
    </>
  );
};

export default Dashboard;
