import type { KeyboardEvent, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { copy } from "@/lib/copy";
import EmptyState from "@/components/shared/EmptyState";
import { SkeletonTableRows } from "@/components/shared/Skeletons";

export interface Column<T> {
  key: string;
  header: ReactNode;
  cell: (row: T, index: number) => ReactNode;
  /** Extra classes for both th and td */
  className?: string;
  align?: "start" | "center" | "end";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowKey: (row: T, index: number) => string;
  loading?: boolean;
  onRowClick?: (row: T) => void;
  /** Accessible label for the row action (row click), e.g. the row title */
  rowLabel?: (row: T) => string;
  /** Rendered when rows is empty and not loading */
  empty?: ReactNode;
  caption?: string;
  className?: string;
}

const alignClass = { start: "text-start", center: "text-center", end: "text-end" } as const;

/**
 * Table wrapper: 56px rows, sticky header (desktop), no zebra, row hover,
 * skeleton rows while loading, EmptyState when empty. Scrolls horizontally on small screens.
 */
function DataTable<T>({ columns, rows, getRowKey, loading, onRowClick, rowLabel, empty, caption, className }: DataTableProps<T>) {
  const handleKey = (e: KeyboardEvent<HTMLTableRowElement>, row: T) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onRowClick?.(row);
    }
  };

  const showEmpty = !loading && rows.length === 0;

  return (
    <div className={cn("rounded-lg border border-border bg-card", className)}>
      <div className="overflow-x-auto scrollbar-thin lg:overflow-visible">
        <table className="w-full min-w-[640px] border-separate border-spacing-0 text-small">
          {caption && <caption className="sr-only">{caption}</caption>}
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn(
                    "h-12 whitespace-nowrap border-b border-border bg-card px-4 font-hrsd-medium text-caption text-muted-foreground first:rounded-ts-lg last:rounded-te-lg lg:sticky lg:top-16 lg:z-10",
                    alignClass[col.align ?? "start"],
                    col.className
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody aria-busy={loading || undefined} aria-label={loading ? copy.table_loading : undefined}>
            {loading ? (
              <SkeletonTableRows columns={columns.length} />
            ) : (
              rows.map((row, i) => (
                <tr
                  key={getRowKey(row, i)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  onKeyDown={onRowClick ? (e) => handleKey(e, row) : undefined}
                  tabIndex={onRowClick ? 0 : undefined}
                  aria-label={onRowClick && rowLabel ? rowLabel(row) : undefined}
                  className={cn(
                    "group h-14 transition-colors duration-micro ease-standard hover:bg-section-alt/70 [&:last-child>td]:border-b-0",
                    onRowClick && "cursor-pointer focus-visible:bg-section-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                  )}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={cn("border-b border-border px-4 py-3 align-middle text-ink", alignClass[col.align ?? "start"], col.className)}
                    >
                      {col.cell(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {showEmpty && (empty ?? <EmptyState />)}
    </div>
  );
}

export default DataTable;
