import { useEffect, useState, type ReactNode } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRight, FileText, SearchX } from "lucide-react";
import { motion } from "motion/react";
import { pagesCopy } from "@/lib/copy";
import { revealGroup, revealItem } from "@/lib/motion";
import { getProgramById, TrainingProgram } from "@/data/trainingPrograms";
import Container from "@/components/layout/Container";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { Skeleton } from "@/components/ui/skeleton";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";

const LMS_URL = "https://phpstack-1518564-5838964.cloudwaysapps.com/";
const JOURNEY_PATH = "/individuals-journey";

const Block = ({ title, children }: { title: string; children: ReactNode }) => (
  <section className="flex flex-col gap-4">
    <h2 className="text-h3 text-ink">{title}</h2>
    {children}
  </section>
);

const BackLink = () => (
  <Link
    to={JOURNEY_PATH}
    className="inline-flex items-center gap-2 rounded-sm text-small font-hrsd-medium text-muted-foreground transition-colors duration-micro hover:text-primary"
  >
    <ArrowRight aria-hidden className="h-4 w-4" />
    {pagesCopy.cd_back}
  </Link>
);

const IndividualCourseDetail = () => {
  const { courseId } = useParams();
  const [program, setProgram] = useState<TrainingProgram | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [openDays, setOpenDays] = useState<string[]>(["0", "1"]);

  useEffect(() => {
    if (courseId) {
      const foundProgram = getProgramById(parseInt(courseId));
      if (foundProgram) {
        setProgram(foundProgram);
      }
      setIsLoading(false);
    }
  }, [courseId]);

  if (isLoading) {
    return (
      <Container className="py-12 md:py-16" aria-busy>
        <div className="flex max-w-[760px] flex-col gap-4">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-5 w-full" />
        </div>
        <Skeleton className="mt-8 h-24 w-full rounded-lg" />
        <SkeletonPanel lines={5} className="mt-8 max-w-[760px]" />
      </Container>
    );
  }

  if (!program) {
    return (
      <Container className="py-12 md:py-16">
        <div className="rounded-lg border border-border bg-card">
          <EmptyState message={pagesCopy.cd_not_found} icon={SearchX} action={{ label: pagesCopy.cd_back, to: JOURNEY_PATH }} />
        </div>
      </Container>
    );
  }

  const facts = [
    { label: pagesCopy.cd_duration, value: program.duration },
    { label: pagesCopy.cd_days, value: program.schedule?.days.join("، ") },
    { label: pagesCopy.cd_mode, value: program.deliveryMode },
    { label: pagesCopy.cd_instructor, value: program.instructor },
    {
      label: pagesCopy.cd_period,
      value: program.startDate && program.endDate ? pagesCopy.cd_period_value(program.startDate, program.endDate) : undefined,
    },
    { label: pagesCopy.cd_time, value: program.schedule?.time ?? program.time },
  ];

  return (
    <Container className="py-12 md:py-16">
      <motion.div initial="hidden" animate="visible" variants={revealGroup}>
        <motion.header variants={revealItem} className="flex flex-col gap-6">
          <BackLink />
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-[760px]">
              <p className="text-small font-hrsd-medium text-muted-foreground">{program.category}</p>
              <h1 className="mt-2 text-h1 text-primary">{program.title}</h1>
              <p className="mt-3 text-body text-muted-foreground">{program.description}</p>
            </div>
            <Button asChild className="h-12 shrink-0 px-8 text-body">
              <a href={LMS_URL}>{pagesCopy.cd_enroll}</a>
            </Button>
          </div>
        </motion.header>

        <motion.dl
          variants={revealItem}
          className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border md:grid-cols-3 xl:grid-cols-6"
        >
          {facts.map((fact) => (
            <div key={fact.label} className="flex flex-col gap-1 bg-card p-4 md:p-5">
              <dt className="text-caption text-muted-foreground">{fact.label}</dt>
              <dd className={fact.value ? "text-small font-hrsd-bold text-ink" : "text-small text-muted-foreground"}>{fact.value || "—"}</dd>
            </div>
          ))}
        </motion.dl>

        <motion.div variants={revealItem} className="mt-12 flex max-w-[760px] flex-col gap-12">
          <Block title={pagesCopy.cd_about}>
            <p className="text-body text-ink">{program.fullDescription}</p>
          </Block>

          {program.objectives.length > 0 && (
            <Block title={pagesCopy.cd_objectives}>
              <ul className="flex list-disc flex-col gap-2 ps-5 text-body text-ink marker:text-primary">
                {program.objectives.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Block>
          )}

          {program.requirements.length > 0 && (
            <Block title={pagesCopy.cd_requirements}>
              <ul className="flex list-disc flex-col gap-2 ps-5 text-body text-ink marker:text-primary">
                {program.requirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Block>
          )}

          {program.courseDays.length > 0 && (
            <Block title={pagesCopy.cd_content}>
              <Accordion type="multiple" dir="rtl" value={openDays} onValueChange={setOpenDays} className="rounded-lg border border-border bg-card">
                {program.courseDays.map((day, index) => (
                  <AccordionItem key={day.title} value={String(index)} className="border-border last:border-b-0">
                    <AccordionTrigger className="min-h-14 gap-4 px-5 py-4 text-start text-body font-hrsd-bold text-ink transition-colors duration-micro hover:bg-section-alt/60 hover:no-underline focus-visible:-outline-offset-2 [&>svg]:text-muted-foreground">
                      {day.title}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-5">
                      {day.materials.length > 0 ? (
                        <ul className="flex flex-col gap-2">
                          {day.materials.map((material) => (
                            <li key={material.name} className="flex items-center justify-between gap-3 rounded-md border border-border px-4 py-3">
                              <span className="flex items-center gap-3 text-small text-ink">
                                <FileText aria-hidden className="h-5 w-5 shrink-0 text-primary" />
                                {material.name}
                              </span>
                              <span className="shrink-0 rounded-full bg-section-alt px-2.5 py-0.5 text-caption text-muted-foreground">
                                {material.type}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-small text-muted-foreground">{pagesCopy.cd_no_materials}</p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Block>
          )}
        </motion.div>
      </motion.div>
    </Container>
  );
};

export default IndividualCourseDetail;
