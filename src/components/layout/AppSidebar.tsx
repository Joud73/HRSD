import { NavLink, useLocation } from "react-router-dom";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { SIDEBAR_NAV, type ShellRole } from "@/components/layout/navigation";

interface AppSidebarNavProps {
  role: ShellRole;
  /** Icon-only rail between md and lg */
  railOnTablet?: boolean;
  onNavigate?: () => void;
}

/** Sidebar navigation list, shared by the desktop rail and the mobile sheet. */
export const AppSidebarNav = ({ role, railOnTablet = false, onNavigate }: AppSidebarNavProps) => {
  const location = useLocation();
  const groups = SIDEBAR_NAV[role] ?? [];
  // Evaluation detail pages belong to the assignments item
  const pathname = location.pathname.startsWith("/evaluator/assignment/") ? "/evaluator/assignments" : location.pathname;

  return (
    <nav aria-label={copy.main_nav} className="flex flex-col gap-6">
      {groups.map((group, gi) => (
        <div key={group.label ?? gi} className="flex flex-col gap-1">
          {group.label && (
            <p className={cn("px-4 pb-1 text-caption text-primary-foreground/60", railOnTablet && "md:sr-only lg:not-sr-only")}>
              {group.label}
            </p>
          )}
          {group.items.map((item) => {
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to);
            const link = (
              <NavLink
                to={item.to}
                end={item.end}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                aria-label={railOnTablet ? item.label : undefined}
                className={cn(
                  "relative flex h-11 items-center gap-3 rounded-md px-4 text-small transition-colors duration-micro ease-standard",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary",
                  active
                    ? "bg-primary-foreground/10 font-hrsd-bold text-primary-foreground"
                    : "font-hrsd-medium text-primary-foreground/80 hover:bg-primary-foreground/5 hover:text-primary-foreground",
                  railOnTablet && "md:justify-center md:px-0 lg:justify-start lg:px-4"
                )}
              >
                {active && <span aria-hidden className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-accent" />}
                <item.icon aria-hidden className="h-5 w-5 shrink-0" strokeWidth={1.75} />
                <span aria-hidden={railOnTablet || undefined} className={cn("truncate", railOnTablet && "md:hidden lg:inline")}>
                  {item.label}
                </span>
              </NavLink>
            );
            if (!railOnTablet) return <div key={item.to}>{link}</div>;
            return (
              <Tooltip key={item.to} delayDuration={150}>
                <TooltipTrigger asChild>{link}</TooltipTrigger>
                <TooltipContent side="left" className="lg:hidden">
                  {item.label}
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
      ))}
    </nav>
  );
};

/** Desktop sidebar: 264px on desktop, 72px icon rail on tablet, hidden on mobile (Sheet instead). */
const AppSidebar = ({ role }: { role: ShellRole }) => (
  <aside className="scrollbar-thin sticky top-16 hidden h-[calc(100vh-4rem)] shrink-0 overflow-y-auto bg-primary px-3 py-6 md:block md:w-[72px] lg:w-[264px]">
    <AppSidebarNav role={role} railOnTablet />
  </aside>
);

export default AppSidebar;
