/** AdminReports prototype data (mock, unchanged values). Tracks follow the TRACKS order in copy. */
import { TRACKS } from "@/lib/copy";

export interface AssocReport {
  id: string;
  name: string;
  year: number;
  track: string;
  progress: number;
  avgScore: number;
  compliance: number;
  /** Legacy label, mapped to the five states with toStatusKey */
  status: string;
}

export interface EvaluatorReport {
  id: string;
  name: string;
  assignedCount: number;
  avgDuration: number;
  avgScore: number;
  compliance: number;
}

export const reportTracks = TRACKS.map((t) => t.name);

export const assocReports2026: AssocReport[] = [
  { id: "a1", name: "جمعية البر الخيرية", year: 2026, track: "التوجه", progress: 85, avgScore: 78, compliance: 90, status: "قيد التقييم" },
  { id: "a2", name: "جمعية إنسان", year: 2026, track: "الفريق", progress: 100, avgScore: 92, compliance: 95, status: "تسليم كامل" },
  { id: "a3", name: "جمعية تكافل", year: 2026, track: "الشراكات", progress: 45, avgScore: 61, compliance: 55, status: "تسليم جزئي" },
  { id: "a4", name: "مؤسسة العطاء", year: 2026, track: "التأثير", progress: 0, avgScore: 0, compliance: 20, status: "لم تبدأ" },
  { id: "a5", name: "جمعية رعاية", year: 2026, track: "البرامج", progress: 60, avgScore: 70, compliance: 75, status: "قيد التقييم" },
  { id: "a6", name: "جمعية إحسان", year: 2026, track: "التوجه", progress: 100, avgScore: 95, compliance: 98, status: "تسليم كامل" },
  { id: "a7", name: "مؤسسة الأمل", year: 2026, track: "الفريق", progress: 30, avgScore: 50, compliance: 40, status: "قيد التقييم" },
  { id: "a8", name: "جمعية الوفاء", year: 2026, track: "الشراكات", progress: 75, avgScore: 82, compliance: 80, status: "تسليم جزئي" },
  { id: "a9", name: "جمعية السلام", year: 2026, track: "التأثير", progress: 90, avgScore: 88, compliance: 92, status: "تسليم كامل" },
  { id: "a10", name: "مؤسسة التنمية", year: 2026, track: "البرامج", progress: 20, avgScore: 35, compliance: 30, status: "قيد التقييم" },
];

export const assocReports2025: AssocReport[] = [
  { id: "a1", name: "جمعية البر الخيرية", year: 2025, track: "التوجه", progress: 100, avgScore: 88, compliance: 95, status: "تسليم كامل" },
  { id: "a2", name: "جمعية إنسان", year: 2025, track: "الفريق", progress: 100, avgScore: 79, compliance: 85, status: "تسليم كامل" },
  { id: "a3", name: "جمعية تكافل", year: 2025, track: "الشراكات", progress: 100, avgScore: 71, compliance: 78, status: "تسليم كامل" },
  { id: "a4", name: "مؤسسة العطاء", year: 2025, track: "التأثير", progress: 78, avgScore: 65, compliance: 60, status: "تسليم جزئي" },
  { id: "a5", name: "جمعية رعاية", year: 2025, track: "البرامج", progress: 100, avgScore: 67, compliance: 70, status: "تسليم كامل" },
];

export const evalReports: EvaluatorReport[] = [
  { id: "e1", name: "أحمد محمد", assignedCount: 12, avgDuration: 5, avgScore: 82, compliance: 90 },
  { id: "e2", name: "سارة علي", assignedCount: 10, avgDuration: 3, avgScore: 91, compliance: 95 },
  { id: "e3", name: "خالد عمر", assignedCount: 8, avgDuration: 7, avgScore: 74, compliance: 80 },
  { id: "e4", name: "نورة سعد", assignedCount: 15, avgDuration: 4, avgScore: 88, compliance: 92 },
  { id: "e5", name: "فهد ناصر", assignedCount: 6, avgDuration: 9, avgScore: 65, compliance: 70 },
  { id: "e6", name: "ريم خالد", assignedCount: 11, avgDuration: 4, avgScore: 85, compliance: 88 },
  { id: "e7", name: "عمر يوسف", assignedCount: 9, avgDuration: 6, avgScore: 77, compliance: 82 },
];

export const yearCompData = [
  { metric: "متوسط الدرجات", "2025": 74, "2026": 68 },
  { metric: "نسبة الالتزام", "2025": 78, "2026": 72 },
  { metric: "نسبة الإنجاز", "2025": 91, "2026": 64 },
];

/** Per-track averages by year, keyed by track name (same values as before) */
const track2025: Record<string, number> = { التوجه: 88, الفريق: 79, الشراكات: 71, التأثير: 92, البرامج: 67 };
const track2026: Record<string, number> = { التوجه: 78, الفريق: 65, الشراكات: 58, التأثير: 80, البرامج: 45 };

export const trackCompData = reportTracks.map((track) => ({ track, "2025": track2025[track], "2026": track2026[track] }));

export const SHARE_URL = "https://tamkeen.hrsd.gov.sa/reports/shared/abc123";
