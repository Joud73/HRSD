import HeroGov from "@/components/gov/HeroGov";
import StepsSection from "@/components/gov/StepsSection";
import TracksSection from "@/components/gov/TracksSection";
import GeographicDistributionSection from "@/components/GeographicDistributionSection";
import CtaBand from "@/components/gov/CtaBand";

/** Home: hero, journey, tracks, map, closing call to action. Sections alternate white and grey. */
const Index = () => (
  <>
    <HeroGov />
    <StepsSection />
    <TracksSection />
    <GeographicDistributionSection />
    <CtaBand />
  </>
);

export default Index;
