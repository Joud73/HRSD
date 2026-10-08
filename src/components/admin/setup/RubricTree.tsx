import type { ReactNode } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ArrowDown, ArrowUp, ChevronLeft, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { adminSetupCopy as t } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { countStandard, countTrack, counted, type NodeLevel, type ParentIds, type RubricItem, type Track } from "./rubric";

type NodeData = { name: string; description?: string; evidenceType?: string; isActive: boolean };

export interface RubricTreeHandlers {
  onAdd: (level: NodeLevel, parentIds: ParentIds) => void;
  onEdit: (level: NodeLevel, id: string, parentIds: ParentIds, data: NodeData) => void;
  onDelete: (level: NodeLevel, id: string, parentIds: ParentIds, childCount: number) => void;
  onMove: (level: NodeLevel, id: string, parentIds: ParentIds, dir: -1 | 1) => void;
}

interface RubricTreeProps extends RubricTreeHandlers {
  tracks: Track[];
  search: string;
  openIds: string[];
  onOpenChange: (ids: string[]) => void;
}

const c = t.rubric_count;

/* ── Row building blocks ── */

const InactiveTag = () => (
  <span className="shrink-0 rounded-full border border-border bg-card px-2 text-caption text-muted-foreground">{t.inactive}</span>
);

interface RowMenuProps {
  name: string;
  onEdit: () => void;
  onDelete: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

const RowMenu = ({ name, onEdit, onDelete, onMoveUp, onMoveDown, isFirst, isLast }: RowMenuProps) => (
  <DropdownMenu dir="rtl">
    <DropdownMenuTrigger asChild>
      <Button size="icon" variant="ghost" className="h-9 w-9 shrink-0 text-muted-foreground hover:text-ink" aria-label={`${t.row_actions}: ${name}`}>
        <MoreHorizontal aria-hidden />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className="min-w-44 rounded-md shadow-float">
      <DropdownMenuItem onSelect={onEdit} className="gap-2 text-small">
        <Pencil aria-hidden className="h-4 w-4" /> {t.edit}
      </DropdownMenuItem>
      {onMoveUp && (
        <DropdownMenuItem onSelect={onMoveUp} disabled={isFirst} className="gap-2 text-small">
          <ArrowUp aria-hidden className="h-4 w-4" /> {t.rubric_move_up}
        </DropdownMenuItem>
      )}
      {onMoveDown && (
        <DropdownMenuItem onSelect={onMoveDown} disabled={isLast} className="gap-2 text-small">
          <ArrowDown aria-hidden className="h-4 w-4" /> {t.rubric_move_down}
        </DropdownMenuItem>
      )}
      <DropdownMenuSeparator />
      <DropdownMenuItem onSelect={onDelete} className="gap-2 text-small text-danger focus:bg-danger/10 focus:text-danger">
        <Trash2 aria-hidden className="h-4 w-4" /> {t.delete}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
);

const triggerClass =
  "group flex w-full min-w-0 items-center gap-3 rounded-md py-1 text-start transition-colors duration-micro hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

/** Chevron points in reading direction when closed and turns down when open */
const Chevron = () => (
  <ChevronLeft
    aria-hidden
    className="h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-ui ease-standard group-data-[state=open]:-rotate-90 motion-reduce:transition-none"
  />
);

const contentClass =
  "overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down motion-reduce:animate-none";

/** Nested children sit behind a guide line at the start edge */
const Branch = ({ children, dim }: { children: ReactNode; dim?: boolean }) => (
  <div className={cn("ms-6 border-s border-border", dim && "pointer-events-none opacity-60")} aria-disabled={dim || undefined}>
    {children}
  </div>
);

const AddRow = ({ label, onClick }: { label: string; onClick: () => void }) => (
  <div className="border-t border-border px-4 py-2">
    <Button size="sm" variant="ghost" className="text-primary hover:text-primary" onClick={onClick}>
      <Plus aria-hidden /> {label}
    </Button>
  </div>
);

const EmptyRow = ({ text }: { text: string }) => <p className="border-t border-border px-4 py-3 text-small text-muted-foreground">{text}</p>;

const Meta = ({ children }: { children: ReactNode }) => (
  <span className="tabular text-caption text-muted-foreground">{children}</span>
);

/* ── Tree ── */

const RubricTree = ({ tracks, search, openIds, onOpenChange, onAdd, onEdit, onDelete, onMove }: RubricTreeProps) => {
  const matches = (name: string) => !search || name.includes(search);
  const itemMatches = (b: RubricItem) => matches(b.name);
  const indicatorMatches = (i: Track["standards"][number]["indicators"][number]) => matches(i.name) || i.items.some(itemMatches);
  const standardMatches = (s: Track["standards"][number]) => matches(s.name) || s.indicators.some(indicatorMatches);

  const visibleTracks = tracks.filter((tr) => matches(tr.name) || tr.standards.some(standardMatches));

  return (
    <AccordionPrimitive.Root type="multiple" value={openIds} onValueChange={onOpenChange} dir="rtl" className="divide-y divide-border">
      {visibleTracks.map((track) => {
        const tc = countTrack(track);
        const trackIds: ParentIds = { trackId: track.id };
        const standards = track.standards.filter((s) => matches(track.name) || standardMatches(s));
        return (
          <AccordionPrimitive.Item key={track.id} value={track.id}>
            {/* Track header: section grey */}
            <div className="flex items-center gap-2 bg-section-alt px-4 py-3">
              <AccordionPrimitive.Header className="min-w-0 flex-1">
                <AccordionPrimitive.Trigger className={triggerClass}>
                  <Chevron />
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-body font-hrsd-bold text-ink group-hover:text-primary">{track.name}</span>
                    <Meta>
                      {counted(tc.standards, c.standards)} · {counted(tc.indicators, c.indicators)} · {counted(tc.items, c.items)}
                    </Meta>
                  </span>
                  {!track.isActive && <InactiveTag />}
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
              <RowMenu
                name={track.name}
                onEdit={() => onEdit("track", track.id, {}, track)}
                onDelete={() => onDelete("track", track.id, {}, track.standards.length)}
              />
            </div>

            <AccordionPrimitive.Content className={contentClass}>
              <Branch dim={!track.isActive}>
                {standards.length === 0 && <EmptyRow text={t.rubric_no_standards} />}
                <AccordionPrimitive.Root type="multiple" value={openIds} onValueChange={onOpenChange} dir="rtl">
                  {standards.map((std, si) => {
                    const sc = countStandard(std);
                    const stdIds: ParentIds = { trackId: track.id, standardId: std.id };
                    const indicators = std.indicators.filter((i) => matches(std.name) || indicatorMatches(i));
                    return (
                      <AccordionPrimitive.Item key={std.id} value={std.id} className="border-t border-border">
                        <div className="flex items-center gap-2 px-4 py-2.5">
                          <AccordionPrimitive.Header className="min-w-0 flex-1">
                            <AccordionPrimitive.Trigger className={triggerClass}>
                              <Chevron />
                              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-small font-hrsd-bold text-ink group-hover:text-primary">{std.name}</span>
                                <Meta>
                                  {counted(sc.indicators, c.indicators)} · {counted(sc.items, c.items)}
                                </Meta>
                              </span>
                              {!std.isActive && <InactiveTag />}
                            </AccordionPrimitive.Trigger>
                          </AccordionPrimitive.Header>
                          <RowMenu
                            name={std.name}
                            onEdit={() => onEdit("standard", std.id, trackIds, std)}
                            onDelete={() => onDelete("standard", std.id, trackIds, std.indicators.length)}
                            onMoveUp={() => onMove("standard", std.id, trackIds, -1)}
                            onMoveDown={() => onMove("standard", std.id, trackIds, 1)}
                            isFirst={si === 0}
                            isLast={si === track.standards.length - 1}
                          />
                        </div>

                        <AccordionPrimitive.Content className={contentClass}>
                          <Branch dim={!std.isActive}>
                            {indicators.length === 0 && <EmptyRow text={t.rubric_no_indicators} />}
                            <AccordionPrimitive.Root type="multiple" value={openIds} onValueChange={onOpenChange} dir="rtl">
                              {indicators.map((ind, ii) => {
                                const indIds: ParentIds = { ...stdIds, indicatorId: ind.id };
                                const items = ind.items.filter((b) => matches(ind.name) || itemMatches(b));
                                return (
                                  <AccordionPrimitive.Item key={ind.id} value={ind.id} className="border-t border-border">
                                    <div className="flex items-center gap-2 px-4 py-2">
                                      <AccordionPrimitive.Header className="min-w-0 flex-1">
                                        <AccordionPrimitive.Trigger className={triggerClass}>
                                          <Chevron />
                                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="text-small text-ink group-hover:text-primary">{ind.name}</span>
                                            <Meta>{counted(ind.items.length, c.items)}</Meta>
                                          </span>
                                          {!ind.isActive && <InactiveTag />}
                                        </AccordionPrimitive.Trigger>
                                      </AccordionPrimitive.Header>
                                      <RowMenu
                                        name={ind.name}
                                        onEdit={() => onEdit("indicator", ind.id, stdIds, ind)}
                                        onDelete={() => onDelete("indicator", ind.id, stdIds, ind.items.length)}
                                        onMoveUp={() => onMove("indicator", ind.id, stdIds, -1)}
                                        onMoveDown={() => onMove("indicator", ind.id, stdIds, 1)}
                                        isFirst={ii === 0}
                                        isLast={ii === std.indicators.length - 1}
                                      />
                                    </div>

                                    <AccordionPrimitive.Content className={contentClass}>
                                      <Branch dim={!ind.isActive}>
                                        {items.length === 0 && <EmptyRow text={t.rubric_no_items} />}
                                        <ul>
                                          {items.map((item, bi) => (
                                            <li key={item.id} className="flex items-center gap-3 border-t border-border py-2 pe-4 ps-6">
                                              <span aria-hidden className="h-1.5 w-1.5 shrink-0 rounded-full bg-neutral" />
                                              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                                                <span className="text-small text-ink">{item.name}</span>
                                                <Meta>
                                                  {t.rubric_evidence_type}: {item.evidenceType}
                                                </Meta>
                                              </span>
                                              {!item.isActive && <InactiveTag />}
                                              <RowMenu
                                                name={item.name}
                                                onEdit={() => onEdit("item", item.id, indIds, item)}
                                                onDelete={() => onDelete("item", item.id, indIds, 0)}
                                                onMoveUp={() => onMove("item", item.id, indIds, -1)}
                                                onMoveDown={() => onMove("item", item.id, indIds, 1)}
                                                isFirst={bi === 0}
                                                isLast={bi === ind.items.length - 1}
                                              />
                                            </li>
                                          ))}
                                        </ul>
                                        <AddRow label={t.rubric_add.item} onClick={() => onAdd("item", indIds)} />
                                      </Branch>
                                    </AccordionPrimitive.Content>
                                  </AccordionPrimitive.Item>
                                );
                              })}
                            </AccordionPrimitive.Root>
                            <AddRow label={t.rubric_add.indicator} onClick={() => onAdd("indicator", stdIds)} />
                          </Branch>
                        </AccordionPrimitive.Content>
                      </AccordionPrimitive.Item>
                    );
                  })}
                </AccordionPrimitive.Root>
                <AddRow label={t.rubric_add.standard} onClick={() => onAdd("standard", trackIds)} />
              </Branch>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        );
      })}
    </AccordionPrimitive.Root>
  );
};

export default RubricTree;
