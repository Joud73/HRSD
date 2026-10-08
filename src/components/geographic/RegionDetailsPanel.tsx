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
    <h3 className="mb-3 font-hrsd-bold text-h3 text-ink">
      ملخص الإحصائيات
    </h3>

    {/* Total */}
    <div className="mb-2 rounded-md bg-primary p-3 text-start text-primary-foreground">
      <div className="text-h2 font-hrsd-bold">
        +<AnimatedCount value={totalCount} startCounting={startCounting} />
      </div>
      <div className="text-small font-hrsd-medium text-primary-foreground/85">الإجمالي</div>
    </div>

    {/* Summary Stats */}
    <div className="grid grid-cols-2 gap-2 mb-2">
      {summaryStats.map((stat, idx) => <div key={idx} className="rounded-md border border-border bg-surface p-3 text-start">
          <div className="text-h3 font-hrsd-bold text-primary">
            +<AnimatedCount value={stat.count} startCounting={startCounting} />
          </div>
          <div className="text-small font-hrsd-medium text-muted-foreground">{stat.label}</div>
        </div>)}
    </div>

    {/* Top regions list */}
    <div className="flex-1 flex flex-col min-h-0">
      <h4 className="mb-2 font-hrsd-semibold text-small text-ink">
        أعلى المناطق
      </h4>
      <div className="space-y-1">
        {[...regions].sort((a, b) => b.count - a.count).slice(0, 3).map((region, idx) => <div key={region.id} className="flex w-full items-center justify-between border-b border-border py-2 last:border-b-0" dir="rtl">
              {/* RIGHT side - City name and badge */}
              <div className="flex items-center gap-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[11px] font-hrsd-bold text-primary-foreground">
                  {idx + 1}
                </span>
                <span className="text-small font-hrsd-medium text-ink">
                  {region.name}
                </span>
              </div>
              {/* LEFT side - Count */}
              <span className="text-small font-hrsd-bold text-primary">
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
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="إغلاق" className="text-muted-foreground hover:text-ink">
        <X className="h-5 w-5" />
      </Button>
      <h3 className="font-hrsd-bold text-h3 text-ink">{region.name}</h3>
    </div>

    {/* Main stat */}
    <div className="rounded-md bg-primary p-6 text-start text-primary-foreground">
      <div className="text-display-sm font-hrsd-bold">{region.count}</div>
      <div className="text-body font-hrsd-medium text-primary-foreground/85">منظمة أهلية</div>
    </div>

    {/* Details placeholder */}
    <div className="rounded-md border border-border bg-surface p-4">
      <h4 className="mb-2 font-hrsd-semibold text-small text-ink">
        تفاصيل المنطقة
      </h4>
      <p className="text-small font-hrsd-regular text-muted-foreground">
        تضم منطقة {region.name} عدداً من الجهات الخاضعة للإشراف الفني من قبل
        الوزارة، حيث يتم متابعة أدائها وتقديم الدعم اللازم لضمان جودة الخدمات
        المقدمة.
      </p>
    </div>

    {/* Clear selection button */}
    <Button variant="outline" className="w-full border-primary font-hrsd-medium text-primary hover:bg-primary hover:text-primary-foreground" onClick={onClose}>
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
          <DrawerHeader className="text-start">
            <DrawerTitle className="font-hrsd-bold text-h3 text-ink">
              {selectedRegion?.name || "تفاصيل المنطقة"}
            </DrawerTitle>
          </DrawerHeader>
          {selectedRegion && <RegionDetailView region={selectedRegion} onClose={onClose} />}
          <DrawerClose asChild>
            <Button variant="ghost" className="absolute top-4 end-4" size="icon" aria-label="إغلاق">
              <X className="h-5 w-5" />
            </Button>
          </DrawerClose>
        </DrawerContent>
      </Drawer>;
  }

  // Desktop: Side panel
  return <div className="h-full rounded-lg border border-border bg-background p-4">
      {selectedRegion ? <RegionDetailView region={selectedRegion} onClose={onClose} /> : <SummaryView startCounting={startCounting} />}
    </div>;
};
export default RegionDetailsPanel;