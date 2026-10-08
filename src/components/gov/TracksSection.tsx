import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { CheckCircle2, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { copy, homeCopy, TRACK_INDICATORS, TRACKS } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import Section from "@/components/layout/Section";
import CountUp from "@/components/shared/CountUp";

const TOTAL_STANDARDS = TRACKS.reduce((n, t) => n + t.standardList.length, 0);
const TOTAL_INDICATORS = Object.values(TRACK_INDICATORS).reduce((n, v) => n + v, 0);

/** "مسارات التقييم": five selectable tracks; the selected one expands its standards below the grid. */
const TracksSection = () => {
  const location = useLocation();
  const [openId, setOpenId] = useState<string | null>(null);

  // Header links (/#track-team …) open the matching track
  useEffect(() => {
    const id = location.hash.slice(1);
    if (TRACKS.some((t) => t.id === id)) setOpenId(id);
  }, [location.hash]);

  const open = TRACKS.find((t) => t.id === openId) ?? null;

  const subtitle = (
    <span className="tabular">
      <CountUp value={TRACKS.length} /> {copy.tracks_summary_tracks}، <CountUp value={TOTAL_STANDARDS} />{" "}
      {copy.tracks_summary_standards}، <CountUp value={TOTAL_INDICATORS} /> {copy.tracks_summary_indicators}
    </span>
  );

  return (
    <Section id="tracks" tone="alt" title={copy.tracks_title} subtitle={subtitle}>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {TRACKS.map((track) => {
          const selected = openId === track.id;
          return (
            <li key={track.id} id={track.id}>
              <button
                type="button"
                aria-expanded={selected}
                aria-controls="track-detail"
                onClick={() => setOpenId(selected ? null : track.id)}
                className={cn(
                  "group relative flex h-full w-full flex-col overflow-hidden rounded-lg border bg-card p-6 text-start transition-[border-color,background-color] duration-ui ease-standard active:scale-[0.98]",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                  selected ? "border-primary" : "border-border hover:border-ink/20"
                )}
              >
                {/* Gold top edge on hover: the page's single accent */}
                <span
                  aria-hidden
                  className={cn(
                    "absolute inset-x-0 top-0 h-[3px] transition-opacity duration-ui",
                    selected ? "bg-primary opacity-100" : "bg-accent opacity-0 group-hover:opacity-100"
                  )}
                />
                <h3 className="text-h3 text-ink">{track.name}</h3>
                <p className="mt-6 flex items-baseline gap-2">
                  <CountUp value={TRACK_INDICATORS[track.id]} className="tabular text-h2 font-hrsd-bold text-primary" />
                  <span className="text-small text-muted-foreground">{copy.tracks_indicators_label}</span>
                </p>
                <p className="mt-1 text-small text-muted-foreground">
                  <span className="tabular">{formatNumber(track.standardList.length)}</span> {copy.tracks_standards_label}
                </p>
              </button>
            </li>
          );
        })}
      </ul>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="detail"
            id="track-detail"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={transition.ui}
            className="overflow-hidden"
          >
            <div className="mt-4 rounded-lg border border-border bg-card p-6 md:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-small text-muted-foreground">{copy.tracks_standards_heading}</p>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.h3
                      key={open.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={transition.micro}
                      className="text-h3 text-ink"
                    >
                      {open.name}
                    </motion.h3>
                  </AnimatePresence>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setOpenId(null)} aria-label={homeCopy.tracks_close}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                <motion.ul
                  key={open.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={transition.micro}
                  className="mt-6 grid gap-3 md:grid-cols-3"
                >
                  {open.standardList.map((standard) => (
                    <li key={standard} className="flex items-center gap-3 rounded-md bg-section-alt px-4 py-3">
                      <CheckCircle2 aria-hidden className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                      <span className="text-body text-ink">{standard}</span>
                    </li>
                  ))}
                </motion.ul>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      {!open && <p className="mt-4 text-small text-muted-foreground">{homeCopy.tracks_select_hint}</p>}
    </Section>
  );
};

export default TracksSection;
