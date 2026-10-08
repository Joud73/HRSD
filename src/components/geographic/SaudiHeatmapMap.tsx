import { useLayoutEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from "react";
import { copy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import { regionPaths } from "./regionPaths";
import { CLASS_FILLS, NORTH_TO_SOUTH, classBreaks, fillOf, maxCount, minCount, regions } from "./types";

/** Path extents (730 x 600) plus 2% padding on every side */
const VIEW_BOX = "-14.6 -12 759 624";

const byId = new Map(regions.map((r) => [r.id, r]));

interface SaudiHeatmapMapProps {
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string | null) => void;
}

interface TipState {
  id: string;
  /** Anchor in canvas pixels */
  x: number;
  y: number;
}

/**
 * Choropleth of the 13 administrative regions. Quantile classes of the primary token,
 * linked hover with the ranked list, keyboard reachable north to south.
 */
const SaudiHeatmapMap = ({ hoveredId, selectedId, onHover, onSelect }: SaudiHeatmapMapProps) => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const [tip, setTip] = useState<TipState | null>(null);
  const [tipPos, setTipPos] = useState<{ left: number; top: number } | null>(null);

  // Keep the tooltip inside the canvas: measure it, then clamp
  useLayoutEffect(() => {
    if (!tip || !tipRef.current || !canvasRef.current) {
      setTipPos(null);
      return;
    }
    const canvas = canvasRef.current.getBoundingClientRect();
    const box = tipRef.current.getBoundingClientRect();
    const gap = 12;
    let left = tip.x - box.width / 2;
    let top = tip.y - box.height - gap;
    if (top < 0) top = tip.y + gap;
    left = Math.max(0, Math.min(left, canvas.width - box.width));
    top = Math.max(0, Math.min(top, canvas.height - box.height));
    setTipPos({ left, top });
  }, [tip]);

  const anchorFromPointer = (e: PointerEvent<SVGPathElement>, id: string) => {
    const canvas = canvasRef.current?.getBoundingClientRect();
    if (!canvas) return;
    setTip({ id, x: e.clientX - canvas.left, y: e.clientY - canvas.top });
  };

  const anchorFromElement = (el: SVGPathElement, id: string) => {
    const canvas = canvasRef.current?.getBoundingClientRect();
    if (!canvas) return;
    const r = el.getBoundingClientRect();
    setTip({ id, x: r.left + r.width / 2 - canvas.left, y: r.top + r.height / 2 - canvas.top });
  };

  const handleKey = (e: KeyboardEvent<SVGPathElement>, id: string) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onSelect(selectedId === id ? null : id);
    }
  };

  const hasSelection = !!selectedId;
  // The highlighted outline is drawn last so it is never covered by a neighbour
  const outlined = selectedId ?? hoveredId;
  const tipRegion = tip ? byId.get(tip.id) : null;

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={canvasRef}
        className="relative"
        onKeyDown={(e) => {
          if (e.key === "Escape") onSelect(null);
        }}
      >
        <svg viewBox={VIEW_BOX} className="block h-auto w-full" role="group" aria-label={copy.map_aria}>
          {NORTH_TO_SOUTH.map((id) => {
            const region = byId.get(id);
            const d = regionPaths[id];
            if (!region || !d) return null;
            const isSelected = selectedId === id;
            const isHovered = hoveredId === id;
            const dimmed = hasSelection && !isSelected;
            return (
              <path
                key={id}
                d={d}
                tabIndex={0}
                role="button"
                aria-pressed={isSelected}
                aria-label={`${region.name}: ${formatNumber(region.count)} ${copy.map_org_umbrella}`}
                className="cursor-pointer outline-none transition-[opacity,stroke] duration-ui ease-standard"
                style={{
                  fill: fillOf(id),
                  opacity: dimmed && !isHovered ? 0.6 : 1,
                  stroke: "hsl(var(--background))",
                  strokeWidth: 1,
                  vectorEffect: "non-scaling-stroke",
                }}
                onPointerEnter={(e) => {
                  onHover(id);
                  anchorFromPointer(e, id);
                }}
                onPointerMove={(e) => anchorFromPointer(e, id)}
                onPointerLeave={() => {
                  onHover(null);
                  setTip(null);
                }}
                onFocus={(e) => {
                  onHover(id);
                  anchorFromElement(e.currentTarget, id);
                }}
                onBlur={() => {
                  onHover(null);
                  setTip(null);
                }}
                onClick={() => onSelect(isSelected ? null : id)}
                onKeyDown={(e) => handleKey(e, id)}
              />
            );
          })}
          {outlined && regionPaths[outlined] && (
            <path
              d={regionPaths[outlined]}
              aria-hidden
              pointerEvents="none"
              fill="none"
              style={{
                stroke: "hsl(var(--ink))",
                strokeWidth: selectedId === outlined ? 2 : 1.5,
                vectorEffect: "non-scaling-stroke",
              }}
            />
          )}
        </svg>

        {tipRegion && (
          <div
            ref={tipRef}
            role="presentation"
            className={cn(
              "pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-border bg-popover px-3 py-2 shadow-float transition-opacity duration-micro",
              tipPos ? "opacity-100" : "opacity-0"
            )}
            style={{ left: tipPos?.left ?? 0, top: tipPos?.top ?? 0 }}
          >
            <p className="text-small font-hrsd-bold text-ink">{tipRegion.name}</p>
            <p className="text-caption text-muted-foreground">
              <span className="tabular font-hrsd-bold text-ink">{formatNumber(tipRegion.count)}</span> {copy.map_org_umbrella}
            </p>
          </div>
        )}
      </div>

      {/* Legend: horizontal quantile scale with numeric ends */}
      <figure className="flex flex-col gap-2" aria-label={copy.map_legend_label}>
        <figcaption className="text-caption text-muted-foreground">{copy.map_legend_label}</figcaption>
        <div className="flex gap-0.5" aria-hidden>
          {CLASS_FILLS.map((fill, i) => (
            <span key={fill} className={cn("h-2.5 flex-1", i === 0 && "rounded-s-full", i === CLASS_FILLS.length - 1 && "rounded-e-full")} style={{ background: fill }} />
          ))}
        </div>
        <div className="flex justify-between text-caption tabular text-muted-foreground">
          <span>{formatNumber(minCount)}</span>
          {classBreaks.slice(1).map((b, i) => (
            <span key={i} className="hidden sm:inline">
              {formatNumber(b)}
            </span>
          ))}
          <span>{formatNumber(maxCount)}</span>
        </div>
      </figure>
    </div>
  );
};

export default SaudiHeatmapMap;
