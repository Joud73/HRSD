// Staging only. Puts the demo back: removes the uploaded evidence files of org A and org B from the private
// bucket (Storage API, service key read through the Supabase CLI and never printed), then runs
// supabase/seed/demo_reset.sql (org A demo state, org B fresh draft) and prints the result.
// Usage: node e2e/reset-demo.mjs
import { execSync } from "node:child_process";

const REF = "qjwbdgstdqhflozblmeb";
const URL = `https://${REF}.supabase.co`;
const ORGS = ["aaaaaaaa-0000-0000-0000-000000000001", "aaaaaaaa-0000-0000-0000-000000000002"];

const run = (cmd) => execSync(cmd, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const json = (out) => JSON.parse(out.slice(out.indexOf("{")));

const keys = run(`npx supabase projects api-keys --project-ref ${REF} -o json`);
const service = JSON.parse(keys.slice(keys.indexOf("["))).find((k) => k.name === "service_role")?.api_key;
if (!service) throw new Error("service_role key not found");

const list = json(
  run(
    `npx supabase db query --linked -o json "select coalesce(json_agg(e.storage_path), '[]')::text as paths from public.evidences e join public.assessments a on a.id = e.assessment_id join public.assessment_cycles c on c.id = a.cycle_id and c.status = 'open' where e.kind = 'file' and a.organization_id in ('${ORGS.join("','")}')"`
  )
);
const paths = JSON.parse(list.rows[0].paths);
if (paths.length > 0) {
  const res = await fetch(`${URL}/storage/v1/object/evidences`, {
    method: "DELETE",
    headers: { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: paths }),
  });
  if (!res.ok) throw new Error(`storage delete ${res.status}`);
}
console.log(`files removed: ${paths.length}`);

const result = json(run(`npx supabase db query --linked -o json -f supabase/seed/demo_reset.sql`));
console.table(result.rows);
