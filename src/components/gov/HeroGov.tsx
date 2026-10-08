import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { revealGroup, revealItem } from "@/lib/motion";
import Container from "@/components/layout/Container";

/** Home hero: deep green, start-aligned statement, one orchestrated load sequence. */
const HeroGov = () => (
  <section id="about" className="bg-primary text-primary-foreground">
    <Container className="flex items-center py-16 md:py-20 lg:min-h-[480px] lg:py-24">
      <motion.div className="max-w-[760px]" initial="hidden" animate="visible" variants={revealGroup}>
        <motion.h1 variants={revealItem} className="text-h1 text-primary-foreground lg:text-display">
          {copy.hero_title}
        </motion.h1>
        <motion.p variants={revealItem} className="mt-5 max-w-[60ch] text-body font-hrsd-regular text-primary-foreground/85 md:text-h3 md:font-hrsd-regular">
          {copy.hero_subtitle}
        </motion.p>
        <motion.div variants={revealItem} className="mt-10 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 bg-primary-foreground px-6 text-body font-hrsd-bold text-primary hover:bg-primary-foreground/90 focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
          >
            <Link to="/login">{copy.hero_cta_primary}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 border-primary-foreground/60 bg-transparent px-6 text-body font-hrsd-medium text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
          >
            <Link to="/#steps">{copy.hero_cta_secondary}</Link>
          </Button>
        </motion.div>
      </motion.div>
    </Container>
  </section>
);

export default HeroGov;
