import { Fragment, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  to?: string;
}

interface PageHeaderProps {
  title: string;
  /** One line under the title */
  description?: ReactNode;
  breadcrumbs?: Crumb[];
  /** Primary action first; it sits at the start of the action group */
  actions?: ReactNode;
  /** Extra row under the title (status summary, key facts) */
  meta?: ReactNode;
  className?: string;
}

/** Breadcrumb, title, one-line description and actions for every internal page. */
const PageHeader = ({ title, description, breadcrumbs, actions, meta, className }: PageHeaderProps) => (
  <header className={cn("mb-8 flex flex-col gap-4", className)}>
    {breadcrumbs && breadcrumbs.length > 0 && (
      <nav aria-label={copy.breadcrumb_label}>
        <ol className="flex flex-wrap items-center gap-1.5 text-small text-muted-foreground">
          {breadcrumbs.map((crumb, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <Fragment key={`${crumb.label}-${i}`}>
                <li>
                  {crumb.to && !last ? (
                    <Link to={crumb.to} className="rounded-sm transition-colors duration-micro hover:text-primary">
                      {crumb.label}
                    </Link>
                  ) : (
                    <span aria-current={last ? "page" : undefined} className={cn(last && "text-ink")}>
                      {crumb.label}
                    </span>
                  )}
                </li>
                {!last && (
                  <li aria-hidden>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </li>
                )}
              </Fragment>
            );
          })}
        </ol>
      </nav>
    )}
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0 max-w-[760px]">
        <h1 className="text-h1 text-primary">{title}</h1>
        {description && <p className="mt-2 text-body text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-3">{actions}</div>}
    </div>
    {meta}
  </header>
);

export default PageHeader;
