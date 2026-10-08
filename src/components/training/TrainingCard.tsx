import { BookOpen, CheckCircle2, Clock, Monitor, type LucideIcon } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { Button } from "@/components/ui/button";

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

/** One training program as a bordered tile: name, one-line summary, key facts, two actions. */
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
}: TrainingCardProps) => (
  <article className="flex h-full flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors duration-micro hover:border-primary/40">
    <div className="flex items-start justify-between gap-3">
      {Icon && (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
          <Icon aria-hidden className="h-5 w-5" strokeWidth={1.75} />
        </span>
      )}
      {isEnrolled && (
        <span className="inline-flex h-7 items-center gap-1.5 rounded-full bg-primary/10 px-3 text-caption font-hrsd-medium text-primary">
          <CheckCircle2 aria-hidden className="h-3.5 w-3.5" />
          {t.training_enrolled}
        </span>
      )}
    </div>

    <div className="flex flex-1 flex-col gap-2">
      <h3 className="text-body font-hrsd-bold text-ink">{title}</h3>
      <p className="text-small text-muted-foreground">{description}</p>
    </div>

    <dl className="flex flex-wrap gap-x-4 gap-y-2 text-small text-ink">
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">{t.training_duration}</dt>
        <Clock aria-hidden className="h-4 w-4 text-muted-foreground" />
        <dd>{duration}</dd>
      </div>
      {deliveryMode && (
        <div className="flex items-center gap-1.5">
          <dt className="sr-only">{t.training_delivery}</dt>
          <Monitor aria-hidden className="h-4 w-4 text-muted-foreground" />
          <dd>{deliveryMode}</dd>
        </div>
      )}
      <div className="flex items-center gap-1.5">
        <dt className="sr-only">{t.training_type}</dt>
        <BookOpen aria-hidden className="h-4 w-4 text-muted-foreground" />
        <dd>{type}</dd>
      </div>
    </dl>

    <div className="flex flex-col gap-2 border-t border-border pt-4 sm:flex-row">
      <Button onClick={onEnroll} className="sm:flex-1" aria-label={`${t.training_view}: ${title}`}>
        {t.training_view}
      </Button>
      <Button onClick={onDetails} variant="outline" className="sm:flex-1" aria-label={`${t.training_summary}: ${title}`}>
        {t.training_summary}
      </Button>
    </div>
  </article>
);

export default TrainingCard;
