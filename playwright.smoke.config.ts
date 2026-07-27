import { defineConfig, devices } from '@playwright/test'

// Config separada do E2E de fluxo: aqui o objetivo e VER as telas, entao gravamos
// video e print sempre (nao so em falha), e nao paramos no primeiro erro — queremos
// o retrato do sistema inteiro, mesmo com uma pagina quebrada no meio.
export default defineConfig({
  testDir: './e2e',
  testMatch: /smoke\.spec\.ts/,
  // Monta o relatorio HTML sempre ao fim, mesmo se alguma pagina falhar — o relatorio
  // com a pagina vermelha e justamente o que interessa nesse caso.
  globalTeardown: './e2e/smoke.teardown.ts',
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['json', { outputFile: 'smoke-report/playwright.json' }]],
  timeout: 60000,
  outputDir: 'smoke-report/videos',
  use: {
    baseURL: 'http://localhost:5173',
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',
    video: 'on',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: true,
    timeout: 60000,
  },
})
