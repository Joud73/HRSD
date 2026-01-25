import { 
  UserPlus, 
  Compass, 
  ClipboardCheck, 
  BookOpen, 
  GraduationCap, 
  Upload, 
  Brain, 
  Users, 
  Award 
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

const steps = [
  { id: 1, title: "التسجيل", description: "تسجيل الدخول", icon: UserPlus, path: "/login" },
  { id: 2, title: "التقييم الذاتي", description: "التقييم الذكي ورفع الشواهد", icon: ClipboardCheck, path: "/dashboard" },
  { id: 3, title: "اختيار الدورات", description: "اختيار الدورات والتدريب", icon: BookOpen, path: "/training-stage" },
  { id: 4, title: "مراجعة الإدارة", description: "اعتماد النتائج", icon: Users, path: null },
  { id: 5, title: "النتيجة النهائية", description: "إصدار الشهادة", icon: Award, path: "/certificate/:organizationId" },
];

const OrganizationJourney = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getCurrentStepFromPath = () => {
    const path = location.pathname;
    const matchedStep = steps.find(step => step.path === path);
    return matchedStep?.id || 1;
  };

  const currentStep = getCurrentStepFromPath();

  const handleStepClick = (path: string | null) => {
    if (path) {
      navigate(path);
    }
  };

  return (
    <section className="py-6 px-4 md:px-6 bg-white overflow-x-auto" dir="rtl">
      <div className="max-w-6xl mx-auto">
        <h2 
          className="text-xl md:text-2xl font-hrsd-title text-center mb-6"
          style={{ color: "hsl(35, 91%, 54%)" }}
        >
          رحلة المنظمة
        </h2>

        <div className="relative min-w-[700px]">
          {/* Golden connecting line */}
          <div 
            className="absolute h-0.5 rounded-full"
            style={{ 
              backgroundColor: "hsl(40, 50%, 65%)",
              top: "50%",
              right: "5%",
              left: "5%",
              transform: "translateY(-50%)",
            }} 
          />

          <div className="flex justify-between items-center relative py-10">
            {steps.map((step, index) => {
              const isCurrent = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const isTop = index % 2 === 0;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center relative group ${step.path ? 'cursor-pointer' : 'cursor-default'}`}
                  style={{ width: `${100 / steps.length}%` }}
                  onClick={() => handleStepClick(step.path)}
                >
                  {/* Top text area */}
                  <div className={`absolute bottom-full mb-2 text-center w-20 ${isTop ? 'block' : 'invisible'}`}>
                    <p
                      className="text-xs font-hrsd-semibold leading-tight group-hover:opacity-80 transition-opacity"
                      style={{ color: isCurrent ? "hsl(35, 91%, 54%)" : "hsl(175, 75%, 25%)" }}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight font-hrsd">
                      {step.description}
                    </p>
                  </div>

                  {/* Circle with ring design */}
                  <div className="relative">
                    {/* Outer shadow ring */}
                    <div 
                      className="absolute inset-0 rounded-full transition-transform group-hover:scale-105"
                      style={{
                        width: "64px",
                        height: "64px",
                        background: "linear-gradient(145deg, #e6e6e6, #ffffff)",
                        boxShadow: "4px 4px 8px #d1d1d1, -4px -4px 8px #ffffff",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                    
                    {/* Teal ring */}
                    <div 
                      className="relative z-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-105"
                      style={{
                        width: "64px",
                        height: "64px",
                        background: isCurrent 
                          ? "linear-gradient(145deg, hsl(35, 91%, 54%), hsl(35, 91%, 45%))"
                          : isCompleted
                          ? "linear-gradient(145deg, hsl(175, 75%, 30%), hsl(175, 75%, 25%))"
                          : "linear-gradient(145deg, hsl(175, 75%, 30%), hsl(175, 75%, 25%))",
                        boxShadow: isCurrent 
                          ? "0 2px 12px hsla(35, 91%, 54%, 0.4)"
                          : "0 2px 8px hsla(175, 75%, 30%, 0.3)",
                      }}
                    >
                      {/* White inner circle */}
                      <div 
                        className="rounded-full flex items-center justify-center bg-white"
                        style={{
                          width: "50px",
                          height: "50px",
                          boxShadow: "inset 1px 1px 3px rgba(0,0,0,0.05)",
                        }}
                      >
                        <Icon 
                          className="w-5 h-5"
                          style={{ 
                            color: isCurrent 
                              ? "hsl(35, 91%, 54%)" 
                              : "hsl(175, 75%, 30%)" 
                          }}
                          strokeWidth={1.5}
                        />
                      </div>
                    </div>

                    {/* Connector dot on left side */}
                    {index < steps.length - 1 && (
                      <div 
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                        style={{
                          left: "-12px",
                          backgroundColor: "hsl(175, 75%, 30%)",
                        }}
                      />
                    )}
                  </div>

                  {/* Bottom text area */}
                  <div className={`absolute top-full mt-2 text-center w-20 ${!isTop ? 'block' : 'invisible'}`}>
                    <p
                      className="text-xs font-hrsd-semibold leading-tight group-hover:opacity-80 transition-opacity"
                      style={{ color: isCurrent ? "hsl(35, 91%, 54%)" : "hsl(175, 75%, 25%)" }}
                    >
                      {step.title}
                    </p>
                    <p className="text-[10px] text-gray-500 mt-0.5 leading-tight font-hrsd">
                      {step.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default OrganizationJourney;
