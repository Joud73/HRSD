import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Info, ShieldCheck } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { formatNumber } from "@/lib/format";
import { cn } from "@/lib/utils";
import PageHeader from "@/components/shared/PageHeader";
import { Panel } from "@/components/admin/AdminParts";
import { ROLE_PAGES, type SidebarItem } from "@/components/layout/navigation";

/**
 * Release 1 roles, read only. Permissions are enforced by RLS policies and database
 * functions; this page documents them and changes nothing.
 */
type RoleKey = keyof typeof adminCopy.roles_ref;

const ROLE_ORDER: RoleKey[] = ["admin", "supervisor", "evaluator", "organization"];

/** Pages per role. The supervisor has no database role yet, so no pages. */
const PAGES: Record<RoleKey, SidebarItem[]> = {
  admin: ROLE_PAGES.admin,
  supervisor: [],
  evaluator: ROLE_PAGES.evaluator,
  organization: ROLE_PAGES.organization,
};

const PLANNED: RoleKey[] = ["supervisor"];

const AdminRoles = () => {
  const [selectedKey, setSelectedKey] = useState<RoleKey>("admin");
  const role = adminCopy.roles_ref[selectedKey];
  const pages = PAGES[selectedKey];
  // Admins can follow the links; other roles' pages are shown as plain text
  const linkable = selectedKey === "admin";

  return (
    <>
      <PageHeader
        title={copy.nav_admin.roles}
        description={adminCopy.roles_desc}
        breadcrumbs={[{ label: adminCopy.breadcrumb_root, to: "/admin" }, { label: copy.nav_admin.roles }]}
        meta={
          <p className="flex items-start gap-2 rounded-lg border border-border bg-card px-5 py-4 text-small text-ink">
            <Info aria-hidden className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            {adminCopy.roles_enforced_note}
          </p>
        }
      />

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        {/* Roles list */}
        <Panel
          title={adminCopy.roles_list_title}
          aside={<span className="tabular text-small text-muted-foreground">{formatNumber(ROLE_ORDER.length)}</span>}
          bodyClassName="p-4"
        >
          <ul className="flex flex-col gap-1">
            {ROLE_ORDER.map((key) => {
              const active = key === selectedKey;
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => setSelectedKey(key)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-start text-small transition-colors duration-micro active:scale-[0.98]",
                      active ? "bg-primary/10 font-hrsd-bold text-primary" : "font-hrsd-medium text-ink hover:bg-section-alt"
                    )}
                  >
                    <ShieldCheck aria-hidden className={cn("h-4 w-4 shrink-0", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="flex-1 truncate">{adminCopy.roles_ref[key].name}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Panel>

        {/* Role reference */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h2 className="text-h2 text-ink">{role.name}</h2>
            <p className="text-body text-muted-foreground">{role.description}</p>
            {PLANNED.includes(selectedKey) && <p className="mt-2 text-small text-warning-ink">{adminCopy.roles_planned}</p>}
          </div>

          <Panel title={adminCopy.roles_can_title}>
            <ul className="flex flex-col gap-3">
              {role.can.map((item) => (
                <li key={item} className="flex items-start gap-3 text-body text-ink">
                  <Check aria-hidden className="mt-1 h-4 w-4 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title={adminCopy.roles_pages_title}>
            {pages.length === 0 ? (
              <p className="text-small text-muted-foreground">{adminCopy.roles_no_pages}</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {pages.map(({ label, icon: Icon, to }) => (
                  <li key={to} className="flex items-center gap-3 rounded-md border border-border px-4 py-3 text-small text-ink">
                    <Icon aria-hidden className="h-4 w-4 shrink-0 text-muted-foreground" />
                    {linkable ? (
                      <Link to={to} className="flex-1 rounded-sm transition-colors duration-micro hover:text-primary focus-ring">
                        {label}
                      </Link>
                    ) : (
                      <span className="flex-1">{label}</span>
                    )}
                    <bdi dir="ltr" className="text-caption text-muted-foreground">{to}</bdi>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </>
  );
};

export default AdminRoles;
