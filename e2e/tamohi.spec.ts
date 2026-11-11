/**
 * طموحي on staging, against the dev server on http://localhost:8080.
 * Accounts and passwords come from e2e/.env (gitignored); see e2e/.env.example.
 * Every test fails on a console error, an uncaught page error, a failed request or an HTTP error response.
 * Screenshots go to e2e/screens/tamohi/ (gitignored).
 *
 * Starting state, set by beforeAll (staging only): org B's results issued and no طموحي enrollments.
 * After review.spec.ts org B is already issued, so only org B's enrollments are cleared; otherwise beforeAll runs
 * `node e2e/reset-demo.mjs`, `demo_phase4.sql`, then the issuance path of review.spec.ts (evaluator2 records the
 * 3 pending verdicts and approves, the supervisor issues). Org A stays a draft (no issued results).
 * Put the demo back afterwards with reset-demo.mjs then demo_phase4.sql.
 *
 * Org B has no evidence in track 4, so every lesson of its rank-1 program (TMH-11) is a gap: the run marks two of
 * them, then one non-gap lesson in TMH-01 to show that only gap lessons move "البنود المعالجة".
 */
import { execSync } from "node:child_process";
import { expect, test, type Browser, type Page } from "@playwright/test";

const env = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is missing from e2e/.env`);
  return value;
};

const ORG_B_ID = "aaaaaaaa-0000-0000-0000-000000000002";
const ORG_B_NAME = "منظمة الاختبار ب";

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
  await page.screenshot({ path: `e2e/screens/tamohi/run-${String(shot).padStart(2, "0")}-${name}.png`, fullPage: true });
}

async function login(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByRole("tab", { name: "البريد الإلكتروني" }).click();
  await page.getByRole("textbox", { name: "البريد الإلكتروني", exact: true }).fill(email);
  await page.getByLabel("كلمة المرور", { exact: true }).fill(password);
  await page.getByRole("button", { name: "دخول", exact: true }).click();
  await page.waitForURL((url) => !url.pathname.startsWith("/login"));
}

function sql<T = Record<string, unknown>>(args: string): T[] {
  const out = execSync(`npx supabase db query --linked -o json ${args}`, { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  return JSON.parse(out.slice(out.indexOf("{"))).rows as T[];
}

const orgBAssessment = () =>
  sql<{ id: string; status: string }>(
    `"select a.id, a.status from public.assessments a join public.assessment_cycles c on c.id = a.cycle_id and c.status = 'open' where a.organization_id = '${ORG_B_ID}'"`
  )[0];

/** The issuance path of review.spec.ts, from demo_phase4 (3 pending verdicts) to issued. */
async function issueOrgB(browser: Browser) {
  const evaluator = await browser.newPage();
  await login(evaluator, env("E2E_EVALUATOR2_EMAIL"), env("E2E_PASSWORD"));
  await evaluator.goto("/evaluator/assignments");
  await evaluator.getByRole("row").filter({ hasText: ORG_B_NAME }).click();
  await evaluator.getByRole("navigation", { name: "مؤشرات المسار" }).getByRole("button").filter({ hasText: /^المؤشر 1[^0-9]/ }).click();
  for (const n of ["1", "2", "3"]) {
    const group = evaluator.getByRole("radiogroup", { name: `حكم المدقق على البند ${n}` });
    await group.getByRole("radio", { name: "تأكيد" }).click();
    await expect(group.getByRole("radio", { name: "تأكيد" })).toHaveAttribute("aria-checked", "true");
  }
  await expect(evaluator.getByRole("button", { name: "اعتماد التقييم" })).toBeEnabled();
  await evaluator.getByRole("button", { name: "اعتماد التقييم" }).click();
  const approve = evaluator.getByRole("dialog").filter({ hasText: "يُجمّد الاحتساب" });
  await approve.getByRole("button", { name: "اعتماد", exact: true }).click();
  await expect(approve).toBeHidden();
  await evaluator.close();

  const supervisor = await browser.newPage();
  await login(supervisor, env("E2E_SUPERVISOR_EMAIL"), env("E2E_SUPERVISOR_PASSWORD"));
  await supervisor.goto(`/supervisor/assessments/${orgBAssessment().id}/results`);
  await supervisor.getByRole("button", { name: "إصدار النتائج" }).click();
  const issue = supervisor.getByRole("dialog").filter({ hasText: "لا يمكن التراجع" });
  await issue.getByRole("button", { name: "إصدار", exact: true }).click();
  await expect(issue).toBeHidden({ timeout: 180_000 });
  await supervisor.close();
}

/** Marks the lesson done from its expanded panel and waits until the database has it (the check is optimistic). */
async function markLesson(page: Page, lessonRow: ReturnType<Page["locator"]>) {
  await lessonRow.getByRole("button").first().click();
  const check = lessonRow.getByLabel("أنجزت هذا الناتج");
  const saved = page.waitForResponse((res) => res.url().includes("/rest/v1/lesson_progress") && res.request().method() === "POST");
  await check.click();
  await expect(check).toBeChecked();
  expect((await saved).status()).toBe(201);
}

/* ── طموحي ── */

test.describe.serial("tamohi", () => {
  let topCode = "";
  let topLessons = 0;
  let gapTotal = 0;

  test.beforeAll(async ({ browser }) => {
    test.setTimeout(420_000);
    if (orgBAssessment()?.status === "issued") {
      sql(`"with d as (delete from public.program_enrollments where organization_id = '${ORG_B_ID}' returning 1) select count(*) as removed from d"`);
    } else {
      execSync("node e2e/reset-demo.mjs", { stdio: "ignore" });
      sql("-f supabase/seed/demo_phase4.sql");
      await issueOrgB(browser);
    }
    const id = orgBAssessment().id;
    const [top] = sql<{ code: string; lessons: number; gap_total: number }>(
      `"select code, lessons_total as lessons, (select sum(gap_lessons) from public.v_program_recommendations where assessment_id = '${id}')::int as gap_total from public.v_program_recommendations where assessment_id = '${id}' and rank = 1"`
    );
    topCode = top.code;
    topLessons = top.lessons;
    gapTotal = top.gap_total;
  });

  test("org B: results → first program → enroll → two gap lessons → my path; reload keeps it", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_B_EMAIL"), env("E2E_PASSWORD"));

    await page.goto("/results");
    const panel = page.getByRole("region", { name: "البرامج المقترحة" });
    await panel.getByRole("listitem").first().getByRole("link", { name: "عرض البرنامج" }).click();
    await expect(page).toHaveURL(new RegExp(`/tamohi/programs/${topCode}$`));
    await expect(page.getByRole("heading", { name: "لماذا يُقترح لمنظمتكم" })).toBeVisible();
    await expect(page.getByText(`${topLessons} من ${topLessons} بنداً لم يتحقق في تقييمكم`)).toBeVisible();

    await page.getByRole("button", { name: "سجّل منظمتك في البرنامج" }).click();
    await expect(page.getByRole("button", { name: "متابعة البرنامج" })).toBeVisible();
    await page.getByRole("button", { name: "متابعة البرنامج" }).click();
    const lessons = page.locator('li[id^="lesson-"]');
    await expect(lessons.first()).toBeVisible();
    await expect(lessons.first()).toContainText("لم يتحقق في تقييمكم");
    await markLesson(page, lessons.nth(0));
    await markLesson(page, lessons.nth(1));
    await expect(page.getByRole("img", { name: `2 من ${topLessons}` })).toBeVisible();
    await screen(page, "org-b-program-two-done");

    await page.goto("/tamohi/my-path");
    const summary = page.getByRole("definition").filter({ hasText: " من " }).first();
    await expect(summary).toHaveText(`2 من ${gapTotal}`);
    const node = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: /./ }) }).first();
    await expect(node).toContainText("قيد التنفيذ");
    await screen(page, "org-b-my-path");

    await page.reload();
    await expect(page.getByRole("definition").filter({ hasText: " من " }).first()).toHaveText(`2 من ${gapTotal}`);
    await expect(page.getByRole("listitem").filter({ hasText: "قيد التنفيذ" }).first()).toBeVisible();

    expect(problems).toEqual([]);
  });

  test("org B: a lesson that is not a gap does not move البنود المعالجة", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_B_EMAIL"), env("E2E_PASSWORD"));

    await page.goto("/tamohi/programs/TMH-01");
    await page.getByRole("button", { name: "سجّل منظمتك في البرنامج" }).click();
    await expect(page.getByRole("button", { name: "متابعة البرنامج" })).toBeVisible();
    await page.getByRole("button", { name: /الوحدة 1/ }).first().click();
    const notGap = page.locator('li[id^="lesson-"]').filter({ hasNotText: "لم يتحقق في تقييمكم" }).first();
    await markLesson(page, notGap);
    await expect(page.getByRole("img", { name: /^1 من \d+$/ })).toBeVisible();

    await page.goto("/tamohi/my-path");
    await expect(page.getByRole("definition").filter({ hasText: " من " }).first()).toHaveText(`2 من ${gapTotal}`);
    await expect(page.getByRole("definition").nth(2)).toHaveText("2"); // المسجلة
    // The non-gap lesson is recorded: TMH-01 is in progress with one lesson done
    const tmh01 = page.getByRole("listitem").filter({ has: page.getByRole("link", { name: "قراءة السياق المؤسسي" }) });
    await expect(tmh01).toContainText("قيد التنفيذ");
    await expect(tmh01).toContainText(/(^|\D)1 من \d+/);

    expect(problems).toEqual([]);
  });

  test("org B: catalog filters by track and search", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_B_EMAIL"), env("E2E_PASSWORD"));
    await page.goto("/tamohi");
    await expect(page.getByRole("region", { name: "مقترح لمنظمتك" }).getByRole("listitem")).toHaveCount(3);
    const count = page.getByRole("search").getByText(/برنامجاً$/);
    await expect(count).toHaveText("15 برنامجاً");

    await page.getByRole("radiogroup", { name: "المسار" }).getByRole("radio", { name: "الشراكات" }).click();
    await expect(count).toHaveText("3 برنامجاً");
    const cards = page.getByRole("region", { name: "كتالوج البرامج" }).getByRole("listitem");
    await expect(cards).toHaveCount(3);
    for (const card of await cards.all()) await expect(card).toContainText("الشراكات");

    await page.getByRole("searchbox", { name: "ابحث في عناوين البرامج" }).fill("تقييم");
    await expect(count).toHaveText("1 برنامجاً");
    await expect(cards.first()).toContainText("تقييم الشراكات");

    await page.getByRole("searchbox", { name: "ابحث في عناوين البرامج" }).fill("لا يوجد برنامج بهذا الاسم");
    await expect(page.getByText("لا توجد برامج تطابق التصفية.")).toBeVisible();
    await page.getByRole("button", { name: "مسح التصفية" }).click();
    await expect(count).toHaveText("15 برنامجاً");
    await screen(page, "org-b-catalog");

    expect(problems).toEqual([]);
  });

  test("org A (not issued): catalog without personalisation, my path empty", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_ORG_A_EMAIL"), env("E2E_PASSWORD"));
    await page.goto("/tamohi");
    await expect(page.getByRole("heading", { name: "كتالوج البرامج" })).toBeVisible();
    await expect(page.getByRole("definition").filter({ hasText: /^378$/ })).toBeVisible();
    await expect(page.getByRole("heading", { name: "مقترح لمنظمتك" })).toHaveCount(0);
    await expect(page.getByText("أولوية عالية")).toHaveCount(0);
    await expect(page.getByRole("switch")).toHaveCount(0);

    await page.goto(`/tamohi/programs/${topCode}`);
    await expect(page.getByText("تظهر هنا مواءمة البرنامج مع نتائج منظمتك بعد صدورها.")).toBeVisible();
    await expect(page.getByText("لم يتحقق في تقييمكم")).toHaveCount(0);

    await page.goto("/tamohi/my-path");
    await expect(page.getByText("تُبنى خطتك التطويرية بعد صدور نتائج التقييم.")).toBeVisible();
    await expect(page.getByRole("link", { name: "العودة إلى لوحة المنظمة" })).toHaveAttribute("href", "/dashboard");
    await screen(page, "org-a-my-path-empty");

    expect(problems).toEqual([]);
  });

  test("evaluator1: catalog and program without enroll actions; my path closed", async ({ page }) => {
    const problems = watch(page);
    await login(page, env("E2E_EVALUATOR1_EMAIL"), env("E2E_PASSWORD"));
    await page.goto("/tamohi");
    await expect(page.getByRole("heading", { name: "كتالوج البرامج" })).toBeVisible();
    await expect(page.getByRole("link", { name: "خطتي التطويرية" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "مقترح لمنظمتك" })).toHaveCount(0);

    await page.goto(`/tamohi/programs/${topCode}`);
    await expect(page.getByRole("heading", { name: "محتوى البرنامج" })).toBeVisible();
    await expect(page.getByRole("button", { name: "سجّل منظمتك في البرنامج" })).toHaveCount(0);
    await expect(page.getByRole("heading", { name: "لماذا يُقترح لمنظمتكم" })).toHaveCount(0);
    await page.getByRole("button", { name: /الوحدة 1/ }).first().click();
    await page.locator('li[id^="lesson-"]').first().getByRole("button").first().click();
    await expect(page.getByText("خطوات التطبيق").first()).toBeVisible();
    await expect(page.getByLabel("أنجزت هذا الناتج")).toHaveCount(0);

    await page.goto("/tamohi/my-path");
    await expect(page).toHaveURL(/\/tamohi$/);

    expect(problems).toEqual([]);
  });

  test("signed out: /tamohi goes to login and back", async ({ page }) => {
    const problems = watch(page);
    await page.goto("/tamohi");
    await expect(page).toHaveURL(/\/login\?next=%2Ftamohi$/);
    await page.getByRole("tab", { name: "البريد الإلكتروني" }).click();
    await page.getByRole("textbox", { name: "البريد الإلكتروني", exact: true }).fill(env("E2E_ORG_A_EMAIL"));
    await page.getByLabel("كلمة المرور", { exact: true }).fill(env("E2E_PASSWORD"));
    await page.getByRole("button", { name: "دخول", exact: true }).click();
    await expect(page).toHaveURL(/\/tamohi$/);

    expect(problems).toEqual([]);
  });
});
