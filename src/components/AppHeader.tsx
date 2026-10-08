import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronDown, LayoutGrid, LogOut, Menu, MoreVertical, Settings } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { roleDefaultRoute } from "@/lib/roles";
import { copy, TRACKS } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetClose, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import GovStrip from "@/components/gov/GovStrip";
import UserDropdown, { type UserMenuItem } from "@/components/UserDropdown";
import hrsdColoredLogo from "@/assets/logos/hrsd-colored.png";

interface NavChild {
  label: string;
  /** Missing `to` renders the item disabled (no page yet) */
  to?: string;
}

interface NavEntry {
  label: string;
  to?: string;
  children?: NavChild[];
}

const [aboutIntro, aboutGoals, aboutMethod] = copy.nav_about_items;

const NAV: NavEntry[] = [
  { label: copy.nav_home, to: "/" },
  {
    label: copy.nav_about,
    children: [
      { label: aboutIntro, to: "/#about" },
      { label: aboutGoals, to: "/#about" },
      { label: aboutMethod, to: "/#steps" },
    ],
  },
  { label: copy.nav_tracks, children: TRACKS.map((t) => ({ label: t.name, to: `/#${t.id}` })) },
  { label: copy.nav_guides, children: copy.nav_guides_items.map((label) => ({ label })) },
  { label: copy.nav_contact, to: "/contact-us" },
];

const LOGO_ALT = "وزارة الموارد البشرية والتنمية الاجتماعية";

const navItemClass =
  "relative flex h-full items-center gap-1 text-body font-hrsd-medium text-ink transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring data-[state=open]:text-primary";

/** 3px primary bar on the header's bottom edge */
const ActiveBar = ({ active }: { active: boolean }) => (
  <span aria-hidden className={cn("absolute inset-x-0 -bottom-px h-[3px] bg-primary", active ? "block" : "hidden")} />
);

/** Gov strip + sticky header for public, organization and individual pages. */
const AppHeader = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, userRole, organizationName, loading, signOut } = useAuth();
  const [sheetOpen, setSheetOpen] = useState(false);

  // Scroll to in-page sections (/#tracks etc.) after navigation
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (!target) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Defer past the click: a smooth scroll started inside it is cancelled by the link focus
    const timer = window.setTimeout(() =>
      target.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" })
    );
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.hash]);

  const isActive = (to?: string) => {
    if (!to) return false;
    const [path, hash] = to.split("#");
    if (hash) return location.pathname === path && location.hash === `#${hash}`;
    if (to === "/") return location.pathname === "/" && !location.hash;
    return location.pathname.startsWith(to);
  };
  const isEntryActive = (entry: NavEntry) =>
    entry.children ? entry.children.some((c) => isActive(c.to)) : isActive(entry.to);

  const handleLogout = async () => {
    setSheetOpen(false);
    await signOut();
    navigate("/", { replace: true });
  };

  const isLoggedIn = !loading && !!user;
  const accountName = organizationName || (userRole === "individual" ? user?.email : null) || "حسابي";
  const accountItems: UserMenuItem[] = [
    { label: "لوحة التحكم", to: userRole ? roleDefaultRoute[userRole] : "/dashboard", icon: LayoutGrid },
    ...(userRole === "organization" ? [{ label: "الإعدادات", to: "/settings", icon: Settings }] : []),
  ];

  return (
    <div dir="rtl" className="sticky top-0 z-50">
      <GovStrip />
      <header className="h-16 border-b border-border bg-background lg:h-20">
        {/* ---------- Desktop ---------- */}
        <div className="mx-auto hidden h-full max-w-[1200px] items-center px-6 lg:flex">
          <Link
            to="/"
            className="shrink-0 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4"
          >
            <img src={hrsdColoredLogo} alt={LOGO_ALT} className="h-14 w-auto" />
          </Link>

          <nav aria-label="القائمة الرئيسية" className="ms-10 flex h-full items-stretch gap-8">
            {NAV.map((entry) => {
              const active = isEntryActive(entry);
              if (!entry.children) {
                return (
                  <Link
                    key={entry.label}
                    to={entry.to!}
                    aria-current={active ? "page" : undefined}
                    className={navItemClass}
                  >
                    {entry.label}
                    <ActiveBar active={active} />
                  </Link>
                );
              }
              return (
                <DropdownMenu key={entry.label} dir="rtl" modal={false}>
                  <DropdownMenuTrigger className={cn(navItemClass, "group")}>
                    {entry.label}
                    <ChevronDown
                      aria-hidden
                      className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                    />
                    <ActiveBar active={active} />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={0}
                    collisionPadding={16}
                    className="min-w-[220px] rounded-lg p-1"
                  >
                    {entry.children.map((child) =>
                      child.to ? (
                        <DropdownMenuItem key={child.label} asChild className="cursor-pointer rounded-md px-3 py-2.5 text-small font-hrsd-medium">
                          <Link to={child.to}>{child.label}</Link>
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem key={child.label} disabled className="rounded-md px-3 py-2.5 text-small font-hrsd-medium">
                          {child.label}
                        </DropdownMenuItem>
                      )
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              );
            })}
          </nav>

          <div className="ms-auto flex items-center gap-2">
            <Button variant="ghost" lang="en" className="h-10 px-3 font-sans text-small text-muted-foreground hover:text-ink">
              {copy.lang}
            </Button>
            {isLoggedIn ? (
              <UserDropdown name={accountName} items={accountItems} />
            ) : (
              <Button
                asChild
                variant="outline"
                className="h-10 rounded-md border-primary px-5 text-small font-hrsd-medium text-primary hover:bg-primary hover:text-primary-foreground"
              >
                <Link to="/login">{copy.login}</Link>
              </Button>
            )}
          </div>
        </div>

        {/* ---------- Mobile / tablet: ☰ start, logo center, ⋮ end ---------- */}
        <div className="grid h-full grid-cols-[40px_1fr_40px] items-center px-4 lg:hidden">
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="فتح القائمة">
                <Menu className="!h-6 !w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" dir="rtl" className="flex w-[300px] flex-col gap-0 overflow-y-auto p-0 sm:max-w-[300px]">
              <div className="flex h-16 shrink-0 items-center border-b border-border px-6">
                <SheetTitle className="sr-only">القائمة الرئيسية</SheetTitle>
                <img src={hrsdColoredLogo} alt={LOGO_ALT} className="h-10 w-auto" />
              </div>
              <nav aria-label="القائمة الرئيسية" className="flex flex-col py-2">
                {NAV.map((entry) => {
                  const active = isEntryActive(entry);
                  const rowClass = cn(
                    "flex h-12 w-full items-center justify-between border-s-[3px] px-6 text-body transition-colors hover:bg-surface focus-visible:bg-surface focus-visible:outline-none",
                    active ? "border-primary font-hrsd-bold text-primary" : "border-transparent font-hrsd-medium text-ink"
                  );
                  if (!entry.children) {
                    return (
                      <SheetClose asChild key={entry.label}>
                        <Link to={entry.to!} aria-current={active ? "page" : undefined} className={rowClass}>
                          {entry.label}
                        </Link>
                      </SheetClose>
                    );
                  }
                  return (
                    <Collapsible key={entry.label} defaultOpen={active}>
                      <CollapsibleTrigger className={cn(rowClass, "group")}>
                        {entry.label}
                        <ChevronDown
                          aria-hidden
                          className="h-4 w-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180"
                        />
                      </CollapsibleTrigger>
                      <CollapsibleContent className="pb-2">
                        {entry.children.map((child) =>
                          child.to ? (
                            <SheetClose asChild key={child.label}>
                              <Link
                                to={child.to}
                                className={cn(
                                  "flex h-11 items-center ps-10 pe-6 text-small font-hrsd-medium hover:bg-surface",
                                  isActive(child.to) ? "text-primary" : "text-muted-foreground"
                                )}
                              >
                                {child.label}
                              </Link>
                            </SheetClose>
                          ) : (
                            <span
                              key={child.label}
                              aria-disabled
                              className="flex h-11 items-center ps-10 pe-6 text-small font-hrsd-medium text-muted-foreground/60"
                            >
                              {child.label}
                            </span>
                          )
                        )}
                      </CollapsibleContent>
                    </Collapsible>
                  );
                })}
              </nav>
            </SheetContent>
          </Sheet>

          <Link
            to="/"
            className="justify-self-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            <img src={hrsdColoredLogo} alt={LOGO_ALT} className="h-10 w-auto" />
          </Link>

          <DropdownMenu dir="rtl" modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="خيارات إضافية">
                <MoreVertical className="!h-5 !w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} collisionPadding={16} className="w-56 rounded-lg p-1">
              {isLoggedIn ? (
                <>
                  <DropdownMenuLabel className="truncate px-2 py-2 text-xs font-hrsd-regular text-muted-foreground">
                    {accountName}
                  </DropdownMenuLabel>
                  {accountItems.map(({ label, to, icon: Icon }) => (
                    <DropdownMenuItem key={to} onSelect={() => navigate(to)} className="cursor-pointer gap-2 px-2 py-2.5 font-hrsd-medium">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      {label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuItem onSelect={handleLogout} className="cursor-pointer gap-2 px-2 py-2.5 font-hrsd-medium text-danger focus:text-danger">
                    <LogOut className="h-4 w-4" />
                    تسجيل الخروج
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onSelect={() => navigate("/login")} className="cursor-pointer px-2 py-2.5 font-hrsd-medium text-primary focus:text-primary">
                  {copy.login}
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem lang="en" className="cursor-pointer px-2 py-2.5 font-sans">
                {copy.lang}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
    </div>
  );
};

export default AppHeader;
