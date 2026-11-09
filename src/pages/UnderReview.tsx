import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, BadgeCheck, CalendarDays, ClipboardCheck, ClipboardList, FileCheck2, Loader2, RotateCcw, type LucideIcon } from "lucide-react";
import { assessmentCopy, authCopy } from "@/lib/copy";
import { formatDateTime } from "@/lib/format";
import { useAuth } from "@/context/AuthContext";
import { useAssessment } from "@/hooks/useAssessment";
import { AuthHelpLinks, AuthStatus, authButtonClass } from "@/components/auth/AuthParts";
import AuthShell from "@/components/auth/AuthShell";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { assessmentStatusKey } from "@/components/assessment/indicatorUtils";

const SCOPE = { kind: "mine" } as const;

const Row = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
    <dt className="text-small text-muted-foreground">{label}</dt>
    <dd className="text-small font-hrsd-medium text-ink">{children}</dd>
  </div>
);

/** Status of the organization's assessment in the open cycle, read from the database. */
const UnderReview = () => {
  const { organizationName } = useAuth();
  const { assessment, isLoading, isError, refetch } = useAssessment(SCOPE);

  if (isLoading) {
    return (
      <AuthShell crumb={authCopy.review_title} below={<AuthHelpLinks />}>
        <p className="flex justify-center py-10 text-muted-foreground" aria-busy="true">
          <Loader2 aria-hidden className="h-6 w-6 animate-spin motion-reduce:animate-none" />
        </p>
      </AuthShell>
    );
  }

  const back = (label: string = authCopy.review_action, to = "/dashboard") => (
    <Button asChild className={authButtonClass}>
      <Link to={to}>{label}</Link>
    </Button>
  );

  if (isError || !assessment) {
    return (
      <AuthShell crumb={authCopy.review_title} below={<AuthHelpLinks />}>
        <AuthStatus
          icon={isError ? AlertCircle : CalendarDays}
          tone="warning"
          title={isError ? authCopy.review_load_error : authCopy.review_none_title}
          description={isError ? "" : authCopy.review_draft_desc}
        >
          {isError ? (
            <Button className={authButtonClass} onClick={() => void refetch()}>
              {assessmentCopy.retry}
            </Button>
          ) : (
            back()
          )}
        </AuthStatus>
      </AuthShell>
    );
  }

  const status = assessment.status;
  const view: { icon: LucideIcon; tone: "primary" | "success" | "warning"; title: string; desc: string; action: string; to?: string } =
    status === "issued"
      ? { icon: FileCheck2, tone: "success", title: authCopy.review_issued_title, desc: authCopy.review_issued_desc, action: authCopy.review_issued_action, to: "/results" }
      : status === "returned"
      ? { icon: RotateCcw, tone: "warning", title: authCopy.review_returned_title, desc: authCopy.review_returned_desc, action: authCopy.review_returned_action }
      : status === "approved"
        ? { icon: BadgeCheck, tone: "success", title: authCopy.review_approved_title, desc: authCopy.review_approved_desc, action: authCopy.review_action }
        : status === "draft"
          ? { icon: ClipboardList, tone: "primary", title: authCopy.review_draft_title, desc: authCopy.review_draft_desc, action: authCopy.review_action }
          : { icon: ClipboardCheck, tone: "primary", title: authCopy.review_title, desc: authCopy.review_desc, action: authCopy.review_action };

  return (
    <AuthShell crumb={view.title} below={<AuthHelpLinks />}>
      <AuthStatus
        icon={view.icon}
        tone={view.tone}
        title={view.title}
        description={view.desc}
        meta={
          <div className="flex flex-col gap-4">
            <dl className="flex flex-col divide-y divide-border rounded-lg border border-border">
              {organizationName && <Row label={authCopy.review_org_label}>{organizationName}</Row>}
              <Row label={authCopy.review_cycle_label}>{assessment.cycle.name}</Row>
              <Row label={authCopy.review_status_label}>
                <StatusBadge status={assessmentStatusKey(status)} />
              </Row>
              {assessment.submittedAt && (
                <Row label={authCopy.review_submitted_label}>
                  <span className="tabular">{formatDateTime(assessment.submittedAt)}</span>
                </Row>
              )}
            </dl>
            {status === "returned" && assessment.returnNote && (
              <section className="rounded-lg border border-warning/40 bg-warning/5 p-4">
                <h2 className="text-small font-hrsd-bold text-warning-ink">{authCopy.review_returned_note}</h2>
                <p className="mt-1 whitespace-pre-line text-body text-ink">{assessment.returnNote}</p>
              </section>
            )}
          </div>
        }
      >
        {back(view.action, view.to)}
      </AuthStatus>
    </AuthShell>
  );
};

export default UnderReview;
