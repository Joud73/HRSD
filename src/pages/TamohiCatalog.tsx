import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { AlertCircle, Search, SearchX } from "lucide-react";
import { tamohiCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { useCatalog, useReadiness, useTamohiPersonal } from "@/hooks/useTamohi";
import type { CatalogProgram, Delivery, Readiness } from "@/services/tamohiService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SegmentedControl from "@/components/shared/SegmentedControl";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { TamohiFrame } from "@/components/tamohi/TamohiShell";
import { ReadinessRing } from "@/components/tamohi/Rings";
import { ProgramCard, RecommendationCard } from "@/components/tamohi/ProgramCards";
import { trackUi } from "@/components/tamohi/tamohiUi";

const DELIVERIES: Delivery[] = ["online", "in_person", "blended", "self_paced"];

type TrackFilter = "all" | "1" | "2" | "3" | "4" | "5";

/** Live search, applied 150 ms after the last keystroke. */
function useDebounced<T>(value: T, ms = 150) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(id);
  }, [value, ms]);
  return debounced;
}

/* ── Hero: readiness map (issued results) or the catalog's real counts ── */

const ReadinessPanel = ({ readiness, trackNames, gaps, programs }: { readiness: Readiness; trackNames: Map<number, string>; gaps: number; programs: number }) => {
  const arcs = readiness.tracks.map((tr) => ({ trackNumber: tr.trackNumber, name: trackNames.get(tr.trackNumber) ?? "", pct: tr.reviewPct }));
  const label = `${t.readiness_label}: ${t.readiness_center} ${formatNumber(readiness.overallPct)}%. ${arcs
    .map((a) => t.readiness_track(a.name, formatNumber(a.pct)))
    .join("، ")}`;
  return (
    <section aria-label={t.readiness_label} className="flex flex-col gap-6 rounded-lg bg-card p-6 text-ink">
      <div className="grid items-center gap-6 sm:grid-cols-[minmax(0,220px)_1fr]">
        <ReadinessRing arcs={arcs} overall={readiness.overallPct} label={label} centerLabel={t.readiness_center} />
        <ul className="flex flex-col divide-y divide-border">
          {arcs.map((a) => (
            <li key={a.trackNumber} className="flex items-center justify-between gap-3 py-2 text-small">
              <span className="flex items-center gap-2">
                <span aria-hidden className={cn("h-2.5 w-2.5 rounded-full", trackUi(a.trackNumber).dot)} />
                {a.name}
              </span>
              <span className="tabular font-hrsd-medium">{formatNumber(a.pct)}%</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex flex-col gap-4 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="tabular text-small text-ink">{t.readiness_summary(formatNumber(gaps), formatNumber(programs))}</p>
        <Button asChild>
          <Link to="/tamohi/my-path">{t.readiness_action}</Link>
        </Button>
      </div>
    </section>
  );
};

/** Rules between the counts: 2 per row below sm, 4 in one row from sm */
const COUNT_CELL = ["pe-5", "border-s px-5", "pe-5 sm:border-s sm:ps-5", "border-s px-5"];

const CatalogCounts = ({ programs }: { programs: CatalogProgram[] }) => {
  const minutes = programs.reduce((sum, p) => sum + p.totalMinutes, 0);
  const items: [number, string][] = [
    [programs.length, t.count_programs],
    [programs.reduce((sum, p) => sum + p.modulesCount, 0), t.count_modules],
    [programs.reduce((sum, p) => sum + p.lessonsCount, 0), t.count_lessons],
    [Math.round(minutes / 60), t.count_hours],
  ];
  return (
    <dl aria-label={t.counts_label} className="grid grid-cols-2 gap-y-6 sm:grid-cols-4">
      {items.map(([value, label], i) => (
        <div key={label} className={cn("flex flex-col gap-1 border-primary-foreground/20", COUNT_CELL[i])}>
          <dt className="order-2 text-small text-primary-foreground/80">{label}</dt>
          <dd className="tabular order-1 text-h1 font-hrsd-bold">{formatNumber(value)}</dd>
        </div>
      ))}
    </dl>
  );
};

/* ── Page ── */

const TamohiCatalog = () => {
  const reduced = useReducedMotion();
  const catalog = useCatalog();
  const personal = useTamohiPersonal();
  const readiness = useReadiness(personal.assessmentId);

  const [track, setTrack] = useState<TrackFilter>("all");
  const [delivery, setDelivery] = useState<"all" | Delivery>("all");
  const [query, setQuery] = useState("");
  const [recommendedOnly, setRecommendedOnly] = useState(false);
  const search = useDebounced(query.trim());

  const programs = useMemo(() => catalog.data ?? [], [catalog.data]);
  const byId = useMemo(() => new Map(programs.map((p) => [p.programId, p])), [programs]);
  const trackNames = useMemo(() => new Map(programs.map((p) => [p.trackNumber, p.trackName])), [programs]);
  const tracks = useMemo(() => [...trackNames.entries()].sort((a, b) => a[0] - b[0]), [trackNames]);
  const personalised = !!personal.issued;

  const visible = useMemo(() => {
    const rec = personal.recommendationByProgram;
    return programs
      .filter((p) => track === "all" || p.trackNumber === Number(track))
      .filter((p) => delivery === "all" || p.delivery === delivery)
      .filter((p) => !search || p.title.includes(search) || p.code.toLowerCase().includes(search.toLowerCase()))
      .filter((p) => !recommendedOnly || rec.has(p.programId))
      .sort((a, b) => {
        const ra = rec.get(a.programId)?.rank ?? Infinity;
        const rb = rec.get(b.programId)?.rank ?? Infinity;
        return ra - rb || a.sortOrder - b.sortOrder;
      });
  }, [programs, track, delivery, search, recommendedOnly, personal.recommendationByProgram]);

  const filtered = track !== "all" || delivery !== "all" || !!query || recommendedOnly;
  const clear = () => {
    setTrack("all");
    setDelivery("all");
    setQuery("");
    setRecommendedOnly(false);
  };

  const gaps = readiness.data ? readiness.data.itemsTotal - readiness.data.reviewCounted : 0;
  const top = personal.recommendations.slice(0, 3);

  return (
    <>
      {/* Hero */}
      <section className="bg-primary text-primary-foreground">
        <TamohiFrame className="grid gap-10 py-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,520px)] lg:items-center lg:py-14">
          <div className="flex flex-col gap-4">
            <h1 className="text-h1 font-hrsd-bold">{t.hero_title}</h1>
            <p className="max-w-[52ch] text-body text-primary-foreground/85">{t.hero_desc}</p>
          </div>
          {catalog.isLoading || personal.loading || (personalised && readiness.isLoading) ? (
            <div aria-hidden className="h-48 rounded-lg bg-primary-foreground/10" />
          ) : personalised && readiness.data ? (
            <ReadinessPanel readiness={readiness.data} trackNames={trackNames} gaps={gaps} programs={personal.recommendations.length} />
          ) : (
            programs.length > 0 && <CatalogCounts programs={programs} />
          )}
        </TamohiFrame>
      </section>

      {/* Recommended for the organization */}
      {personalised && top.length > 0 && (
        <section aria-labelledby="recommended-title" className="border-b border-border">
          <TamohiFrame className="flex flex-col gap-5 py-10">
            <div>
              <h2 id="recommended-title" className="text-h2 font-hrsd-bold text-ink">
                {t.recommended_title}
              </h2>
              <p className="text-small text-muted-foreground">{t.recommended_desc(personal.issued?.cycleName ?? "")}</p>
            </div>
            <ul className="grid gap-4 lg:grid-cols-3">
              {top.map((r) => (
                <li key={r.programId}>
                  <RecommendationCard recommendation={r} program={byId.get(r.programId)} enrollment={personal.enrollmentByProgram.get(r.programId)} />
                </li>
              ))}
            </ul>
          </TamohiFrame>
        </section>
      )}

      {/* Catalog */}
      <section aria-labelledby="catalog-title">
        <TamohiFrame className="pt-10">
          <h2 id="catalog-title" className="text-h2 font-hrsd-bold text-ink">
            {t.catalog_title}
          </h2>
        </TamohiFrame>

        <div role="search" aria-label={t.filter_label} className="z-30 mt-4 border-b border-border bg-section-alt md:sticky md:top-16">
          <TamohiFrame className="flex flex-wrap items-center gap-3 py-3">
            <div className="-mx-1 max-w-full overflow-x-auto px-1 py-0.5">
              <SegmentedControl<TrackFilter>
                label={t.filter_track}
                value={track}
                onChange={setTrack}
                className="flex-nowrap"
                options={[
                  { value: "all", label: t.filter_all },
                  ...tracks.map(([n, name]) => ({
                    value: String(n) as TrackFilter,
                    label: name,
                    prefix: <span aria-hidden className={cn("h-2 w-2 rounded-full", trackUi(n).dot)} />,
                  })),
                ]}
              />
            </div>
            <Select value={delivery} onValueChange={(v) => setDelivery(v as "all" | Delivery)}>
              <SelectTrigger aria-label={t.filter_delivery} className="h-11 w-full bg-card sm:w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir="rtl">
                <SelectItem value="all">{t.filter_delivery_all}</SelectItem>
                {DELIVERIES.map((d) => (
                  <SelectItem key={d} value={d}>
                    {t.delivery[d]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-64">
              <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={t.filter_search}
                aria-label={t.filter_search}
                className="h-11 bg-card ps-9"
              />
            </div>
            {personalised && (
              <label className="flex items-center gap-2 text-small text-ink">
                <Switch checked={recommendedOnly} onCheckedChange={setRecommendedOnly} />
                {t.filter_recommended}
              </label>
            )}
            <p aria-live="polite" className="tabular ms-auto text-small text-muted-foreground">
              {t.result_count(formatNumber(visible.length))}
            </p>
          </TamohiFrame>
        </div>

        <TamohiFrame className="py-8">
          {catalog.isLoading ? (
            <SkeletonPanel lines={6} />
          ) : catalog.isError ? (
            <div className="rounded-lg border border-border bg-card">
              <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void catalog.refetch() }} />
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-lg border border-border bg-card">
              <EmptyState icon={SearchX} message={t.filter_empty} action={filtered ? { label: t.filter_clear, onClick: clear } : undefined} />
            </div>
          ) : (
            <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <AnimatePresence initial={false} mode="popLayout">
                {visible.map((p) => (
                  <motion.li
                    key={p.programId}
                    layout={!reduced}
                    initial={reduced ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={reduced ? undefined : { opacity: 0 }}
                    transition={transition.ui}
                  >
                    <ProgramCard
                      program={p}
                      recommendation={personal.recommendationByProgram.get(p.programId)}
                      enrollment={personal.enrollmentByProgram.get(p.programId)}
                    />
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          )}
        </TamohiFrame>
      </section>
    </>
  );
};

export default TamohiCatalog;
