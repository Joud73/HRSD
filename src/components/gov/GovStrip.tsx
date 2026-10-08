import { Landmark } from "lucide-react";
import { copy } from "@/lib/copy";
import Container from "@/components/layout/Container";

/** 36px government affiliation strip. Not sticky: it scrolls away and the header takes the top. */
const GovStrip = () => (
  <div className="h-9 bg-section-alt">
    <Container className="flex h-full items-center gap-2">
      <Landmark aria-hidden className="h-3.5 w-3.5 shrink-0 text-primary" strokeWidth={2} />
      <p className="truncate text-caption text-muted-foreground font-hrsd-regular sm:text-small">{copy.gov_strip}</p>
    </Container>
  </div>
);

export default GovStrip;
