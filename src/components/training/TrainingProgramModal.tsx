import { X, Clock, BookOpen, Users, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProgramDetails {
  title: string;
  description: string;
  duration: string;
  type: string;
  objectives?: string[];
  requirements?: string[];
  instructor?: string;
  startDate?: string;
}

interface TrainingProgramModalProps {
  program: ProgramDetails | null;
  isOpen: boolean;
  onClose: () => void;
  onEnroll: () => void;
  isEnrolled?: boolean;
}

const TrainingProgramModal = ({
  program,
  isOpen,
  onClose,
  onEnroll,
  isEnrolled = false,
}: TrainingProgramModalProps) => {
  if (!isOpen || !program) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-card rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border p-4 md:p-6 flex items-start justify-between gap-4 rounded-t-2xl">
          <h2
            id="modal-title"
            className="text-xl md:text-2xl font-hrsd-bold text-foreground leading-relaxed"
          >
            {program.title}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-muted rounded-lg transition-colors shrink-0"
            aria-label="إغلاق النافذة"
          >
            <X size={20} className="text-muted-foreground" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-6">
          {/* Description */}
          <p className="text-muted-foreground leading-relaxed font-hrsd-medium">
            {program.description}
          </p>

          {/* Meta Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Clock size={18} className="text-primary" />
              <span className="font-hrsd-medium text-foreground">{program.duration}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <BookOpen size={18} className="text-primary" />
              <span className="font-hrsd-medium text-foreground">{program.type}</span>
            </div>
            {program.instructor && (
              <div className="flex items-center gap-2 text-sm">
                <Users size={18} className="text-primary" />
                <span className="font-hrsd-medium text-foreground">{program.instructor}</span>
              </div>
            )}
            {program.startDate && (
              <div className="flex items-center gap-2 text-sm">
                <Calendar size={18} className="text-primary" />
                <span className="font-hrsd-medium text-foreground">{program.startDate}</span>
              </div>
            )}
          </div>

          {/* Objectives */}
          {program.objectives && program.objectives.length > 0 && (
            <div>
              <h3 className="text-base font-hrsd-bold text-foreground mb-3">
                أهداف البرنامج
              </h3>
              <ul className="space-y-2">
                {program.objectives.map((objective, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground font-hrsd-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                    <span>{objective}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Requirements */}
          {program.requirements && program.requirements.length > 0 && (
            <div>
              <h3 className="text-base font-hrsd-bold text-foreground mb-3">
                المتطلبات
              </h3>
              <ul className="space-y-2">
                {program.requirements.map((requirement, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-muted-foreground font-hrsd-medium"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                    <span>{requirement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-card border-t border-border p-4 md:p-6 flex flex-col sm:flex-row gap-3 rounded-b-2xl">
          <Button
            onClick={onEnroll}
            disabled={isEnrolled}
            className={`h-12 flex-1 font-hrsd-semibold rounded-lg ${
              isEnrolled
                ? "bg-muted text-muted-foreground cursor-not-allowed"
                : "bg-primary hover:bg-primary/90 text-white"
            }`}
          >
            {isEnrolled ? "ملتحق بالبرنامج ✓" : "الالتحاق بالبرنامج"}
          </Button>
          <Button
            onClick={onClose}
            variant="outline"
            className="h-12 flex-1 font-hrsd-medium border-border hover:bg-muted rounded-lg"
          >
            إغلاق
          </Button>
        </div>
      </div>
    </div>
  );
};

export default TrainingProgramModal;
