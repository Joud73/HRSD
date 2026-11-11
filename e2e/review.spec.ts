/**
 * Phase 4 review path on staging, against the dev server on http://localhost:8080.
 * Accounts and passwords come from e2e/.env (gitignored); see e2e/.env.example.
 * Every test fails on a console error, an uncaught page error, a failed request or an HTTP error response.
 * Screenshots of each screen go to e2e/screens/review/.
 *
 * Starting state, set by beforeAll (staging only): `node e2e/reset-demo.mjs` (also removes earlier issued PDFs),
 * then supabase/seed/demo_phase4.sql through the Supabase CLI: org B under review with evaluator2, 3 items pending
 * a verdict, two rejected, no documents. Programs come from supabase/seed/tamohi_catalog.sql (run once).
 * The run issues org B's results; put the demo back afterwards with reset-demo.mjs then demo_phase4.sql.
 */
import { execSync } from "node:child_process";
import { expect, test, type Locator, type Page } from "@playwright/test";

const env = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is missing from e2e/.env`);
  return value;
};

const ORG_A_ID = "aaaaaaaa-0000-0000-0000-000000000001";
const ORG_B_NAME = "منظمة الاختبار ب";
const EDITED_TASK = "مهمة معدلة في الاختبار: تحديث سجل المخاطر واعتماده.";

/* ── Helpers ── */

function watch(page: Page) {
  const problems: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") problems.push(`console: ${msg.text()}`);
  });
  page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
  page.on("requestfailed", (req) => problems.push(`requestfailed: ${req.method()} ${req.url()} ${req.failure()?.errorText ?? ""}`));
  page.on("response", (res) => {
    if (res.status() >= 400) problems.push(`http ${res.status()}: ${res.request().method()} ${res.url()}`);
  });
  return problems;
}

let shot = 0;
async function screen(page: Page, name: string) {
  await page.waitForLoadState("networkidle");
  shot += 1;
  await page.screenshot({ path: `e2e/screens/review/${String(shot).padStart(2, "0")}-${name}.png`, fullPage: true });
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByRole("tab", { name: "البريد الإلكتروني" }).click();
  await page.getByRole("textbox", { name: "البريد الإلكتروني", exact: true }).fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "دخول", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Runs SQL on the linked staging project through the Supabase CLI and returns the rows. */
function sql<T = Record<string, string>>(args: string): T[] {
  const out = execSync(`npx supabase db query --linked -o json ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(out.slice(out.indexOf("{"))).rows as T[];
}

/** The value of a key fact; the first match is the page header (the review progress panel repeats some labels). */
const keyFact = (scope: Page | Locator, label: string) => scope.locator("dt", { hasText: label }).locator("xpath=following-sibling::dd[1]").first();

/* ── Review path ── */

test.describe.serial("phase 4 review path", () => {
  let assessmentId = "";
  let orgAAssessmentId = "";

  test.beforeAll(() => {
    test.setTimeout(180_000);
    execSync("node e2e/reset-demo.mjs", { stdio: "ignore" });
    const [seeded] = sql<{ status: string; pending: string; documents: string }>("-f supabase/seed/demo_phase4.sql");
    expect(seeded).toMatchObject({ status: "under_review", pending: 3, documents: 0 });
    orgAAssessmentId = sql<{ id: string }>(
      `"select a.id from public.assessments a join public.assessment_cycles c on c.id = a.cycle_id and c.status = 'open' where a.organization_id = '${ORG_A_ID}'"`
    )[0].id;
  });

  test("evaluator2: approve waits for 3 verdicts, recording them generates both documents", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_EVALUATOR2_EMAIL"), env("E2E_PASSWORD"));

    await page.goto("/evaluator/assignments");
    const row = page.getByRole("row").filter({ hasText: ORG_B_NAME });
    await expect(row).toContainText("قيد المراجعة");
    await row.click();
    await expect(page).toHaveURL(/\/evaluator\/assessments\/[0-9a-f-]+$/);
    assessmentId = page.url().split("/").pop() ?? "";

    await expect(page.getByRole("heading", { level: 1, name: ORG_B_NAME })).toBeVisible();
    await expect(keyFact(page, "بانتظار التحقق")).toHaveText("3");
    const approve = page.getByRole("button", { name: "اعتماد التقييم" });
    await expect(approve).toBeDisabled();
    await approve.locator("xpath=..").hover();
    await expect(page.getByRole("tooltip")).toContainText("3 بند بانتظار التحقق");
    await expect(page.getByText("تُنشأ المستندات تلقائياً عند اكتمال التحقق.")).toBeVisible();
    await screen(page, "evaluator2-pending");

    // Track 1 indicator 1: items 1 to 3 await a verdict. Confirm two, reject one.
    await page
      .getByRole("navigation", { name: "مؤشرات المسار" })
      .getByRole("button")
      .filter({ hasText: /^المؤشر 1[^0-9]/ })
      .click();
    for (const [n, verdict] of [["1", "تأكيد"], ["2", "تأكيد"], ["3", "رفض"]] as const) {
      const group = page.getByRole("radiogroup", { name: `حكم المدقق على البند ${n}` });
      await expect(group.getByRole("radio", { checked: true })).toHaveCount(0);
      await group.getByRole("radio", { name: verdict }).click();
      await expect(group.getByRole("radio", { name: verdict })).toHaveAttribute("aria-checked", "true");
    }

    await expect(keyFact(page, "بانتظار التحقق")).toHaveText("0");
    const documents = page.getByRole("region", { name: "مستندات النتائج" });
    await expect(documents.getByRole("heading", { name: "التقرير التعقيبي" })).toBeVisible();
    await expect(documents.getByRole("heading", { name: "خطة التحسين" })).toBeVisible();
    await expect(approve).toBeEnabled();
    await screen(page, "evaluator2-verdicts-recorded");

    expect(problems).toEqual([]);
  });

  test("evaluator2: edits a task line of the plan, then approves", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_EVALUATOR2_EMAIL"), env("E2E_PASSWORD"));

    await page.goto(`/evaluator/assessments/${assessmentId}`);
    const planCard = page.getByRole("listitem").filter({ has: page.getByRole("heading", { name: "خطة التحسين" }) });
    await planCard.getByRole("link", { name: "تحرير" }).click();
    await expect(page).toHaveURL(new RegExp(`/documents/improvement_plan$`));
    await expect(page.getByRole("heading", { level: 1, name: "تحرير خطة التحسين" })).toBeVisible();

    const line = page.getByRole("textbox", { name: "نص السطر" }).first();
    await line.fill(EDITED_TASK);
    await line.blur();
    await expect(page.getByText("حُفظ السطر").first()).toBeVisible();
    const row = line.locator("xpath=ancestor::li[1]");
    await expect(row.getByText("معدل", { exact: true })).toBeVisible();
    await expect(page.getByRole("complementary", { name: "معاينة" })).toContainText(EDITED_TASK);
    await screen(page, "evaluator2-plan-edited");

    await page.reload();
    await expect(page.getByRole("textbox", { name: "نص السطر" }).first()).toHaveValue(EDITED_TASK);

    await page.goto(`/evaluator/assessments/${assessmentId}`);
    await page.getByRole("button", { name: "اعتماد التقييم" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "يُجمّد الاحتساب" });
    await expect(keyFact(dialog, "مؤكد")).toHaveText("186");
    await expect(keyFact(dialog, "مرفوض")).toHaveText("3");
    await expect(keyFact(dialog, "النتيجة الذاتية")).toHaveText(/^\d+%$/);
    await expect(keyFact(dialog, "نتيجة المراجعة")).toHaveText(/^\d+%$/);
    await screen(page, "evaluator2-approve-dialog");
    await dialog.getByRole("button", { name: "اعتماد", exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(page.getByText("بانتظار الاعتماد النهائي من المشرف الفني.").first()).toBeVisible();
    await screen(page, "evaluator2-approved");

    expect(problems).toEqual([]);
  });

  test("supervisor: org B approved, issues the results with both PDFs", async ({ page }) => {
    test.setTimeout(240_000);
    const problems = watch(page);
    await login(page, env("E2E_SUPERVISOR_EMAIL"), env("E2E_SUPERVISOR_PASSWORD"));

    await page.goto("/supervisor/organizations");
    const row = page.getByRole("row").filter({ hasText: ORG_B_NAME });
    await expect(row).toContainText("معتمد");
    await row.getByRole("link", { name: `النتائج: ${ORG_B_NAME}` }).click();
    await expect(page).toHaveURL(new RegExp(`/supervisor/assessments/${assessmentId}/results$`));
    await expect(page.getByRole("tab", { name: "التقرير التعقيبي" })).toBeVisible();
    await page.getByRole("tab", { name: "خطة التحسين" }).click();
    await expect(page.getByRole("tabpanel", { name: "خطة التحسين" })).toContainText(EDITED_TASK);
    await screen(page, "supervisor-results-approved");

    await page.getByRole("button", { name: "إصدار النتائج" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "لا يمكن التراجع" });
    await expect(dialog).toContainText(/ت\.م\.TEST-0002\|\d{2}\.\d{2}\.\d{2}/);
    await dialog.getByRole("button", { name: "إصدار", exact: true }).click();
    await expect(dialog).toBeHidden({ timeout: 180_000 });
    await expect(page.getByText(/صدرت النتائج في .+، رقم التقرير/)).toBeVisible();
    await expect(page.getByRole("button", { name: "تحميل PDF" }).first()).toBeVisible();
    await screen(page, "supervisor-issued");

    const [doc] = sql<{ issued: string; with_pdf: string; canonical: string }>(
      `"select count(*) filter (where status = 'issued') as issued, count(pdf_sha256) as with_pdf, count(*) filter (where pdf_path = assessment_id::text || '/' || kind || '.pdf') as canonical from public.assessment_documents where assessment_id = '${assessmentId}'"`
    );
    expect(doc).toMatchObject({ issued: 2, with_pdf: 2, canonical: 2 });

    expect(problems).toEqual([]);
  });

  test("org B: dashboard, results page with both PDFs and programs, no other organization's results", async ({ page, context }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_B_EMAIL"), env("E2E_PASSWORD"));

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("list", { name: "مراحل رحلة التقييم" })).toBeVisible();
    await expect(page.locator("main")).toContainText("صدرت النتائج");
    const next = page.getByRole("region", { name: "الخطوة التالية" });
    await expect(next).toContainText("صدرت نتائج التقييم وخطة التحسين.");
    await screen(page, "org-b-dashboard-issued");

    await next.getByRole("link", { name: "عرض النتائج" }).click();
    await expect(page).toHaveURL(/\/results$/);
    await expect(keyFact(page, "رقم التقرير")).toContainText("TEST-0002");
    const downloads = page.getByRole("button", { name: "تحميل PDF" });
    await expect(downloads).toHaveCount(2);
    const programs = page.getByRole("region", { name: "البرامج المقترحة" });
    // طموحي: the top 3 by rank, the first is rank 1, each linking inside the platform
    const [top] = sql<{ code: string; title: string; gap: number }>(
      `"select code, title, gap_lessons as gap from public.v_program_recommendations where assessment_id = '${assessmentId}' and rank = 1"`
    );
    await expect(programs.getByRole("listitem")).toHaveCount(3);
    await expect(programs.getByRole("listitem").first()).toContainText(top.title);
    await expect(programs.getByRole("listitem").first()).toContainText(`يعالج ${top.gap} بنداً لم يتحقق`);
    await expect(programs.getByRole("listitem").first().getByRole("link", { name: "عرض البرنامج" })).toHaveAttribute("href", `/tamohi/programs/${top.code}`);
    await expect(programs.getByRole("link", { name: "افتح خطتي التطويرية" })).toHaveAttribute("href", "/tamohi/my-path");
    await screen(page, "org-b-results");

    // Both PDFs open through a signed URL
    for (const i of [0, 1]) {
      const pdf = context.waitForEvent("response", (res) => res.url().includes("/storage/v1/object/sign/documents/") && res.url().includes("token="));
      await downloads.nth(i).click();
      const res = await pdf;
      expect(res.status()).toBe(200);
      expect(res.headers()["content-type"]).toContain("application/pdf");
    }

    // Another organization's results: the supervisor route is closed to the organization role
    await page.goto(`/supervisor/assessments/${orgAAssessmentId}/results`);
    await expect(page).not.toHaveURL(/\/supervisor\//);
    await expect(page.getByText("منظمة الاختبار أ")).toHaveCount(0);
    await screen(page, "org-b-other-results-closed");

    expect(problems).toEqual([]);
  });

  test("evaluator1: cannot open org B's documents", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_EVALUATOR1_EMAIL"), env("E2E_PASSWORD"));

    await page.goto(`/evaluator/assessments/${assessmentId}/documents/improvement_plan`);
    await expect(page.getByText("التقييم غير موجود أو غير مسند إليك.")).toBeVisible();
    await expect(page.getByText(EDITED_TASK)).toHaveCount(0);
    await screen(page, "evaluator1-org-b-documents-404");

    expect(problems).toEqual([]);
  });
});
