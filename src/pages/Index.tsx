import AppHeader from "@/components/AppHeader";
import HeroGov from "@/components/gov/HeroGov";
import StepsSection from "@/components/gov/StepsSection";
import TracksSection from "@/components/gov/TracksSection";
import GeographicDistributionSection from "@/components/GeographicDistributionSection";
import Footer from "@/components/Footer";

const Index = () => (
  <div className="flex min-h-screen flex-col">
    <AppHeader />
    <main className="flex-1">
      <HeroGov />
      <StepsSection />
      <TracksSection />
      <GeographicDistributionSection />
    </main>
    <Footer />
  </div>
);

export default Index;
