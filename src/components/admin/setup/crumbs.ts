import { copy, adminSetupCopy as t } from "@/lib/copy";
import type { Crumb } from "@/components/shared/PageHeader";

export const SETUP_PATH = "/admin/performance/evaluation-setup";
export const ENTITIES_PATH = `${SETUP_PATH}/entities`;
export const RUBRIC_PATH = `${SETUP_PATH}/rubric`;
export const YEARS_PATH = "/admin/performance/evaluation-years";

/** Breadcrumb roots shared by the admin performance pages */
const root: Crumb[] = [{ label: copy.shell_context.admin, to: "/admin" }, { label: copy.nav_admin.group_performance }];

export const crumbs = {
  setup: [...root, { label: copy.nav_admin.setup }],
  entities: [...root, { label: copy.nav_admin.setup, to: SETUP_PATH }, { label: t.entities_title }],
  rubric: [...root, { label: copy.nav_admin.setup, to: SETUP_PATH }, { label: t.rubric_title }],
  years: [...root, { label: copy.nav_admin.years }],
  year: (label: string): Crumb[] => [...root, { label: copy.nav_admin.years, to: YEARS_PATH }, { label }],
  reports: [{ label: copy.shell_context.admin, to: "/admin" }, { label: copy.nav_admin.group_performance }, { label: copy.nav_admin.reports }],
};
