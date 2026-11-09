// Staging read checks through the real API as a test user (anon key + password from e2e/.env). Prints no secret.
// Usage: node e2e/api-check.mjs evaluator1@tamkeen.local
import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";

const REF = "qjwbdgstdqhflozblmeb";
const URL = `https://${REF}.supabase.co`;
const env = Object.fromEntries(
  readFileSync("e2e/.env", "utf8").split(/\r?\n/).filter((l) => l && !l.startsWith("#")).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)])
);
const email = process.argv[2];
const keys = execSync(`npx supabase projects api-keys --project-ref ${REF} -o json`, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] });
const anon = JSON.parse(keys.slice(keys.indexOf("["))).find((k) => k.name === "anon").api_key;

const login = await (await fetch(`${URL}/auth/v1/token?grant_type=password`, {
  method: "POST",
  headers: { apikey: anon, "Content-Type": "application/json" },
  body: JSON.stringify({ email, password: email.startsWith("supervisor") ? env.E2E_SUPERVISOR_PASSWORD : env.E2E_PASSWORD }),
})).json();
const h = { apikey: anon, Authorization: `Bearer ${login.access_token}` };
const get = async (path) => {
  const res = await fetch(`${URL}/rest/v1/${path}`, { headers: h });
  return res.ok ? res.json() : `HTTP ${res.status}`;
};

const reviews = await get(
  `assessment_reviews?select=assigned_at,assessments!inner(id,status,organization_id,organizations(name,registration_number),assessment_cycles(name,review_start))&evaluator_id=eq.${login.user.id}`
);
console.log("reviews", JSON.stringify(reviews));
for (const r of Array.isArray(reviews) ? reviews : []) {
  const org = r.assessments.organization_id;
  console.log("org", JSON.stringify(await get(`organizations?select=name,entity_type,sub_classifications(name),social_dev_centers(name)&id=eq.${org}`)));
  console.log("delegate", JSON.stringify(await get(`delegates?select=full_name,mobile&organization_id=eq.${org}`)));
  console.log("progress", JSON.stringify(await get(`v_assessment_progress?select=progress_pct,score_pct&assessment_id=eq.${r.assessments.id}`)));
  console.log("responses", (await get(`item_responses?select=item_id&assessment_id=eq.${r.assessments.id}`)).length);
}
console.log("all assessments visible", (await get("assessments?select=id")).length);
