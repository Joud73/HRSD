import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// Test accounts and passwords live in e2e/.env (gitignored).
loadEnv({ path: "e2e/.env" });

export default defineConfig({
  testDir: "e2e",
  outputDir: "e2e/test-results",
  // The demo path depends on order (org B submits before the supervisor and admin checks)
  fullyParallel: false,
  workers: 1,
  retries: 0,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  reporter: [["list"]],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? "http://localhost:8080",
    viewport: { width: 1440, height: 900 },
    locale: "ar-SA",
    timezoneId: "Asia/Riyadh",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 } } }],
});
