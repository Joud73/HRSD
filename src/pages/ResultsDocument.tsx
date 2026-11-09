import { Navigate, useParams } from "react-router-dom";
import { copy, resultsCopy as t } from "@/lib/copy";
import { useAssessment } from "@/hooks/useAssessment";
import { DOCUMENT_KINDS } from "@/services/resultsService";
import PageHeader from "@/components/shared/PageHeader";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import DocumentScreen from "@/components/documents/DocumentScreen";
import { KIND_LABEL } from "@/components/results/documentUtils";

const SCOPE = { kind: "mine" } as const;

/** /results/documents/:kind: one issued document on screen (print, download PDF). */
const ResultsDocument = () => {
  const { kind: rawKind = "" } = useParams<{ kind: string }>();
  const kind = DOCUMENT_KINDS.find((k) => k === rawKind);
  const { assessment, isLoading } = useAssessment(SCOPE, { ensure: false });

  if (!kind) return <Navigate to="/results" replace />;
  const title = KIND_LABEL[kind];
  const crumbs = [{ label: copy.account_dashboard, to: "/dashboard" }, { label: t.back_to_results, to: "/results" }, { label: title }];

  if (isLoading) {
    return (
      <>
        <PageHeader title={title} breadcrumbs={crumbs} />
        <SkeletonPanel lines={8} />
      </>
    );
  }
  if (!assessment || assessment.status !== "issued") return <Navigate to="/dashboard" replace />;

  return (
    <>
      <PageHeader title={title} breadcrumbs={crumbs} />
      <DocumentScreen assessmentId={assessment.id} kind={kind} />
    </>
  );
};

export default ResultsDocument;
