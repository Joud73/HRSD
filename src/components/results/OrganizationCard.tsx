import { evaluatorCopy as t, fieldsCopy as f } from "@/lib/copy";
import { formatDate, formatNumber } from "@/lib/format";
import { useOrganization } from "@/hooks/useOrganizations";
import { SkeletonPanel } from "@/components/shared/Skeletons";
import { Fact, Panel } from "@/components/admin/AdminParts";

const orDash = (v: string | number | null | undefined) => (v === null || v === undefined || v === "" ? "-" : v);

/** Organization facts and its delegate. Shared by the evaluator's review page and the supervisor's results page. */
const OrganizationCard = ({ orgId }: { orgId: string }) => {
  const { data: org, isLoading } = useOrganization(orgId);
  if (isLoading) return <SkeletonPanel lines={4} />;
  if (!org) return null;
  const d = org.delegate;
  return (
    <Panel title={t.org_card_title}>
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
        <Fact label={f.org.name}>{org.name}</Fact>
        <Fact label={f.org.registration_number}>
          <span className="tabular">{org.registrationNumber}</span>
        </Fact>
        <Fact label={f.entity_type}>{org.entityType ? f.entity_types[org.entityType] : "-"}</Fact>
        <Fact label={f.org.registration_date}>
          <span className="tabular">{org.registrationDate ? formatDate(org.registrationDate) : "-"}</span>
        </Fact>
        <Fact label={f.org.sub_classification}>{orDash(org.subClassificationName)}</Fact>
        <Fact label={f.org.social_dev_center}>{orDash(org.socialDevCenterName)}</Fact>
        <Fact label={t.org_region_city}>{[org.region, org.city].filter(Boolean).join("، ") || "-"}</Fact>
        <Fact label={f.org.employees_count}>
          <span className="tabular">{org.employeesCount === null ? "-" : formatNumber(org.employeesCount)}</span>
        </Fact>
      </dl>
      <h3 className="mb-4 mt-6 border-t border-border pt-5 text-small font-hrsd-bold text-ink">{t.delegate_title}</h3>
      <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-3">
        <Fact label={f.delegate.name}>{orDash(d?.fullName)}</Fact>
        <Fact label={f.delegate.mobile}>{d?.mobile ? <bdi dir="ltr" className="tabular">{d.mobile}</bdi> : "-"}</Fact>
        <Fact label={f.delegate.email}>{d?.email ? <bdi dir="ltr">{d.email}</bdi> : "-"}</Fact>
      </dl>
    </Panel>
  );
};

export default OrganizationCard;
