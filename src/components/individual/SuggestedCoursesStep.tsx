import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Clock, Users, CheckCircle2 } from "lucide-react";

interface SuggestedCoursesStepProps {
  assessmentScore?: number;
  onEnroll: (courseId: number) => void;
}

const allCourses = [
  {
    id: 1,
    title: "أساسيات العمل غير الربحي",
    description: "تعرف على المفاهيم الأساسية والإطار العام للعمل في القطاع غير الربحي",
    duration: "8 ساعات",
    participants: 234,
    level: "مبتدئ",
    category: "basic",
  },
  {
    id: 2,
    title: "مهارات التواصل الفعّال",
    description: "تطوير مهارات التواصل مع الفريق والمستفيدين والشركاء",
    duration: "6 ساعات",
    participants: 189,
    level: "متوسط",
    category: "skills",
  },
  {
    id: 3,
    title: "إدارة المشاريع التطوعية",
    description: "تعلم كيفية تخطيط وتنفيذ ومتابعة المشاريع التطوعية بكفاءة",
    duration: "12 ساعة",
    participants: 156,
    level: "متقدم",
    category: "management",
  },
  {
    id: 4,
    title: "الحوكمة المؤسسية",
    description: "فهم مبادئ الحوكمة وتطبيقها في المنظمات غير الربحية",
    duration: "10 ساعات",
    participants: 98,
    level: "متقدم",
    category: "governance",
  },
  {
    id: 5,
    title: "بناء الشراكات الاستراتيجية",
    description: "استراتيجيات بناء وإدارة الشراكات الفعالة مع الجهات المختلفة",
    duration: "8 ساعات",
    participants: 145,
    level: "متوسط",
    category: "partnerships",
  },
  {
    id: 6,
    title: "التخطيط الاستراتيجي",
    description: "تعلم وضع الخطط الاستراتيجية وقياس مؤشرات الأداء",
    duration: "14 ساعة",
    participants: 112,
    level: "متقدم",
    category: "planning",
  },
];

const SuggestedCoursesStep = ({ assessmentScore, onEnroll }: SuggestedCoursesStepProps) => {
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([]);

  // Filter courses based on assessment score
  const getSuggestedCourses = () => {
    if (!assessmentScore) return allCourses;
    if (assessmentScore >= 80) {
      return allCourses.filter(c => c.level === "متقدم");
    }
    if (assessmentScore >= 60) {
      return allCourses.filter(c => c.level === "متوسط" || c.level === "متقدم");
    }
    return allCourses;
  };

  const suggestedCourses = getSuggestedCourses();

  const handleEnroll = (courseId: number) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId]);
      onEnroll(courseId);
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "مبتدئ":
        return "hsl(142, 71%, 45%)";
      case "متوسط":
        return "hsl(35, 91%, 54%)";
      case "متقدم":
        return "hsl(175, 75%, 30%)";
      default:
        return "hsl(175, 75%, 30%)";
    }
  };

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="text-center mb-8">
        <h3 
          className="text-2xl font-hrsd-title mb-3"
          style={{ color: "hsl(175, 75%, 30%)" }}
        >
          الدورات المقترحة
        </h3>
        <p className="text-gray-600 font-hrsd">
          {assessmentScore 
            ? `بناءً على نتيجة تقييمك (${assessmentScore}%)، نقترح عليك الدورات التالية`
            : "اختر من الدورات المتاحة لتطوير مهاراتك"
          }
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {suggestedCourses.map((course) => {
          const isEnrolled = enrolledCourses.includes(course.id);
          
          return (
            <div
              key={course.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-all hover:shadow-xl"
            >
              <div 
                className="h-2"
                style={{ backgroundColor: getLevelColor(course.level) }}
              />
              
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h4 className="text-lg font-hrsd-semibold text-gray-800">
                    {course.title}
                  </h4>
                  <span 
                    className="px-3 py-1 rounded-full text-xs font-hrsd-semibold text-white"
                    style={{ backgroundColor: getLevelColor(course.level) }}
                  >
                    {course.level}
                  </span>
                </div>
                
                <p className="text-gray-600 text-sm mb-4 font-hrsd leading-relaxed">
                  {course.description}
                </p>
                
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span className="font-hrsd">{course.duration}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span className="font-hrsd">{course.participants} مشارك</span>
                  </div>
                </div>
                
                {isEnrolled ? (
                  <Button
                    disabled
                    className="w-full h-11 font-hrsd-semibold bg-green-500 hover:bg-green-500"
                  >
                    <CheckCircle2 className="w-5 h-5 ml-2" />
                    تم الالتحاق
                  </Button>
                ) : (
                  <a href="https://phpstack-1518564-5838964.cloudwaysapps.com/">
                    <Button
                      className="w-full h-11 font-hrsd-semibold bg-primary hover:bg-primary/90"
                      onClick={() => handleEnroll(course.id)}
                    >
                      الالتحاق بالدورة
                    </Button>
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {enrolledCourses.length > 0 && (
        <div className="mt-8 text-center">
          <p className="text-gray-600 font-hrsd mb-4">
            لقد التحقت بـ {enrolledCourses.length} دورة
          </p>
        </div>
      )}
    </div>
  );
};

export default SuggestedCoursesStep;
