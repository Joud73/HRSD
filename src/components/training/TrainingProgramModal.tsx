import { BookOpen, Calendar, CheckCircle2, Clock, Users } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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

/** Program summary in a dialog, with a link through to the full program page. */
const TrainingProgramModal = ({ program, isOpen, onClose, onEnroll, isEnrolled = false }: TrainingProgramModalProps) => {
  const facts = program
    ? [
        { icon: Clock, label: t.training_duration, value: program.duration },
        { icon: BookOpen, label: t.training_type, value: program.type },
        { icon: Users, label: t.modal_instructor, value: program.instructor },
        { icon: Calendar, label: t.modal_start, value: program.startDate },
      ].filter((f) => !!f.value)
    : [];

  return (
    <Dialog open={isOpen && !!program} onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] gap-6 overflow-y-auto sm:max-w-lg">
        {program && (
          <>
            <DialogHeader className="text-start">
              <DialogTitle className="text-h3 text-ink">{program.title}</DialogTitle>
              <DialogDescription className="text-body text-muted-foreground">{program.description}</DialogDescription>
            </DialogHeader>

            {isEnrolled && (
              <p className="inline-flex items-center gap-1.5 self-start rounded-full bg-primary/10 px-3 py-1 text-small font-hrsd-medium text-primary">
                <CheckCircle2 aria-hidden className="h-4 w-4" />
                {t.course_enrolled}
              </p>
            )}

            <dl className="grid grid-cols-1 gap-4 rounded-lg bg-section-alt p-4 sm:grid-cols-2">
              {facts.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-2">
                  <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <div>
                    <dt className="text-small text-muted-foreground">{label}</dt>
                    <dd className="text-small font-hrsd-medium text-ink">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>

            {program.objectives && program.objectives.length > 0 && (
              <section>
                <h3 className="mb-2 text-body font-hrsd-bold text-ink">{t.modal_objectives}</h3>
                <ul className="flex flex-col gap-2">
                  {program.objectives.map((objective) => (
                    <li key={objective} className="flex items-start gap-2 text-small text-muted-foreground">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      {objective}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {program.requirements && program.requirements.length > 0 && (
              <section>
                <h3 className="mb-2 text-body font-hrsd-bold text-ink">{t.modal_requirements}</h3>
                <ul className="flex flex-col gap-2">
                  {program.requirements.map((requirement) => (
                    <li key={requirement} className="flex items-start gap-2 text-small text-muted-foreground">
                      <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral" />
                      {requirement}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <DialogFooter className="flex-col-reverse gap-3 sm:flex-row sm:justify-start sm:gap-3 sm:space-x-0">
              <Button onClick={onEnroll}>{t.modal_open}</Button>
              <Button variant="outline" onClick={onClose}>
                {t.modal_close}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TrainingProgramModal;
