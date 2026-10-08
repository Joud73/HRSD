import type { ReactNode } from "react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";
import { inViewOnce, revealGroup, revealItem } from "@/lib/motion";
import Container from "@/components/layout/Container";

interface SectionProps {
  id?: string;
  /** Alternating rhythm: white or the light section grey */
  tone?: "white" | "alt";
  title?: string;
  /** One line under the title */
  subtitle?: ReactNode;
  /** Small muted caption next to the subtitle (e.g. data source notes) */
  caption?: string;
  /** Rendered at the end side of the heading block */
  headingAside?: ReactNode;
  children: ReactNode;
  className?: string;
}

/**
 * Page section: background tone, 48/64/96px vertical rhythm, heading block,
 * and a once-only reveal of the heading together with its content group.
 */
const Section = ({ id, tone = "white", title, subtitle, caption, headingAside, children, className }: SectionProps) => (
  <section
    id={id}
    aria-labelledby={title && id ? `${id}-title` : undefined}
    className={cn("py-12 md:py-16 lg:py-24", tone === "alt" ? "bg-section-alt" : "bg-background", className)}
  >
    <Container>
      <motion.div initial="hidden" whileInView="visible" viewport={inViewOnce} variants={revealGroup}>
        {title && (
          <motion.div variants={revealItem} className="mb-8 flex flex-col gap-4 md:mb-12 md:flex-row md:items-end md:justify-between">
            <div className="max-w-[720px]">
              <h2 id={id ? `${id}-title` : undefined} className="text-h2 text-primary">
                {title}
              </h2>
              {(subtitle || caption) && (
                <p className="mt-2 text-body text-muted-foreground">
                  {subtitle}
                  {caption && (
                    <span className="ms-3 inline-flex items-center rounded-full border border-border px-2.5 text-caption text-muted-foreground align-middle">
                      {caption}
                    </span>
                  )}
                </p>
              )}
            </div>
            {headingAside}
          </motion.div>
        )}
        <motion.div variants={revealItem}>{children}</motion.div>
      </motion.div>
    </Container>
  </section>
);

export default Section;
