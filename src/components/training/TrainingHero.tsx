import { ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import TrainingProgressBar from "./TrainingProgressBar";

const TrainingHero = () => {
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section className="bg-primary py-12 md:py-20 px-4" dir="rtl">
      <div className="container mx-auto">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          {/* Content */}
          <div className="flex-1 space-y-6">
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-hrsd-title text-white leading-relaxed">
              مرحلة التأهيل والتدريب – منصة التدريب والتأهيل
            </h1>
            <p className="text-white/90 text-base md:text-lg leading-relaxed max-w-2xl font-hrsd-medium">
              تهدف هذه المرحلة إلى تزويدك بالمعرفة والمهارات اللازمة للنجاح في
              رحلتك المهنية. تتضمن مجموعة من البرامج التدريبية المتخصصة التي
              صُممت بعناية لتلبية احتياجاتك وتطوير قدراتك.
            </p>

            {/* Progress */}
            <div className="max-w-md">
              <TrainingProgressBar progress={45} label="نسبة إتمام المرحلة" />
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                onClick={() => scrollToSection("training-programs")}
                className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-hrsd-semibold bg-accent hover:bg-accent/90 text-white rounded-lg flex items-center justify-center gap-2 w-full sm:w-auto"
                aria-label="متابعة المسار التدريبي - التمرير إلى قسم البرامج"
              >
                <span>متابعة المسار التدريبي</span>
                <ArrowDown size={20} className="animate-bounce" />
              </Button>
              <Button
                onClick={() => scrollToSection("outputs")}
                variant="outline"
                className="h-12 md:h-14 px-6 md:px-8 text-base md:text-lg font-hrsd-semibold bg-transparent border-2 border-white text-white hover:bg-white/10 rounded-lg w-full sm:w-auto"
                aria-label="عرض الخطة التدريبية - التمرير إلى قسم المخرجات"
              >
                عرض الخطة التدريبية
              </Button>
            </div>
          </div>

          {/* Decorative Element */}
          <div className="hidden lg:flex items-center justify-center">
            <div className="w-48 h-48 xl:w-64 xl:h-64 rounded-full border-4 border-white/20 flex items-center justify-center">
              <div className="w-36 h-36 xl:w-48 xl:h-48 rounded-full border-4 border-accent/50 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-4xl xl:text-5xl font-hrsd-bold text-accent">45%</span>
                  <p className="text-white/80 text-sm mt-1 font-hrsd-medium">مكتمل</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrainingHero;
