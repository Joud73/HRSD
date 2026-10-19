/**
 * Assessment tool (CTS): the approved version and its tree
 * tracks -> standards -> indicators -> items. An approved version is immutable,
 * so this module only reads.
 */
import { supabase } from "@/integrations/supabase/client";

export interface RubricItem {
  id: string;
  number: number;
  text: string;
  improvementAction: string;
  strengthText: string;
  opportunityText: string;
}
export interface Indicator {
  id: string;
  number: number;
  text: string;
  items: RubricItem[];
}
export interface Standard {
  id: string;
  number: number;
  name: string;
  indicators: Indicator[];
}
export interface Track {
  id: string;
  number: number;
  name: string;
  standards: Standard[];
}
export interface LevelBand {
  level: number;
  minPct: number;
  maxPct: number;
  label: string;
}
export interface ToolCounts {
  tracks: number;
  standards: number;
  indicators: number;
  items: number;
}
export interface ApprovedTool {
  id: string;
  code: string;
  title: string;
  /** Date only, yyyy-mm-dd */
  approvedAt: string | null;
  tracks: Track[];
  levelBands: LevelBand[];
  counts: ToolCounts;
}

/** Latest approved tool version row, or null when none is approved yet. */
async function getApprovedVersion() {
  const { data, error } = await supabase
    .from("tool_versions")
    .select("id, code, title, approved_at")
    .eq("status", "approved")
    .order("approved_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

/** Id of the latest approved tool version (default for new cycles). */
export async function getApprovedToolVersionId(): Promise<string | null> {
  const version = await getApprovedVersion();
  return version?.id ?? null;
}

/** Group rows by a parent key, keeping the incoming order. */
function groupBy<T>(rows: T[], key: (row: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const row of rows) {
    const k = key(row);
    const list = map.get(k);
    if (list) list.push(row);
    else map.set(k, [row]);
  }
  return map;
}

export async function getApprovedTool(): Promise<ApprovedTool | null> {
  const version = await getApprovedVersion();
  if (!version) return null;
  const vid = version.id;

  const [tracksRes, standardsRes, indicatorsRes, itemsRes, bandsRes] = await Promise.all([
    supabase.from("tracks").select("id, number, name").eq("tool_version_id", vid).order("number"),
    supabase.from("standards").select("id, track_id, number, name").eq("tool_version_id", vid).order("number"),
    supabase.from("indicators").select("id, standard_id, number, text").eq("tool_version_id", vid).order("number"),
    supabase
      .from("items")
      .select("id, indicator_id, number, text, improvement_action, strength_text, opportunity_text")
      .eq("tool_version_id", vid)
      .order("number"),
    supabase.from("level_bands").select("level, min_pct, max_pct, label").eq("tool_version_id", vid).order("level"),
  ]);
  for (const res of [tracksRes, standardsRes, indicatorsRes, itemsRes, bandsRes]) {
    if (res.error) throw res.error;
  }

  const itemsByIndicator = groupBy(itemsRes.data ?? [], (r) => r.indicator_id);
  const indicatorsByStandard = groupBy(indicatorsRes.data ?? [], (r) => r.standard_id);
  const standardsByTrack = groupBy(standardsRes.data ?? [], (r) => r.track_id);

  const tracks: Track[] = (tracksRes.data ?? []).map((tr) => ({
    id: tr.id,
    number: tr.number,
    name: tr.name,
    standards: (standardsByTrack.get(tr.id) ?? []).map((s) => ({
      id: s.id,
      number: s.number,
      name: s.name,
      indicators: (indicatorsByStandard.get(s.id) ?? []).map((ind) => ({
        id: ind.id,
        number: ind.number,
        text: ind.text,
        items: (itemsByIndicator.get(ind.id) ?? []).map((it) => ({
          id: it.id,
          number: it.number,
          text: it.text,
          improvementAction: it.improvement_action,
          strengthText: it.strength_text,
          opportunityText: it.opportunity_text,
        })),
      })),
    })),
  }));

  return {
    id: vid,
    code: version.code,
    title: version.title,
    approvedAt: version.approved_at,
    tracks,
    levelBands: (bandsRes.data ?? []).map((b) => ({ level: b.level, minPct: b.min_pct, maxPct: b.max_pct, label: b.label })),
    counts: {
      tracks: tracks.length,
      standards: standardsRes.data?.length ?? 0,
      indicators: indicatorsRes.data?.length ?? 0,
      items: itemsRes.data?.length ?? 0,
    },
  };
}
