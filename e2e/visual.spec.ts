import { test, expect } from '@playwright/test'
import { ROTAS } from './rotas'

// Regressao visual: compara cada tela pixel a pixel contra uma referencia guardada
// no repo. Pega o que nenhum outro teste pega — mexeu no CSS de um botao e
// desalinhou a tabela de outra pagina.
//
// POR QUE MASCARAR: o conteudo vem do banco de verdade e muda o tempo todo (o proprio
// E2E cria e apaga registros). Comparar a pagina inteira daria diff em toda rodada e
// o teste viraria ruido que ninguem olha. Entao mascaramos as areas de DADOS (tabelas,
// numeros dos cards, graficos, avatares) e comparamos o ESQUELETO: menu lateral,
// cabecalho, barra de ferramentas, botoes, abas, espacamentos. E ali que regressao de
// CSS aparece.
//
// As referencias sao por sistema operacional (Windows renderiza fonte diferente do
// Linux). Como so existem baselines de Windows, isso NAO roda no CI — e local, via
// `npm run test:visual`. Para atualizar depois de uma mudanca proposital de layout:
// `npm run test:visual:atualizar`.

const AREAS_DE_DADOS = [
  'table',
  'svg.recharts-surface',
  '.recharts-wrapper',
  '.stat-card p',
  '[class*="rounded-full"][class*="bg-"]', // avatares gerados
]

test.describe('regressão visual', () => {
  for (const rota of ROTAS) {
    test(`${rota.nome} (${rota.path})`, async ({ page }) => {
      await page.goto(rota.path, { waitUntil: 'domcontentloaded' })
      await page.waitForLoadState('networkidle').catch(() => {})

      // Sem isso os skeletons de carregamento entram no print e dao diff toda vez.
      await expect(page.locator('.skeleton')).toHaveCount(0, { timeout: 15000 })
      await page.waitForTimeout(600)

      await expect(page).toHaveScreenshot(`${rota.slug}.png`, {
        // VIEWPORT, nao pagina inteira. Com fullPage, cada linha nova numa tabela muda
        // a ALTURA do print e vira diferenca — e a partir do momento em que alguem usa
        // o sistema de verdade (a Deise lancou ferias em 28/07), isso reprovaria todo
        // dia sem nenhuma regressao existir. Alarme que toca sempre ninguem olha.
        // Regressao de layout aparece na primeira dobra do mesmo jeito.
        fullPage: false,
        mask: AREAS_DE_DADOS.map((s) => page.locator(s)),
        // 0,2% da area. Em pagina inteira, 1% engolia mudanca de padding de botao —
        // testado com canario. Baixo o suficiente pra pegar layout, alto o suficiente
        // pra nao reclamar de anti-aliasing de fonte.
        maxDiffPixelRatio: 0.002,
        animations: 'disabled',
      })
    })
  }
})
