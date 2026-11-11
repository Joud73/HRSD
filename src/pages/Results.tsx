import { Link, Navigate } from "react-router-dom";
import { AlertCircle, ChevronLeft, GraduationCap } from "lucide-react";
import { copy, documentsCopy as d, resultsCopy as t } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { useAssessment } from "@/hooks/useAssessment";
import { useDocuments, useFrozenResults, useRecommendedPrograms } from "@/hooks/useResults";
import { Button } from "@/components/ui/button";
import PageHeader from "@/components/shared/PageHeader";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { KeyFacts } from "@/components/admin/AdminParts";
import ResultsOverview from "@/components/results/ResultsOverview";
import DocumentCards from "@/components/results/DocumentCards";

const SCOPE = { kind: "mine" } as const;

/** The top 3 طموحي programs by rank, each with the gap it closes, and the way into the development path. */
const Programs = ({ assessmentId }: { assessmentId: string }) => {
  const programs = useRecommendedPrograms(assessmentId);
  const rows = (programs.data ?? []).slice(0, 3);
  return (
    <section aria-labelledby="programs-title" className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="programs-title" className="text-h3 text-ink">
            {t.programs_title}
          </h2>
          <p className="text-small text-muted-foreground">{t.programs_desc}</p>
        </div>
        {rows.length > 0 && (
          <Button asChild>
            <Link to="/tamohi/my-path">{t.programs_path}</Link>
          </Button>
        )}
      </div>
      {programs.isLoading ? (
        <SkeletonPanel lines={3} />
      ) : rows.length === 0 ? (
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={GraduationCap} message={t.programs_empty} />
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {rows.map((p) => (
            <li key={p.programId} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between md:px-6">
              <div className="flex min-w-0 flex-col gap-1">
                <p className="text-body font-hrsd-bold text-ink">{p.title}</p>
                <p className="tabular text-small text-muted-foreground">{t.program_gap(formatNumber(p.gapLessons))}</p>
              </div>
              <Button asChild variant="outline" className="shrink-0 self-start sm:self-auto">
                <Link to={`/tamohi/programs/${p.code}`}>
                  {t.program_go}
                  <ChevronLeft aria-hidden />
                </Link>
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
};

/** /results: the organization's issued results, documents and recommended programs. Only once issued. */
const Results = () => {
  const { assessment, isLoading, isError, refetch } = useAssessment(SCOPE, { ensure: false });
  const issued = assessment?.status === "issued";
  const results = useFrozenResults(issued ? assessment.id : undefined);
  const documents = useDocuments(issued ? assessment.id : undefined);
  const crumbs = [{ label: copy.account_dashboard, to: "/dashboard" }, { label: t.page_title }];

  if (isLoading) {
    return (
      <>
        <PageHeader title={t.page_title} breadcrumbs={crumbs} />
        <SkeletonPanel lines={6} />
      </>
    );
  }
  if (isError) {
    return (
      <>
        <PageHeader title={t.page_title} breadcrumbs={crumbs} />
        <div className="rounded-lg border border-border bg-card">
          <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void refetch() }} />
        </div>
      </>
    );
  }
  if (!assessment || !issued) return <Navigate to="/dashboard" replace />;

  const number = documents.data?.find((doc) => doc.number)?.number ?? null;

  return (
    <>
      <PageHeader
        title={t.page_title}
        description={t.page_desc}
        breadcrumbs={crumbs}
        meta={
          <KeyFacts
            items={[
              { label: t.issued_date, value: <span className="tabular">{assessment.issuedAt ? formatDate(assessment.issuedAt) : "-"}</span> },
              { label: t.report_number, value: number ? <bdi className="tabular">{number}</bdi> : "-" },
            ]}
          />
        }
      />

      <div className="flex flex-col gap-8">
        {results.isLoading ? (
          <SkeletonPanel lines={6} />
        ) : results.isError || !results.data ? (
          <div className="rounded-lg border border-border bg-card">
            <EmptyState icon={AlertCircle} message={t.load_error} action={{ label: t.retry, onClick: () => void results.refetch() }} />
          </div>
        ) : (
          <ResultsOverview results={results.data} />
        )}

        <section aria-labelledby="documents-title" className="flex flex-col gap-4">
          <h2 id="documents-title" className="text-h3 text-ink">
            {d.documents_title}
          </h2>
          {documents.isLoading ? (
            <SkeletonPanel lines={3} />
          ) : (
            <DocumentCards documents={documents.data ?? []} linkTo={(doc) => `/results/documents/${doc.kind}`} linkLabel={t.documents_view} />
          )}
        </section>

        <Programs assessmentId={assessment.id} />
      </div>
    </>
  );
};

export default Results;
