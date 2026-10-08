import { Link } from "react-router-dom";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import Section from "@/components/layout/Section";

/** Closing call to action before the footer: a deep green band inset on the section grey. */
const CtaBand = () => (
  <Section tone="alt">
    <div className="flex flex-col gap-6 rounded-lg bg-primary px-6 py-10 text-primary-foreground md:flex-row md:items-center md:justify-between md:px-12 md:py-12">
      <div className="max-w-[640px]">
        <h2 className="text-h2 text-primary-foreground">{copy.cta_title}</h2>
        <p className="mt-2 text-body text-primary-foreground/85">{copy.cta_subtitle}</p>
      </div>
      <Button
        asChild
        className="h-12 shrink-0 self-start bg-primary-foreground px-6 text-body font-hrsd-bold text-primary hover:bg-primary-foreground/90 focus-visible:ring-primary-foreground focus-visible:ring-offset-primary md:self-auto"
      >
        <Link to="/login">{copy.hero_cta_primary}</Link>
      </Button>
    </div>
  </Section>
);

export default CtaBand;
