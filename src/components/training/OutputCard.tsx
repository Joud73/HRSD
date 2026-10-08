import type { LucideIcon } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";

interface OutputCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  isComingSoon?: boolean;
}

/** One stage output: icon, name and one line. Rendered inside the outputs panel, so no border of its own. */
const OutputCard = ({ title, description, icon: Icon, isComingSoon = false }: OutputCardProps) => (
  <div className={cn("flex items-start gap-4", isComingSoon && "opacity-70")}>
    <span
      className={cn(
        "flex h-10 w-10 shrink-0 items-center justify-center rounded-md",
        isComingSoon ? "bg-section-alt text-muted-foreground" : "bg-primary/5 text-primary"
      )}
    >
      <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
    </span>
    <div className="min-w-0">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-body font-hrsd-bold text-ink">{title}</h3>
        {isComingSoon && (
          <span className="rounded-full bg-section-alt px-2 text-small text-muted-foreground">{t.output_soon}</span>
        )}
      </div>
      <p className="mt-1 text-small text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default OutputCard;
