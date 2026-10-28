import { Navigate, useNavigate, useParams } from "react-router-dom";
import { assessmentCopy as t } from "@/lib/copy";
import AssessmentWorkspace from "@/components/assessment/AssessmentWorkspace";

const SCOPE = { kind: "mine" } as const;
const CRUMBS = [{ label: t.crumb_portal, to: "/dashboard" }, { label: t.crumb_assessment }];

/** /assessment/:trackNumber, the organization's own self-assessment of one track (1 to 5). */
const AssessmentTrack = () => {
  const navigate = useNavigate();
  const { trackNumber } = useParams<{ trackNumber: string }>();
  const number = Number(trackNumber);
  if (!Number.isInteger(number) || number < 1 || number > 5) return <Navigate to="/dashboard" replace />;

  return (
    <AssessmentWorkspace
      key={number}
      scope={SCOPE}
      trackNumber={number}
      breadcrumbs={CRUMBS}
      backTo="/dashboard"
      onSubmitted={() => navigate("/under-review")}
    />
  );
};

/** Old track links: /technical-indicators/:courseSlug -> /assessment/:trackNumber */
const LEGACY_TRACK: Record<string, number> = { altawajuh: 1, alfariq: 2, alsharakat: 3, albaramij: 4, altaathir: 5 };

export const LegacyTrackRedirect = () => {
  const { courseSlug } = useParams<{ courseSlug: string }>();
  const number = courseSlug ? LEGACY_TRACK[courseSlug] : undefined;
  return <Navigate to={number ? `/assessment/${number}` : "/dashboard"} replace />;
};

export default AssessmentTrack;
