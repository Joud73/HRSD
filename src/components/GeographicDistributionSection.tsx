import { useEffect, useState, useRef } from "react";
import SaudiHeatmapMap from "./geographic/SaudiHeatmapMap";
import RegionDetailsPanel from "./geographic/RegionDetailsPanel";
import { regions, RegionData } from "./geographic/types";
const GeographicDistributionSection = () => {
  const [startCounting, setStartCounting] = useState(false);
  const [selectedRegion, setSelectedRegion] = useState<RegionData | null>(null);
  const sectionRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting) {
        setStartCounting(true);
        observer.disconnect();
      }
    }, {
      threshold: 0.2
    });
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    return () => observer.disconnect();
  }, []);
  const handleRegionSelect = (region: RegionData | null) => {
    setSelectedRegion(region);
  };
  return <section ref={sectionRef} className="bg-background py-14 lg:py-24">
      <div className="mx-auto max-w-[1200px] px-4 md:px-6">
        {/* Section Header */}
        <div className="mb-8">
          <h2 className="font-hrsd-bold text-h2 text-ink">
            التوزيع الجغرافي للإشراف الفني
          </h2>
          <p className="mt-2 text-small font-hrsd-regular text-muted-foreground">
            انقر على أي منطقة لعرض التفاصيل
          </p>
        </div>

        {/* Map and Details Layout */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12 lg:gap-6">
          {/* Map - Right side on desktop (RTL) */}
          <div className="lg:col-span-7 order-1">
            <div className="h-[300px] rounded-lg border border-border bg-surface p-3 md:h-[360px] md:p-4">
              <SaudiHeatmapMap regions={regions} selectedRegion={selectedRegion} onRegionSelect={handleRegionSelect} />
            </div>
          </div>

          {/* Details Panel - Left side on desktop (RTL) */}
          <div className="lg:col-span-5 order-2">
            <div className="lg:h-[360px]">
              <RegionDetailsPanel selectedRegion={selectedRegion} onClose={() => setSelectedRegion(null)} startCounting={startCounting} />
            </div>
          </div>
        </div>
      </div>
    </section>;
};
export default GeographicDistributionSection;