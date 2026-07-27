import { defineConfig } from 'vitest/config'

// Testes que batem no Supabase real (dados descartáveis, limpos ao final).
// Rodar separado do `npm test` porque depende de rede + credenciais.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 30000,
  },
})
