import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'

// E2E de fluxo da Avaliacao de Desempenho. Cobre os dois fluxos que gravam dados:
//  - Novo Ciclo: cria uma avaliacao para CADA colaborador ativo de uma vez
//  - Novo PDI: plano de desenvolvimento individual (objetivo mora em metas jsonb)
// Mais o preenchimento de nota/desempenho/potencial direto na tabela, que salva
// no blur/change sem botao de salvar — justamente o tipo de coisa que quebra calado.

const CICLO = '__TESTE_E2E__ Ciclo de Avaliacao'
const PDI_TITULO = '__TESTE_E2E__ PDI do teste'
const PDI_OBJETIVO = 'Objetivo registrado pelo teste automatizado'

async function limparResiduos() {
  await supabaseTest.from('avaliacoes').delete().eq('ciclo', CICLO)
  await supabaseTest.from('pdis').delete().like('titulo', '__TESTE_E2E__%')
}

test.beforeAll(limparResiduos)
test.afterAll(limparResiduos)

test('cria ciclo para todos os ativos, preenche avaliacao e gerencia PDI', async ({ page }) => {
  page.on('dialog', d => d.accept()) // excluir PDI usa confirm() nativo

  // Quantos ativos existem agora — o ciclo tem que gerar exatamente uma avaliacao
  // por colaborador ativo. Le do banco pra nao depender de numero cravado no teste.
  const { data: ativos } = await supabaseTest
    .from('colaboradores')
    .select('id, nome')
    .eq('status', 'ativo')
    .order('nome')

  expect(ativos!.length, 'precisa de colaborador ativo pra avaliar').toBeGreaterThan(0)

  await page.goto('/avaliacao-desempenho')
  await expect(page.getByRole('heading', { name: 'Avaliação de Desempenho' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })

  // ---------- VALIDACAO DO CICLO ----------
  await page.getByRole('button', { name: 'Novo Ciclo' }).click()
  await page.getByRole('button', { name: 'Criar Ciclo' }).click()
  await expect(page.getByText('Preencha nome, início e encerramento do ciclo.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  // ---------- CRIAR CICLO ----------
  await page.getByLabel('Nome do ciclo *').fill(CICLO)
  await page.getByLabel('Data de início *').fill('2026-08-01')
  await page.getByLabel('Data de encerramento *').fill('2026-08-31')
  await page.getByRole('button', { name: 'Criar Ciclo' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Ciclo criado para colaboradores ativos.').first()).toBeVisible()

  const { data: criadas } = await supabaseTest
    .from('avaliacoes')
    .select('id, colaborador_id, status, data_inicio, data_fim')
    .eq('ciclo', CICLO)

  // Uma avaliacao por colaborador ativo, nem a mais nem a menos
  expect(criadas).toHaveLength(ativos!.length)
  expect(criadas!.every(a => a.status === 'pendente')).toBe(true)
  expect(criadas![0]).toMatchObject({ data_inicio: '2026-08-01', data_fim: '2026-08-31' })

  // ---------- PREENCHER A AVALIACAO NA TABELA ----------
  // Nota salva no blur e os selects no change — sem botao de salvar, entao e o
  // ponto mais silencioso da tela: se parar de gravar, ninguem percebe olhando.
  const alvo = ativos![0]
  const linha = page.getByRole('row', { name: new RegExp(alvo.nome.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) })
  await expect(linha.getByRole('cell', { name: CICLO })).toBeVisible()

  await linha.getByRole('spinbutton').fill('8.5')
  await linha.getByRole('spinbutton').blur()

  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('avaliacoes')
        .select('nota')
        .eq('ciclo', CICLO)
        .eq('colaborador_id', alvo.id)
        .single()
      return data?.nota
    }, { message: 'a nota digitada nao chegou no banco' })
    .toBe(8.5)

  const selects = linha.getByRole('combobox')
  await selects.nth(0).selectOption('concluido') // status
  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('avaliacoes')
        .select('status')
        .eq('ciclo', CICLO)
        .eq('colaborador_id', alvo.id)
        .single()
      return data?.status
    })
    .toBe('concluido')

  // Preencher a avaliacao nao pode criar um registro paralelo
  const { data: aposPreencher } = await supabaseTest
    .from('avaliacoes')
    .select('id')
    .eq('ciclo', CICLO)
  expect(aposPreencher).toHaveLength(ativos!.length)

  // ---------- PDI ----------
  await page.getByRole('button', { name: 'PDI', exact: true }).click()
  await page.getByRole('button', { name: 'Novo PDI' }).click()

  await page.getByRole('button', { name: 'Salvar PDI' }).click()
  await expect(page.getByText('Preencha colaborador, título, objetivo e início.').first()).toBeVisible()

  await page.getByLabel('Colaborador *').selectOption(alvo.id)
  await page.getByLabel('Título *').fill(PDI_TITULO)
  await page.getByLabel('Objetivo *').fill(PDI_OBJETIVO)
  await page.getByLabel('Ações previstas').fill('Mentoria mensal com o gestor.')
  await page.getByLabel('Início *').fill('2026-08-05')
  await page.getByRole('button', { name: 'Salvar PDI' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('PDI criado.').first()).toBeVisible()

  await expect(page.getByText(PDI_TITULO)).toBeVisible()
  await expect(page.getByText(PDI_OBJETIVO)).toBeVisible()

  const { data: pdis } = await supabaseTest
    .from('pdis')
    .select('id, titulo, metas, descricao, data_inicio, status')
    .eq('titulo', PDI_TITULO)

  expect(pdis).toHaveLength(1)
  expect(pdis![0]).toMatchObject({
    // o objetivo NAO tem coluna propria: mora dentro de metas (jsonb)
    metas: { objetivo: PDI_OBJETIVO },
    descricao: 'Mentoria mensal com o gestor.',
    data_inicio: '2026-08-05',
  })

  // Excluir o PDI pelo botao do card
  await page.getByTitle('Excluir PDI').click()
  await expect(page.getByText(PDI_TITULO)).toHaveCount(0)

  const { data: pdisRestantes } = await supabaseTest
    .from('pdis')
    .select('id')
    .eq('titulo', PDI_TITULO)
  expect(pdisRestantes).toHaveLength(0)

  // ---------- ABAS ----------
  // As outras abas nao gravam nada, mas nao podem quebrar ao abrir
  for (const aba of ['Nine Box', 'Calendário', 'Relatórios', 'Colaboradores']) {
    await page.getByRole('button', { name: aba, exact: true }).click()
    await expect(page.getByRole('heading', { name: 'Avaliação de Desempenho' }).first()).toBeVisible()
  }
})
