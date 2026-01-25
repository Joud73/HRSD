import { 
  LogIn, 
  ClipboardCheck, 
  BookOpen, 
  GraduationCap 
} from "lucide-react";

const steps = [
  { id: 1, title: "التسجيل / تسجيل الدخول", description: "تسجيل الدخول الفردي", icon: LogIn },
  { id: 2, title: "التقييم الذاتي", description: "تحليل الوضع الحالي", icon: ClipboardCheck },
  { id: 3, title: "الدورات المقترحة", description: "تحديد المسار التدريبي", icon: BookOpen },
  { id: 4, title: "التدريب وإصدار الشهادة", description: "حضور الدورات والحصول على الشهادة", icon: GraduationCap },
];

interface IndividualJourneyProps {
  currentStep?: number;
  onStepClick?: (stepId: number) => void;
}

const IndividualJourney = ({ currentStep = 1, onStepClick }: IndividualJourneyProps) => {
  return (
    <section className="py-12 px-4 md:px-8 bg-white overflow-x-auto" dir="rtl">
      <div className="max-w-7xl mx-auto">
        <h2 
          className="text-3xl md:text-4xl font-hrsd-title text-center mb-12"
          style={{ color: "hsl(35, 91%, 54%)" }}
        >
          رحلة الأفراد (العاملين والمستفيدين)
        </h2>

        <div className="relative min-w-[700px]">
          {/* Golden connecting line */}
          <div 
            className="absolute h-1 rounded-full"
            style={{ 
              backgroundColor: "hsl(40, 50%, 65%)",
              top: "50%",
              right: "10%",
              left: "10%",
              transform: "translateY(-50%)",
            }} 
          />

          <div className="flex justify-between items-center relative py-16">
            {steps.map((step, index) => {
              const isCurrent = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              const isTop = index % 2 === 0;
              const Icon = step.icon;

              return (
                <div
                  key={step.id}
                  className={`flex flex-col items-center relative ${onStepClick ? 'cursor-pointer' : ''}`}
                  style={{ width: `${100 / steps.length}%` }}
                  onClick={() => onStepClick?.(step.id)}
                >
                  {/* Top text area */}
                  <div className={`absolute bottom-full mb-4 text-center w-32 ${isTop ? 'block' : 'invisible'}`}>
                    <p
                      className="text-sm font-hrsd-semibold leading-tight"
                      style={{ color: "hsl(175, 75%, 25%)" }}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight font-hrsd">
                      {step.description}
                    </p>
                  </div>

                  {/* Circle with ring design */}
                  <div className="relative">
                    {/* Outer shadow ring */}
                    <div 
                      className="absolute inset-0 rounded-full"
                      style={{
                        width: "80px",
                        height: "80px",
                        background: "linear-gradient(145deg, #e6e6e6, #ffffff)",
                        boxShadow: "8px 8px 16px #d1d1d1, -8px -8px 16px #ffffff",
                        top: "50%",
                        left: "50%",
                        transform: "translate(-50%, -50%)",
                      }}
                    />
                    
                    {/* Teal ring */}
                    <div 
                      className="relative z-10 rounded-full flex items-center justify-center transition-all duration-300"
                      style={{
                        width: "80px",
                        height: "80px",
                        background: isCurrent 
                          ? "linear-gradient(145deg, hsl(35, 91%, 54%), hsl(35, 91%, 45%))"
                          : isCompleted
                          ? "linear-gradient(145deg, hsl(175, 75%, 30%), hsl(175, 75%, 25%))"
                          : "linear-gradient(145deg, hsl(175, 75%, 30%), hsl(175, 75%, 25%))",
                        boxShadow: isCurrent 
                          ? "0 4px 20px hsla(35, 91%, 54%, 0.4)"
                          : "0 4px 15px hsla(175, 75%, 30%, 0.3)",
                      }}
                    >
                      {/* White inner circle */}
                      <div 
                        className="rounded-full flex items-center justify-center bg-white"
                        style={{
                          width: "60px",
                          height: "60px",
                          boxShadow: "inset 2px 2px 5px rgba(0,0,0,0.05)",
                        }}
                      >
                        <Icon 
                          className="w-7 h-7"
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
                        className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
                        style={{
                          left: "-30px",
                          backgroundColor: "hsl(175, 75%, 30%)",
                        }}
                      />
                    )}
                  </div>

                  {/* Bottom text area */}
                  <div className={`absolute top-full mt-4 text-center w-32 ${!isTop ? 'block' : 'invisible'}`}>
                    <p
                      className="text-sm font-hrsd-semibold leading-tight"
                      style={{ color: "hsl(175, 75%, 25%)" }}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-tight font-hrsd">
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

export default IndividualJourney;
