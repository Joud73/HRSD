import { Clock, BookOpen, CheckCircle, Monitor, LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface TrainingCardProps {
  title: string;
  description: string;
  duration: string;
  type: string;
  deliveryMode?: string;
  icon?: LucideIcon;
  isEnrolled?: boolean;
  onEnroll: () => void;
  onDetails: () => void;
}

const TrainingCard = ({
  title,
  description,
  duration,
  type,
  deliveryMode,
  icon: Icon,
  isEnrolled = false,
  onEnroll,
  onDetails,
}: TrainingCardProps) => {
  return (
    <div
      className="bg-card rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 md:p-6 flex flex-col h-full border border-border"
      dir="rtl"
    >
      {/* Header with Icon */}
      <div className="flex items-start gap-4 mb-4">
        {/* Icon */}
        {Icon && (
          <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Icon size={24} className="text-primary" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-lg md:text-xl font-hrsd-bold text-foreground leading-relaxed">
              {title}
            </h3>
            {isEnrolled && (
              <Badge className="bg-primary/10 text-primary border-0 flex items-center gap-1 shrink-0">
                <CheckCircle size={14} />
                <span>ملتحق</span>
              </Badge>
            )}
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-4 flex-1 font-hrsd-medium">
        {description}
      </p>

      {/* Tags */}
      <div className="flex flex-wrap gap-2 mb-5">
        <Badge
          variant="secondary"
          className="flex items-center gap-1 bg-section-light text-foreground font-hrsd-medium"
        >
          <Clock size={14} />
          <span>{duration}</span>
        </Badge>
        <Badge
          variant="secondary"
          className="flex items-center gap-1 bg-section-tealLight text-primary font-hrsd-medium"
        >
          <BookOpen size={14} />
          <span>{type}</span>
        </Badge>
        {deliveryMode && (
          <Badge
            variant="secondary"
            className="flex items-center gap-1 bg-accent/10 text-accent font-hrsd-medium"
          >
            <Monitor size={14} />
            <span>{deliveryMode}</span>
          </Badge>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-auto">
        <Button
          onClick={onEnroll}
          disabled={isEnrolled}
          className={`h-11 flex-1 font-hrsd-semibold rounded-lg min-h-[44px] ${
            isEnrolled
              ? "bg-muted text-muted-foreground cursor-not-allowed"
              : "bg-primary hover:bg-primary/90 text-white"
          }`}
          aria-label={isEnrolled ? "أنت ملتحق بهذا البرنامج" : `الالتحاق ببرنامج ${title}`}
        >
          {isEnrolled ? "ملتحق ✓" : "الالتحاق بالبرنامج"}
        </Button>
        <Button
          onClick={onDetails}
          variant="outline"
          className="h-11 flex-1 font-hrsd-medium border-primary text-primary hover:bg-primary/5 rounded-lg min-h-[44px]"
          aria-label={`عرض تفاصيل برنامج ${title}`}
        >
          تفاصيل
        </Button>
      </div>
    </div>
  );
};

export default TrainingCard;
