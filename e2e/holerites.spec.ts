import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E de fluxo de Holerites e Informes (as duas abas gravam em tabelas diferentes).
// O ponto de atencao e o liquido: a tela NAO pede o valor, ela calcula
// (base + proventos - descontos). Errar essa conta e errar o contracheque.

const NOME_COLAB = '__TESTE_E2E__ Colaborador Holerite'

let colaboradorId: string

async function limparResiduos() {
  const { data: colabs } = await supabaseTest
    .from('colaboradores')
    .select('id')
    .like('nome', '__TESTE_E2E__%')

  for (const c of colabs ?? []) {
    await supabaseTest.from('holerites').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('informes_rendimentos').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('movimentacoes').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('colaboradores').delete().eq('id', c.id)
  }
}

test.beforeAll(async () => {
  await limparResiduos()
  const { data, error } = await supabaseTest
    .from('colaboradores')
    .insert({
      nome: NOME_COLAB,
      cpf: '999.888.777-11',
      cargo: 'Analista de Teste',
      setor: 'QA Automatizado',
      tipo: 'CLT',
      status: 'ativo',
      data_admissao: '2026-01-05',
    })
    .select()
    .single()

  expect(error, 'nao consegui criar o colaborador de teste').toBeNull()
  colaboradorId = data!.id
})

test.afterAll(limparResiduos)

test('prepara holerite com liquido calculado, prepara informe e exclui os dois', async ({ page }) => {
  page.on('dialog', d => d.accept())

  await page.goto('/holerites')
  await expect(page.getByRole('heading', { name: 'Holerites e Informes' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })

  // ---------- VALIDACAO ----------
  await page.getByRole('button', { name: 'Novo Holerite' }).click()
  await page.getByRole('button', { name: 'Salvar Holerite' }).click()
  await expect(page.getByText('Preencha colaborador e competência.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  // ---------- HOLERITE ----------
  await campo(page, 'Colaborador *').selectOption(colaboradorId)
  await campo(page, 'Competência *').fill('2026-07')
  await campo(page, 'Salário base').fill('3000')
  await campo(page, 'Proventos').fill('500.50')
  await campo(page, 'Descontos').fill('320.25')

  await page.getByRole('button', { name: 'Salvar Holerite' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Holerite preparado.').first()).toBeVisible()

  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()

  const { data: holerites } = await supabaseTest
    .from('holerites')
    .select('id, competencia, salario_base, proventos, descontos, valor_liquido, status')
    .eq('colaborador_id', colaboradorId)

  expect(holerites).toHaveLength(1)
  expect(holerites![0]).toMatchObject({
    competencia: '2026-07',
    salario_base: 3000,
    proventos: 500.5,
    descontos: 320.25,
    // 3000 + 500,50 - 320,25 — a tela calcula, ninguem digita
    valor_liquido: 3180.25,
  })

  // ---------- INFORME (outra aba, outra tabela) ----------
  await page.getByRole('button', { name: 'Informes', exact: true }).click()
  await page.getByRole('button', { name: 'Novo Informe' }).click()

  await page.getByRole('button', { name: 'Salvar Informe' }).click()
  await expect(page.getByText('Preencha colaborador e ano-base.').first()).toBeVisible()

  await campo(page, 'Colaborador *').selectOption(colaboradorId)
  await campo(page, 'Ano-base *').fill('2025')
  await campo(page, 'Rendimentos').fill('42000')
  await campo(page, 'IR retido').fill('3150.75')
  await page.getByRole('button', { name: 'Salvar Informe' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Informe preparado.').first()).toBeVisible()

  const { data: informes } = await supabaseTest
    .from('informes_rendimentos')
    .select('id, ano_base, rendimentos_tributaveis, imposto_retido')
    .eq('colaborador_id', colaboradorId)

  expect(informes).toHaveLength(1)
  expect(informes![0]).toMatchObject({
    ano_base: 2025,
    rendimentos_tributaveis: 42000,
    imposto_retido: 3150.75,
  })

  // ---------- EXCLUIR OS DOIS ----------
  await page.getByRole('row', { name: new RegExp(NOME_COLAB) }).getByRole('button').click()
  await expect(page.getByText('Documento excluído.').first()).toBeVisible()
  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('informes_rendimentos')
        .select('id')
        .eq('colaborador_id', colaboradorId)
      return data?.length
    })
    .toBe(0)

  await page.getByRole('button', { name: 'Holerites', exact: true }).click()
  await page.getByRole('row', { name: new RegExp(NOME_COLAB) }).getByRole('button').click()
  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('holerites')
        .select('id')
        .eq('colaborador_id', colaboradorId)
      return data?.length
    })
    .toBe(0)
})
