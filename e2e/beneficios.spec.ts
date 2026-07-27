import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'

// Competência descartável, isolada da usada pelo teste de integração do vitest.
const COMPETENCIA_TESTE = '2099-03'
const NOME_COLABORADOR_TESTE = '__TESTE_E2E__ Beneficios'

let colaboradorId: string
let periodoId: string
let ocorrenciaId: string | null = null

async function limparResiduos() {
  const antigo = await supabaseTest.from('colaboradores').select('id').eq('nome', NOME_COLABORADOR_TESTE).maybeSingle()
  if (antigo.data) await supabaseTest.from('colaboradores').delete().eq('id', antigo.data.id)
  const periodoAntigo = await supabaseTest.from('beneficios_periodos').select('id').eq('competencia', COMPETENCIA_TESTE).maybeSingle()
  if (periodoAntigo.data) await supabaseTest.from('beneficios_periodos').delete().eq('id', periodoAntigo.data.id)
}

test.beforeAll(async () => {
  await limparResiduos()

  const { data: colaborador, error: colabErr } = await supabaseTest
    .from('colaboradores')
    .insert({ nome: NOME_COLABORADOR_TESTE, cargo: 'Teste E2E', setor: 'Teste', unidade: 'Rede Ideia', tipo: 'CLT', status: 'ativo' })
    .select()
    .single()
  if (colabErr) throw colabErr
  colaboradorId = colaborador.id

  await supabaseTest.from('beneficios_configuracoes_colaborador').insert({
    colaborador_id: colaboradorId,
    empresa: 'Rede Ideia',
    valor_vr_diario: 31,
    recebe_frutas: false,
    valor_frutas_mensal: 0,
    tipo_transporte: 'HOME OFFICE', // sem VT, pra isolar o teste no efeito da falta sobre o VR
    valor_vt_diario: 0,
    ativo: true,
  })
})

test.afterAll(async () => {
  if (ocorrenciaId) await supabaseTest.from('ocorrencias').delete().eq('id', ocorrenciaId)
  if (periodoId) {
    await supabaseTest.from('beneficios_eventos').delete().eq('periodo_id', periodoId)
    await supabaseTest.from('beneficios_resultados').delete().eq('periodo_id', periodoId).eq('colaborador_id', colaboradorId)
  }
  await supabaseTest.from('beneficios_configuracoes_colaborador').delete().eq('colaborador_id', colaboradorId)
  await supabaseTest.from('colaboradores').delete().eq('id', colaboradorId)
  if (periodoId) await supabaseTest.from('beneficios_periodos').delete().eq('id', periodoId)
})

test('Benefícios: recalcular puxa falta lançada em Ocorrências e reflete no VR', async ({ page }) => {
  // 1) Cria a competência de teste a partir da própria UI ("Nova competência" avança
  // a partir da mais recente existente, então criamos direto pra garantir o mês certo)
  await page.goto('/beneficios')
  await expect(page.getByRole('heading', { name: 'Benefícios' })).toBeVisible()

  periodoId = await page.evaluate(async (competencia) => {
    const mod = await import('/src/lib/beneficiosService.ts')
    const periodo = await mod.obterOuCriarPeriodo(competencia)
    return periodo.id
  }, COMPETENCIA_TESTE)

  await page.reload()
  await page.getByLabel('Competência').selectOption({ value: periodoId })

  // 2) Recalcula sem faltas lançadas ainda — deve aparecer o colaborador de teste
  await page.getByRole('button', { name: /Recalcular/ }).click()
  await expect(page.getByText(/Recalculando/)).toBeHidden({ timeout: 15000 })

  await page.getByRole('button', { name: 'Cálculo por colaborador' }).click()
  await page.getByPlaceholder('Buscar colaborador, empresa ou transporte...').fill(NOME_COLABORADOR_TESTE)

  const linha = page.locator('tr', { hasText: NOME_COLABORADOR_TESTE })
  await expect(linha).toBeVisible()
  const vrCheio = await linha.locator('td').nth(3).innerText() // "R$ 620,00" (31 x 20 dias úteis, varia com o mês)

  // 3) Lança uma falta de verdade em Ocorrências, pela UI
  await page.goto('/ocorrencias')
  await page.getByRole('button', { name: 'Nova Ocorrência' }).click()
  await page.getByLabel('Colaborador *').selectOption({ label: NOME_COLABORADOR_TESTE })
  await page.locator('input[type="date"]').fill('2099-01-25')
  await page.getByLabel('Descrição *').fill('Falta de teste E2E automatizado')
  await page.getByRole('button', { name: 'Registrar' }).click()
  await expect(page.getByText('Ocorrência registrada.').first()).toBeVisible()

  const { data: ocorrencia } = await supabaseTest
    .from('ocorrencias')
    .select('id')
    .eq('colaborador_id', colaboradorId)
    .eq('descricao', 'Falta de teste E2E automatizado')
    .single()
  ocorrenciaId = ocorrencia?.id ?? null

  // 4) Volta em Benefícios, recalcula de novo — o valor de VR precisa ter caído
  await page.goto('/beneficios')
  await page.getByLabel('Competência').selectOption({ value: periodoId })
  await page.getByRole('button', { name: /Recalcular/ }).click()
  await expect(page.getByText(/Recalculando/)).toBeHidden({ timeout: 15000 })

  await page.getByRole('button', { name: 'Cálculo por colaborador' }).click()
  await page.getByPlaceholder('Buscar colaborador, empresa ou transporte...').fill(NOME_COLABORADOR_TESTE)
  const linhaAtualizada = page.locator('tr', { hasText: NOME_COLABORADOR_TESTE })
  const vrComFalta = await linhaAtualizada.locator('td').nth(3).innerText()
  expect(vrComFalta).not.toBe(vrCheio) // desconto da falta refletiu automaticamente

  // 5) Abre o detalhamento por dia e confirma que a falta aparece listada
  await linhaAtualizada.click()
  await expect(page.getByText(`Detalhamento — ${NOME_COLABORADOR_TESTE}`)).toBeVisible()
  await expect(page.getByText('Falta de teste E2E automatizado')).toBeVisible()
  await page.keyboard.press('Escape').catch(() => {})
  await page.locator('.modal-overlay').click({ position: { x: 5, y: 5 } })

  // 6) Testa a tela de ajuste manual (exceções)
  await page.getByPlaceholder('Buscar colaborador, empresa ou transporte...').fill(NOME_COLABORADOR_TESTE)
  await page.getByRole('button', { name: 'Ajustar' }).click()
  await expect(page.getByText(`Ajuste manual — ${NOME_COLABORADOR_TESTE}`)).toBeVisible()
  await page.getByLabel('Valor final de VR').fill('999')
  await page.getByLabel('Motivo').fill('Ajuste de teste E2E automatizado')
  await page.getByRole('button', { name: 'Salvar ajuste' }).click()
  await expect(page.getByText('Ajuste salvo.').first()).toBeVisible()

  await page.getByPlaceholder('Buscar colaborador, empresa ou transporte...').fill(NOME_COLABORADOR_TESTE)
  await expect(page.locator('tr', { hasText: NOME_COLABORADOR_TESTE }).getByText('ajustado')).toBeVisible()
})
