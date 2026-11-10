/**
 * Phase 3 demo path on staging (updated for phase 4: an item counts when it has evidence, no checkbox), against the dev server on http://localhost:8080.
 * Accounts and passwords come from e2e/.env (gitignored); see e2e/.env.example.
 * Every test fails on a console error, an uncaught page error, a failed request or an HTTP error response.
 * Screenshots of each screen go to e2e/screens/.
 *
 * Starting state: `node e2e/reset-demo.mjs` (org A draft at 48 %, track 1 indicator 1 empty; org B empty draft).
 * The run submits org B and adds answers to org A; run the reset again afterwards.
 */
import { expect, test, type Page } from "@playwright/test";

const env = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is missing from e2e/.env`);
  return value;
};

const ORG_B_ID = "aaaaaaaa-0000-0000-0000-000000000002";
const ORG_A_NAME = "منظمة الاختبار أ";
const ORG_B_NAME = "منظمة الاختبار ب";
const CYCLE_NAME = "الدورة التجريبية 2026";
const PDF = "e2e/fixtures/evidence.pdf";

/* ── Helpers ── */

/** Collects console errors, page errors, failed requests and HTTP errors for the whole test. */
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
  // Let in-flight requests finish, so leaving the page does not abort them
  await page.waitForLoadState("networkidle");
  shot += 1;
  await page.screenshot({ path: `e2e/screens/${String(shot).padStart(2, "0")}-${name}.png`, fullPage: true });
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByRole("tab", { name: "البريد الإلكتروني" }).click();
  await page.getByRole("textbox", { name: "البريد الإلكتروني", exact: true }).fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "دخول", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

/** Opens indicator `n` of the current track from the desktop indicator list. */
async function openIndicator(page: Page, n: number) {
  await page
    .getByRole("navigation", { name: "مؤشرات المسار" })
    .getByRole("button")
    .filter({ hasText: new RegExp(`^المؤشر ${n}[^0-9]`) })
    .click();
  await expect(page.locator("article header")).toContainText(`المؤشر ${n}`);
}

const itemRows = (page: Page) => page.locator("article > ul > li");
const resultLabel = (page: Page) => page.locator("article footer p").first();

/** Item row `index` without evidence: attaches one through the "إضافة شاهد" menu (a link, or the PDF fixture). */
async function addEvidence(page: Page, index: number, evidence: { url: string } | { file: string }) {
  const row = itemRows(page).nth(index);
  await expect(row.getByText("بدون شاهد", { exact: true })).toBeVisible();
  await row.getByRole("button", { name: "إضافة شاهد" }).click();
  if ("file" in evidence) {
    const chooser = page.waitForEvent("filechooser");
    await page.getByRole("menuitem", { name: "ملف" }).click();
    await (await chooser).setFiles(evidence.file);
  } else {
    await page.getByRole("menuitem", { name: "رابط" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "إضافة رابط شاهد" });
    // The URL field is the dialog's first textbox (the label carries a required asterisk)
    await dialog.getByRole("textbox").first().fill(evidence.url);
    await dialog.getByRole("button", { name: "إضافة الرابط" }).click();
    await expect(dialog).toBeHidden();
  }
  await expect(row.getByRole("list", { name: "شواهد البند" }).getByRole("listitem")).toHaveCount(1);
  await expect(row.getByText("محقق", { exact: true })).toBeVisible();
}

const counted = (page: Page, index: number) => itemRows(page).nth(index).getByText("محقق", { exact: true });

/** The dashboard never shows an average level or a slash fraction. */
async function expectCleanFigures(page: Page) {
  const text = await page.locator("main").innerText();
  expect(text).not.toContain("متوسط المستوى");
  expect(text).not.toMatch(/\d\s*\/\s*\d/);
}

/* ── Demo path ── */

test.describe.serial("phase 3 demo path", () => {
  test("org A: dashboard, track 1 indicator 1, PDF and link evidence, refresh keeps state", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_A_EMAIL"), env("E2E_PASSWORD"));

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("heading", { level: 1, name: ORG_A_NAME })).toBeVisible();
    await expect(page.getByRole("list", { name: "مراحل رحلة التقييم" })).toBeVisible();
    await expect(page.getByText(/الموعد النهائي \d+/)).toBeVisible();
    await expect(page.getByRole("region", { name: "ملخص التقييم" })).toContainText("48%");
    await expect(page.getByRole("region", { name: "الخطوة التالية" })).toContainText("أكملت 182 من 378");
    await expectCleanFigures(page);
    await screen(page, "org-a-dashboard");

    await page.goto("/assessment/1");
    await openIndicator(page, 1);
    await expect(resultLabel(page)).toContainText("غير مكتمل");
    await screen(page, "org-a-indicator-1-empty");

    await addEvidence(page, 0, { file: PDF });
    await addEvidence(page, 1, { url: "https://example.org/e2e/org-a-2" });
    await expect(resultLabel(page)).toContainText("بحاجة لتحسين كبير");
    await expect(page.locator("article header")).toContainText("2 من 7");
    await screen(page, "org-a-indicator-1-ticked");

    await page.reload();
    await openIndicator(page, 1);
    await expect(counted(page, 0)).toBeVisible();
    await expect(itemRows(page).nth(0).getByRole("listitem")).toContainText("evidence.pdf");
    await expect(counted(page, 1)).toBeVisible();
    await expect(itemRows(page).nth(2).getByText("بدون شاهد", { exact: true })).toBeVisible();
    await expect(resultLabel(page)).toContainText("بحاجة لتحسين كبير");
    await screen(page, "org-a-indicator-1-after-refresh");

    expect(problems).toEqual([]);
  });

  test("admin: assign evaluator2 to org B, four roles, cycle scope tab", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ADMIN_EMAIL"), env("E2E_PASSWORD"));
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto(`/admin/associations/${ORG_B_ID}`);
    await expect(page.getByRole("heading", { name: "مسار التقييم في الدورة الحالية" })).toBeVisible();
    const assign = page.getByRole("combobox", { name: "المدقق المسند" });
    for (const evaluator of ["evaluator1@tamkeen.local", "evaluator2@tamkeen.local"]) {
      await assign.click();
      await page.getByRole("option", { name: evaluator }).click();
      await expect(assign).toContainText(evaluator);
      await expect(page.getByText("تم إسناد المدقق").first()).toBeVisible();
    }
    await screen(page, "admin-org-b-assigned");

    await page.goto("/admin/roles");
    for (const role of ["مدير النظام", "المشرف الفني", "مدقق", "منظمة"]) {
      await expect(page.getByRole("button", { name: role, exact: true }).first()).toBeVisible();
    }
    await screen(page, "admin-roles");

    await page.goto("/admin/performance/evaluation-years");
    await page.getByText(CYCLE_NAME, { exact: true }).first().click();
    await page.getByRole("tab", { name: "نطاق التقييم في الدورة" }).click();
    await expect(page.getByText(/البنود الفعّالة في الدورة: \d+ من 378/)).toBeVisible();
    await expect(page.getByRole("checkbox").first()).toBeEnabled();
    await screen(page, "admin-cycle-scope");

    expect(problems).toEqual([]);
  });

  test("supervisor: both organizations, proxy entry writes on org B's draft", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_SUPERVISOR_EMAIL"), env("E2E_SUPERVISOR_PASSWORD"));

    await expect(page).toHaveURL(/\/supervisor$/);
    await expect(page.getByRole("heading", { name: "لوحة المتابعة" })).toBeVisible();
    await screen(page, "supervisor-dashboard");

    await page.goto("/supervisor/organizations");
    const table = page.getByRole("table");
    await expect(table.getByText(ORG_A_NAME, { exact: true })).toBeVisible();
    await expect(table.getByText(ORG_B_NAME, { exact: true })).toBeVisible();
    await screen(page, "supervisor-organizations");

    await page.getByRole("link", { name: `إدخال التقييم نيابة عن المنظمة: ${ORG_B_NAME}` }).click();
    await expect(page).toHaveURL(new RegExp(`/supervisor/organizations/${ORG_B_ID}/assessment/1$`));
    await expect(page.getByText(`أنت تُدخل التقييم نيابة عن: ${ORG_B_NAME}`)).toBeVisible();
    await openIndicator(page, 1);
    await addEvidence(page, 0, { url: "https://example.org/e2e/proxy-org-b" });
    await screen(page, "supervisor-proxy-org-b-written");

    expect(problems).toEqual([]);
  });

  test("org B: sees the proxy entry, submits, under review, read only", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_B_EMAIL"), env("E2E_PASSWORD"));
    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("region", { name: "ملخص التقييم" })).toContainText(/(^|\D)1 من 378/);
    await expectCleanFigures(page);
    await screen(page, "org-b-dashboard-after-proxy");

    await page.goto("/assessment/1");
    await openIndicator(page, 1);
    await expect(counted(page, 0)).toBeVisible();

    await page.getByRole("button", { name: "إرسال التقييم للمراجعة" }).click();
    const dialog = page.getByRole("dialog").filter({ hasText: "تأكيد الإرسال" });
    await expect(dialog).toBeVisible();
    await screen(page, "org-b-submit-dialog");
    await dialog.getByRole("button", { name: "تأكيد الإرسال" }).click();

    await page.waitForURL(/\/under-review$/);
    await expect(page.getByRole("heading", { name: "التقييم قيد التدقيق" })).toBeVisible();
    await screen(page, "org-b-under-review");

    await page.goto("/assessment/1");
    await expect(page.getByText("أُرسل التقييم للمراجعة. الإجابات للعرض فقط.")).toBeVisible();
    await expect(counted(page, 0)).toBeVisible();
    await expect(page.getByRole("button", { name: "إضافة شاهد" })).toHaveCount(0);
    await screen(page, "org-b-read-only");

    expect(problems).toEqual([]);
  });

  test("evaluator2: org B submitted, organization card, review period open", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_EVALUATOR2_EMAIL"), env("E2E_PASSWORD"));
    await expect(page).toHaveURL(/\/evaluator$/);
    await expect(page.getByRole("heading", { name: "لوحة تحكم المدقق" })).toBeVisible();
    await screen(page, "evaluator2-dashboard");

    await page.goto("/evaluator/assignments");
    const row = page.getByRole("row").filter({ hasText: ORG_B_NAME });
    await expect(row).toContainText("مرسل للمراجعة");
    await screen(page, "evaluator2-assignments");
    await row.click();

    await expect(page).toHaveURL(/\/evaluator\/assessments\/[0-9a-f-]+$/);
    await expect(page.getByRole("heading", { level: 1, name: ORG_B_NAME })).toBeVisible();
    const card = page.getByRole("heading", { name: "بيانات المنظمة" }).locator("xpath=ancestor::section[1]");
    await expect(card).toContainText("TEST-0002");
    await expect(card).toContainText("خالد الشمري");
    // review_start (1 Nov) has passed: the evaluator can start the review (review.spec.ts takes over from here)
    await expect(page.getByRole("button", { name: "بدء المراجعة" })).toBeEnabled();
    await expect(page.getByText(/تبدأ فترة المراجعة في/)).toHaveCount(0);
    await expect(page.getByRole("button", { name: "إضافة شاهد" })).toHaveCount(0);
    await screen(page, "evaluator2-review-org-b");

    expect(problems).toEqual([]);
  });
});
