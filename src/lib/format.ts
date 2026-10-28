const numberFormat = new Intl.NumberFormat("ar-SA-u-nu-latn");
const percentFormat = new Intl.NumberFormat("ar-SA-u-nu-latn", { maximumFractionDigits: 1 });

/** The only number formatter in the app: Western digits, Arabic grouping. */
export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return numberFormat.format(value);
}

/** Percentage from a 0-100 value, e.g. 42.5 -> "42.5%" */
export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${percentFormat.format(value)}%`;
}

/** Dates in Arabic with Western digits */
export function formatDate(value: string | number | Date | null | undefined): string {
  if (value === null || value === undefined || value === "") return "—";
  // A date-only string ("2026-10-08") is a calendar day, not UTC midnight
  const date =
    value instanceof Date ? value : typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("ar-SA-u-nu-latn-ca-gregory", { year: "numeric", month: "long", day: "numeric" });
}

const pad = (n: number) => String(n).padStart(2, "0");

/** 24h time, Western digits: "10:30" */
export const formatTime = (value: Date) => `${pad(value.getHours())}:${pad(value.getMinutes())}`;

/** Date plus 24h time, Western digits: "22 يناير 2026، 10:30" */
export const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  const d = value instanceof Date ? value : new Date(String(value).replace(" ", "T"));
  if (Number.isNaN(d.getTime())) return "—";
  return `${formatDate(d)}، ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

/** "3 معايير", "15 معياراً" with Western digits. Forms: one, two, few (0 and 3-10), many (11+). */
export const counted = (n: number, forms: { one: string; two: string; few: string; many: string }) => {
  const r = n % 100;
  const noun = n === 1 || (n >= 100 && r === 0) ? forms.one : n === 2 ? forms.two : r >= 11 ? forms.many : forms.few;
  return `${formatNumber(n)} ${noun}`;
};
