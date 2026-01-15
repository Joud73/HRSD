import { useEffect, useState } from "react";

interface TrainingProgressBarProps {
  progress: number;
  label?: string;
}

const TrainingProgressBar = ({ progress, label }: TrainingProgressBarProps) => {
  const [animatedProgress, setAnimatedProgress] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress);
    }, 300);
    return () => clearTimeout(timer);
  }, [progress]);

  return (
    <div className="w-full" dir="rtl">
      {label && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-hrsd-medium text-white/90">{label}</span>
          <span className="text-sm font-hrsd-bold text-accent">{progress}%</span>
        </div>
      )}
      <div
        className="w-full h-3 md:h-4 bg-white/20 rounded-full overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`نسبة الإنجاز ${progress}%`}
      >
        <div
          className="h-full bg-accent rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${animatedProgress}%` }}
        />
      </div>
    </div>
  );
};

export default TrainingProgressBar;
