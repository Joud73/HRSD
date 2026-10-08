import { Link } from "react-router-dom";
import { BarChart3, ClipboardCheck, ListChecks } from "lucide-react";
import { copy } from "@/lib/copy";
import RouteFade from "@/components/layout/RouteFade";
import hrsdColoredLogo from "@/assets/logos/hrsd-colored.png";
import hrsdWhiteLogo from "@/assets/logos/hrsd-white.png";

const POINT_ICONS = [ClipboardCheck, ListChecks, BarChart3];

/**
 * Authentication frame shared by login, register, password reset, individual access,
 * pending approval and under review. Desktop: form column (55%) at the start side,
 * deep green panel (45%) at the end side. Mobile: the panel collapses to a slim strip.
 */
const AuthLayout = () => (
  <div dir="rtl" className="flex min-h-screen flex-col bg-background lg:flex-row">
    {/* Mobile strip */}
    <div className="flex h-14 shrink-0 items-center bg-primary px-5 md:px-8 lg:hidden">
      <Link to="/" className="rounded-md focus-visible:outline-primary-foreground">
        <img src={hrsdWhiteLogo} alt={copy.logo_alt} className="h-8 w-auto" />
      </Link>
    </div>

    {/* Form column */}
    <main id="main" className="flex flex-1 flex-col lg:w-[55%] lg:flex-none">
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col px-5 py-10 md:px-8 lg:justify-center lg:py-16">
        <Link to="/" className="mb-10 hidden self-start rounded-md lg:block">
          <img src={hrsdColoredLogo} alt={copy.logo_alt} className="h-12 w-auto" />
        </Link>
        <RouteFade />
      </div>
    </main>

    {/* Identity panel */}
    <aside className="hidden flex-col justify-between bg-primary px-12 py-16 text-primary-foreground lg:flex lg:w-[45%]">
      <div className="max-w-[440px] pt-8">
        <h2 className="text-h1 text-primary-foreground">{copy.panel_title}</h2>
        <ul className="mt-10 flex flex-col gap-6">
          {copy.panel_points.map((point, i) => {
            const Icon = POINT_ICONS[i] ?? ClipboardCheck;
            return (
              <li key={point} className="flex items-center gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-foreground/10">
                  <Icon aria-hidden className="h-5 w-5 text-primary-foreground" strokeWidth={1.75} />
                </span>
                <span className="text-body text-primary-foreground/85">{point}</span>
              </li>
            );
          })}
        </ul>
      </div>
      <img src={hrsdWhiteLogo} alt="" aria-hidden className="h-12 w-auto self-start opacity-90" />
    </aside>
  </div>
);

export default AuthLayout;
