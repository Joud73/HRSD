export interface RegionData {
  id: string;
  name: string;
  count: number;
}

export const regions: RegionData[] = [
  { id: "riyadh", name: "الرياض", count: 452 },
  { id: "makkah", name: "مكة المكرمة", count: 537 },
  { id: "madinah", name: "المدينة المنورة", count: 158 },
  { id: "qassim", name: "القصيم", count: 248 },
  { id: "eastern", name: "المنطقة الشرقية", count: 223 },
  { id: "hail", name: "حائل", count: 185 },
  { id: "asir", name: "عسير", count: 263 },
  { id: "najran", name: "نجران", count: 55 },
  { id: "jazan", name: "جازان", count: 134 },
  { id: "jawf", name: "الجوف", count: 62 },
  { id: "northern", name: "الحدود الشمالية", count: 51 },
  { id: "baha", name: "الباحة", count: 94 },
  { id: "tabuk", name: "تبوك", count: 74 },
];

export const summaryStats = [
  { label: "جمعية اهلية", count: 2463 },
  { label: "مؤسسة اهلية", count: 73 },
];

export const totalCount = 2536;

// Heatmap color scale (light mint to deep teal)
export const heatmapColors = [
  "#E8F5E9", // Lightest - 0-20%
  "#A5D6A7", // Light - 20-40%
  "#66BB6A", // Medium - 40-60%
  "#2E7D32", // Dark - 60-80%
  "#1B5E20", // Darkest - 80-100%
];

export function getHeatmapColor(value: number, min: number, max: number): string {
  if (max === min) return heatmapColors[2];
  const normalized = (value - min) / (max - min);
  const index = Math.min(Math.floor(normalized * heatmapColors.length), heatmapColors.length - 1);
  return heatmapColors[index];
}
