import type { ReactNode } from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDown, ChevronLeft } from "lucide-react";
import { adminSetupCopy as t } from "@/lib/copy";
import { counted } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import type { Indicator, RubricItem, Standard, Track } from "@/services/toolService";

/** Optional per-node selection (cycle scope). Without it the tree is read only, as in AdminRubric. */
export interface RubricSelection {
  /** Control at the start of a track, standard, indicator or item row, for the items under it */
  control: (itemIds: string[], label: string) => ReactNode;
  /** Shown after an item's text */
  itemNote?: (itemId: string) => ReactNode;
  /** Item text shown muted (e.g. excluded) */
  isMuted?: (itemId: string) => boolean;
}

interface RubricTreeProps {
  tracks: Track[];
  search: string;
  openIds: string[];
  onOpenChange: (ids: string[]) => void;
  selection?: RubricSelection;
}

const indicatorItemIds = (i: Indicator) => i.items.map((b) => b.id);
const standardItemIds = (s: Standard) => s.indicators.flatMap(indicatorItemIds);
const trackItemIds = (tr: Track) => tr.standards.flatMap(standardItemIds);

const c = t.rubric_count;

const countTrack = (tr: Track) => {
  const indicators = tr.standards.flatMap((s) => s.indicators);
  return { standards: tr.standards.length, indicators: indicators.length, items: indicators.reduce((n, i) => n + i.items.length, 0) };
};

const countStandard = (s: Standard) => ({
  indicators: s.indicators.length,
  items: s.indicators.reduce((n, i) => n + i.items.length, 0),
});

/* ── Row building blocks ── */

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
const Branch = ({ children }: { children: ReactNode }) => <div className="ms-6 border-s border-border">{children}</div>;

const EmptyRow = ({ text }: { text: string }) => <p className="border-t border-border px-4 py-3 text-small text-muted-foreground">{text}</p>;

const Meta = ({ children }: { children: ReactNode }) => (
  <span className="tabular text-caption text-muted-foreground">{children}</span>
);

const Detail = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="flex flex-col gap-1">
    <dt className="text-caption font-hrsd-medium text-muted-foreground">{label}</dt>
    <dd className="text-small text-ink">{children}</dd>
  </div>
);

/** Item text, with improvement action, strength and opportunity collapsed under it */
const ItemRow = ({ item, selection }: { item: RubricItem; selection?: RubricSelection }) => (
  <li className="border-t border-border py-2 pe-4 ps-6">
    <Collapsible>
      <div className="flex items-start gap-3">
        {selection ? (
          <span className="mt-0.5 flex shrink-0">{selection.control([item.id], item.text)}</span>
        ) : (
          <span aria-hidden className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-neutral" />
        )}
        <span className={cn("min-w-0 flex-1 text-small", selection?.isMuted?.(item.id) ? "text-muted-foreground line-through" : "text-ink")}>
          {item.text}
          {selection?.itemNote && <span className="ms-2 inline-block no-underline">{selection.itemNote(item.id)}</span>}
        </span>
        <CollapsibleTrigger className="group inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-caption text-primary transition-colors duration-micro hover:bg-section-alt focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          {t.rubric_item_details}
          <ChevronDown
            aria-hidden
            className="h-3.5 w-3.5 transition-transform duration-ui ease-standard group-data-[state=open]:rotate-180 motion-reduce:transition-none"
          />
        </CollapsibleTrigger>
      </div>
      <CollapsibleContent className={contentClass}>
        <dl className="mt-3 flex flex-col gap-3 rounded-md bg-section-alt p-4 ms-4">
          <Detail label={t.rubric_item_improvement}>{item.improvementAction}</Detail>
          <Detail label={t.rubric_item_strength}>{item.strengthText}</Detail>
          <Detail label={t.rubric_item_opportunity}>{item.opportunityText}</Detail>
        </dl>
      </CollapsibleContent>
    </Collapsible>
  </li>
);

/* ── Tree ── */

const RubricTree = ({ tracks, search, openIds, onOpenChange, selection }: RubricTreeProps) => {
  const matches = (text: string) => !search || text.includes(search);
  const itemMatches = (b: RubricItem) => matches(b.text);
  const indicatorMatches = (i: Indicator) => matches(i.text) || i.items.some(itemMatches);
  const standardMatches = (s: Standard) => matches(s.name) || s.indicators.some(indicatorMatches);

  const visibleTracks = tracks.filter((tr) => matches(tr.name) || tr.standards.some(standardMatches));

  return (
    <AccordionPrimitive.Root type="multiple" value={openIds} onValueChange={onOpenChange} dir="rtl" className="divide-y divide-border">
      {visibleTracks.map((track) => {
        const tc = countTrack(track);
        const standards = track.standards.filter((s) => matches(track.name) || standardMatches(s));
        return (
          <AccordionPrimitive.Item key={track.id} value={track.id}>
            {/* Track header: section grey */}
            <div className="flex items-center gap-2 bg-section-alt px-4 py-3">
              {selection?.control(trackItemIds(track), track.name)}
              <AccordionPrimitive.Header className="min-w-0 flex-1">
                <AccordionPrimitive.Trigger className={triggerClass}>
                  <Chevron />
                  <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                    <span className="text-body font-hrsd-bold text-ink group-hover:text-primary">{track.name}</span>
                    <Meta>
                      {counted(tc.standards, c.standards)} · {counted(tc.indicators, c.indicators)} · {counted(tc.items, c.items)}
                    </Meta>
                  </span>
                </AccordionPrimitive.Trigger>
              </AccordionPrimitive.Header>
            </div>

            <AccordionPrimitive.Content className={contentClass}>
              <Branch>
                {standards.length === 0 && <EmptyRow text={t.rubric_no_standards} />}
                <AccordionPrimitive.Root type="multiple" value={openIds} onValueChange={onOpenChange} dir="rtl">
                  {standards.map((std) => {
                    const sc = countStandard(std);
                    const indicators = std.indicators.filter((i) => matches(std.name) || indicatorMatches(i));
                    return (
                      <AccordionPrimitive.Item key={std.id} value={std.id} className="border-t border-border">
                        <div className="flex items-center gap-2 px-4 py-2.5">
                          {selection?.control(standardItemIds(std), std.name)}
                          <AccordionPrimitive.Header className="min-w-0 flex-1">
                            <AccordionPrimitive.Trigger className={triggerClass}>
                              <Chevron />
                              <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                                <span className="text-small font-hrsd-bold text-ink group-hover:text-primary">{std.name}</span>
                                <Meta>
                                  {counted(sc.indicators, c.indicators)} · {counted(sc.items, c.items)}
                                </Meta>
                              </span>
                            </AccordionPrimitive.Trigger>
                          </AccordionPrimitive.Header>
                        </div>

                        <AccordionPrimitive.Content className={contentClass}>
                          <Branch>
                            {indicators.length === 0 && <EmptyRow text={t.rubric_no_indicators} />}
                            <AccordionPrimitive.Root type="multiple" value={openIds} onValueChange={onOpenChange} dir="rtl">
                              {indicators.map((ind) => {
                                const items = ind.items.filter((b) => matches(ind.text) || itemMatches(b));
                                return (
                                  <AccordionPrimitive.Item key={ind.id} value={ind.id} className="border-t border-border">
                                    <div className="flex items-center gap-2 px-4 py-2">
                                      {selection?.control(indicatorItemIds(ind), ind.text)}
                                      <AccordionPrimitive.Header className="min-w-0 flex-1">
                                        <AccordionPrimitive.Trigger className={triggerClass}>
                                          <Chevron />
                                          <span className="flex min-w-0 flex-1 flex-wrap items-center gap-x-3 gap-y-1">
                                            <span className="text-small text-ink group-hover:text-primary">{ind.text}</span>
                                            <Meta>{counted(ind.items.length, c.items)}</Meta>
                                          </span>
                                        </AccordionPrimitive.Trigger>
                                      </AccordionPrimitive.Header>
                                    </div>

                                    <AccordionPrimitive.Content className={contentClass}>
                                      <Branch>
                                        {items.length === 0 && <EmptyRow text={t.rubric_no_items} />}
                                        <ul>
                                          {items.map((item) => (
                                            <ItemRow key={item.id} item={item} selection={selection} />
                                          ))}
                                        </ul>
                                      </Branch>
                                    </AccordionPrimitive.Content>
                                  </AccordionPrimitive.Item>
                                );
                              })}
                            </AccordionPrimitive.Root>
                          </Branch>
                        </AccordionPrimitive.Content>
                      </AccordionPrimitive.Item>
                    );
                  })}
                </AccordionPrimitive.Root>
              </Branch>
            </AccordionPrimitive.Content>
          </AccordionPrimitive.Item>
        );
      })}
    </AccordionPrimitive.Root>
  );
};

export default RubricTree;
