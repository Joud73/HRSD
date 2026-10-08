import { Link } from "react-router-dom";
import { ClipboardCheck } from "lucide-react";
import { authCopy } from "@/lib/copy";
import { useAuth } from "@/context/AuthContext";
import { AuthHelpLinks, AuthStatus, authButtonClass } from "@/components/auth/AuthParts";
import AuthShell from "@/components/auth/AuthShell";
import StatusBadge from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";

const UnderReview = () => {
  const { organizationName } = useAuth();

  return (
    <AuthShell crumb={authCopy.review_title} below={<AuthHelpLinks />}>
      <AuthStatus
        icon={ClipboardCheck}
        title={authCopy.review_title}
        description={authCopy.review_desc}
        meta={
          <dl className="flex flex-col divide-y divide-border rounded-lg border border-border">
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <dt className="text-small text-muted-foreground">{authCopy.review_org_label}</dt>
              <dd className={organizationName ? "text-small font-hrsd-medium text-ink" : "text-small text-muted-foreground"}>
                {organizationName || "—"}
              </dd>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <dt className="text-small text-muted-foreground">{authCopy.review_status_label}</dt>
              <dd>
                <StatusBadge status="submitted" />
              </dd>
            </div>
          </dl>
        }
      >
        <Button asChild className={authButtonClass}>
          <Link to="/dashboard">{authCopy.review_action}</Link>
        </Button>
      </AuthStatus>
    </AuthShell>
  );
};

export default UnderReview;
