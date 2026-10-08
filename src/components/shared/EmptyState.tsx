import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Inbox, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { copy } from "@/lib/copy";
import { transition } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  /** One sentence */
  message?: string;
  icon?: LucideIcon;
  /** One action: a route or a handler */
  action?: { label: string; to?: string; onClick?: () => void };
  /** Custom action node, used instead of `action` */
  children?: ReactNode;
  className?: string;
}

/** Empty list or panel: one sentence plus one action. */
const EmptyState = ({ message = copy.empty_default, icon: Icon = Inbox, action, children, className }: EmptyStateProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={transition.ui}
    className={cn("flex flex-col items-center gap-4 px-6 py-12 text-center", className)}
  >
    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-section-alt text-muted-foreground">
      <Icon aria-hidden className="h-6 w-6" strokeWidth={1.5} />
    </span>
    <p className="text-body text-muted-foreground">{message}</p>
    {children}
    {!children && action && (
      action.to ? (
        <Button asChild variant="outline">
          <Link to={action.to}>{action.label}</Link>
        </Button>
      ) : (
        <Button variant="outline" onClick={action.onClick}>
          {action.label}
        </Button>
      )
    )}
  </motion.div>
);

export default EmptyState;
