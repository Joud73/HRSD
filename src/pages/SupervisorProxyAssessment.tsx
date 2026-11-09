import { NavLink, Navigate, useNavigate, useParams } from "react-router-dom";
import { UserCog } from "lucide-react";
import { assessmentCopy, copy, supervisorCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { useApprovedTool } from "@/hooks/useApprovedTool";
import { useOrganization } from "@/hooks/useOrganizations";
import AssessmentWorkspace from "@/components/assessment/AssessmentWorkspace";

/**
 * /supervisor/organizations/:orgId/assessment/:trackNumber: the supervisor enters the self-assessment on
 * behalf of an organization without connectivity. Same workspace as the organization, scope { kind: "org" }.
 */
const SupervisorProxyAssessment = () => {
  const navigate = useNavigate();
  const { orgId, trackNumber } = useParams<{ orgId: string; trackNumber: string }>();
  const { data: org } = useOrganization(orgId);
  const { data: tool } = useApprovedTool();
  const number = Number(trackNumber);

  if (!orgId || !Number.isInteger(number) || number < 1 || number > 5) return <Navigate to="/supervisor/organizations" replace />;

  const name = org?.name ?? "";
  const banner = (
    <section role="note" className="flex flex-col gap-3 rounded-lg border border-accent/40 bg-accent/10 px-5 py-4">
      <p className="flex items-center gap-2 text-body font-hrsd-bold text-ink">
        <UserCog aria-hidden className="h-5 w-5 shrink-0 text-primary" />
        {t.proxy_banner(name)}
      </p>
      <p className="text-small text-muted-foreground">{t.proxy_banner_note}</p>
      <nav aria-label={t.proxy_tracks_label} className="flex flex-wrap gap-2">
        {(tool?.tracks ?? []).map((track) => (
          <NavLink
            key={track.number}
            to={`/supervisor/organizations/${orgId}/assessment/${track.number}`}
            className={({ isActive }) =>
              cn(
                "rounded-full border px-3 py-1 text-small transition-colors duration-micro",
                isActive ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-ink hover:border-primary hover:text-primary"
              )
            }
          >
            {assessmentCopy.page_title_prefix} {track.name}
          </NavLink>
        ))}
      </nav>
    </section>
  );

  return (
    <AssessmentWorkspace
      key={`${orgId}:${number}`}
      scope={{ kind: "org", orgId }}
      trackNumber={number}
      breadcrumbs={[
        { label: copy.shell_context.supervisor, to: "/supervisor" },
        { label: t.organizations_title, to: "/supervisor/organizations" },
        ...(name ? [{ label: name }] : []),
      ]}
      backTo="/supervisor/organizations"
      banner={banner}
      onSubmitted={() => navigate("/supervisor/organizations")}
    />
  );
};

export default SupervisorProxyAssessment;
