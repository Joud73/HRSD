import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "motion/react";
import { copy, pagesCopy } from "@/lib/copy";
import { revealGroup, revealItem } from "@/lib/motion";
import Container from "@/components/layout/Container";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404: route not found", location.pathname);
  }, [location.pathname]);

  return (
    <Container className="py-24 md:py-32">
      <motion.div initial="hidden" animate="visible" variants={revealGroup} className="flex max-w-[560px] flex-col items-start gap-4">
        <motion.p variants={revealItem} className="tabular text-small font-hrsd-medium text-muted-foreground">
          {pagesCopy.not_found_code}
        </motion.p>
        <motion.h1 variants={revealItem} className="text-h1 text-primary">
          {copy.not_found_title}
        </motion.h1>
        <motion.p variants={revealItem} className="text-body text-muted-foreground">
          {copy.not_found_desc}
        </motion.p>
        <motion.div variants={revealItem} className="mt-4">
          <Button asChild className="h-12 px-6 text-body">
            <Link to="/">{copy.not_found_action}</Link>
          </Button>
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default NotFound;
