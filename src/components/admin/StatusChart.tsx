import { useMemo } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, type TooltipProps } from "recharts";
import { BarChart3 } from "lucide-react";
import { adminCopy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { STATUS, type StatusKey } from "@/lib/status";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import EmptyState from "@/components/shared/EmptyState";
import { assessmentStatus } from "@/components/admin/adminUi";

const ORDER: StatusKey[] = ["not_started", "in_progress", "submitted", "returned", "approved"];

interface Datum {
  key: StatusKey;
  label: string;
  count: number;
}

const ChartTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload as Datum;
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 shadow-float">
      <p className="text-caption text-muted-foreground">{d.label}</p>
      <p className="tabular text-small font-hrsd-bold text-ink">
        {formatNumber(d.count)} <span className="font-hrsd-regular text-muted-foreground">{adminCopy.chart_count}</span>
      </p>
    </div>
  );
};

/** Assessments per status: one restrained bar series (primary), neutral axis text, no grid. */
const StatusChart = ({ statusCounts }: { statusCounts: { label: string; count: number }[] }) => {
  const reduced = useReducedMotion();

  const data = useMemo<Datum[]>(() => {
    const totals: Record<StatusKey, number> = { not_started: 0, in_progress: 0, submitted: 0, returned: 0, approved: 0 };
    for (const s of statusCounts) totals[assessmentStatus(s.label)] += s.count;
    return ORDER.map((key) => ({ key, label: STATUS[key].label, count: totals[key] }));
  }, [statusCounts]);

  const total = data.reduce((sum, d) => sum + d.count, 0);
  if (total === 0) return <EmptyState icon={BarChart3} message={adminCopy.chart_empty} className="py-10" />;

  return (
    <figure className="m-0">
      {/* Chart canvas: the one place a fixed height is allowed */}
      <div className="h-72 w-full" role="img" aria-label={adminCopy.chart_aria}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 8, right: 0, bottom: 0, left: 0 }} barCategoryGap="28%">
            <XAxis
              dataKey="label"
              reversed
              tickLine={false}
              axisLine={{ stroke: "hsl(var(--neutral))", strokeOpacity: 0.3 }}
              tick={{ fill: "hsl(var(--neutral))", fontSize: 12 }}
              interval={0}
              height={36}
            />
            <YAxis
              orientation="right"
              allowDecimals={false}
              tickLine={false}
              axisLine={false}
              width={32}
              tick={{ fill: "hsl(var(--neutral))", fontSize: 12 }}
              tickFormatter={(v: number) => formatNumber(v)}
            />
            <Tooltip cursor={{ fill: "hsl(var(--neutral))", fillOpacity: 0.08 }} content={<ChartTooltip />} />
            <Bar
              dataKey="count"
              fill="hsl(var(--primary))"
              radius={[6, 6, 0, 0]}
              maxBarSize={56}
              isAnimationActive={!reduced}
              animationDuration={600}
              animationEasing="ease-out"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      {/* Screen-reader and no-hover equivalent of the bars */}
      <figcaption className="sr-only">
        {data.map((d) => `${d.label}: ${formatNumber(d.count)}`).join("، ")}
      </figcaption>
    </figure>
  );
};

export default StatusChart;
