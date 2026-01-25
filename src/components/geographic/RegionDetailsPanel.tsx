import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { RegionData, regions, summaryStats, totalCount } from "./types";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerClose } from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
interface RegionDetailsPanelProps {
  selectedRegion: RegionData | null;
  onClose: () => void;
  startCounting: boolean;
}

// Animated counter component
const AnimatedCount = ({
  value,
  startCounting
}: {
  value: number;
  startCounting: boolean;
}) => {
  return <span className={startCounting ? "animate-fade-in" : ""}>
      {startCounting ? value.toLocaleString("ar-SA") : "0"}
    </span>;
};

// Summary stats that show when no region is selected
const SummaryView = ({
  startCounting
}: {
  startCounting: boolean;
}) => <div className="h-full flex flex-col">
    <h3 className="font-hrsd-bold text-[#1D4D37] text-right mb-2 text-3xl">
      ملخص الإحصائيات
    </h3>

    {/* Total */}
    <div className="bg-[#1D4D37] rounded-lg p-3 text-center text-white mb-2">
      <div className="text-2xl font-hrsd-bold">
        +<AnimatedCount value={totalCount} startCounting={startCounting} />
      </div>
      <div className="text-xs font-hrsd-medium">الإجمالي</div>
    </div>

    {/* Summary Stats */}
    <div className="grid grid-cols-2 gap-2 mb-2">
      {summaryStats.map((stat, idx) => <div key={idx} className="bg-[#1D4D37] rounded-lg p-2 text-center text-white">
          <div className="text-lg font-hrsd-bold">
            +<AnimatedCount value={stat.count} startCounting={startCounting} />
          </div>
          <div className="text-[10px] font-hrsd-medium">{stat.label}</div>
        </div>)}
    </div>

    {/* Top regions list */}
    <div className="flex-1 flex flex-col min-h-0">
      <h4 className="font-hrsd-semibold text-gray-700 text-right mb-1.5 text-base">
        أعلى المناطق
      </h4>
      <div className="space-y-1">
        {[...regions].sort((a, b) => b.count - a.count).slice(0, 3).map((region, idx) => <div key={region.id} className="flex items-center justify-between w-full bg-gray-50 rounded-lg py-1.5 px-2 border border-gray-100" dir="rtl">
              {/* RIGHT side - City name and badge */}
              <div className="flex items-center gap-2">
                <span className="w-4 h-4 rounded-full bg-[#1D4D37] text-white text-[10px] flex items-center justify-center font-hrsd-bold">
                  {idx + 1}
                </span>
                <span className="font-hrsd-medium text-gray-700 text-sm">
                  {region.name}
                </span>
              </div>
              {/* LEFT side - Count */}
              <span className="font-hrsd-bold text-[#1B8354] text-sm">
                {region.count}
              </span>
            </div>)}
      </div>
    </div>
  </div>;

// Selected region detail view
const RegionDetailView = ({
  region,
  onClose
}: {
  region: RegionData;
  onClose: () => void;
}) => <div className="space-y-6">
    <div className="flex items-start justify-between">
      <Button variant="ghost" size="icon" onClick={onClose} className="text-gray-400 hover:text-gray-600">
        <X className="h-5 w-5" />
      </Button>
      <h3 className="font-hrsd-bold text-2xl text-[#1D4D37]">{region.name}</h3>
    </div>

    {/* Main stat */}
    <div className="bg-gradient-to-br from-[#1D4D37] to-[#14573A] rounded-2xl p-8 text-center text-white py-[25px] px-[25px]">
      <div className="text-5xl font-hrsd-bold mb-2">{region.count}</div>
      <div className="text-lg font-hrsd-medium opacity-90">منظمة أهلية</div>
    </div>

    {/* Details placeholder */}
    <div className="bg-gray-50 rounded-xl p-5 border border-gray-100 py-[10px]">
      <h4 className="font-hrsd-semibold text-gray-700 text-right mb-3">
        تفاصيل المنطقة
      </h4>
      <p className="text-gray-500 text-right text-sm leading-relaxed font-hrsd-regular">
        تضم منطقة {region.name} عدداً من الجهات الخاضعة للإشراف الفني من قبل
        الوزارة، حيث يتم متابعة أدائها وتقديم الدعم اللازم لضمان جودة الخدمات
        المقدمة.
      </p>
    </div>

    {/* Clear selection button */}
    <Button variant="outline" className="w-full border-[#1D4D37] text-[#1D4D37] hover:bg-[#1D4D37] hover:text-white font-hrsd-medium" onClick={onClose}>
      إظهار كل المناطق
    </Button>
  </div>;
const RegionDetailsPanel = ({
  selectedRegion,
  onClose,
  startCounting
}: RegionDetailsPanelProps) => {
  const isMobile = useIsMobile();

  // Mobile: Use drawer
  if (isMobile) {
    return <Drawer open={!!selectedRegion} onOpenChange={open => !open && onClose()}>
        <DrawerContent className="px-4 pb-8">
          <DrawerHeader className="text-right">
            <DrawerTitle className="font-hrsd-bold text-xl text-[#1D4D37]">
              {selectedRegion?.name || "تفاصيل المنطقة"}
            </DrawerTitle>
          </DrawerHeader>
          {selectedRegion && <RegionDetailView region={selectedRegion} onClose={onClose} />}
          <DrawerClose asChild>
            <Button variant="ghost" className="absolute top-4 left-4" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>;
  }

  // Desktop: Side panel
  return <div className="bg-white rounded-xl shadow-lg border border-gray-100 p-3 h-full">
      {selectedRegion ? <RegionDetailView region={selectedRegion} onClose={onClose} /> : <SummaryView startCounting={startCounting} />}
    </div>;
};
export default RegionDetailsPanel;