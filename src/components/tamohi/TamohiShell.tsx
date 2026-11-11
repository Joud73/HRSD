import { NavLink, Link, useLocation } from "react-router-dom";
import { ArrowRight, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { copy, tamohiCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { getDefaultRouteForRole } from "@/lib/roles";
import UserDropdown, { type UserMenuItem } from "@/components/UserDropdown";
import RouteFade from "@/components/layout/RouteFade";
import { ORGANIZATION_NAV } from "@/components/layout/navigation";

const PROFILE: Record<string, string> = { admin: "/admin/profile", supervisor: "/supervisor/profile", evaluator: "/evaluator/profile" };

/** The 1200px frame of طموحي pages (bands go edge to edge, content inside this). */
export const TamohiFrame = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={cn("mx-auto w-full max-w-content px-5 md:px-8 lg:px-12 xl:px-0", className)}>{children}</div>
);

const linkClass = ({ isActive }: { isActive: boolean }) =>
  cn(
    "relative inline-flex h-16 items-center whitespace-nowrap px-1 text-small font-hrsd-medium transition-colors duration-micro focus-ring rounded-sm",
    isActive ? "text-primary after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted-foreground hover:text-ink"
  );

/**
 * طموحي's own frame: wordmark and tagline, الكتالوج / خطتي التطويرية (organization), the way back to the
 * user's home in مركز التمكين, the account menu, and a one-line footer. Pages own their bands.
 */
const TamohiShell = () => {
  const { userRole, organizationName } = useAuth();
  const { pathname } = useLocation();
  const isOrg = userRole === "organization";
  const home = getDefaultRouteForRole(userRole);
  const name = isOrg ? organizationName || copy.account_fallback : userRole && userRole !== "individual" ? copy.shell_user[userRole] : copy.account_fallback;
  const menu: UserMenuItem[] = isOrg
    ? ORGANIZATION_NAV.map(({ label, to, icon }) => ({ label, to, icon }))
    : userRole && PROFILE[userRole]
      ? [{ label: copy.account_profile, to: PROFILE[userRole], icon: User }]
      : [];

  const links = (
    <>
      {/* Program pages belong to the catalog; my path is its own section */}
      <NavLink to="/tamohi" className={({ isActive }) => linkClass({ isActive: isActive && !pathname.startsWith("/tamohi/my-path") })}>
        {t.nav_catalog}
      </NavLink>
      {isOrg && (
        <NavLink to="/tamohi/my-path" className={linkClass}>
          {t.nav_my_path}
        </NavLink>
      )}
    </>
  );

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-section-alt">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-float"
      >
        {copy.skip_to_content}
      </a>
      <header className="sticky top-0 z-40 border-b border-border bg-background">
        <TamohiFrame className="flex h-16 items-center gap-4">
          <Link to="/tamohi" className="flex shrink-0 items-baseline gap-3 rounded-md focus-ring">
            <span className="text-h3 font-hrsd-bold text-primary">{t.wordmark}</span>
            <span className="hidden text-small text-muted-foreground sm:inline">{t.tagline}</span>
          </Link>
          <nav aria-label={t.nav_label} className="ms-4 hidden items-center gap-6 md:flex">
            {links}
          </nav>
          <div className="ms-auto flex min-w-0 items-center gap-2">
            <Link
              to={home}
              aria-label={t.back_to_center}
              className="inline-flex h-10 items-center gap-2 rounded-md px-2 text-small font-hrsd-medium text-muted-foreground transition-colors duration-micro hover:text-ink focus-ring lg:px-3"
            >
              <ArrowRight aria-hidden className="h-4 w-4" />
              <span className="hidden lg:inline">{t.back_to_center}</span>
            </Link>
            <UserDropdown name={name} items={menu} logoutRedirect="/login" />
          </div>
        </TamohiFrame>
        {/* Below md the two links take their own row */}
        <nav aria-label={t.nav_label} className="border-t border-border md:hidden">
          <TamohiFrame className="flex items-center gap-6 overflow-x-auto [&>a]:h-12">{links}</TamohiFrame>
        </nav>
      </header>

      <main id="main" className="flex-1">
        <RouteFade />
      </main>

      <footer className="border-t border-border bg-background">
        <TamohiFrame className="py-5">
          <p className="text-caption text-muted-foreground">{t.footer}</p>
        </TamohiFrame>
      </footer>
    </div>
  );
};

export default TamohiShell;
