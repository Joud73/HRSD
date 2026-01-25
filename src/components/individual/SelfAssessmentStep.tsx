import { useState } from "react";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";

interface SelfAssessmentStepProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

const questions = [
  { id: 1, text: "ما مدى معرفتك بأهداف العمل غير الربحي؟" },
  { id: 2, text: "هل لديك خبرة سابقة في العمل التطوعي؟" },
  { id: 3, text: "ما مستوى مهاراتك في التواصل مع الآخرين؟" },
  { id: 4, text: "هل تجيد العمل ضمن فريق؟" },
  { id: 5, text: "ما مدى قدرتك على إدارة الوقت؟" },
  { id: 6, text: "هل لديك خبرة في التخطيط الاستراتيجي؟" },
  { id: 7, text: "ما مستوى معرفتك بالأنظمة واللوائح ذات العلاقة؟" },
  { id: 8, text: "هل تستطيع التعامل مع ضغوط العمل؟" },
  { id: 9, text: "ما مدى إلمامك باستخدام التقنية في العمل؟" },
  { id: 10, text: "هل لديك مهارات القيادة والتوجيه؟" },
  { id: 11, text: "ما مستوى معرفتك بإدارة المشاريع؟" },
  { id: 12, text: "هل تجيد التعامل مع المستفيدين؟" },
  { id: 13, text: "ما مدى قدرتك على حل المشكلات؟" },
  { id: 14, text: "هل لديك خبرة في كتابة التقارير؟" },
  { id: 15, text: "ما مستوى مهاراتك في العرض والتقديم؟" },
  { id: 16, text: "هل تستطيع التكيف مع التغييرات؟" },
  { id: 17, text: "ما مدى معرفتك بأفضل الممارسات في القطاع؟" },
  { id: 18, text: "هل لديك خبرة في جمع التبرعات؟" },
  { id: 19, text: "ما مستوى معرفتك بالحوكمة المؤسسية؟" },
  { id: 20, text: "هل تجيد بناء الشراكات والعلاقات؟" },
  { id: 21, text: "ما مدى قدرتك على الابتكار والإبداع؟" },
  { id: 22, text: "هل لديك رغبة في التطوير المستمر؟" },
];

const options = [
  { value: "1", label: "ضعيف" },
  { value: "2", label: "متوسط" },
  { value: "3", label: "جيد" },
  { value: "4", label: "ممتاز" },
];

const SelfAssessmentStep = ({ onComplete, onSkip }: SelfAssessmentStepProps) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [questions[currentQuestion].id]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Calculate score
      const totalScore = Object.values(answers).reduce((sum, val) => sum + parseInt(val), 0);
      const maxScore = questions.length * 4;
      const percentage = Math.round((totalScore / maxScore) * 100);
      setScore(percentage);
      setShowResult(true);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const getScoreLevel = (score: number) => {
    if (score >= 80) return { label: "ممتاز", color: "hsl(142, 71%, 45%)" };
    if (score >= 60) return { label: "جيد جداً", color: "hsl(175, 75%, 30%)" };
    if (score >= 40) return { label: "جيد", color: "hsl(35, 91%, 54%)" };
    return { label: "يحتاج تحسين", color: "hsl(0, 84%, 60%)" };
  };

  if (showResult) {
    const level = getScoreLevel(score);
    return (
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg mx-auto text-center" dir="rtl">
        <h3 
          className="text-2xl font-hrsd-title mb-6"
          style={{ color: "hsl(175, 75%, 30%)" }}
        >
          نتيجة التقييم الذاتي
        </h3>

        <div 
          className="w-32 h-32 mx-auto rounded-full flex items-center justify-center mb-6"
          style={{ 
            background: `conic-gradient(${level.color} ${score}%, #e5e7eb ${score}%)`,
          }}
        >
          <div className="w-24 h-24 rounded-full bg-white flex flex-col items-center justify-center">
            <span className="text-3xl font-hrsd-bold" style={{ color: level.color }}>
              {score}%
            </span>
          </div>
        </div>

        <div 
          className="inline-block px-6 py-2 rounded-full mb-6 font-hrsd-semibold text-white"
          style={{ backgroundColor: level.color }}
        >
          {level.label}
        </div>

        <p className="text-gray-600 mb-8 font-hrsd">
          بناءً على إجاباتك، قمنا بتحديد الدورات المناسبة لتطوير مهاراتك
        </p>

        <Button
          className="w-full h-12 font-hrsd-semibold bg-primary hover:bg-primary/90"
          onClick={() => onComplete(score)}
        >
          الدورات المقترحة
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-8 max-w-lg mx-auto" dir="rtl">
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="text-2xl font-hrsd-title"
          style={{ color: "hsl(175, 75%, 30%)" }}
        >
          التقييم الذاتي
        </h3>
        <Button
          variant="ghost"
          className="text-gray-500 hover:text-gray-700 font-hrsd"
          onClick={onSkip}
        >
          تخطي
        </Button>
      </div>

      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2 font-hrsd">
          <span>السؤال {currentQuestion + 1} من {questions.length}</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      <div className="mb-8">
        <p className="text-lg font-hrsd-semibold text-gray-800 mb-6">
          {questions[currentQuestion].text}
        </p>

        <RadioGroup
          value={answers[questions[currentQuestion].id] || ""}
          onValueChange={handleAnswer}
          className="space-y-3"
        >
          {options.map((option) => (
            <div
              key={option.value}
              className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                answers[questions[currentQuestion].id] === option.value
                  ? "border-primary bg-primary/5"
                  : "border-gray-200 hover:border-gray-300"
              }`}
              onClick={() => handleAnswer(option.value)}
            >
              <Label 
                htmlFor={option.value} 
                className="flex-1 cursor-pointer font-hrsd text-base text-right"
              >
                {option.label}
              </Label>
              <RadioGroupItem value={option.value} id={option.value} className="mr-3" />
            </div>
          ))}
        </RadioGroup>
      </div>

      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 h-12 font-hrsd-semibold"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          <ChevronRight className="w-5 h-5 ml-2" />
          السابق
        </Button>
        <Button
          type="button"
          className="flex-1 h-12 font-hrsd-semibold bg-primary hover:bg-primary/90"
          onClick={handleNext}
          disabled={!answers[questions[currentQuestion].id]}
        >
          {currentQuestion === questions.length - 1 ? "عرض النتيجة" : "التالي"}
          {currentQuestion < questions.length - 1 && <ChevronLeft className="w-5 h-5 mr-2" />}
        </Button>
      </div>
    </div>
  );
};

export default SelfAssessmentStep;
