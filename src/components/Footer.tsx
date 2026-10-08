import { Link } from "react-router-dom";
import { copy } from "@/lib/copy";
import Container from "@/components/layout/Container";
import hrsdWhiteLogo from "@/assets/logos/hrsd-white.png";
import vision2030White from "@/assets/logos/vision-2030-white.webp";

const COL1_LINKS = [
  { label: copy.nav_home, to: "/" },
  { label: copy.nav_about, to: "/#about" },
  { label: copy.nav_tracks, to: "/#tracks" },
  { label: copy.nav_contact, to: "/contact-us" },
];

const [ministry, ncnp, privacy, terms] = copy.footer_col2_items;

// External destinations are the official sites; privacy/terms have no page yet (rendered as text)
const COL2_LINKS: { label: string; href?: string }[] = [
  { label: ministry, href: "https://www.hrsd.gov.sa" },
  { label: ncnp, href: "https://ncnp.gov.sa" },
  { label: privacy },
  { label: terms },
];

const linkClass =
  "rounded-sm text-small font-hrsd-regular text-primary-foreground/75 underline-offset-4 transition-colors duration-micro ease-standard hover:text-primary-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-primary";
const headingClass = "mb-4 font-hrsd-bold text-body text-primary-foreground";

/** Site footer for public and individual pages, aligned to the Container line. */
const Footer = () => (
  <footer dir="rtl" className="bg-primary text-primary-foreground">
    <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1.3fr_1fr] lg:gap-12 lg:py-16">
      <div>
        <img src={hrsdWhiteLogo} alt={copy.logo_alt} className="h-14 w-auto" />
        <p className="mt-5 max-w-[40ch] text-small font-hrsd-regular text-primary-foreground/75">{copy.footer_about}</p>
      </div>

      <nav aria-label={copy.footer_col1}>
        <h2 className={headingClass}>{copy.footer_col1}</h2>
        <ul className="flex flex-col gap-3">
          {COL1_LINKS.map((link) => (
            <li key={link.label}>
              <Link to={link.to} className={linkClass}>
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>

      <nav aria-label={copy.footer_col2}>
        <h2 className={headingClass}>{copy.footer_col2}</h2>
        <ul className="flex flex-col gap-3">
          {COL2_LINKS.map((link) => (
            <li key={link.label}>
              {link.href ? (
                <a href={link.href} target="_blank" rel="noopener noreferrer" className={linkClass}>
                  {link.label}
                </a>
              ) : (
                <span className="text-small font-hrsd-regular text-primary-foreground/60">{link.label}</span>
              )}
            </li>
          ))}
        </ul>
      </nav>

      <section>
        <h2 className={headingClass}>{copy.footer_col3}</h2>
        {/* Contact details not provided yet: muted dashes */}
        <ul className="flex flex-col gap-3 text-small font-hrsd-regular text-primary-foreground/60">
          <li aria-label={copy.footer_email_missing}>—</li>
          <li aria-label={copy.footer_phone_missing}>—</li>
        </ul>
      </section>
    </Container>

    <div className="border-t border-primary-foreground/15">
      <Container className="flex flex-col gap-4 py-5 md:flex-row md:items-center md:justify-between">
        <p className="text-caption font-hrsd-regular text-primary-foreground/70">{copy.footer_legal}</p>
        <div className="flex items-center gap-4">
          <p className="text-caption font-hrsd-regular text-primary-foreground/70">{copy.footer_credit}</p>
          <img src={vision2030White} alt={copy.vision_alt} className="h-8 w-auto" />
        </div>
      </Container>
    </div>
  </footer>
);

export default Footer;
