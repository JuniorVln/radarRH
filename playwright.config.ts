import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // O smoke visual tem config propria (playwright.smoke.config.ts) — grava video,
  // nao para na primeira falha e gera relatorio de prints.
  testIgnore: /smoke\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 30000,
  },
})
