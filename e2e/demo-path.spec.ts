/**
 * Phase 3 demo path on staging (Step 7), against the dev server on http://localhost:8080.
 * Accounts and passwords come from e2e/.env (gitignored); see e2e/.env.example.
 * Every test fails on a console error, an uncaught page error, a failed request or an HTTP error response.
 * Screenshots of each screen go to e2e/screens/.
 *
 * Starting state: supabase/seed/demo_reset.sql applied (org A draft at 48 %, track 1 indicator 1 empty)
 * and org B with a fresh draft. Org B is submitted by this run; reset both afterwards.
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

/** Ticks item row `index` and attaches a link evidence to it. */
async function tickWithLink(page: Page, index: number, url: string) {
  const row = itemRows(page).nth(index);
  await row.getByRole("checkbox").click();
  await expect(row.getByRole("checkbox")).toBeChecked();
  await row.getByRole("button", { name: "إضافة رابط" }).click();
  const dialog = page.getByRole("dialog").filter({ hasText: "إضافة رابط شاهد" });
  // The URL field is the dialog's first textbox (the label carries a required asterisk)
  await dialog.getByRole("textbox").first().fill(url);
  await dialog.getByRole("button", { name: "إضافة الرابط" }).click();
  await expect(dialog).toBeHidden();
  await expect(row.getByRole("list", { name: "شواهد البند" }).getByRole("listitem")).toHaveCount(1);
}

/* ── Demo path ── */

test.describe.serial("phase 3 demo path", () => {
  test("org A: dashboard, track 1 indicator 1, tick and evidence, refresh keeps state", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_A_EMAIL"), env("E2E_PASSWORD"));

    await expect(page).toHaveURL(/\/dashboard$/);
    await expect(page.getByRole("region", { name: "مراحل رحلة التقييم" })).toBeVisible();
    await expect(page.getByText("الموعد النهائي")).toBeVisible();
    await expect(page.getByText("نسبة الإنجاز").locator("xpath=ancestor::*[contains(., '%')][1]")).toContainText(/48\s*%/);
    await screen(page, "org-a-dashboard");

    await page.goto("/assessment/1");
    await openIndicator(page, 1);
    await expect(resultLabel(page)).toContainText("غير مكتمل");
    await screen(page, "org-a-indicator-1-empty");

    await tickWithLink(page, 0, "https://example.org/e2e/org-a-1");
    await tickWithLink(page, 1, "https://example.org/e2e/org-a-2");
    await expect(resultLabel(page)).not.toContainText("غير مكتمل");
    await expect(resultLabel(page)).toContainText("بحاجة لتحسين كبير");
    await expect(page.locator("article header")).toContainText("2 من 7");
    await screen(page, "org-a-indicator-1-ticked");

    await page.reload();
    await openIndicator(page, 1);
    await expect(itemRows(page).nth(0).getByRole("checkbox")).toBeChecked();
    await expect(itemRows(page).nth(1).getByRole("checkbox")).toBeChecked();
    await expect(itemRows(page).nth(2).getByRole("checkbox")).not.toBeChecked();
    await expect(resultLabel(page)).toContainText("بحاجة لتحسين كبير");
    await screen(page, "org-a-indicator-1-after-refresh");

    expect(problems).toEqual([]);
  });

  test("org B: tick one item with a link, submit, under review, read only", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_B_EMAIL"), env("E2E_PASSWORD"));
    await expect(page).toHaveURL(/\/dashboard$/);
    await screen(page, "org-b-dashboard");

    await page.goto("/assessment/1");
    await openIndicator(page, 1);
    await tickWithLink(page, 0, "https://example.org/e2e/org-b-1");
    await screen(page, "org-b-indicator-1-ticked");

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
    await expect(itemRows(page).first().getByRole("checkbox")).toBeDisabled();
    await expect(page.getByRole("button", { name: "إضافة رابط" })).toHaveCount(0);
    await screen(page, "org-b-read-only");

    expect(problems).toEqual([]);
  });

  test("supervisor: dashboard, both organizations, org B proxy is read only with the banner", async ({ page }) => {
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
    await expect(page.getByText("أُرسل التقييم للمراجعة. الإجابات للعرض فقط.")).toBeVisible();
    await expect(itemRows(page).first().getByRole("checkbox")).toBeDisabled();
    await screen(page, "supervisor-proxy-org-b");

    expect(problems).toEqual([]);
  });

  test("admin: org B journey panel, four roles, cycle scope tab", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ADMIN_EMAIL"), env("E2E_PASSWORD"));
    await expect(page).toHaveURL(/\/admin$/);

    await page.goto(`/admin/associations/${ORG_B_ID}`);
    await expect(page.getByRole("heading", { name: "مسار التقييم في الدورة الحالية" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "بيانات المنظمة" })).toBeVisible();
    await screen(page, "admin-org-b");

    await page.goto("/admin/roles");
    for (const role of ["مدير النظام", "المشرف الفني", "مدقق", "منظمة"]) {
      await expect(page.getByRole("button", { name: role, exact: true }).or(page.getByRole("tab", { name: role, exact: true })).first()).toBeVisible();
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
});
