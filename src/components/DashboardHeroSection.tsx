import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Info, CheckCircle2, Circle, AlertCircle, ClipboardCheck, Send } from "lucide-react";

// Animated Donut Chart Component
interface DonutChartProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
}

const DonutChart = ({ percentage, size = 120, strokeWidth = 12 }: DonutChartProps) => {
  const [animatedPercentage, setAnimatedPercentage] = useState(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (animatedPercentage / 100) * circumference;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedPercentage(percentage);
    }, 100);
    return () => clearTimeout(timer);
  }, [percentage]);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#148287"
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      {/* Percentage text */}
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xl font-hrsd-bold" style={{ color: "#148287" }}>{Math.round(animatedPercentage)}%</span>
      </div>
    </div>
  );
};

// Animated Progress Bar Component
interface AnimatedBarProps {
  percentage: number;
  color: string;
  delay?: number;
}

const AnimatedBar = ({ percentage, color, delay = 0 }: AnimatedBarProps) => {
  const [animatedWidth, setAnimatedWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedWidth(percentage);
    }, 100 + delay);
    return () => clearTimeout(timer);
  }, [percentage, delay]);

  return (
    <div
      className="h-full rounded transition-all duration-1000 ease-out"
      style={{
        width: `${animatedWidth}%`,
        backgroundColor: color,
      }}
    />
  );
};

// Course card data
interface CourseCard {
  title: string;
  percentage: number;
  statuses: {
    incomplete: number;
    needsMajorImprovement: number;
    needsMinorImprovement: number;
    complete: number;
  };
  newNotes: number;
}

const courseCards: CourseCard[] = [
  {
    title: "التوجه",
    percentage: 53,
    statuses: { incomplete: 5, needsMajorImprovement: 0, needsMinorImprovement: 2, complete: 6 },
    newNotes: 0,
  },
  {
    title: "الفريق",
    percentage: 87,
    statuses: { incomplete: 1, needsMajorImprovement: 1, needsMinorImprovement: 0, complete: 12 },
    newNotes: 0,
  },
  {
    title: "الشراكات",
    percentage: 47,
    statuses: { incomplete: 3, needsMajorImprovement: 1, needsMinorImprovement: 2, complete: 4 },
    newNotes: 0,
  },
  {
    title: "التأثير",
    percentage: 62,
    statuses: { incomplete: 2, needsMajorImprovement: 1, needsMinorImprovement: 1, complete: 5 },
    newNotes: 0,
  },
  {
    title: "البرامج",
    percentage: 67,
    statuses: { incomplete: 1, needsMajorImprovement: 4, needsMinorImprovement: 1, complete: 8 },
    newNotes: 0,
  },
];

// Summary data
const summaryData = {
  totalPercentage: 56,
  incomplete: 15,
  needsMajorImprovement: 11,
  needsMinorImprovement: 3,
  complete: 32,
};

const totalItems = summaryData.incomplete + summaryData.needsMajorImprovement + summaryData.needsMinorImprovement + summaryData.complete;

// Map course titles to slugs
const courseSlugMap: Record<string, string> = {
  "التوجه": "altawajuh",
  "الفريق": "alfariq",
  "الشراكات": "alsharakat",
  "التأثير": "altaathir",
  "البرامج": "albaramij",
};

const DashboardHeroSection = () => {
  const navigate = useNavigate();
  
  const handleCourseClick = (courseTitle: string) => {
    const slug = courseSlugMap[courseTitle] || "altawajuh";
    navigate(`/technical-indicators/${slug}`);
  };
  return (
    <section className="relative min-h-screen bg-white py-6">
      {/* Side Patterns - Curved Lines */}
      <div 
        className="fixed left-0 top-0 bottom-0 w-24 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 80 0 Q 20 100 80 200 Q 20 300 80 400' stroke='%23148287' stroke-width='1' fill='none' opacity='0.15'/%3E%3Cpath d='M 60 0 Q 0 100 60 200 Q 0 300 60 400' stroke='%23148287' stroke-width='1' fill='none' opacity='0.12'/%3E%3Cpath d='M 40 0 Q -20 100 40 200 Q -20 300 40 400' stroke='%23148287' stroke-width='1' fill='none' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-y',
          backgroundPosition: 'left center',
        }}
      />
      <div 
        className="fixed right-0 top-0 bottom-0 w-24 pointer-events-none z-0"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='400' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M 20 0 Q 80 100 20 200 Q 80 300 20 400' stroke='%23148287' stroke-width='1' fill='none' opacity='0.15'/%3E%3Cpath d='M 40 0 Q 100 100 40 200 Q 100 300 40 400' stroke='%23148287' stroke-width='1' fill='none' opacity='0.12'/%3E%3Cpath d='M 60 0 Q 120 100 60 200 Q 120 300 60 400' stroke='%23148287' stroke-width='1' fill='none' opacity='0.08'/%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat-y',
          backgroundPosition: 'right center',
        }}
      />

      <div className="container mx-auto px-4 relative z-10">
        {/* Page Title and Breadcrumb */}
        <div className="mb-4">
          <nav className="flex items-center gap-2 text-sm font-hrsd mb-3">
            <Link to="/" className="text-primary hover:underline transition-colors">
              العودة الى الصفحة الرئيسية
            </Link>
            <span className="text-primary">&gt;</span>
            <span className="text-primary font-hrsd-semibold">مساقات التقييم الفني</span>
          </nav>
          {/* Green horizontal line */}
          <div className="h-0.5 bg-primary w-full" />
        </div>

        {/* Info Message Box */}
        <div className="flex items-center gap-3 justify-center mb-6">
          <span className="text-sm font-hrsd text-muted-foreground">
            انت في مرحلة التقييم الذاتي ، عند الانتهاء من التقييم قم بالضغط على زر ارسال التقييم . . .
          </span>
          <Info className="w-5 h-5 text-primary flex-shrink-0" />
        </div>

        {/* Constrained width container for main content */}
        <div className="max-w-5xl mx-auto">
          {/* إجمالي التقييم Summary Block */}
          <div 
            className="rounded-lg p-6 mb-8"
            style={{ backgroundColor: "#fef9e7" }}
          >
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left side - Status list */}
              <div className="flex-1 order-2 md:order-1">
                {/* Status rows */}
                <div className="space-y-3">
                  {/* غير مكتمل */}
                  <div className="flex items-center gap-3 transition-all duration-200 hover:bg-white/50 rounded px-2 py-1 cursor-default">
                    <Circle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="text-sm font-hrsd-medium text-foreground w-32">غير مكتمل</span>
                    <div className="flex-1 h-5 bg-white rounded overflow-hidden">
                      <AnimatedBar 
                        percentage={(summaryData.incomplete / totalItems) * 100}
                        color="#9ca3af"
                        delay={0}
                      />
                    </div>
                    <span className="text-sm font-hrsd-semibold w-8 text-center">{summaryData.incomplete}</span>
                  </div>

                  {/* بحاجة إلى تحسين كبير */}
                  <div className="flex items-center gap-3 transition-all duration-200 hover:bg-white/50 rounded px-2 py-1 cursor-default">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" style={{ color: "#f5961e" }} />
                    <span className="text-sm font-hrsd-medium text-foreground w-32">بحاجة إلى تحسين كبير</span>
                    <div className="flex-1 h-5 bg-white rounded overflow-hidden">
                      <AnimatedBar 
                        percentage={(summaryData.needsMajorImprovement / totalItems) * 100}
                        color="#f5961e"
                        delay={100}
                      />
                    </div>
                    <span className="text-sm font-hrsd-semibold w-8 text-center">{summaryData.needsMajorImprovement}</span>
                  </div>

                  {/* بحاجة إلى تحسين بسيط */}
                  <div className="flex items-center gap-3 transition-all duration-200 hover:bg-white/50 rounded px-2 py-1 cursor-default">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#22c55e" }} />
                    <span className="text-sm font-hrsd-medium text-foreground w-32">بحاجة إلى تحسين بسيط</span>
                    <div className="flex-1 h-5 bg-white rounded overflow-hidden">
                      <AnimatedBar 
                        percentage={(summaryData.needsMinorImprovement / totalItems) * 100}
                        color="#22c55e"
                        delay={200}
                      />
                    </div>
                    <span className="text-sm font-hrsd-semibold w-8 text-center">{summaryData.needsMinorImprovement}</span>
                  </div>

                  {/* مكتمل */}
                  <div className="flex items-center gap-3 transition-all duration-200 hover:bg-white/50 rounded px-2 py-1 cursor-default">
                    <CheckCircle2 className="w-4 h-4 flex-shrink-0" style={{ color: "#148287" }} />
                    <span className="text-sm font-hrsd-medium text-foreground w-32">مكتمل</span>
                    <div className="flex-1 h-5 bg-white rounded overflow-hidden">
                      <AnimatedBar 
                        percentage={(summaryData.complete / totalItems) * 100}
                        color="#148287"
                        delay={300}
                      />
                    </div>
                    <span className="text-sm font-hrsd-semibold w-8 text-center">{summaryData.complete}</span>
                  </div>
                </div>
              </div>

              {/* Right side - Title and total percentage */}
              <div className="flex flex-col items-end order-1 md:order-2 md:w-56">
                <h2 className="text-xl font-hrsd-bold mb-3" style={{ color: "#f5961e" }}>
                  إجمالي التقييم
                </h2>
                <div className="flex items-center gap-3 w-full">
                  <div className="flex-1 h-6 bg-white rounded overflow-hidden">
                    <AnimatedBar 
                      percentage={summaryData.totalPercentage}
                      color="#f5961e"
                      delay={400}
                    />
                  </div>
                  <span className="text-2xl font-hrsd-bold" style={{ color: "#148287" }}>
                    %{summaryData.totalPercentage}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Course Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {courseCards.map((card, index) => (
              <div
                key={index}
                className="rounded-lg p-5 transition-all duration-300 hover:shadow-md cursor-pointer"
                style={{ backgroundColor: "#e8f5f3" }}
              >
                {/* Card Title */}
                <h3 
                  className="text-lg font-hrsd-bold text-right mb-4"
                  style={{ color: "#148287" }}
                >
                  {card.title}
                </h3>

                {/* Chart and Status Section */}
                <div className="flex items-start gap-4 mb-4">
                  {/* Status Lines - Right side */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between gap-2 transition-all duration-200 hover:bg-white/40 rounded px-1 py-0.5">
                      <span className="text-sm font-hrsd-semibold w-4">{card.statuses.incomplete}</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-xs font-hrsd text-muted-foreground">غير مكتمل</span>
                        <Circle className="w-3 h-3 text-gray-400" />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 transition-all duration-200 hover:bg-white/40 rounded px-1 py-0.5">
                      <span className="text-sm font-hrsd-semibold w-4">{card.statuses.needsMajorImprovement}</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-xs font-hrsd" style={{ color: "#f5961e" }}>بحاجة لتحسين كبير</span>
                        <AlertCircle className="w-3 h-3" style={{ color: "#f5961e" }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 transition-all duration-200 hover:bg-white/40 rounded px-1 py-0.5">
                      <span className="text-sm font-hrsd-semibold w-4">{card.statuses.needsMinorImprovement}</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-xs font-hrsd" style={{ color: "#22c55e" }}>بحاجة لتحسين بسيط</span>
                        <CheckCircle2 className="w-3 h-3" style={{ color: "#22c55e" }} />
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 transition-all duration-200 hover:bg-white/40 rounded px-1 py-0.5">
                      <span className="text-sm font-hrsd-semibold w-4">{card.statuses.complete}</span>
                      <div className="flex items-center gap-2 flex-1 justify-end">
                        <span className="text-xs font-hrsd" style={{ color: "#148287" }}>مكتمل</span>
                        <CheckCircle2 className="w-3 h-3" style={{ color: "#148287" }} />
                      </div>
                    </div>
                  </div>

                  {/* Donut Chart - Left side */}
                  <DonutChart percentage={card.percentage} size={100} strokeWidth={10} />
                </div>

                {/* Divider */}
                <div className="h-px bg-primary/30 mb-4" />

                {/* Footer: Button and Notes */}
                <div className="flex items-center justify-between">
                  {/* Notes on left */}
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-xs font-hrsd-bold text-white"
                      style={{ backgroundColor: "#22c55e" }}
                    >
                      {card.newNotes}
                    </span>
                    <span
                      className="text-sm font-hrsd-medium"
                      style={{ color: "#22c55e" }}
                    >
                      ملاحظات جديدة
                    </span>
                  </div>

                  {/* Button on right */}
                  <button
                    onClick={() => handleCourseClick(card.title)}
                    className="flex items-center gap-2 px-4 py-2 rounded-md text-sm font-hrsd-medium text-white transition-all duration-200 hover:shadow-md hover:brightness-110 cursor-pointer"
                    style={{ backgroundColor: "#148287" }}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    تقييم المساق
                  </button>
                </div>
              </div>
            ))}

            {/* Send Evaluation Block - Beige Info Box (in grid) */}
            <div 
              className="rounded-lg p-5 shadow-sm"
              style={{ backgroundColor: "#f5f0e1" }}
            >
              {/* Top sentence - Blue text */}
              <p className="text-sm font-hrsd-semibold text-right mb-3" style={{ color: "#148287" }}>
                حتى تتمكن من ارسال تقييمك الذاتي للمراجعة بواسطة مقيم الوزارة :
              </p>
              
              {/* Thin green line */}
              <div className="h-0.5 mb-4" style={{ backgroundColor: "#148287" }} />
              
              {/* Transparent white text area */}
              <div 
                className="rounded-lg p-4 mb-4"
                style={{ backgroundColor: "rgba(255, 255, 255, 0.7)" }}
              >
                <div className="space-y-1.5 text-right" style={{ color: "#148287" }}>
                  <p className="text-xs font-hrsd-medium">
                    اولا: ضرورة احتساب نتيجة تقييم كافة المؤشرات لجميع المساقات
                  </p>
                  <p className="text-xs font-hrsd-medium">
                    ثانيا: التحقق من صحة بيانات المنظمة في صفحة الاعدادات
                  </p>
                  <p className="text-xs font-hrsd-medium">
                    ثالثا: سوف يتم تفعيل زر ارسال التقييم ادناه, وفي حال قمت بالضغط عليه سيتم
                  </p>
                  <p className="text-xs font-hrsd-medium">
                    ارسال تقييمك ليم مراجعته من قبل الوزارة وافادتكم بالنتيجة
                  </p>
                </div>
              </div>
              
              {/* Send Evaluation Button */}
              <button
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-md text-sm font-hrsd-semibold text-white transition-all duration-200 hover:shadow-md hover:brightness-110"
                style={{ backgroundColor: "#148287" }}
              >
                <Send className="w-4 h-4" />
                إرسال التقييم
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default DashboardHeroSection;
