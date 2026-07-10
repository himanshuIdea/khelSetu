import { defineConfig, devices } from "@playwright/test";
import { config as loadDotenv } from "dotenv";
import path from "node:path";

loadDotenv({ path: path.resolve(__dirname, ".env") });
loadDotenv({ path: path.resolve(__dirname, ".env.local"), override: true });

const baseURL = process.env.DEMO_BASE_URL ?? "http://127.0.0.1:3000";
const port = new URL(baseURL).port || "3000";

export default defineConfig({
  testDir: "e2e",
  timeout: 600_000,
  expect: { timeout: 45_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "e2e/report" }]],
  outputDir: "e2e/results",
  use: {
    baseURL,
    trace: "retain-on-failure",
    video: "on",
    screenshot: "off",
    actionTimeout: 45_000,
    navigationTimeout: 90_000,
    acceptDownloads: true,
    ...devices["Desktop Chrome"],
    viewport: { width: 1280, height: 800 },
    launchOptions: {
      slowMo: 500,
    },
  },
  projects: [
    {
      name: "state-demo",
      testMatch: /state-portal-demo\.spec\.ts/,
    },
  ],
  webServer: process.env.DEMO_SKIP_SERVER
    ? undefined
    : {
        command: `npm run start:demo -- -p ${port}`,
        url: `${baseURL}/health`,
        reuseExistingServer: true,
        timeout: 120_000,
        stdout: "pipe",
        stderr: "pipe",
      },
});
