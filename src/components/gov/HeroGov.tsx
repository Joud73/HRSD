import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";

/** Eight-point star outline (union of two squares), centred on 0,0 */
const starPoints = (outer: number) => {
  const inner = outer * (Math.cos(Math.PI / 4) / Math.cos(Math.PI / 8));
  return Array.from({ length: 16 }, (_, i) => {
    const r = i % 2 === 0 ? outer : inner;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    return `${(r * Math.cos(a)).toFixed(2)},${(r * Math.sin(a)).toFixed(2)}`;
  }).join(" ");
};

const STAR_RINGS = [300, 240, 180, 120, 60];

/** Large concentric star motif, white at low opacity. Decorative only. */
const StarMotif = () => (
  <svg
    aria-hidden
    viewBox="-320 -320 640 640"
    className="pointer-events-none absolute -end-24 top-1/2 hidden h-[600px] w-[600px] -translate-y-1/2 text-primary-foreground opacity-[0.08] lg:block"
  >
    {STAR_RINGS.map((r, i) => (
      <polygon
        key={r}
        points={starPoints(r)}
        fill="none"
        stroke="currentColor"
        strokeWidth={i === 0 ? 2 : 1.25}
        transform={i % 2 === 1 ? "rotate(22.5)" : undefined}
      />
    ))}
    <circle r={300} fill="none" stroke="currentColor" strokeWidth={1} />
  </svg>
);

/** Home hero: deep green, start-aligned statement, one quiet motif on the end side. */
const HeroGov = () => (
  <section id="about" className="relative scroll-mt-[100px] overflow-hidden bg-primary text-primary-foreground lg:scroll-mt-[116px]">
    <StarMotif />
    <div className="relative mx-auto flex max-w-[1200px] items-center px-4 py-14 md:px-6 lg:min-h-[440px] lg:py-20">
      <div className="max-w-[720px]">
        <h1 className="font-hrsd-title text-display-sm font-normal lg:text-display">{copy.hero_title}</h1>
        <p className="mt-4 max-w-[60ch] text-lead font-hrsd-regular text-primary-foreground/85">{copy.hero_subtitle}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button
            asChild
            className="h-12 rounded-md bg-primary-foreground px-6 text-body font-hrsd-bold text-primary hover:bg-primary-foreground/90 focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
          >
            <Link to="/login">{copy.hero_cta_primary}</Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 rounded-md border-primary-foreground/60 bg-transparent px-6 text-body font-hrsd-medium text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground focus-visible:ring-primary-foreground focus-visible:ring-offset-primary"
          >
            <Link to="/#tracks">{copy.hero_cta_secondary}</Link>
          </Button>
        </div>
      </div>
    </div>
  </section>
);

export default HeroGov;
