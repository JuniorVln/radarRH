import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'

// Guarda de configuração de DEPLOY, não de código.
//
// Por que existe: ao adicionar o rewrite do portal (/vagas), o vercel.json passou a
// ter apenas essa regra — e isso desligou o fallback automático da SPA na Vercel.
// Resultado: /colaboradores e /disc/<token> começaram a devolver 404 em produção
// quando abertos direto ou recarregados. Nenhum teste pegou, porque o servidor de
// desenvolvimento do Vite faz esse fallback sozinho: o bug só existe no deploy.
//
// Este teste lê o arquivo de configuração e confere as duas regras e a ORDEM delas.
//
// SEGUNDA ARMADILHA, também paga na prática: a Vercel valida o vercel.json de forma
// estrita e RECUSA chaves que não estão no schema dela. A primeira tentativa de
// correção levava um "_comentario" explicando as regras — e isso fez o BUILD FALHAR,
// deixando a produção na versão quebrada por mais tempo. Por isso o arquivo não tem
// comentário nenhum e a explicação mora aqui.
//
// Ordem que a Vercel aplica: arquivos estáticos e funções de /api primeiro; os
// rewrites abaixo só entram quando nada disso resolveu a URL.

const config = JSON.parse(readFileSync('vercel.json', 'utf8'))

describe('rewrites de deploy (vercel.json)', () => {
  const rewrites: { source: string; destination: string }[] = config.rewrites || []

  it('manda /vagas para a página própria do portal', () => {
    const portal = rewrites.find(r => r.source === '/vagas')
    expect(portal, 'o rewrite do portal sumiu').toBeDefined()
    expect(portal!.destination).toBe('/vagas.html')
  })

  it('tem o fallback da SPA, senão rota funda dá 404 em produção', () => {
    const fallback = rewrites.find(r => r.destination === '/index.html')
    expect(fallback, 'sem fallback: /disc/<token> e /colaboradores quebram').toBeDefined()
  })

  it('o portal vem ANTES do fallback — senão /vagas cai na SPA', () => {
    const iPortal = rewrites.findIndex(r => r.source === '/vagas')
    const iFallback = rewrites.findIndex(r => r.destination === '/index.html')
    expect(iPortal).toBeGreaterThanOrEqual(0)
    expect(iFallback).toBeGreaterThanOrEqual(0)
    expect(iPortal).toBeLessThan(iFallback)
  })

  it('o fallback não engole as funções de /api', () => {
    const fallback = rewrites.find(r => r.destination === '/index.html')!
    // Precisa excluir api/ do padrão, senão /api/vagas passa a devolver o HTML do app
    expect(fallback.source).toContain('api/')
  })
})
