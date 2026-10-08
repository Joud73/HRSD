import { Landmark } from "lucide-react";
import { copy } from "@/lib/copy";

/** 36px government affiliation strip above the header. */
const GovStrip = () => (
  <div className="h-9 border-b border-border bg-surface">
    <div className="mx-auto flex h-full max-w-[1200px] items-center gap-2 px-4 md:px-6">
      <Landmark aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
      <p className="truncate text-xs text-muted-foreground font-hrsd-regular sm:text-small">{copy.gov_strip}</p>
    </div>
  </div>
);

export default GovStrip;
