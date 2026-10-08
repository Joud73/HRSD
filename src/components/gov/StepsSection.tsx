import { BadgeCheck, ClipboardList, TrendingUp, UserPlus, type LucideIcon } from "lucide-react";
import { copy } from "@/lib/copy";

const STEP_ICONS: LucideIcon[] = [UserPlus, ClipboardList, BadgeCheck, TrendingUp];

/** "رحلة التقييم": the four-step sequence. Vertical on mobile, horizontal from lg. */
const StepsSection = () => (
  <section id="steps" className="scroll-mt-[100px] bg-background py-14 lg:scroll-mt-[116px] lg:py-24">
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <h2 className="font-hrsd-bold text-h2 text-ink">{copy.steps_title}</h2>

      <ol className="mt-10 grid gap-0 lg:mt-12 lg:grid-cols-4 lg:gap-6">
        {copy.steps.map((label, i) => {
          const Icon = STEP_ICONS[i];
          const isLast = i === copy.steps.length - 1;
          return (
            <li key={label} className="relative flex gap-4 pb-8 last:pb-0 lg:flex-col lg:gap-5 lg:pb-0">
              {/* Connector: vertical on mobile, horizontal on desktop */}
              {!isLast && (
                <span
                  aria-hidden
                  className="absolute start-5 top-12 bottom-1 w-px bg-border lg:start-14 lg:-end-6 lg:top-5 lg:bottom-auto lg:h-px lg:w-auto"
                />
              )}
              <span className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary font-hrsd-bold text-h3 text-primary-foreground">
                {(i + 1).toLocaleString("ar-SA")}
              </span>
              <div className="flex items-start gap-3 pt-1.5 lg:pt-0">
                <Icon aria-hidden className="mt-1 h-5 w-5 shrink-0 text-primary" strokeWidth={1.75} />
                <h3 className="font-hrsd-semibold text-h3 text-ink">{label}</h3>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  </section>
);

export default StepsSection;
