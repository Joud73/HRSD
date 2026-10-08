import { forwardRef, type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/**
 * The one horizontal frame of the product: 1440px max, 20/32/48px gutters.
 * Header, strip, hero, sections, footer and internal pages all use it so their
 * start edges share one vertical line.
 */
const Container = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("mx-auto w-full max-w-container px-5 md:px-8 lg:px-12", className)} {...props} />
));
Container.displayName = "Container";

export default Container;
