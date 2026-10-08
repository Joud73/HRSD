import { useState } from "react";
import { CheckCircle2, Clock, Users } from "lucide-react";
import { pagesCopy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

interface SuggestedCoursesStepProps {
  assessmentScore?: number;
  onEnroll: (courseId: number) => void;
}

const LMS_URL = "https://phpstack-1518564-5838964.cloudwaysapps.com/";
const allCourses = pagesCopy.sc_courses;

const SuggestedCoursesStep = ({ assessmentScore, onEnroll }: SuggestedCoursesStepProps) => {
  const [enrolledCourses, setEnrolledCourses] = useState<number[]>([]);

  // Filter courses based on assessment score
  const getSuggestedCourses = () => {
    if (!assessmentScore) return allCourses;
    if (assessmentScore >= 80) {
      return allCourses.filter((c) => c.level === "advanced");
    }
    if (assessmentScore >= 60) {
      return allCourses.filter((c) => c.level === "intermediate" || c.level === "advanced");
    }
    return allCourses;
  };

  const suggestedCourses = getSuggestedCourses();

  const handleEnroll = (courseId: number) => {
    if (!enrolledCourses.includes(courseId)) {
      setEnrolledCourses([...enrolledCourses, courseId]);
      onEnroll(courseId);
    }
  };

  return (
    <section aria-labelledby="sc-title">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[720px]">
          <h2 id="sc-title" className="text-h3 text-ink">
            {pagesCopy.sc_title}
          </h2>
          <p className="mt-1 text-body text-muted-foreground">
            {assessmentScore ? pagesCopy.sc_desc_score(assessmentScore) : pagesCopy.sc_desc_default}
          </p>
        </div>
        {enrolledCourses.length > 0 && (
          <p className="text-small text-muted-foreground">
            {pagesCopy.sc_enrolled_count}: <span className="tabular font-hrsd-bold text-ink">{formatNumber(enrolledCourses.length)}</span>
          </p>
        )}
      </div>

      {suggestedCourses.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState message={pagesCopy.sc_empty} />
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {suggestedCourses.map((course) => {
            const isEnrolled = enrolledCourses.includes(course.id);
            return (
              <li key={course.id} className="flex flex-col rounded-lg border border-border bg-card p-6 transition-colors duration-micro hover:border-ink/20">
                <div className="flex items-start justify-between gap-3">
                  <h3 className="text-body font-hrsd-bold text-ink">{course.title}</h3>
                  <span className="inline-flex h-7 shrink-0 items-center rounded-full border border-border px-3 text-caption text-muted-foreground">
                    {pagesCopy.sc_levels[course.level]}
                  </span>
                </div>
                <p className="mt-2 flex-1 text-small text-muted-foreground">{course.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-4 text-small text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5">
                    <Clock aria-hidden className="h-4 w-4" />
                    {pagesCopy.hours(course.hours)}
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Users aria-hidden className="h-4 w-4" />
                    <span className="tabular">{formatNumber(course.participants)}</span> {pagesCopy.sc_participants}
                  </span>
                </div>
                <div className="mt-6">
                  {isEnrolled ? (
                    <Button disabled variant="outline" className="h-11 w-full border-success/40 text-success disabled:opacity-100">
                      <CheckCircle2 aria-hidden />
                      {pagesCopy.sc_enrolled}
                    </Button>
                  ) : (
                    <Button asChild className="h-11 w-full">
                      <a href={LMS_URL} onClick={() => handleEnroll(course.id)}>
                        {pagesCopy.sc_enroll}
                      </a>
                    </Button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
};

export default SuggestedCoursesStep;
