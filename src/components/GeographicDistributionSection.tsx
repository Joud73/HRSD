import { useEffect, useState, useRef } from "react";
import favIcon from "@/assets/icons/fav.png";

// Region data with exact numbers from the screenshots
const regions = [
  { name: "الرياض", count: 394 },
  { name: "القصيم", count: 203 },
  { name: "المنطقة الشرقية", count: 192 },
  { name: "المدينة المنورة", count: 132 },
  { name: "مكة المكرمة", count: 424 },
  { name: "حائل", count: 151 },
  { name: "جازان", count: 112 },
  { name: "نجران", count: 112 },
  { name: "عسير", count: 219 },
  { name: "الباحة", count: 78 },
  { name: "الحدود الشمالية", count: 36 },
  { name: "الجوف", count: 53 },
  { name: "تبوك", count: 65 },
];

const summaryStats = [
  { label: "منظمة اهلية", count: 1938 },
  { label: "مؤسسة اهلية", count: 41 },
];

const totalCount = 1978;

// Count-up animation hook
const useCountUp = (end: number, duration: number = 2000, startCounting: boolean = false) => {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (!startCounting) return;
    
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (startTime === null) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      setCount(Math.floor(progress * end));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [end, duration, startCounting]);
  
  return count;
};

// Orbit graphic SVG component
const OrbitGraphic = () => (
  <svg viewBox="0 0 100 100" className="w-24 h-24 absolute left-4 bottom-4 opacity-60">
    {/* Multiple curved lines forming orbit pattern */}
    {[...Array(8)].map((_, i) => (
      <ellipse
        key={i}
        cx="20"
        cy="50"
        rx={15 + i * 5}
        ry={30 + i * 3}
        fill="none"
        stroke={i % 2 === 0 ? "#f5961e" : "#2db473"}
        strokeWidth="1"
        transform={`rotate(-30 20 50)`}
        opacity={0.5 + (i * 0.05)}
      />
    ))}
  </svg>
);

// Star icon component (representing palm/star from the site)
const StarIcon = () => (
  <img src={favIcon} alt="icon" className="w-8 h-8" />
);

// Region Card Component
const RegionCard = ({ region, startCounting }: { region: typeof regions[0]; startCounting: boolean }) => {
  const count = useCountUp(region.count, 1500, startCounting);
  
  return (
    <div className="region-card min-h-32">
      <OrbitGraphic />
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex-1" />
        <div className="text-center flex-1">
          <div className="text-3xl md:text-4xl font-hrsd-bold text-primary">
            {count}
          </div>
          <div className="text-lg font-hrsd-medium text-accent">
            {region.name}
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <StarIcon />
        </div>
      </div>
    </div>
  );
};

// Full width region card for Tabuk
const FullWidthRegionCard = ({ region, startCounting }: { region: typeof regions[0]; startCounting: boolean }) => {
  const count = useCountUp(region.count, 1500, startCounting);
  
  return (
    <div className="region-card min-h-32 col-span-full">
      <OrbitGraphic />
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="flex-1" />
        <div className="text-center flex-1">
          <div className="text-3xl md:text-4xl font-hrsd-bold text-primary">
            {count}
          </div>
          <div className="text-lg font-hrsd-medium text-accent">
            {region.name}
          </div>
        </div>
        <div className="flex-1 flex justify-end">
          <StarIcon />
        </div>
      </div>
    </div>
  );
};

const GeographicDistributionSection = () => {
  const [startCounting, setStartCounting] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  
  const orgCount = useCountUp(summaryStats[0].count, 2000, startCounting);
  const foundationCount = useCountUp(summaryStats[1].count, 2000, startCounting);
  const total = useCountUp(totalCount, 2500, startCounting);
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStartCounting(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );
    
    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  return (
    <section ref={sectionRef} className="py-16 md:py-24 bg-white relative">
      {/* Side patterns */}
      <div className="side-pattern-left" />
      <div className="side-pattern-right" />
      
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-right mb-12">
          <h2 className="section-title">التوزيع الجغرافي للإشراف الفني</h2>
          <div className="section-title-underline" />
        </div>

        {/* Region Cards Grid - First 9 regions (3x3) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {regions.slice(0, 9).map((region, index) => (
            <RegionCard key={index} region={region} startCounting={startCounting} />
          ))}
        </div>

        {/* Second row - 3 regions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {regions.slice(9, 12).map((region, index) => (
            <RegionCard key={index} region={region} startCounting={startCounting} />
          ))}
        </div>

        {/* Tabuk - Full width */}
        <div className="mb-6">
          <FullWidthRegionCard region={regions[12]} startCounting={startCounting} />
        </div>

        {/* Summary Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="stats-card-teal">
          <div className="text-4xl md:text-5xl font-hrsd-bold mb-2">
              {orgCount}+
            </div>
            <div className="text-lg font-hrsd-medium">
              {summaryStats[0].label}
            </div>
          </div>
          <div className="stats-card-teal">
            <div className="text-4xl md:text-5xl font-hrsd-bold mb-2">
              {foundationCount}+
            </div>
            <div className="text-lg font-hrsd-medium">
              {summaryStats[1].label}
            </div>
          </div>
        </div>

        {/* Total Card */}
        <div className="stats-card-navy">
          <div className="text-4xl md:text-5xl font-hrsd-bold mb-2">
            +{total}
          </div>
          <div className="text-lg font-hrsd-medium">
            الإجمالي
          </div>
        </div>
      </div>
    </section>
  );
};

export default GeographicDistributionSection;
