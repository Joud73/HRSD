import HeroGov from "@/components/gov/HeroGov";
import StepsSection from "@/components/gov/StepsSection";
import TracksSection from "@/components/gov/TracksSection";
import GeographicDistributionSection from "@/components/GeographicDistributionSection";

const Index = () => (
  <div className="flex min-h-screen flex-col">
    <main className="flex-1">
      <HeroGov />
      <StepsSection />
      <TracksSection />
      <GeographicDistributionSection />
    </main>
  </div>
);

export default Index;
