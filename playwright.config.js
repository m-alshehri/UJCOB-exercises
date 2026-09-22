import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "tests/browser",
  timeout: 45000,
  workers: 1,
  use: {
    baseURL: "http://127.0.0.1:4173",
    headless: true,
    launchOptions: { executablePath: process.env.CHROME_PATH },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "node scripts/dev-server.js",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
  },
});
