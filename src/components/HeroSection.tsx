import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.png";
const HeroSection = () => {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center text-center px-4"
      style={{
        backgroundImage: `url(${heroBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundColor: "#148287",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-[#148287]/40" />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Title */}
        <h1
          style={{
            color: "#f5961e",
          }}
          className="text-4xl md:text-5xl lg:text-6xl mb-6 animate-fade-in text-center font-sans text-[#f49b1f]"
        >
          مركز التأهيل والتدريب للمنظمات
        </h1>

        {/* Decorative Lines */}
        <div className="flex justify-center items-center gap-2 mb-8">
          <div
            className="w-12 h-1 rounded"
            style={{
              backgroundColor: "#148287",
            }}
          />
          <div
            className="w-24 h-1 rounded"
            style={{
              backgroundColor: "#148287",
            }}
          />
        </div>

        {/* Description */}
        <p className="text-xl md:text-2xl font-hrsd-medium mb-10 text-white/90 animate-fade-in animation-delay-200">
          تابع لإشراف وزارة الموارد البشرية فنيًا لتمكين المنظمات غير الربحية
        </p>

        {/* CTA Button */}
        <Link to="/login" className="hero-button inline-block animate-fade-in animation-delay-400">
          ابدأ الآن
        </Link>
      </div>

      {/* Side Badge */}
      <div className="side-badge text-primary-foreground bg-accent">نسخة تجريبية</div>
    </section>
  );
};
export default HeroSection;
