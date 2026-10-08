/** Rubric tree (tracks -> standards -> indicators -> items): types, mock seed and count helpers. */
import { TRACKS } from "@/lib/copy";
import { formatNumber } from "@/lib/format";

export interface RubricItem {
  id: string; name: string; description: string; evidenceType: string; isActive: boolean;
}
export interface Indicator {
  id: string; name: string; isActive: boolean; items: RubricItem[];
}
export interface Standard {
  id: string; name: string; isActive: boolean; indicators: Indicator[];
}
export interface Track {
  id: string; name: string; isActive: boolean; standards: Standard[];
}

export type NodeLevel = "track" | "standard" | "indicator" | "item";
export interface ParentIds { trackId?: string; standardId?: string; indicatorId?: string }

/** Sample indicators (prototype data) placed under the goals standard of the first track */
const sampleIndicators: Indicator[] = [
  {
    id: "i1", name: "وضوح الرؤية", isActive: true,
    items: [
      { id: "b1", name: "وثيقة الرؤية", description: "وثيقة معتمدة", evidenceType: "ملف", isActive: true },
      { id: "b2", name: "رابط الموقع", description: "", evidenceType: "رابط", isActive: true },
    ],
  },
  { id: "i2", name: "توافق الرسالة", isActive: true, items: [] },
];

/** Tracks and standards follow the official structure in copy (5 tracks, 15 standards). */
export const rubricSeed: Track[] = TRACKS.map((track, ti) => ({
  id: `t${ti + 1}`,
  name: track.name,
  isActive: true,
  standards: track.standardList.map((name, si) => ({
    id: `s${ti + 1}-${si + 1}`,
    name,
    isActive: true,
    indicators: ti === 0 && si === 1 ? sampleIndicators : [],
  })),
}));

export const countTrack = (t: Track) => {
  const indicators = t.standards.flatMap((s) => s.indicators);
  return { standards: t.standards.length, indicators: indicators.length, items: indicators.reduce((n, i) => n + i.items.length, 0) };
};

export const countStandard = (s: Standard) => ({
  indicators: s.indicators.length,
  items: s.indicators.reduce((n, i) => n + i.items.length, 0),
});

/** "3 معايير", "15 معياراً" with Western digits */
export const counted = (n: number, forms: { one: string; two: string; few: string; many: string }) => {
  const r = n % 100;
  const noun = n === 1 || (n >= 100 && r === 0) ? forms.one : n === 2 ? forms.two : r >= 11 ? forms.many : forms.few;
  return `${formatNumber(n)} ${noun}`;
};
