import { motion } from "motion/react";
import { useLocation, useOutlet } from "react-router-dom";
import { transition } from "@/lib/motion";

/** Route content with a 150ms opacity crossfade on path change. */
const RouteFade = () => {
  const location = useLocation();
  const outlet = useOutlet();
  return (
    <motion.div key={location.pathname} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={transition.micro}>
      {outlet}
    </motion.div>
  );
};

export default RouteFade;
