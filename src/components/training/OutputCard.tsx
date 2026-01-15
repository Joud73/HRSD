import { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface OutputCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  isComingSoon?: boolean;
}

const OutputCard = ({
  title,
  description,
  icon: Icon,
  isComingSoon = false,
}: OutputCardProps) => {
  return (
    <div
      className={`bg-card rounded-xl p-5 md:p-6 border border-border transition-all duration-200 ${
        isComingSoon
          ? "opacity-75"
          : "hover:shadow-md hover:border-primary/30 cursor-pointer"
      }`}
      dir="rtl"
      role="article"
      aria-label={title}
    >
      {/* Icon */}
      <div
        className={`w-12 h-12 md:w-14 md:h-14 rounded-xl flex items-center justify-center mb-4 ${
          isComingSoon ? "bg-muted" : "bg-primary/10"
        }`}
      >
        <Icon
          size={24}
          className={isComingSoon ? "text-muted-foreground" : "text-primary"}
        />
      </div>

      {/* Content */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className={`text-base md:text-lg font-hrsd-bold ${
            isComingSoon ? "text-muted-foreground" : "text-foreground"
          }`}
        >
          {title}
        </h3>
        {isComingSoon && (
          <Badge className="bg-accent/10 text-accent border-0 shrink-0 font-hrsd-medium">
            قريبًا
          </Badge>
        )}
      </div>

      <p
        className={`text-sm leading-relaxed font-hrsd-medium ${
          isComingSoon ? "text-muted-foreground/70" : "text-muted-foreground"
        }`}
      >
        {description}
      </p>
    </div>
  );
};

export default OutputCard;
