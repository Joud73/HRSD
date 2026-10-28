import {
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
  type LucideIcon,
} from "lucide-react";
import { copy } from "@/lib/copy";

export type ShellRole = "admin" | "evaluator" | "organization";

export interface SidebarItem {
  label: string;
  icon: LucideIcon;
  to: string;
  /** Match only the exact path (dashboards) */
  end?: boolean;
}

interface SidebarGroup {
  label?: string;
  items: SidebarItem[];
}

const A = copy.nav_admin;
const E = copy.nav_evaluator;

export const SIDEBAR_NAV: Partial<Record<ShellRole, SidebarGroup[]>> = {
  admin: [
    { items: [{ label: A.dashboard, icon: LayoutDashboard, to: "/admin", end: true }] },
    {
      label: A.group_management,
      items: [
        { label: A.users, icon: Users, to: "/admin/users" },
        { label: A.roles, icon: ShieldCheck, to: "/admin/roles" },
        { label: A.associations, icon: Building2, to: "/admin/associations" },
        { label: A.requests, icon: Inbox, to: "/admin/organization-requests" },
        { label: A.reviewers, icon: UserCheck, to: "/admin/reviewers" },
      ],
    },
    {
      label: A.group_performance,
      items: [
        { label: A.setup, icon: BookOpen, to: "/admin/performance/evaluation-setup" },
        { label: A.years, icon: CalendarDays, to: "/admin/performance/evaluation-years" },
        { label: A.reports, icon: FileBarChart, to: "/admin/reports" },
      ],
    },
  ],
  evaluator: [
    {
      items: [
        { label: E.dashboard, icon: LayoutDashboard, to: "/evaluator", end: true },
        { label: E.assignments, icon: ClipboardCheck, to: "/evaluator/assignments" },
      ],
    },
  ],
};

/** Organization pages: no sidebar, opened from the account menu (see AppShell). */
export const ORGANIZATION_NAV: SidebarItem[] = [
  { label: copy.account_dashboard, icon: LayoutGrid, to: "/dashboard" },
  { label: copy.account_settings, icon: Settings, to: "/settings" },
];

/** Every page a role can open from the interface, flattened (used by the roles reference page). */
export const ROLE_PAGES: Record<ShellRole, SidebarItem[]> = {
  admin: (SIDEBAR_NAV.admin ?? []).flatMap((g) => g.items),
  evaluator: (SIDEBAR_NAV.evaluator ?? []).flatMap((g) => g.items),
  organization: ORGANIZATION_NAV,
};
