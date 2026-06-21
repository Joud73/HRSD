import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Building2,
  ChevronLeft,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  label: string;
  icon: React.ElementType;
  path: string;
}

const navItems: NavItem[] = [
  { label: "لوحة التحكم", icon: LayoutDashboard, path: "/evaluator" },
  { label: "الجمعيات المكلّفة", icon: Building2, path: "/evaluator/assignments" },
];

const EvaluatorSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <aside className="sticky top-0 h-[calc(100vh-3.5rem)] w-60 shrink-0 border-s border-border bg-card overflow-y-auto py-6 px-3">
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            item.path === "/evaluator"
              ? location.pathname === "/evaluator"
              : location.pathname.startsWith(item.path);

          return (
            <button
              key={item.label}
              onClick={() => navigate(item.path)}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-hrsd-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4 shrink-0" />
              <span className="flex-1 text-start">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default EvaluatorSidebar;
