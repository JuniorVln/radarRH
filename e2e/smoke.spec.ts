import fs from 'node:fs'
import path from 'node:path'
import { test, expect, type Page } from '@playwright/test'
import { ROTAS } from './rotas'

// Smoke test visual: abre TODAS as paginas do sistema, verifica que carregaram de
// verdade (sem tela branca, sem erro no console, sem erro de rede no Supabase) e
// tira um print de cada uma. O relatorio HTML e montado depois por
// scripts/build-smoke-report.mjs — e o que voce abre pra "ver na tela" sem clicar em nada.

const PASTA_PRINTS = 'smoke-report/prints'
const PASTA_RESULTADOS = 'smoke-report/resultados'

// Ruido conhecido do ecossistema (dev tools, extensoes, avisos de lib) que nao indica
// pagina quebrada. Tudo que nao estiver aqui e tratado como falha de verdade.
const RUIDO_IGNORADO = [
  /Download the React DevTools/i,
  /React Router Future Flag Warning/i,
  /was preloaded using link preload/i,
  /\[vite\] connect(ing|ed)/i,
  /favicon\.ico/i,
]

const ehRuido = (texto: string) => RUIDO_IGNORADO.some((r) => r.test(texto))

type Problema = { tipo: string; detalhe: string }

function observarProblemas(page: Page) {
  const problemas: Problema[] = []

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return
    const texto = msg.text()
    if (ehRuido(texto)) return
    problemas.push({ tipo: 'console', detalhe: texto })
  })

  page.on('pageerror', (err) => {
    problemas.push({ tipo: 'excecao', detalhe: err.message })
  })

  page.on('response', async (res) => {
    if (res.status() < 400) return
    if (ehRuido(res.url())) return
    problemas.push({ tipo: 'rede', detalhe: `${res.status()} — ${res.url()}` })
  })

  return problemas
}

function garantirPastas() {
  for (const p of [PASTA_PRINTS, PASTA_RESULTADOS]) {
    fs.mkdirSync(p, { recursive: true })
  }
}

test.beforeAll(() => {
  garantirPastas()
})

ROTAS.forEach((rota, indice) => {
  test(`${rota.nome} (${rota.path})`, async ({ page }, testInfo) => {
    const inicio = Date.now()
    const problemas = observarProblemas(page)

    await page.goto(rota.path, { waitUntil: 'domcontentloaded' })

    // Espera o app hidratar e as chamadas ao Supabase assentarem. networkidle sozinho
    // e fragil com websocket do vite, entao damos uma folga fixa depois dele.
    await page.waitForLoadState('networkidle').catch(() => {})
    await page.waitForTimeout(1200)

    const relPrint = path.join(PASTA_PRINTS, `${rota.slug}.png`)
    await page.screenshot({ path: relPrint, fullPage: true })

    const texto = (await page.locator('body').innerText().catch(() => '')) ?? ''
    const temConteudo = texto.trim().length > 40
    const ehNotFound = /p[áa]gina n[ãa]o encontrada|404/i.test(texto)

    if (!temConteudo) {
      problemas.push({ tipo: 'tela-branca', detalhe: 'A pagina renderizou praticamente vazia.' })
    }
    if (ehNotFound) {
      problemas.push({ tipo: 'rota-404', detalhe: 'A rota caiu na pagina de "nao encontrada".' })
    }

    // O video so e movido pra pasta final depois que o contexto fecha. Guardamos a
    // pasta do teste; o montador do relatorio (que roda no teardown) acha o video la.

    const resultado = {
      ordem: indice,
      slug: rota.slug,
      nome: rota.nome,
      path: rota.path,
      print: `prints/${rota.slug}.png`,
      pastaTeste: testInfo.outputDir,
      ok: problemas.length === 0,
      problemas,
      duracaoMs: Date.now() - inicio,
    }

    fs.writeFileSync(
      path.join(PASTA_RESULTADOS, `${rota.slug}.json`),
      JSON.stringify(resultado, null, 2),
      'utf8',
    )

    expect(
      problemas,
      `Problemas em ${rota.nome}:\n` + problemas.map((p) => `  [${p.tipo}] ${p.detalhe}`).join('\n'),
    ).toEqual([])
  })
})
