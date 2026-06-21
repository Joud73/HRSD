import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  ShieldCheck,
  Building2,
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileBarChart,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavChild {
  label: string;
  icon: React.ElementType;
  path?: string;
}

interface NavItem {
  label: string;
  icon: React.ElementType;
  path?: string;
  children?: NavChild[];
}

const navItems: NavItem[] = [
  { label: "لوحة التحكم", icon: LayoutDashboard, path: "/admin" },
  {
    label: "الإدارة",
    icon: Users,
    children: [
      { label: "إدارة المستخدمين", icon: Users, path: "/admin/users" },
      { label: "إدارة الصلاحيات", icon: ShieldCheck, path: "/admin/roles" },
      { label: "إدارة الجمعيات", icon: Building2, path: "/admin/associations" },
      { label: "طلبات التسجيل", icon: Building2, path: "/admin/organization-requests" },
      { label: "إدارة المقيمين", icon: ClipboardCheck, path: "/admin/reviewers" },
    ],
  },
  {
    label: "الأداء",
    icon: ClipboardCheck,
    children: [
      { label: "تهيئة التقييم", icon: BookOpen, path: "/admin/performance/evaluation-setup" },
      { label: "إدارة سنوات التقييم", icon: CalendarDays, path: "/admin/performance/evaluation-years" },
    ],
  },
  { label: "التقارير", icon: FileBarChart, path: "/admin/reports" },
];

const AdminSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const isActive = (path?: string) => {
    if (!path) return false;
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const toggle = (label: string) =>
    setExpanded((prev) => ({ ...prev, [label]: !prev[label] }));

  const handleClick = (item: NavItem | NavChild) => {
    if ("children" in item && (item as NavItem).children) {
      toggle(item.label);
    } else if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <aside className="sticky top-0 h-[calc(100vh-3.5rem)] w-60 shrink-0 border-s border-border bg-card overflow-y-auto py-6 px-3">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <div key={item.label}>
            <button
              onClick={() => handleClick(item)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-hrsd-medium transition-colors",
                isActive(item.path)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-start">{item.label}</span>
              {item.children && (
                <ChevronLeft
                  className={cn(
                    "h-3.5 w-3.5 transition-transform duration-200",
                    expanded[item.label] && "-rotate-90"
                  )}
                />
              )}
            </button>

            {item.children && expanded[item.label] && (
              <div className="me-4 mt-1 flex flex-col gap-0.5 border-e-2 border-border pe-3">
                {item.children.map((child) => (
                  <button
                    key={child.label}
                    onClick={() => handleClick(child)}
                    className={cn(
                      "flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-hrsd transition-colors",
                      isActive(child.path)
                        ? "bg-primary/10 text-primary font-hrsd-medium"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <child.icon className="h-3.5 w-3.5" />
                    <span>{child.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default AdminSidebar;
