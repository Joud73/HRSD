import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { BookX, Calendar, CalendarDays, CheckCircle2, Clock, FileText, Monitor, Users } from "lucide-react";
import { assessmentCopy as t } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { getProgramById, type TrainingProgram } from "@/data/trainingPrograms";

const ENROLLED_KEY = "enrolledPrograms";

const readEnrolled = (): number[] => {
  const stored = localStorage.getItem(ENROLLED_KEY);
  return stored ? JSON.parse(stored) : [];
};

const CourseDetail = () => {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openDays, setOpenDays] = useState<number[]>([0, 1]);
  const [enrolled, setEnrolled] = useState<number[]>(readEnrolled);

  useEffect(() => {
    if (courseId) {
      const foundProgram = getProgramById(parseInt(courseId));
      if (foundProgram) {
        setProgram(foundProgram);
      }
      setIsLoading(false);
    }
  }, [courseId]);

  const handleBack = () => {
    navigate("/training-stage");
  };

  // Enrolment is local to this prototype (read by the training stage page)
  const handleEnroll = () => {
    if (!program || enrolled.includes(program.id)) return;
    const next = [...enrolled, program.id];
    localStorage.setItem(ENROLLED_KEY, JSON.stringify(next));
    setEnrolled(next);
    toast({ title: t.course_enrolled_toast, description: program.title });
  };

  const crumbs = [
    { label: t.crumb_portal, to: "/dashboard" },
    { label: t.training_crumb, to: "/training-stage" },
  ];

  if (isLoading) {
    return (
      <div className="flex max-w-[760px] flex-col gap-6" aria-busy>
        <div className="flex flex-col gap-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-80 max-w-full" />
          <Skeleton className="h-5 w-full" />
        </div>
        <SkeletonPanel lines={3} />
        <SkeletonPanel lines={5} />
      </div>
    );
  }

  if (!program) {
    return (
      <div className="max-w-[760px]">
        <PageHeader title={t.course_not_found_title} breadcrumbs={crumbs} />
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={BookX} message={t.course_not_found} action={{ label: t.course_back, onClick: handleBack }} />
        </div>
      </div>
    );
  }

  const isEnrolled = enrolled.includes(program.id);

  const facts = [
    { icon: Clock, label: t.training_duration, value: program.duration },
    { icon: Calendar, label: t.course_period, value: `${program.startDate} ${t.course_period_sep} ${program.endDate}` },
    { icon: CalendarDays, label: t.course_days, value: program.schedule?.days.join("، ") || t.course_days_fallback },
    { icon: Clock, label: t.course_time, value: program.schedule?.time || program.time },
    { icon: Monitor, label: t.training_delivery, value: program.deliveryMode },
    { icon: Users, label: t.modal_instructor, value: program.instructor },
  ];

  return (
    <div className="max-w-[760px]">
      <PageHeader
        title={program.title}
        description={program.description}
        breadcrumbs={[...crumbs, { label: program.title }]}
        actions={
          isEnrolled ? (
            <span className="inline-flex h-10 items-center gap-2 rounded-md bg-primary/10 px-4 text-small font-hrsd-medium text-primary">
              <CheckCircle2 aria-hidden className="h-4 w-4" />
              {t.course_enrolled}
            </span>
          ) : (
            <Button onClick={handleEnroll}>{t.course_enroll}</Button>
          )
        }
      />

      <div className="flex flex-col gap-6">
        {/* Facts strip */}
        <section aria-label={t.course_facts} className="rounded-lg border border-border bg-card p-5">
          <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2 md:grid-cols-3">
            {facts.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <div className="min-w-0">
                  <dt className="text-small text-muted-foreground">{label}</dt>
                  <dd className="text-small font-hrsd-medium text-ink">{value || "—"}</dd>
                </div>
              </div>
            ))}
          </dl>
        </section>

        {/* About */}
        <section className="rounded-lg border border-border bg-card p-5 md:p-6">
          <h2 className="text-h3 text-ink">{t.course_about}</h2>
          <p className="mt-3 text-body text-muted-foreground">{program.fullDescription}</p>
        </section>

        {/* Course days */}
        <section aria-labelledby="course-content-title" className="rounded-lg border border-border bg-card">
          <h2 id="course-content-title" className="px-5 pt-5 text-h3 text-ink md:px-6 md:pt-6">
            {t.course_content}
            <span className="tabular ms-2 text-small text-muted-foreground">{formatNumber(program.courseDays.length)}</span>
          </h2>
          <Accordion
            type="multiple"
            dir="rtl"
            value={openDays.map(String)}
            onValueChange={(values) => setOpenDays(values.map(Number))}
            className="mt-3"
          >
            {program.courseDays.map((day, index) => (
              <AccordionItem key={day.title} value={String(index)} className="border-t border-border border-b-0">
                <AccordionTrigger className="px-5 py-4 text-start text-body font-hrsd-bold text-ink transition-colors duration-micro hover:bg-section-alt hover:no-underline md:px-6">
                  <span className="flex items-center gap-3">
                    {day.title}
                    <span className="tabular text-small font-hrsd-regular text-muted-foreground">{formatNumber(day.materials.length)}</span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="px-5 pb-5 md:px-6">
                  {day.materials.length > 0 ? (
                    <ul className="flex flex-col gap-2">
                      {day.materials.map((material) => (
                        <li key={material.name} className="flex items-center gap-3 rounded-md border border-border p-3">
                          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/5 text-primary">
                            <FileText aria-hidden className="h-4 w-4" />
                          </span>
                          <p className="min-w-0 flex-1 text-small font-hrsd-medium text-ink">{material.name}</p>
                          <span className="tabular shrink-0 rounded-full bg-section-alt px-2 text-small text-muted-foreground" dir="ltr">
                            {material.type}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-small text-muted-foreground">{t.course_materials_empty}</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>
      </div>
    </div>
  );
};

export default CourseDetail;
