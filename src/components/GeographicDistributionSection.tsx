import { useCallback, useRef, useState } from "react";
import { copy } from "@/lib/copy";
import { useIsMobile } from "@/hooks/use-mobile";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import Section from "@/components/layout/Section";
import SaudiHeatmapMap from "@/components/geographic/SaudiHeatmapMap";
import { RegionDetailsPanel, RegionRankList } from "@/components/geographic/RegionDetailsPanel";

/**
 * Geographic distribution: map (7/12) linked with national totals and the ranked list (5/12).
 * On desktop the data column takes the map's height and the list scrolls inside it if needed.
 */
const GeographicDistributionSection = () => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const listRef = useRef<HTMLOListElement>(null);
  const isMobile = useIsMobile();
  const reduced = useReducedMotion();

  const select = useCallback(
    (id: string | null) => {
      setSelectedId(id);
      if (!id) return;
      // Bring the region's row into view (inside the list on desktop, the page on mobile)
      const row = listRef.current?.querySelector<HTMLElement>(`[data-region="${id}"]`);
      row?.scrollIntoView({ block: isMobile ? "center" : "nearest", behavior: reduced ? "auto" : "smooth" });
    },
    [isMobile, reduced]
  );

  return (
    <Section id="map" tone="white" title={copy.map_title} subtitle={copy.map_subtitle} caption={copy.map_note}>
      <div
        className="grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-stretch"
        onKeyDown={(e) => {
          if (e.key === "Escape") setSelectedId(null);
        }}
      >
        <div className="rounded-lg border border-border bg-card p-4 md:p-6 lg:col-span-7">
          <SaudiHeatmapMap hoveredId={hoveredId} selectedId={selectedId} onHover={setHoveredId} onSelect={select} />
        </div>

        <div className="lg:relative lg:col-span-5">
          <div className="flex flex-col gap-4 lg:absolute lg:inset-0">
            <RegionDetailsPanel selectedId={selectedId} onClear={() => setSelectedId(null)} />
            <div className="flex min-h-0 flex-1 flex-col rounded-lg border border-border bg-card">
              <h3 className="border-b border-border px-5 py-3 text-small font-hrsd-bold text-ink">{copy.map_ranking_title}</h3>
              <div className="scrollbar-thin min-h-0 flex-1 p-2 lg:fade-bottom lg:overflow-y-auto lg:pb-6">
                <RegionRankList
                  ref={listRef}
                  hoveredId={hoveredId}
                  selectedId={selectedId}
                  onHover={setHoveredId}
                  onSelect={select}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

export default GeographicDistributionSection;
