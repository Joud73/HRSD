import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DashboardHeroSection from "@/components/DashboardHeroSection";
import OrganizationJourney from "@/components/OrganizationJourney";

const Dashboard = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Spacer for fixed header */}
      <div className="h-20" />
      
      <main className="flex-1">
        <OrganizationJourney />
        <DashboardHeroSection />
      </main>
      
      <Footer />
      
      {/* Side Badge */}
      <div
        className="fixed left-0 top-1/2 -translate-y-1/2 py-4 px-2 text-xs text-white z-50"
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          backgroundColor: "hsl(var(--accent-orange))",
          borderRadius: "0 4px 4px 0",
        }}
      >
        نسخة تجريبية
      </div>
    </div>
  );
};

export default Dashboard;
