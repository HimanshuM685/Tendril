import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  workers: 2,
  use: {
    baseURL: "http://127.0.0.1:5175",
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    { command: "npm run dev -- --host 127.0.0.1 --port 5175 --strictPort", url: "http://127.0.0.1:5175", reuseExistingServer: !process.env.CI },
    { command: "npm run dev -w @tendril/web -- --host 127.0.0.1 --port 5173 --strictPort", url: "http://127.0.0.1:5173", reuseExistingServer: !process.env.CI },
  ],
});
