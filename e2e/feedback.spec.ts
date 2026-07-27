import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E de fluxo do Painel do Feedback: valida obrigatorios, registra (com o seletor
// Positivo/Neutro/A Melhorar, que sao botoes e nao select), edita e exclui.

const NOME_COLAB = '__TESTE_E2E__ Colaborador Feedback'
const DESCRICAO = '__TESTE_E2E__ feedback do teste automatizado'
const DESCRICAO_EDITADA = '__TESTE_E2E__ feedback revisado'

let colaboradorId: string

async function limparResiduos() {
  const { data: colabs } = await supabaseTest
    .from('colaboradores')
    .select('id')
    .like('nome', '__TESTE_E2E__%')

  for (const c of colabs ?? []) {
    await supabaseTest.from('feedbacks').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('movimentacoes').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('colaboradores').delete().eq('id', c.id)
  }
  await supabaseTest.from('feedbacks').delete().like('descricao', '__TESTE_E2E__%')
}

test.beforeAll(async () => {
  await limparResiduos()
  const { data, error } = await supabaseTest
    .from('colaboradores')
    .insert({
      nome: NOME_COLAB,
      cpf: '999.888.777-33',
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

test('valida obrigatorios, registra, edita e exclui um feedback', async ({ page }) => {
  page.on('dialog', d => d.accept())

  await page.goto('/feedback')
  await expect(page.getByRole('heading', { name: 'Painel do Feedback' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })

  // ---------- VALIDACAO ----------
  await page.getByRole('button', { name: 'Registrar Feedback' }).first().click()
  await page.getByRole('button', { name: 'Salvar Feedback' }).click()
  await expect(page.getByText('Colaborador e data são obrigatórios.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  // ---------- REGISTRAR ----------
  await campo(page, 'Colaborador *').selectOption(colaboradorId)
  await campo(page, 'Gestor / Responsável').fill('Gestor de Teste')
  // O tipo e um grupo de BOTOES (nao select) — clicar em "A Melhorar" grava PARE
  await page.getByRole('button', { name: 'A Melhorar', exact: true }).click()
  await campo(page, 'Data do Feedback *').fill('2026-07-10')
  await campo(page, 'Próximo Feedback').fill('2026-10-10')
  await campo(page, 'Descrição').fill(DESCRICAO)

  await page.getByRole('button', { name: 'Salvar Feedback' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Feedback registrado!').first()).toBeVisible()

  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()

  const { data: criados } = await supabaseTest
    .from('feedbacks')
    .select('id, tipo_par, data_feedback, proximo_feedback, descricao, gestor_nome, status')
    .eq('colaborador_id', colaboradorId)

  expect(criados).toHaveLength(1)
  const criado = criados![0]
  expect(criado).toMatchObject({
    tipo_par: 'PARE', // "A Melhorar" no rotulo, PARE no banco
    data_feedback: '2026-07-10',
    proximo_feedback: '2026-10-10',
    descricao: DESCRICAO,
    gestor_nome: 'Gestor de Teste',
    status: 'realizado',
  })

  // ---------- EDITAR ----------
  await page.getByRole('cell', { name: NOME_COLAB }).click()
  await expect(campo(page, 'Descrição')).toHaveValue(DESCRICAO)

  await campo(page, 'Descrição').fill(DESCRICAO_EDITADA)
  await page.getByRole('button', { name: 'Positivo', exact: true }).click()
  await campo(page, 'Status').selectOption('pendente')
  await page.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(fecharModal).toHaveCount(0)

  const { data: editados } = await supabaseTest
    .from('feedbacks')
    .select('id, tipo_par, descricao, status')
    .eq('colaborador_id', colaboradorId)

  expect(editados).toHaveLength(1) // editar nao pode duplicar
  expect(editados![0]).toMatchObject({
    id: criado.id,
    tipo_par: 'AVANCE',
    descricao: DESCRICAO_EDITADA,
    status: 'pendente',
  })

  // ---------- FILTRAR ----------
  const busca = page.getByPlaceholder('Buscar por colaborador...')
  await busca.fill(NOME_COLAB)
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()
  await busca.fill('__NAO_EXISTE__')
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toHaveCount(0)
  await busca.fill(NOME_COLAB)

  // ---------- EXCLUIR ----------
  await page.getByRole('row', { name: new RegExp(NOME_COLAB) }).getByRole('button').click()
  await expect(page.getByText('Feedback excluído.').first()).toBeVisible()
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toHaveCount(0)

  const { data: restantes } = await supabaseTest
    .from('feedbacks')
    .select('id')
    .eq('colaborador_id', colaboradorId)
  expect(restantes).toHaveLength(0)
})
