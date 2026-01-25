import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Download, Play, CheckCircle2, Award, Lock } from "lucide-react";

interface Course {
  id: number;
  title: string;
  progress: number;
  completed: boolean;
  modules: number;
  completedModules: number;
}

const TrainingCertificateStep = () => {
  const [courses, setCourses] = useState<Course[]>([
    {
      id: 1,
      title: "أساسيات العمل غير الربحي",
      progress: 100,
      completed: true,
      modules: 8,
      completedModules: 8,
    },
    {
      id: 2,
      title: "مهارات التواصل الفعّال",
      progress: 60,
      completed: false,
      modules: 6,
      completedModules: 4,
    },
    {
      id: 3,
      title: "إدارة المشاريع التطوعية",
      progress: 25,
      completed: false,
      modules: 12,
      completedModules: 3,
    },
  ]);

  const handleContinue = (courseId: number) => {
    // Simulate continuing course - in real app would navigate to course content
    window.location.href = "https://phpstack-1518564-5838964.cloudwaysapps.com/";
  };

  const handleDownloadCertificate = (courseId: number) => {
    // Simulate certificate download
    const course = courses.find(c => c.id === courseId);
    if (course) {
      // Create a simple certificate (in production, this would be a proper PDF)
      const certificateContent = `
        شهادة إتمام
        
        نشهد بأن المتدرب قد أتم بنجاح
        دورة: ${course.title}
        
        تاريخ الإصدار: ${new Date().toLocaleDateString('ar-SA')}
      `;
      
      const blob = new Blob([certificateContent], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `شهادة_${course.title.replace(/\s/g, '_')}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const completedCourses = courses.filter(c => c.completed);
  const inProgressCourses = courses.filter(c => !c.completed);

  return (
    <div className="max-w-4xl mx-auto" dir="rtl">
      <div className="text-center mb-8">
        <h3 
          className="text-2xl font-hrsd-title mb-3"
          style={{ color: "hsl(175, 75%, 30%)" }}
        >
          التدريب وإصدار الشهادة
        </h3>
        <p className="text-gray-600 font-hrsd">
          تابع تقدمك في الدورات واحصل على شهاداتك
        </p>
      </div>

      {/* Completed Courses with Certificates */}
      {completedCourses.length > 0 && (
        <div className="mb-10">
          <h4 
            className="text-lg font-hrsd-semibold mb-4 flex items-center gap-2"
            style={{ color: "hsl(142, 71%, 45%)" }}
          >
            <Award className="w-5 h-5" />
            الدورات المكتملة ({completedCourses.length})
          </h4>
          
          <div className="space-y-4">
            {completedCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-lg p-6 border-r-4"
                style={{ borderColor: "hsl(142, 71%, 45%)" }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "hsla(142, 71%, 45%, 0.1)" }}
                    >
                      <CheckCircle2 
                        className="w-6 h-6" 
                        style={{ color: "hsl(142, 71%, 45%)" }}
                      />
                    </div>
                    <div>
                      <h5 className="font-hrsd-semibold text-gray-800">
                        {course.title}
                      </h5>
                      <p className="text-sm text-gray-500 font-hrsd">
                        {course.completedModules} من {course.modules} وحدات
                      </p>
                    </div>
                  </div>
                  
                  <Button
                    className="font-hrsd-semibold"
                    style={{ 
                      backgroundColor: "hsl(142, 71%, 45%)",
                    }}
                    onClick={() => handleDownloadCertificate(course.id)}
                  >
                    <Download className="w-4 h-4 ml-2" />
                    تحميل الشهادة
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* In Progress Courses */}
      {inProgressCourses.length > 0 && (
        <div>
          <h4 
            className="text-lg font-hrsd-semibold mb-4 flex items-center gap-2"
            style={{ color: "hsl(35, 91%, 54%)" }}
          >
            <Play className="w-5 h-5" />
            الدورات قيد التدريب ({inProgressCourses.length})
          </h4>
          
          <div className="space-y-4">
            {inProgressCourses.map((course) => (
              <div
                key={course.id}
                className="bg-white rounded-xl shadow-lg p-6 border-r-4"
                style={{ borderColor: "hsl(35, 91%, 54%)" }}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div 
                      className="w-12 h-12 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: "hsla(35, 91%, 54%, 0.1)" }}
                    >
                      <Play 
                        className="w-6 h-6" 
                        style={{ color: "hsl(35, 91%, 54%)" }}
                      />
                    </div>
                    <div>
                      <h5 className="font-hrsd-semibold text-gray-800">
                        {course.title}
                      </h5>
                      <p className="text-sm text-gray-500 font-hrsd">
                        {course.completedModules} من {course.modules} وحدات
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      className="font-hrsd-semibold"
                      disabled
                    >
                      <Lock className="w-4 h-4 ml-2" />
                      الشهادة
                    </Button>
                    <Button
                      className="font-hrsd-semibold bg-primary hover:bg-primary/90"
                      onClick={() => handleContinue(course.id)}
                    >
                      <Play className="w-4 h-4 ml-2" />
                      متابعة
                    </Button>
                  </div>
                </div>
                
                <div>
                  <div className="flex justify-between text-sm text-gray-500 mb-2 font-hrsd">
                    <span>التقدم</span>
                    <span>{course.progress}%</span>
                  </div>
                  <Progress value={course.progress} className="h-2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {courses.length === 0 && (
        <div className="bg-white rounded-xl shadow-lg p-12 text-center">
          <div 
            className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6"
            style={{ backgroundColor: "hsla(175, 75%, 30%, 0.1)" }}
          >
            <Play className="w-10 h-10" style={{ color: "hsl(175, 75%, 30%)" }} />
          </div>
          <h4 className="text-xl font-hrsd-semibold text-gray-800 mb-2">
            لا توجد دورات حالياً
          </h4>
          <p className="text-gray-600 font-hrsd">
            يرجى الالتحاق بالدورات المقترحة للبدء في التدريب
          </p>
        </div>
      )}
    </div>
  );
};

export default TrainingCertificateStep;