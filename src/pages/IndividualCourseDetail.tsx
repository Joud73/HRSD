import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { ArrowRight, Clock, Calendar, ChevronUp, ChevronDown, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import { getProgramById, TrainingProgram } from "@/data/trainingPrograms";

const IndividualCourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openDays, setOpenDays] = useState<number[]>([0, 1]);

  useEffect(() => {
    if (courseId) {
      const foundProgram = getProgramById(parseInt(courseId));
      if (foundProgram) {
        setProgram(foundProgram);
      }
      setIsLoading(false);
    }
  }, [courseId]);

  const handleBack = () => {
    navigate("/individuals-journey");
  };

  const toggleDay = (index: number) => {
    setOpenDays((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-primary font-hrsd-medium">جاري التحميل...</div>
      </div>
    );
  }

  if (!program) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <AppHeader variant="individual" />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center" dir="rtl">
            <h2 className="text-2xl font-hrsd-bold text-foreground mb-4">البرنامج غير موجود</h2>
            <Button onClick={handleBack} className="bg-primary hover:bg-primary/90">
              العودة إلى رحلة الأفراد
            </Button>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader variant="individual" />
      
      {/* Spacer for fixed header */}
      <div className="h-20" />

      {/* Hero Section */}
      <section className="bg-primary py-12 md:py-16 px-4" dir="rtl">
        <div className="container mx-auto max-w-4xl">
          {/* Back Button */}
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-6 transition-colors font-hrsd-medium"
          >
            <ArrowRight size={20} />
            <span>العودة إلى رحلة الأفراد</span>
          </button>

          {/* Course Title */}
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-hrsd-title text-white leading-relaxed mb-4">
            {program.title}
          </h1>
          
          {/* Short Description */}
          <p className="text-white/90 text-base md:text-lg leading-relaxed font-hrsd-medium">
            {program.description}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-8 md:py-12 px-4" dir="rtl">
        <div className="container mx-auto max-w-4xl space-y-8">
          
          {/* About Section */}
          <div className="bg-card rounded-xl p-6 border border-border">
            <h2 className="text-xl font-hrsd-bold text-foreground mb-4">عام</h2>
            <p className="text-muted-foreground font-hrsd-medium leading-relaxed">
              {program.fullDescription}
            </p>
          </div>

          {/* Schedule Banner */}
          <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex items-center gap-3">
            <Calendar size={24} className="text-primary shrink-0" />
            <p className="text-foreground font-hrsd-medium text-sm md:text-base">
              <span className="text-primary font-hrsd-semibold">{program.title}</span>
              {" "}تبدأ من {program.startDate} إلى {program.endDate} من الساعة {program.time} كل يوم
            </p>
          </div>

          {/* Course Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl p-5 border border-border text-center">
              <Clock size={28} className="text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-hrsd-medium mb-1">المدة</p>
              <p className="font-hrsd-semibold text-foreground">{program.duration}</p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border text-center">
              <Calendar size={28} className="text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-hrsd-medium mb-1">أيام التدريب</p>
              <p className="font-hrsd-semibold text-foreground">
                {program.schedule?.days.join("، ") || "حسب الجدول"}
              </p>
            </div>
            <div className="bg-card rounded-xl p-5 border border-border text-center">
              <FileText size={28} className="text-primary mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-hrsd-medium mb-1">نوع التدريب</p>
              <p className="font-hrsd-semibold text-foreground">{program.deliveryMode}</p>
            </div>
          </div>

          {/* Course Days - Collapsible */}
          <div className="space-y-3">
            {program.courseDays.map((day, index) => (
              <Collapsible
                key={index}
                open={openDays.includes(index)}
                onOpenChange={() => toggleDay(index)}
              >
                <div className="bg-card rounded-xl border border-border overflow-hidden">
                  <CollapsibleTrigger className="w-full p-5 flex items-center justify-between hover:bg-muted/50 transition-colors">
                    <h3 className="text-lg font-hrsd-bold text-foreground">{day.title}</h3>
                    {openDays.includes(index) ? (
                      <ChevronUp size={20} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={20} className="text-muted-foreground" />
                    )}
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-5 pb-5 space-y-3">
                      {day.materials.length > 0 ? (
                        day.materials.map((material, matIndex) => (
                          <div
                            key={matIndex}
                            className="flex items-center justify-between p-4 bg-muted/30 rounded-lg border border-border/50"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                                <FileText size={20} className="text-primary" />
                              </div>
                              <div>
                                <p className="font-hrsd-medium text-foreground text-sm">
                                  {material.name}
                                </p>
                              </div>
                            </div>
                            <span className="text-xs text-muted-foreground font-hrsd-medium bg-muted px-2 py-1 rounded">
                              {material.type}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-sm font-hrsd-medium text-center py-4">
                          لا توجد مواد متاحة حالياً
                        </p>
                      )}
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))}
          </div>

        </div>
      </section>

      <Footer />
    </div>
  );
};

export default IndividualCourseDetail;
