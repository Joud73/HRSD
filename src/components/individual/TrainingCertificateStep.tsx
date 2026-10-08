import { useState, type ReactNode } from "react";
import { CheckCircle2, Download, Lock, Play } from "lucide-react";
import { motion } from "motion/react";
import { pagesCopy } from "@/lib/copy";
import { formatDate, formatNumber, formatPercent } from "@/lib/format";
import { ease } from "@/lib/motion";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import EmptyState from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";

interface Course {
  id: number;
  title: string;
  progress: number;
  completed: boolean;
  modules: number;
  completedModules: number;
}

const LMS_URL = "https://phpstack-1518564-5838964.cloudwaysapps.com/";

const CourseGroup = ({ title, count, children }: { title: string; count: number; children: ReactNode }) => (
  <section className="rounded-lg border border-border bg-card">
    <h3 className="flex items-center gap-2 border-b border-border px-6 py-4 text-body font-hrsd-bold text-ink">
      {title}
      <span className="tabular inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-section-alt px-2 text-caption text-muted-foreground">
        {formatNumber(count)}
      </span>
    </h3>
    <ul className="divide-y divide-border">{children}</ul>
  </section>
);

const TrainingCertificateStep = () => {
  const reduced = useReducedMotion();
  const [courses] = useState<Course[]>(() => pagesCopy.tc_courses.map((c) => ({ ...c })));

  const handleContinue = () => {
    // In the prototype, course content lives in the external LMS
    window.location.href = LMS_URL;
  };

  const handleDownloadCertificate = (courseId: number) => {
    const course = courses.find((c) => c.id === courseId);
    if (course) {
      // Create a simple certificate (in production, this would be a proper PDF)
      const certificateContent = `
        ${pagesCopy.tc_cert_heading}

        ${pagesCopy.tc_cert_body}
        ${pagesCopy.tc_cert_course}: ${course.title}

        ${pagesCopy.tc_cert_date}: ${formatDate(new Date())}
      `;

      const blob = new Blob([certificateContent], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${pagesCopy.tc_cert_file}_${course.title.replace(/\s/g, "_")}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  const completedCourses = courses.filter((c) => c.completed);
  const inProgressCourses = courses.filter((c) => !c.completed);

  return (
    <section aria-labelledby="tc-title" className="mx-auto max-w-[960px]">
      <div className="mb-6">
        <h2 id="tc-title" className="text-h3 text-ink">
          {pagesCopy.tc_title}
        </h2>
        <p className="mt-1 text-body text-muted-foreground">{pagesCopy.tc_desc}</p>
      </div>

      {courses.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState message={pagesCopy.tc_empty} icon={Play} />
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {completedCourses.length > 0 && (
            <CourseGroup title={pagesCopy.tc_completed} count={completedCourses.length}>
              {completedCourses.map((course) => (
                <li key={course.id} className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-success/10 text-success">
                      <CheckCircle2 aria-hidden className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-body font-hrsd-bold text-ink">{course.title}</p>
                      <p className="text-small text-muted-foreground">{pagesCopy.tc_modules(course.completedModules, course.modules)}</p>
                    </div>
                  </div>
                  <Button className="h-11 px-5" onClick={() => handleDownloadCertificate(course.id)}>
                    <Download aria-hidden />
                    {pagesCopy.tc_download}
                  </Button>
                </li>
              ))}
            </CourseGroup>
          )}

          {inProgressCourses.length > 0 && (
            <CourseGroup title={pagesCopy.tc_in_progress} count={inProgressCourses.length}>
              {inProgressCourses.map((course) => (
                <li key={course.id} className="flex flex-col gap-4 p-6">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-section-alt text-primary">
                        <Play aria-hidden className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-body font-hrsd-bold text-ink">{course.title}</p>
                        <p className="text-small text-muted-foreground">{pagesCopy.tc_modules(course.completedModules, course.modules)}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button variant="outline" className="h-11 px-5" disabled>
                        <Lock aria-hidden />
                        {pagesCopy.tc_locked}
                      </Button>
                      <Button className="h-11 px-5" onClick={handleContinue}>
                        {pagesCopy.tc_continue}
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div
                      role="progressbar"
                      aria-label={`${pagesCopy.tc_progress}: ${course.title}`}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={course.progress}
                      className="h-2 flex-1 overflow-hidden rounded-full bg-section-alt"
                    >
                      <motion.div
                        className="h-full rounded-full bg-primary"
                        initial={{ width: reduced ? `${course.progress}%` : 0 }}
                        whileInView={{ width: `${course.progress}%` }}
                        viewport={{ once: true, amount: 0.6 }}
                        transition={reduced ? { duration: 0 } : { duration: 0.6, ease }}
                      />
                    </div>
                    <span className="tabular shrink-0 text-small text-muted-foreground">{formatPercent(course.progress)}</span>
                  </div>
                </li>
              ))}
            </CourseGroup>
          )}
        </div>
      )}
    </section>
  );
};

export default TrainingCertificateStep;
