import { copy, TRACKS } from "@/lib/copy";

/** "مسارات التقييم": the five tracks with their standards. */
const TracksSection = () => (
  <section id="tracks" className="scroll-mt-[100px] bg-surface py-14 lg:scroll-mt-[116px] lg:py-24">
    <div className="mx-auto max-w-[1200px] px-4 md:px-6">
      <h2 className="font-hrsd-bold text-h2 text-ink">{copy.tracks_title}</h2>
      <p className="mt-2 text-small font-hrsd-medium text-muted-foreground">{copy.tracks_subtitle}</p>

      <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-5">
        {TRACKS.map((track) => (
          <li
            key={track.id}
            id={track.id}
            className="group relative flex scroll-mt-[120px] flex-col overflow-hidden rounded-lg border border-border bg-background p-6 lg:scroll-mt-[136px]"
          >
            {/* Gold top edge on hover: the screen's single accent */}
            <span
              aria-hidden
              className="absolute inset-x-0 top-0 h-[3px] bg-accent opacity-0 transition-opacity group-hover:opacity-100"
            />
            <h3 className="font-hrsd-semibold text-h3 text-ink">{track.name}</h3>
            <p className="mt-2 text-small font-hrsd-regular text-muted-foreground">{track.standards}</p>
            <p className="mt-auto pt-6 text-small font-hrsd-medium text-primary">3 معايير</p>
          </li>
        ))}
      </ul>
    </div>
  </section>
);

export default TracksSection;
