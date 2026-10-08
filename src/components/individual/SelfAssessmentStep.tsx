import { useId, useState } from "react";
import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { pagesCopy } from "@/lib/copy";
import { formatPercent } from "@/lib/format";
import { ease, transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import CountUp from "@/components/shared/CountUp";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface SelfAssessmentStepProps {
  onComplete: (score: number) => void;
  onSkip: () => void;
}

const questions = pagesCopy.sa_questions.map((text, i) => ({ id: i + 1, text }));
const options = pagesCopy.sa_options;

const getScoreLevel = (score: number) => {
  if (score >= 80) return pagesCopy.sa_levels.excellent;
  if (score >= 60) return pagesCopy.sa_levels.very_good;
  if (score >= 40) return pagesCopy.sa_levels.good;
  return pagesCopy.sa_levels.improve;
};

const Bar = ({ value, label }: { value: number; label: string }) => {
  const reduced = useReducedMotion();
  return (
    <div role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)} className="h-2 overflow-hidden rounded-full bg-section-alt">
      <motion.div
        className="h-full rounded-full bg-primary"
        initial={false}
        animate={{ width: `${value}%` }}
        transition={reduced ? { duration: 0 } : { duration: 0.6, ease }}
      />
    </div>
  );
};

const SelfAssessmentStep = ({ onComplete, onSkip }: SelfAssessmentStepProps) => {
  const reduced = useReducedMotion();
  const groupId = useId();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);

  const question = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const isLast = currentQuestion === questions.length - 1;

  const handleAnswer = (value: string) => {
    setAnswers({ ...answers, [question.id]: value });
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
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

  if (showResult) {
    return (
      <section aria-labelledby="sa-result-title" className="mx-auto max-w-[640px] rounded-lg border border-border bg-card p-6 md:p-8">
        <h2 id="sa-result-title" className="text-h3 text-ink">
          {pagesCopy.sa_result_title}
        </h2>
        <div className="mt-6 flex flex-wrap items-end gap-4">
          <CountUp value={score} suffix="%" className="tabular text-display font-hrsd-bold text-primary" />
          <span className="mb-3 inline-flex h-7 items-center rounded-full border border-primary/30 bg-primary/5 px-3 text-caption font-hrsd-medium text-primary">
            {getScoreLevel(score)}
          </span>
        </div>
        <div className="mt-4">
          <Bar value={score} label={pagesCopy.sa_result_title} />
        </div>
        <p className="mt-6 text-body text-muted-foreground">{pagesCopy.sa_result_desc}</p>
        <Button className="mt-8 h-12 w-full px-6 text-body sm:w-auto" onClick={() => onComplete(score)}>
          {pagesCopy.sa_result_action}
          <ArrowLeft aria-hidden />
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="sa-title" className="mx-auto max-w-[720px] rounded-lg border border-border bg-card">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border p-6">
        <div>
          <h2 id="sa-title" className="text-h3 text-ink">
            {pagesCopy.sa_title}
          </h2>
          <p className="mt-1 text-small text-muted-foreground">{pagesCopy.sa_desc}</p>
        </div>
        <Button variant="ghost" className="text-muted-foreground hover:text-ink" onClick={onSkip}>
          {pagesCopy.sa_skip}
        </Button>
      </div>

      <div className="p-6 md:p-8">
        <div className="mb-8">
          <div className="mb-2 flex justify-between text-small text-muted-foreground">
            <span>{pagesCopy.sa_question_of(currentQuestion + 1, questions.length)}</span>
            <span className="tabular">{formatPercent(Math.round(progress))}</span>
          </div>
          <Bar value={progress} label={pagesCopy.sa_question_of(currentQuestion + 1, questions.length)} />
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.fieldset
            key={question.id}
            initial={{ opacity: 0, x: reduced ? 0 : 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={transition.ui}
          >
            <legend id={`${groupId}-q`} className="mb-6 text-body font-hrsd-bold text-ink">
              {question.text}
            </legend>
            <RadioGroup
              dir="rtl"
              aria-labelledby={`${groupId}-q`}
              value={answers[question.id] || ""}
              onValueChange={handleAnswer}
              className="grid gap-3 sm:grid-cols-2"
            >
              {options.map((option) => {
                const checked = answers[question.id] === option.value;
                const optionId = `${groupId}-${option.value}`;
                return (
                  <label
                    key={option.value}
                    htmlFor={optionId}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-md border px-4 py-3 text-body transition-colors duration-micro",
                      checked ? "border-primary bg-primary/5 text-primary" : "border-border text-ink hover:border-ink/30"
                    )}
                  >
                    <RadioGroupItem value={option.value} id={optionId} />
                    {option.label}
                  </label>
                );
              })}
            </RadioGroup>
          </motion.fieldset>
        </AnimatePresence>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-border p-6 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="h-12 px-6 text-body" onClick={handlePrevious} disabled={currentQuestion === 0}>
          <ChevronRight aria-hidden />
          {pagesCopy.sa_prev}
        </Button>
        <Button type="button" className="h-12 px-6 text-body" onClick={handleNext} disabled={!answers[question.id]}>
          {isLast ? pagesCopy.sa_finish : pagesCopy.sa_next}
          <ChevronLeft aria-hidden />
        </Button>
      </div>
    </section>
  );
};

export default SelfAssessmentStep;
