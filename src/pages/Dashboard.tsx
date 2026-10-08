import DashboardHeroSection from "@/components/DashboardHeroSection";
import OrganizationJourney from "@/components/OrganizationJourney";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      
      
      <main className="flex-1">
        <OrganizationJourney />
        <DashboardHeroSection />
      </main>
      
      
      {/* Side Badge */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 py-4 px-2 text-xs text-white z-50"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          backgroundColor: "hsl(var(--accent))",
          borderRadius: "0 4px 4px 0",
        }}
      >
        نسخة تجريبية
      </div>
    </div>
  );
};

export default Dashboard;
