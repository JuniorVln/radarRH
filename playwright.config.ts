import { defineConfig, devices } from '@playwright/test'

export default defineConfig({
  testDir: './e2e',
  // O smoke visual tem config propria (playwright.smoke.config.ts) — grava video,
  // nao para na primeira falha e gera relatorio de prints.
  testIgnore: /(smoke|visual)\.spec\.ts/,
  fullyParallel: false,
  workers: 1,
  // O html vai junto porque o workflow sobe playwright-report/ como artefato quando
  // falha — sem ele, uma falha que so acontece no CI fica sem print, video nem trace.
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  timeout: 30000,
  use: {
    baseURL: 'http://localhost:5173',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
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
