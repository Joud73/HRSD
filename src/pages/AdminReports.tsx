import { useMemo, useState, type ReactNode } from "react";
import {
  Award, Check, ChevronDown, Copy, Download, FileSpreadsheet, FileText, SlidersHorizontal, Share2, TrendingDown, TrendingUp,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { copy, adminSetupCopy as t } from "@/lib/copy";
import { formatNumber, formatPercent } from "@/lib/format";
import { toStatusKey, type StatusKey } from "@/lib/status";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useToast } from "@/hooks/use-toast";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import PageHeader from "@/components/shared/PageHeader";
import KpiCard from "@/components/shared/KpiCard";
import DataTable, { type Column } from "@/components/shared/DataTable";
import EmptyState from "@/components/shared/EmptyState";
import StatusBadge from "@/components/shared/StatusBadge";
import SegmentedControl from "@/components/shared/SegmentedControl";
import { FieldShell } from "@/components/shared/FormField";
import { crumbs } from "@/components/admin/setup/crumbs";
import {
  SHARE_URL, assocReports2025, assocReports2026, evalReports, reportTracks, trackCompData, yearCompData,
  type AssocReport, type EvaluatorReport,
} from "@/components/admin/setup/reportsMock";

/* ── Chart tokens: primary and neutral only ── */
const C_PRIMARY = "hsl(var(--primary))";
const C_NEUTRAL = "hsl(var(--neutral))";
const C_GRID = "hsl(var(--border))";
const tick = { fontSize: 12, fill: "hsl(var(--muted-foreground))" };
const tooltipStyle = {
  fontSize: 12,
  borderRadius: 8,
  border: "1px solid hsl(var(--border))",
  background: "hsl(var(--card))",
  boxShadow: "var(--shadow-float)",
  direction: "rtl" as const,
};
const CHART_HEIGHT = 260;

const days = (n: number) => `${formatNumber(n)} ${n >= 3 && n <= 10 ? t.day_few : t.day_one}`;

const YEARS = [2026, 2025] as const;
const DEFAULT_RANGE = [0, 100];
type StatusFilter = "all" | StatusKey;
type CompMode = "single" | "dual";

/* ── Building blocks ── */

const Panel = ({ title, aside, children, className }: { title: string; aside?: ReactNode; children: ReactNode; className?: string }) => (
  <section className={cn("rounded-lg border border-border bg-card p-6", className)}>
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <h2 className="text-h3 text-ink">{title}</h2>
      {aside}
    </div>
    {children}
  </section>
);

const LegendKey = ({ items }: { items: { label: string; color: "primary" | "neutral" }[] }) => (
  <ul className="flex items-center gap-4 text-caption text-muted-foreground">
    {items.map((i) => (
      <li key={i.label} className="inline-flex items-center gap-2">
        <span aria-hidden className={cn("h-2.5 w-2.5 rounded-sm", i.color === "primary" ? "bg-primary" : "bg-neutral")} />
        <span className="tabular">{i.label}</span>
      </li>
    ))}
  </ul>
);

const InlineBar = ({ value }: { value: number }) => (
  <div className="flex items-center gap-3">
    <div className="h-1.5 w-16 shrink-0 overflow-hidden rounded-full bg-section-alt">
      <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
    <span className="tabular text-small text-ink">{formatPercent(value)}</span>
  </div>
);

const Facts = ({ items }: { items: { label: string; value: ReactNode }[] }) => (
  <dl className={cn("grid grid-cols-1 gap-px overflow-hidden rounded-lg border border-border bg-border", items.length === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2")}>
    {items.map((f) => (
      <div key={f.label} className="flex flex-col gap-1 bg-card px-4 py-3">
        <dt className="text-caption text-muted-foreground">{f.label}</dt>
        <dd className="text-small font-hrsd-medium text-ink">{f.value}</dd>
      </div>
    ))}
  </dl>
);

const tabTriggerClass =
  "relative h-11 rounded-none bg-transparent px-1 text-small font-hrsd-medium text-muted-foreground transition-colors duration-micro hover:text-ink data-[state=active]:bg-transparent data-[state=active]:text-primary data-[state=active]:shadow-none after:absolute after:inset-x-0 after:-bottom-px after:h-0.5 after:origin-center after:scale-x-0 after:bg-primary after:transition-transform after:duration-ui data-[state=active]:after:scale-x-100 motion-reduce:after:transition-none";
const tabContentClass = "mt-6 flex flex-col gap-6 data-[state=active]:animate-in data-[state=active]:fade-in-0 data-[state=active]:duration-ui motion-reduce:animate-none";

/* ── Page ── */

const AdminReports = () => {
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const [year, setYear] = useState<number>(2026);
  const [trackFilter, setTrackFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [scoreRange, setScoreRange] = useState(DEFAULT_RANGE);
  const [progressRange, setProgressRange] = useState(DEFAULT_RANGE);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [reportModal, setReportModal] = useState<AssocReport | null>(null);
  const [evalModal, setEvalModal] = useState<EvaluatorReport | null>(null);
  const [copied, setCopied] = useState(false);
  const [trackCompMode, setTrackCompMode] = useState<CompMode>("dual");

  const comingSoon = () => toast({ title: t.reports_soon_title, description: t.reports_soon_desc });

  const allAssocReports = year === 2026 ? assocReports2026 : assocReports2025;

  const filteredAssoc = useMemo(() => {
    return allAssocReports.filter((r) => {
      if (trackFilter !== "all" && r.track !== trackFilter) return false;
      if (typeFilter !== "all" && !r.name.includes(typeFilter)) return false;
      if (statusFilter !== "all" && toStatusKey(r.status) !== statusFilter) return false;
      if (r.avgScore < scoreRange[0] || r.avgScore > scoreRange[1]) return false;
      if (r.progress < progressRange[0] || r.progress > progressRange[1]) return false;
      return true;
    });
  }, [allAssocReports, trackFilter, typeFilter, statusFilter, scoreRange, progressRange]);

  const resetFilters = () => {
    setTrackFilter("all");
    setTypeFilter("all");
    setStatusFilter("all");
    setScoreRange(DEFAULT_RANGE);
    setProgressRange(DEFAULT_RANGE);
  };

  // KPIs: a dash when no association matches, never a zero
  const n = filteredAssoc.length;
  const avgCompliance = n ? Math.round(filteredAssoc.reduce((s, r) => s + r.compliance, 0) / n) : null;
  const avgScore = n ? Math.round(filteredAssoc.reduce((s, r) => s + r.avgScore, 0) / n) : null;
  const byScore = [...filteredAssoc].sort((a, b) => b.avgScore - a.avgScore);
  const topPerformer = byScore[0];
  const bottomPerformer = byScore[byScore.length - 1];
  const top5 = byScore.slice(0, 5);
  const bottom5 = [...byScore].reverse().slice(0, 5);

  const trackPerfData = reportTracks.map((tr) => {
    const subset = filteredAssoc.filter((r) => r.track === tr);
    return { name: tr, value: subset.length ? Math.round(subset.reduce((s, r) => s + r.avgScore, 0) / subset.length) : 0 };
  });

  const evalDurationData = evalReports.map((e) => ({ name: e.name, value: e.avgDuration }));
  const evalScoreData = evalReports.map((e) => ({ name: e.name, value: e.avgScore }));

  const handleCopyLink = () => {
    navigator.clipboard.writeText(SHARE_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const showYear = (y: "2025" | "2026") => trackCompMode === "dual" || String(year) === y;

  const anim = { isAnimationActive: !reduced, animationDuration: 600 };

  /* ── Tables ── */
  const assocColumns: Column<AssocReport>[] = [
    { key: "name", header: t.col_association, cell: (r) => <span className="font-hrsd-medium text-ink">{r.name}</span> },
    { key: "track", header: t.col_track, cell: (r) => r.track },
    { key: "progress", header: t.col_progress, cell: (r) => <InlineBar value={r.progress} /> },
    { key: "score", header: t.col_avg_score, cell: (r) => <span className="tabular font-hrsd-medium">{formatPercent(r.avgScore)}</span> },
    { key: "compliance", header: t.col_compliance, cell: (r) => <span className="tabular">{formatPercent(r.compliance)}</span> },
    { key: "status", header: t.status, cell: (r) => <StatusBadge status={r.status} /> },
    {
      key: "action",
      header: <span className="sr-only">{t.actions}</span>,
      align: "end",
      cell: (r) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary"
          onClick={(e) => {
            e.stopPropagation();
            setReportModal(r);
          }}
        >
          {t.view_report}
        </Button>
      ),
    },
  ];

  const evalColumns: Column<EvaluatorReport>[] = [
    { key: "name", header: t.col_evaluator, cell: (e) => <span className="font-hrsd-medium text-ink">{e.name}</span> },
    { key: "assigned", header: t.col_assigned, cell: (e) => <span className="tabular">{formatNumber(e.assignedCount)}</span> },
    { key: "duration", header: t.col_avg_duration, cell: (e) => <span className="tabular">{days(e.avgDuration)}</span> },
    { key: "score", header: t.kpi_avg_score, cell: (e) => <InlineBar value={e.avgScore} /> },
    { key: "compliance", header: t.col_compliance, cell: (e) => <span className="tabular">{formatPercent(e.compliance)}</span> },
    {
      key: "action",
      header: <span className="sr-only">{t.actions}</span>,
      align: "end",
      cell: (e) => (
        <Button
          variant="ghost"
          size="sm"
          className="text-primary hover:text-primary"
          onClick={(ev) => {
            ev.stopPropagation();
            setEvalModal(e);
          }}
        >
          {t.view_performance}
        </Button>
      ),
    },
  ];

  /* ── Year-over-year change, computed from the comparison data ── */
  const changes = yearCompData.slice(0, 2).map((m) => {
    const rel = ((m["2026"] - m["2025"]) / m["2025"]) * 100;
    return { metric: m.metric, rel };
  });

  const statusOptions: { value: StatusFilter; label: string }[] = [
    { value: "all", label: copy.filter_all },
    { value: "not_started", label: copy.status_not_started },
    { value: "in_progress", label: copy.status_in_progress },
    { value: "submitted", label: copy.status_submitted },
  ];

  return (
    <>
      <PageHeader
        title={copy.nav_admin.reports}
        description={t.reports_desc}
        breadcrumbs={crumbs.reports}
        actions={
          <>
            <DropdownMenu dir="rtl">
              <DropdownMenuTrigger asChild>
                <Button>
                  <Download aria-hidden /> {t.reports_export} <ChevronDown aria-hidden className="opacity-80" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-52 rounded-md shadow-float">
                <DropdownMenuItem onSelect={comingSoon} className="gap-2 text-small">
                  <FileText aria-hidden className="h-4 w-4" /> {t.reports_export_pdf}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={comingSoon} className="gap-2 text-small">
                  <FileSpreadsheet aria-hidden className="h-4 w-4" /> {t.reports_export_excel}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={comingSoon} className="gap-2 text-small">
                  <Download aria-hidden className="h-4 w-4" /> {t.reports_export_full}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="outline" onClick={() => setShareOpen(true)}>
              <Share2 aria-hidden /> {t.reports_share}
            </Button>
          </>
        }
      />

      {/* Filters */}
      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} asChild>
        <section aria-label={t.reports_filters_label} className="mb-6 rounded-lg border border-border bg-card p-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(4,minmax(0,1fr))_auto] lg:items-end">
            <FieldShell id="rep-year" label={t.reports_year}>
              <Select value={String(year)} onValueChange={(v) => setYear(Number(v))} dir="rtl">
                <SelectTrigger id="rep-year" className="tabular">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {YEARS.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
            <FieldShell id="rep-track" label={t.reports_track}>
              <Select value={trackFilter} onValueChange={setTrackFilter} dir="rtl">
                <SelectTrigger id="rep-track">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filter_all}</SelectItem>
                  {reportTracks.map((tr) => (
                    <SelectItem key={tr} value={tr}>
                      {tr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
            <FieldShell id="rep-type" label={t.reports_entity_type}>
              <Select value={typeFilter} onValueChange={setTypeFilter} dir="rtl">
                <SelectTrigger id="rep-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{copy.filter_all}</SelectItem>
                  <SelectItem value={t.reports_entity_types.association}>{t.reports_entity_types.association}</SelectItem>
                  <SelectItem value={t.reports_entity_types.foundation}>{t.reports_entity_types.foundation}</SelectItem>
                </SelectContent>
              </Select>
            </FieldShell>
            <FieldShell id="rep-status" label={t.reports_status}>
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)} dir="rtl">
                <SelectTrigger id="rep-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldShell>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="justify-start text-muted-foreground data-[state=open]:text-primary" aria-expanded={advancedOpen}>
                <SlidersHorizontal aria-hidden /> {t.reports_advanced}
              </Button>
            </CollapsibleTrigger>
          </div>
          <CollapsibleContent>
            <div className="mt-5 grid grid-cols-1 gap-6 border-t border-border pt-5 md:grid-cols-2">
              <div className="flex flex-col gap-3">
                <p className="flex items-center justify-between text-small font-hrsd-medium text-ink">
                  {t.reports_score_range}
                  <span className="tabular text-caption text-muted-foreground">
                    {formatNumber(scoreRange[0])} – {formatNumber(scoreRange[1])}
                  </span>
                </p>
                <Slider min={0} max={100} step={5} value={scoreRange} onValueChange={setScoreRange} aria-label={t.reports_score_range} />
              </div>
              <div className="flex flex-col gap-3">
                <p className="flex items-center justify-between text-small font-hrsd-medium text-ink">
                  {t.reports_progress_range}
                  <span className="tabular text-caption text-muted-foreground">
                    {formatNumber(progressRange[0])} – {formatNumber(progressRange[1])}
                  </span>
                </p>
                <Slider min={0} max={100} step={5} value={progressRange} onValueChange={setProgressRange} aria-label={t.reports_progress_range} />
              </div>
            </div>
          </CollapsibleContent>
        </section>
      </Collapsible>

      {/* KPIs */}
      <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t.kpi_compliance} value={avgCompliance} suffix="%" icon={TrendingUp} />
        <KpiCard label={t.kpi_avg_score} value={avgScore} suffix="%" icon={Award} />
        <KpiCard label={t.kpi_top} value={topPerformer?.avgScore} suffix="%" icon={TrendingUp} hint={topPerformer?.name} />
        <KpiCard label={t.kpi_bottom} value={bottomPerformer?.avgScore} suffix="%" icon={TrendingDown} hint={bottomPerformer?.name} />
      </div>

      <Tabs defaultValue="associations" dir="rtl">
        <TabsList aria-label={t.tabs_label} className="scrollbar-thin h-auto w-full justify-start gap-6 overflow-x-auto rounded-none border-b border-border bg-transparent p-0">
          <TabsTrigger value="associations" className={tabTriggerClass}>{t.tab_associations}</TabsTrigger>
          <TabsTrigger value="evaluators" className={tabTriggerClass}>{t.tab_evaluators}</TabsTrigger>
          <TabsTrigger value="comparisons" className={tabTriggerClass}>{t.tab_comparisons}</TabsTrigger>
        </TabsList>

        {/* Associations */}
        <TabsContent value="associations" className={tabContentClass}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title={t.chart_track_perf}>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={trackPerfData} barSize={28} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={C_GRID} vertical={false} />
                  <XAxis dataKey="name" reversed tick={tick} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} orientation="right" tick={tick} unit="%" axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "hsl(var(--section-alt))" }} contentStyle={tooltipStyle} formatter={(v: number) => [formatPercent(v), t.chart_avg_perf]} />
                  <Bar dataKey="value" fill={C_PRIMARY} radius={[4, 4, 0, 0]} {...anim} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>

            <Panel title={t.top_bottom_title}>
              {n === 0 ? (
                <p className="text-small text-muted-foreground">—</p>
              ) : (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                  {[
                    { label: t.top5, rows: top5 },
                    { label: t.bottom5, rows: bottom5 },
                  ].map((group) => (
                    <div key={group.label}>
                      <p className="mb-2 text-caption font-hrsd-medium text-muted-foreground">{group.label}</p>
                      <ol>
                        {group.rows.map((r) => (
                          <li key={r.id} className="flex items-center justify-between gap-3 border-b border-border py-2 last:border-b-0">
                            <span className="truncate text-small text-ink">{r.name}</span>
                            <span className="tabular text-small font-hrsd-bold text-ink">{formatPercent(r.avgScore)}</span>
                          </li>
                        ))}
                      </ol>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </div>

          <section className="flex flex-col gap-4">
            <h2 className="text-h3 text-ink">{t.assoc_table_title}</h2>
            <DataTable
              columns={assocColumns}
              rows={filteredAssoc}
              getRowKey={(r) => r.id}
              onRowClick={(r) => setReportModal(r)}
              rowLabel={(r) => `${t.view_report}: ${r.name}`}
              caption={t.assoc_table_title}
              empty={<EmptyState message={t.assoc_empty} action={{ label: t.reset_filters, onClick: resetFilters }} />}
            />
          </section>
        </TabsContent>

        {/* Evaluators */}
        <TabsContent value="evaluators" className={tabContentClass}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel title={t.chart_eval_duration}>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={evalDurationData} barSize={16} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={C_GRID} horizontal={false} />
                  <XAxis type="number" reversed tick={tick} axisLine={false} tickLine={false} allowDecimals={false} />
                  <YAxis type="category" dataKey="name" orientation="right" tick={tick} axisLine={false} tickLine={false} width={84} />
                  <Tooltip cursor={{ fill: "hsl(var(--section-alt))" }} contentStyle={tooltipStyle} formatter={(v: number) => [days(v), t.duration_label]} />
                  <Bar dataKey="value" fill={C_PRIMARY} radius={[4, 0, 0, 4]} {...anim} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
            <Panel title={t.chart_eval_score}>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={evalScoreData} barSize={16} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={C_GRID} horizontal={false} />
                  <XAxis type="number" reversed domain={[0, 100]} tick={tick} axisLine={false} tickLine={false} unit="%" />
                  <YAxis type="category" dataKey="name" orientation="right" tick={tick} axisLine={false} tickLine={false} width={84} />
                  <Tooltip cursor={{ fill: "hsl(var(--section-alt))" }} contentStyle={tooltipStyle} formatter={(v: number) => [formatPercent(v), t.score_label]} />
                  <Bar dataKey="value" fill={C_PRIMARY} radius={[4, 0, 0, 4]} {...anim} />
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>

          <section className="flex flex-col gap-4">
            <h2 className="text-h3 text-ink">{t.eval_table_title}</h2>
            <DataTable
              columns={evalColumns}
              rows={evalReports}
              getRowKey={(e) => e.id}
              onRowClick={(e) => setEvalModal(e)}
              rowLabel={(e) => `${t.view_performance}: ${e.name}`}
              caption={t.eval_table_title}
            />
          </section>
        </TabsContent>

        {/* Comparisons */}
        <TabsContent value="comparisons" className={tabContentClass}>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Panel
              title={t.chart_year_comp}
              aside={<LegendKey items={[{ label: "2025", color: "neutral" }, { label: "2026", color: "primary" }]} />}
            >
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={yearCompData} barSize={20} barGap={4} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={C_GRID} vertical={false} />
                  <XAxis dataKey="metric" reversed tick={tick} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} orientation="right" tick={tick} unit="%" axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "hsl(var(--section-alt))" }} contentStyle={tooltipStyle} formatter={(v: number) => formatPercent(v)} />
                  <Bar dataKey="2025" name="2025" fill={C_NEUTRAL} radius={[4, 4, 0, 0]} {...anim} />
                  <Bar dataKey="2026" name="2026" fill={C_PRIMARY} radius={[4, 4, 0, 0]} {...anim} />
                </BarChart>
              </ResponsiveContainer>
              <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 border-t border-border pt-4 text-small text-muted-foreground">
                {changes.map((ch) => (
                  <li key={ch.metric} className="inline-flex items-center gap-2">
                    {ch.metric}:
                    <span className={cn("tabular inline-flex items-center gap-1 font-hrsd-medium", ch.rel < 0 ? "text-danger" : "text-success")}>
                      {ch.rel < 0 ? <TrendingDown aria-hidden className="h-4 w-4" /> : <TrendingUp aria-hidden className="h-4 w-4" />}
                      {ch.rel < 0 ? t.change_decline : t.change_growth} {formatPercent(Math.abs(ch.rel))}
                    </span>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel
              title={t.chart_track_comp}
              aside={
                <SegmentedControl
                  label={t.comp_mode_label}
                  value={trackCompMode}
                  onChange={setTrackCompMode}
                  options={[
                    { value: "single", label: t.comp_single },
                    { value: "dual", label: t.comp_dual },
                  ]}
                />
              }
            >
              <div className="mb-3">
                <LegendKey
                  items={[
                    ...(showYear("2025") ? [{ label: "2025", color: "neutral" as const }] : []),
                    ...(showYear("2026") ? [{ label: "2026", color: "primary" as const }] : []),
                  ]}
                />
              </div>
              <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
                <BarChart data={trackCompData} barSize={18} barGap={4} margin={{ top: 4, right: 0, left: 0, bottom: 0 }}>
                  <CartesianGrid stroke={C_GRID} vertical={false} />
                  <XAxis dataKey="track" reversed tick={tick} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} orientation="right" tick={tick} unit="%" axisLine={false} tickLine={false} width={44} />
                  <Tooltip cursor={{ fill: "hsl(var(--section-alt))" }} contentStyle={tooltipStyle} formatter={(v: number) => formatPercent(v)} />
                  {showYear("2025") && <Bar dataKey="2025" name="2025" fill={C_NEUTRAL} radius={[4, 4, 0, 0]} {...anim} />}
                  {showYear("2026") && <Bar dataKey="2026" name="2026" fill={C_PRIMARY} radius={[4, 4, 0, 0]} {...anim} />}
                </BarChart>
              </ResponsiveContainer>
            </Panel>
          </div>
        </TabsContent>
      </Tabs>

      {/* Share */}
      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent dir="rtl" className="gap-6 rounded-lg sm:max-w-md">
          <DialogHeader className="space-y-1 text-start sm:text-start">
            <DialogTitle className="text-h3 font-hrsd-title text-ink">{t.share_title}</DialogTitle>
            <DialogDescription className="text-small text-muted-foreground">{t.share_desc}</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Input readOnly value={SHARE_URL} dir="ltr" aria-label={t.share_title} className="h-10 flex-1 text-small text-muted-foreground" onFocus={(e) => e.currentTarget.select()} />
            <Button onClick={handleCopyLink} aria-live="polite">
              {copied ? <Check aria-hidden /> : <Copy aria-hidden />} {copied ? t.share_copied : t.share_copy}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Association report summary */}
      <Dialog open={!!reportModal} onOpenChange={(o) => !o && setReportModal(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] gap-6 overflow-y-auto rounded-lg sm:max-w-lg">
          <DialogHeader className="space-y-1 text-start sm:text-start">
            <DialogTitle className="text-h3 font-hrsd-title text-ink">{t.assoc_modal_title}</DialogTitle>
            {reportModal && <DialogDescription className="text-small text-muted-foreground">{reportModal.name}</DialogDescription>}
          </DialogHeader>
          {reportModal && (
            <>
              <Facts
                items={[
                  { label: t.col_year, value: <span className="tabular">{reportModal.year}</span> },
                  { label: t.col_track, value: reportModal.track },
                  { label: t.status, value: <StatusBadge status={reportModal.status} /> },
                ]}
              />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <KpiCard size="compact" label={t.col_progress} value={reportModal.progress} suffix="%" />
                <KpiCard size="compact" label={t.col_avg_score} value={reportModal.avgScore} suffix="%" />
                <KpiCard size="compact" label={t.col_compliance} value={reportModal.compliance} suffix="%" />
              </div>
              <Button onClick={comingSoon} className="self-start">
                <Download aria-hidden /> {t.download_report}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Evaluator performance summary */}
      <Dialog open={!!evalModal} onOpenChange={(o) => !o && setEvalModal(null)}>
        <DialogContent dir="rtl" className="max-h-[90vh] gap-6 overflow-y-auto rounded-lg sm:max-w-lg">
          <DialogHeader className="space-y-1 text-start sm:text-start">
            <DialogTitle className="text-h3 font-hrsd-title text-ink">{t.eval_modal_title}</DialogTitle>
            {evalModal && <DialogDescription className="text-small text-muted-foreground">{evalModal.name}</DialogDescription>}
          </DialogHeader>
          {evalModal && (
            <>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <KpiCard size="compact" label={t.col_assigned} value={evalModal.assignedCount} />
                <KpiCard size="compact" label={t.avg_duration_short} value={evalModal.avgDuration} suffix={` ${evalModal.avgDuration >= 3 && evalModal.avgDuration <= 10 ? t.day_few : t.day_one}`} />
                <KpiCard size="compact" label={t.kpi_avg_score} value={evalModal.avgScore} suffix="%" />
                <KpiCard size="compact" label={t.col_compliance} value={evalModal.compliance} suffix="%" />
              </div>
              <Button onClick={comingSoon} className="self-start">
                <Download aria-hidden /> {t.download_report}
              </Button>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminReports;
