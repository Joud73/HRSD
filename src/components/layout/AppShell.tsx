import { useState } from "react";
import { Link } from "react-router-dom";
import { Menu, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { copy } from "@/lib/copy";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import UserDropdown, { type UserMenuItem } from "@/components/UserDropdown";
import Container from "@/components/layout/Container";
import RouteFade from "@/components/layout/RouteFade";
import AppSidebar, { AppSidebarNav } from "@/components/layout/AppSidebar";
import { ORGANIZATION_NAV, SIDEBAR_NAV, type ShellRole } from "@/components/layout/navigation";
import aolLogo from "@/assets/logos/aol.png";
import aolWhiteLogo from "@/assets/logos/aol-white.png";

const HOME: Record<ShellRole, string> = { admin: "/admin", supervisor: "/supervisor", evaluator: "/evaluator", organization: "/dashboard" };

const MENU: Record<ShellRole, UserMenuItem[]> = {
  admin: [{ label: copy.account_profile, to: "/admin/profile", icon: User }],
  supervisor: [{ label: copy.account_profile, to: "/supervisor/profile", icon: User }],
  evaluator: [{ label: copy.account_profile, to: "/evaluator/profile", icon: User }],
  organization: ORGANIZATION_NAV.map(({ label, to, icon }) => ({ label, to, icon })),
};

/**
 * Internal app frame for admin, supervisor, evaluator and organization pages: compact top bar,
 * green sidebar (admin, supervisor, evaluator), content on the section grey. Pages render their
 * own PageHeader inside.
 */
const AppShell = ({ role }: { role: ShellRole }) => {
  const { organizationName } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);
  const hasSidebar = !!SIDEBAR_NAV[role];
  const userName = role === "organization" ? organizationName || copy.account_fallback : copy.shell_user[role];

  return (
    <div dir="rtl" className="flex min-h-screen flex-col bg-section-alt">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-float"
      >
        {copy.skip_to_content}
      </a>
      <header className="sticky top-0 z-40 h-16 border-b border-border bg-background">
        <div className="flex h-full items-center gap-3 px-5 md:px-8 lg:px-12">
          {hasSidebar && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ms-2 md:hidden" aria-label={copy.open_menu}>
                  <Menu className="!h-6 !w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                dir="rtl"
                className="flex w-[280px] flex-col gap-6 border-0 bg-primary p-4 pt-6 text-primary-foreground [&>button]:text-primary-foreground"
              >
                <SheetTitle className="sr-only">{copy.main_nav}</SheetTitle>
                <img src={aolWhiteLogo} alt={copy.logo_alt} className="h-9 w-auto self-start" />
                <AppSidebarNav role={role} onNavigate={() => setSheetOpen(false)} />
              </SheetContent>
            </Sheet>
          )}
          <Link to={HOME[role]} className="shrink-0 rounded-md">
            <img src={aolLogo} alt={copy.logo_alt} className="h-9 w-auto" />
          </Link>
          <span aria-hidden className="hidden h-6 w-px bg-border sm:block" />
          <p className="hidden truncate text-small font-hrsd-medium text-muted-foreground sm:block">{copy.shell_context[role]}</p>
          <div className="ms-auto min-w-0">
            <UserDropdown name={userName} items={MENU[role]} logoutRedirect="/login" />
          </div>
        </div>
      </header>

      <div className="flex flex-1">
        {hasSidebar && <AppSidebar role={role} />}
        <main id="main" className="min-w-0 flex-1">
          <Container className="py-8 lg:py-10">
            <RouteFade />
          </Container>
        </main>
      </div>
    </div>
  );
};

export default AppShell;
