// Staging only. Puts the demo back: removes the uploaded evidence files of org A and org B and their issued
// document PDFs (documents/{assessment}/*) from the private buckets (Storage API, service key read through the
// Supabase CLI and never printed), deletes both organizations' طموحي enrollments (lesson progress cascades), then runs
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
const headers = { apikey: service, Authorization: `Bearer ${service}`, "Content-Type": "application/json" };
const remove = async (bucket, prefixes) => {
  if (prefixes.length === 0) return;
  const res = await fetch(`${URL}/storage/v1/object/${bucket}`, { method: "DELETE", headers, body: JSON.stringify({ prefixes }) });
  if (!res.ok) throw new Error(`storage delete ${bucket} ${res.status}`);
};

const paths = JSON.parse(list.rows[0].paths);
await remove("evidences", paths);
console.log(`evidence files removed: ${paths.length}`);

// Document PDFs: everything under each assessment's folder in the documents bucket
const ids = json(
  run(
    `npx supabase db query --linked -o json "select coalesce(json_agg(a.id), '[]')::text as ids from public.assessments a join public.assessment_cycles c on c.id = a.cycle_id and c.status = 'open' where a.organization_id in ('${ORGS.join("','")}')"`
  )
);
const docs = [];
for (const id of JSON.parse(ids.rows[0].ids)) {
  const res = await fetch(`${URL}/storage/v1/object/list/documents`, {
    method: "POST",
    headers,
    body: JSON.stringify({ prefix: `${id}/`, limit: 100 }),
  });
  if (!res.ok) throw new Error(`storage list documents ${res.status}`);
  for (const entry of await res.json()) if (entry.id) docs.push(`${id}/${entry.name}`);
}
await remove("documents", docs);
console.log(`document files removed: ${docs.length}`);

// طموحي: every reset starts with no enrollments (lesson_progress goes with them)
const enrollments = json(
  run(
    `npx supabase db query --linked -o json "with d as (delete from public.program_enrollments where organization_id in ('${ORGS.join("','")}') returning 1) select count(*)::int as n from d"`
  )
);
console.log(`enrollments removed: ${enrollments.rows[0].n}`);

const result = json(run(`npx supabase db query --linked -o json -f supabase/seed/demo_reset.sql`));
console.table(result.rows);
