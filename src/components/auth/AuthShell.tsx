import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import Container from "@/components/layout/Container";

// Optional photo for the band: picked up automatically if src/assets/images/login-hero.jpg is added
const bandImages = import.meta.glob<string>("/src/assets/images/login-hero.jpg", { eager: true, import: "default" });
const bandImage = Object.values(bandImages)[0];

const WIDTH = {
  sm: "max-w-[440px]",
  lg: "max-w-[720px]",
} as const;

interface AuthShellProps {
  /** Current page name for the breadcrumb */
  crumb: string;
  width?: keyof typeof WIDTH;
  /** Centered content under the card (prompts, help links) */
  below?: ReactNode;
  children: ReactNode;
}

/**
 * Authentication page frame inside PublicLayout: section grey page, a 280px deep green band
 * with the breadcrumb, and one white card overlapping the band by 160px.
 */
const AuthShell = ({ crumb, width = "sm", below, children }: AuthShellProps) => (
  <div className="relative bg-section-alt pb-12">
    <div aria-hidden className="absolute inset-x-0 top-0 h-[280px] overflow-hidden bg-primary">
      {bandImage && (
        <>
          <img src={bandImage} alt="" className="h-full w-full object-cover" />
          <span className="absolute inset-0 bg-primary/85" />
        </>
      )}
    </div>

    <Container className="relative">
      <nav aria-label={copy.breadcrumb_label} className="flex h-[120px] items-start pt-6">
        <ol className="flex items-center gap-2 text-small text-primary-foreground/80">
          <li>
            <Link
              to="/"
              className="rounded-sm transition-colors duration-micro hover:text-primary-foreground focus-visible:outline-primary-foreground"
            >
              {copy.nav_home}
            </Link>
          </li>
          <li aria-hidden>/</li>
          <li aria-current="page" className="text-primary-foreground">
            {crumb}
          </li>
        </ol>
      </nav>

      <div className={cn("mx-auto w-full", WIDTH[width])}>
        <div className="rounded-[16px] bg-card p-6 shadow-float md:p-10">{children}</div>
        {below && <div className="mt-6 flex flex-col items-center gap-3 text-center">{below}</div>}
      </div>
    </Container>
  </div>
);

export default AuthShell;
