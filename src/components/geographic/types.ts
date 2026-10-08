/** Illustrative dataset (shown with copy.map_note). All 13 administrative regions. */
export interface RegionData {
  id: string;
  name: string;
  /** Associations (جمعية أهلية) */
  associations: number;
  /** Foundations (مؤسسة أهلية) */
  foundations: number;
  /** associations + foundations */
  count: number;
}

const RAW: Omit<RegionData, "count">[] = [
  { id: "riyadh", name: "الرياض", associations: 434, foundations: 18 },
  { id: "makkah", name: "مكة المكرمة", associations: 521, foundations: 16 },
  { id: "madinah", name: "المدينة المنورة", associations: 153, foundations: 5 },
  { id: "qassim", name: "القصيم", associations: 242, foundations: 6 },
  { id: "eastern", name: "المنطقة الشرقية", associations: 214, foundations: 9 },
  { id: "hail", name: "حائل", associations: 182, foundations: 3 },
  { id: "asir", name: "عسير", associations: 258, foundations: 5 },
  { id: "najran", name: "نجران", associations: 54, foundations: 1 },
  { id: "jazan", name: "جازان", associations: 131, foundations: 3 },
  { id: "jawf", name: "الجوف", associations: 60, foundations: 2 },
  { id: "northern", name: "الحدود الشمالية", associations: 50, foundations: 1 },
  { id: "baha", name: "الباحة", associations: 92, foundations: 2 },
  { id: "tabuk", name: "تبوك", associations: 72, foundations: 2 },
];

export const regions: RegionData[] = RAW.map((r) => ({ ...r, count: r.associations + r.foundations }));

/** Keyboard and reading order: north to south */
export const NORTH_TO_SOUTH = [
  "tabuk",
  "jawf",
  "northern",
  "hail",
  "qassim",
  "madinah",
  "riyadh",
  "eastern",
  "makkah",
  "baha",
  "asir",
  "najran",
  "jazan",
] as const;

export const national = regions.reduce(
  (acc, r) => ({
    total: acc.total + r.count,
    associations: acc.associations + r.associations,
    foundations: acc.foundations + r.foundations,
  }),
  { total: 0, associations: 0, foundations: 0 }
);

/** Regions ranked by count, highest first; rank is 1-based */
export const ranked = [...regions]
  .sort((a, b) => b.count - a.count)
  .map((region, i) => ({ region, rank: i + 1 }));

export const rankOf = (id: string) => ranked.find((r) => r.region.id === id)?.rank ?? 0;

export const maxCount = ranked[0]?.region.count ?? 0;
export const minCount = ranked[ranked.length - 1]?.region.count ?? 0;

/** Five classes of the primary token at rising opacity (sequential, one hue) */
export const CLASS_FILLS = [
  "hsl(var(--primary) / 0.14)",
  "hsl(var(--primary) / 0.3)",
  "hsl(var(--primary) / 0.5)",
  "hsl(var(--primary) / 0.72)",
  "hsl(var(--primary))",
];

/**
 * Quantile bins: regions sorted ascending and split into five equal-count classes,
 * so the 13 regions spread across the scale instead of piling into the lightest shades.
 */
const ascending = [...regions].sort((a, b) => a.count - b.count);
const classById = new Map<string, number>();
ascending.forEach((r, i) => {
  classById.set(r.id, Math.min(CLASS_FILLS.length - 1, Math.floor((i * CLASS_FILLS.length) / ascending.length)));
});

export const classOf = (id: string) => classById.get(id) ?? 0;
export const fillOf = (id: string) => CLASS_FILLS[classOf(id)];

/** Lowest count in each class, for the legend breaks */
export const classBreaks = CLASS_FILLS.map((_, c) => {
  const members = ascending.filter((r) => classById.get(r.id) === c);
  return members.length ? members[0].count : null;
});
