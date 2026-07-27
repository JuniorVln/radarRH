import { defineConfig, devices } from '@playwright/test'

// Config da regressao visual. Separada porque:
//  - precisa de viewport fixo (mudou o tamanho da janela, muda todo o print)
//  - as referencias sao por sistema operacional, entao isso roda LOCAL, nao no CI
export default defineConfig({
  testDir: './e2e',
  testMatch: /visual\.spec\.ts/,
  snapshotPathTemplate: 'e2e/referencias-visuais/{arg}{ext}',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { outputFolder: 'visual-report', open: 'never' }]],
  timeout: 60000,
  outputDir: 'test-results-visual',
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1440, height: 900 },
    animations: 'disabled',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
})
