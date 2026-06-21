import { cn } from "@/lib/utils";

interface KpiCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
  showProgress?: boolean;
  progressValue?: number;
}

const KpiCard = ({ title, value, icon, highlight, showProgress, progressValue = 0 }: KpiCardProps) => (
  <div
    className={cn(
      "rounded-xl border bg-card p-5 shadow-sm transition-shadow hover:shadow-md",
      highlight ? "border-primary/30 bg-primary/[0.03]" : "border-border"
    )}
  >
    <div className="flex items-start justify-between">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-hrsd text-muted-foreground">{title}</span>
        <span className="text-2xl font-hrsd-bold text-foreground">{value}</span>
      </div>
      <div
        className={cn(
          "rounded-full p-2.5 border",
          highlight
            ? "border-primary/20 bg-primary/10 text-primary"
            : "border-border bg-muted/50 text-muted-foreground"
        )}
      >
        {icon}
      </div>
    </div>
    {showProgress && (
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-hrsd-medium text-muted-foreground">الإنجاز</span>
          <span className="text-[10px] font-hrsd-bold text-primary">{progressValue}%</span>
        </div>
        <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
    )}
  </div>
);

export default KpiCard;
