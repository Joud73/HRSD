import { forwardRef, type ReactNode } from "react";
import { MoreHorizontal, Search } from "lucide-react";
import { copy, adminCopy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button, type ButtonProps } from "@/components/ui/button";

/* ── Layout pieces ── */

/** White panel with an optional title row. */
export const Panel = ({
  title,
  description,
  aside,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  aside?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) => (
  <section className={cn("rounded-lg border border-border bg-card", className)}>
    {(title || aside) && (
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
        <div className="min-w-0">
          {title && <h2 className="text-h3 text-ink">{title}</h2>}
          {description && <p className="mt-1 text-small text-muted-foreground">{description}</p>}
        </div>
        {aside}
      </div>
    )}
    <div className={cn("p-6", bodyClassName)}>{children}</div>
  </section>
);

/** Toolbar row above a table: search at the start, filters after it. */
export const Toolbar = ({ children, className }: { children: ReactNode; className?: string }) => (
  <div className={cn("mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center", className)}>{children}</div>
);

/** Search input with the icon at the start. */
export const SearchField = ({
  value,
  onChange,
  placeholder = copy.search_placeholder,
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) => (
  <div className={cn("relative w-full sm:w-80", className)}>
    <Search aria-hidden className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    <Input
      type="search"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      aria-label={placeholder}
      className="h-10 ps-9 text-small"
    />
  </div>
);

/** Key facts strip for detail headers: 3–5 label/value pairs. */
export const KeyFacts = ({ items }: { items: { label: string; value: ReactNode }[] }) => (
  <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none">
    {items.map((item) => (
      <div key={item.label} className="flex flex-col gap-1 bg-card px-5 py-4">
        <dt className="text-caption text-muted-foreground">{item.label}</dt>
        <dd className="text-body font-hrsd-medium text-ink">{item.value}</dd>
      </div>
    ))}
  </dl>
);

/** Label and value pair inside a panel grid. */
export const Fact = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-caption text-muted-foreground">{label}</dt>
    <dd className="text-small font-hrsd-medium text-ink">{children ?? "—"}</dd>
  </div>
);

/** Percentage with a slim bar, for table cells. */
export const ProgressCell = ({ value }: { value: number | null | undefined }) => {
  const missing = value === null || value === undefined || Number.isNaN(value);
  const pct = missing ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <span className="tabular w-10 text-small text-ink">{missing ? "—" : `${pct}%`}</span>
      <span aria-hidden className="h-1.5 w-20 rounded-full bg-section-alt">
        <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
};

/** The "more" trigger for a row's DropdownMenu. Stops the row click. */
export const RowActionsTrigger = forwardRef<HTMLButtonElement, ButtonProps>(({ className, onClick, ...props }, ref) => (
  <Button
    ref={ref}
    variant="ghost"
    size="icon"
    aria-label={adminCopy.row_actions}
    className={cn("h-9 w-9 text-muted-foreground hover:text-primary", className)}
    onClick={(e) => {
      e.stopPropagation();
      onClick?.(e);
    }}
    {...props}
  >
    <MoreHorizontal aria-hidden className="h-4 w-4" />
  </Button>
));
RowActionsTrigger.displayName = "RowActionsTrigger";
