import AppHeader from "@/components/AppHeader";
import Footer from "@/components/Footer";
import GovStrip from "@/components/gov/GovStrip";
import RouteFade from "@/components/layout/RouteFade";
import { copy } from "@/lib/copy";

/** Public, individual and marketing pages: gov strip, sticky header, content, footer. */
const PublicLayout = () => (
  <div dir="rtl" className="flex min-h-screen flex-col bg-background">
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-float"
    >
      {copy.skip_to_content}
    </a>
    <GovStrip />
    <AppHeader />
    <main id="main" className="flex-1">
      <RouteFade />
    </main>
    <Footer />
  </div>
);

export default PublicLayout;
