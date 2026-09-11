import { defineConfig } from 'vitest/config'

// Testes que batem no Supabase real (dados descartáveis, limpos ao final).
// Rodar separado do `npm test` porque depende de rede + credenciais.
export default defineConfig({
  test: {
    environment: 'node',
    // Assina um token de admin antes de rodar: sem sessao o banco nao devolve nada
    // desde que o acesso passou a ser por pessoa (11/09/2026).
    globalSetup: ['./e2e/sessao-integracao.ts'],
    include: ['src/**/*.integration.test.ts'],
    testTimeout: 30000,
  },
})
