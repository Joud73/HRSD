import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import SpecializationsSection from "@/components/SpecializationsSection";
import GeographicDistributionSection from "@/components/GeographicDistributionSection";
import Footer from "@/components/Footer";
import { useNavigate } from "react-router-dom";
import loginBg from "@/assets/login-bg.jpg";


const Index = () => {
  const navigate = useNavigate();

  const handleLogin = () => {
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main>
        <HeroSection />
        <SpecializationsSection />
        <GeographicDistributionSection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
