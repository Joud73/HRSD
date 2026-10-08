import { Link } from "react-router-dom";
import { Building2, ChevronLeft, ListTree } from "lucide-react";
import { copy, adminSetupCopy as t } from "@/lib/copy";
import PageHeader from "@/components/shared/PageHeader";
import { crumbs, ENTITIES_PATH, RUBRIC_PATH } from "@/components/admin/setup/crumbs";

const tiles = [
  { title: t.tile_entities_title, desc: t.tile_entities_desc, icon: Building2, path: ENTITIES_PATH },
  { title: t.tile_rubric_title, desc: t.tile_rubric_desc, icon: ListTree, path: RUBRIC_PATH },
];

const AdminEvaluationSetup = () => (
  <>
    <PageHeader title={copy.nav_admin.setup} description={t.setup_desc} breadcrumbs={crumbs.setup} />

    <ul aria-label={t.setup_tiles_label} className="grid grid-cols-1 gap-4 md:grid-cols-2">
      {tiles.map((tile) => (
        <li key={tile.path}>
          <Link
            to={tile.path}
            className="group flex h-full items-center gap-4 rounded-lg border border-border bg-card p-6 transition-colors duration-micro ease-standard hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.99]"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
              <tile.icon aria-hidden className="h-6 w-6" strokeWidth={1.75} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="text-h3 font-hrsd-title text-ink transition-colors duration-micro group-hover:text-primary">{tile.title}</span>
              <span className="text-small text-muted-foreground">{tile.desc}</span>
            </span>
            <ChevronLeft
              aria-hidden
              className="h-5 w-5 shrink-0 text-muted-foreground transition-[color,transform] duration-micro ease-standard group-hover:-translate-x-1 group-hover:text-primary motion-reduce:transform-none"
            />
          </Link>
        </li>
      ))}
    </ul>
  </>
);

export default AdminEvaluationSetup;
