import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E do Bloco B — os campos que dependiam da migration 20260728_bloco_b_campos.sql:
//  1. Mural: data do evento (separada da expiracao) + evento futuro sobe no mural
//  2. Treinamentos: link, carga horaria, periodo; e datas carimbadas por participante
//  3. Ferias: abono (venda de dias) com o limite legal
//  4. Recrutamento: origem da candidatura e motivo de saida do processo

const RECADO_FUTURO = '__TESTE_E2E__ Recado evento futuro'
const RECADO_ANTIGO = '__TESTE_E2E__ Recado sem evento'
const TRILHA = '__TESTE_E2E__ Trilha Bloco B'
const NOME_COLAB = '__TESTE_E2E__ Colaborador Bloco B'
const CANDIDATO = '__TESTE_E2E__ Candidato Bloco B'

// Datas fixas, longe do "hoje", pra o teste nao mudar de resultado com o passar dos dias.
const EVENTO_FUTURO = '2099-12-20'

let colaboradorId: string

async function limparResiduos() {
  await supabaseTest.from('recados').delete().like('titulo', '__TESTE_E2E__%')
  await supabaseTest.from('candidatos').delete().like('nome', '__TESTE_E2E__%')

  const { data: trilhas } = await supabaseTest
    .from('trilhas').select('id').like('nome', '__TESTE_E2E__%')
  for (const t of trilhas ?? []) {
    await supabaseTest.from('trilha_colaborador').delete().eq('trilha_id', t.id)
    await supabaseTest.from('trilhas').delete().eq('id', t.id)
  }

  const { data: colabs } = await supabaseTest
    .from('colaboradores').select('id').like('nome', '__TESTE_E2E__%')
  for (const c of colabs ?? []) {
    await supabaseTest.from('trilha_colaborador').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('ferias').delete().eq('colaborador_id', c.id)
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
      cpf: '999.888.733-99',
      cargo: 'Analista de Teste',
      setor: 'QA Automatizado',
      tipo: 'CLT',
      status: 'ativo',
      data_admissao: '2025-03-10',
    })
    .select()
    .single()
  expect(error).toBeNull()
  colaboradorId = data!.id
})

test.afterAll(limparResiduos)

test('Mural: data do evento é separada da expiração e evento futuro sobe no mural', async ({ page }) => {
  await page.goto('/mural-recados')
  await page.getByRole('button', { name: 'Novo Recado' }).first().click()

  await campo(page, 'Título *').fill(RECADO_FUTURO)
  await campo(page, 'Mensagem *').fill('Confraternização de fim de ano.')
  await campo(page, 'Data do Evento (opcional)').fill(EVENTO_FUTURO)
  // Expiracao DIFERENTE da data do evento — o ponto do campo novo e justamente que
  // "quando acontece" e "quando some do mural" sao coisas distintas.
  await campo(page, 'Data de Expiração (opcional)').fill('2099-12-31')

  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)

  const { data: recados } = await supabaseTest
    .from('recados').select('titulo, data_evento, data_expiracao').eq('titulo', RECADO_FUTURO)
  expect(recados).toHaveLength(1)
  expect(recados![0]).toMatchObject({ data_evento: EVENTO_FUTURO, data_expiracao: '2099-12-31' })

  // A data aparece no card
  await expect(page.getByText('20/12/2099')).toBeVisible()

  // Agora crio o recado SEM evento — e o mais NOVO, entao pela ordem de criacao ele
  // ficaria em 1o. So a regra do evento futuro pode empurrar o outro pra cima.
  // (Ordem invertida de proposito: criar o "sem evento" antes fazia o teste passar
  // sozinho e um canario de ordenacao passou batido.)
  await supabaseTest.from('recados').insert({ titulo: RECADO_ANTIGO, conteudo: 'Sem evento.' })
  await page.reload()
  await expect(page.getByRole('heading', { name: RECADO_ANTIGO })).toBeVisible()

  // E o recado com evento futuro vem ANTES do recado sem evento, mesmo tendo sido
  // publicado depois. Sem isso o campo seria so decoracao.
  const titulos = await page.getByRole('heading', { level: 3 }).allInnerTexts()
  const iFuturo = titulos.indexOf(RECADO_FUTURO)
  const iAntigo = titulos.indexOf(RECADO_ANTIGO)
  expect(iFuturo).toBeGreaterThanOrEqual(0)
  expect(iAntigo).toBeGreaterThanOrEqual(0)
  expect(iFuturo).toBeLessThan(iAntigo)
})

test('Treinamentos: link e carga horária na trilha, datas carimbadas por participante', async ({ page }) => {
  await page.goto('/treinamentos')
  await page.getByRole('button', { name: 'Nova Trilha' }).first().click()

  await campo(page, 'Nome da Trilha *').fill(TRILHA)
  await campo(page, 'Link do treinamento').fill('https://exemplo.local/curso')
  await campo(page, 'Carga horária (h)').fill('8')
  await campo(page, 'Início').fill('2026-08-03')
  await campo(page, 'Fim previsto').fill('2026-08-28')
  await page.getByRole('button', { name: 'Criar Trilha' }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)

  const { data: trilhas } = await supabaseTest
    .from('trilhas')
    .select('id, link_url, carga_horaria, data_inicio, data_fim')
    .like('nome', '__TESTE_E2E__%')
  expect(trilhas).toHaveLength(1)
  expect(trilhas![0]).toMatchObject({
    link_url: 'https://exemplo.local/curso',
    carga_horaria: 8,
    data_inicio: '2026-08-03',
    data_fim: '2026-08-28',
  })

  // O link tem que virar link clicavel no card, nao texto solto
  const link = page.getByRole('link', { name: 'Abrir treinamento' })
  await expect(link).toHaveAttribute('href', 'https://exemplo.local/curso')
  await expect(page.getByText('8h')).toBeVisible()

  // Atribui com progresso 0 — quem nao comecou nao pode ganhar data de inicio
  await page.getByRole('button', { name: 'Progresso Colaboradores' }).click()
  await page.getByRole('button', { name: 'Atribuir Trilha' }).first().click()
  await campo(page, 'Trilha *').selectOption(trilhas![0].id)
  await campo(page, 'Colaborador *').fill(NOME_COLAB)
  await campo(page, 'Progresso inicial (%)').fill('0')
  await page.getByRole('button', { name: 'Atribuir', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)

  const lerAtribuicao = async () => {
    const { data } = await supabaseTest
      .from('trilha_colaborador')
      .select('progresso, status, data_inicio, data_conclusao')
      .eq('colaborador_id', colaboradorId)
      .single()
    return data
  }

  expect(await lerAtribuicao()).toMatchObject({
    progresso: 0,
    status: 'nao_iniciado',
    data_inicio: null,
    data_conclusao: null,
  })

  const hoje = new Date().toISOString().slice(0, 10)
  const linha = page.getByRole('row', { name: new RegExp(NOME_COLAB) })

  // Primeiro avanco carimba o inicio
  await linha.getByRole('spinbutton').fill('40')
  await linha.getByRole('spinbutton').blur()
  await expect.poll(lerAtribuicao, { message: 'o inicio nao foi carimbado' })
    .toMatchObject({ progresso: 40, status: 'em_andamento', data_inicio: hoje, data_conclusao: null })

  // 100% carimba a conclusao e PRESERVA o inicio original
  await linha.getByRole('spinbutton').fill('100')
  await linha.getByRole('spinbutton').blur()
  await expect.poll(lerAtribuicao, { message: 'a conclusao nao foi carimbada' })
    .toMatchObject({ progresso: 100, status: 'concluido', data_inicio: hoje, data_conclusao: hoje })

  // Voltar de 100 tem que LIMPAR a conclusao — senao fica "concluido em" numa
  // trilha que voltou a ficar em andamento.
  await linha.getByRole('spinbutton').fill('60')
  await linha.getByRole('spinbutton').blur()
  await expect.poll(lerAtribuicao, { message: 'a conclusao nao foi limpa ao voltar' })
    .toMatchObject({ progresso: 60, status: 'em_andamento', data_conclusao: null })
})

test('Férias: abono respeita o limite legal e entra no CSV', async ({ page }) => {
  await page.goto('/provisao-ferias')
  await page.getByRole('button', { name: 'Programar Férias' }).first().click()

  await campo(page, 'Colaborador *').selectOption(colaboradorId)
  await campo(page, 'Período Aquisitivo — Início *').fill('2025-03-10')

  // Acima do teto legal (1/3 = 10 dias) tem que barrar
  await campo(page, 'Abono (venda de dias)').fill('15')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('O abono (venda de dias) vai de 0 a 10 dias.').first()).toBeVisible()

  // Gozo + abono acima de 30 tambem
  await campo(page, 'Abono (venda de dias)').fill('10')
  await campo(page, 'Nº de Dias').fill('30')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Gozo + abono não pode passar de 30 dias.').first()).toBeVisible()

  const { data: nadaAinda } = await supabaseTest
    .from('ferias').select('id').eq('colaborador_id', colaboradorId)
  expect(nadaAinda).toHaveLength(0)

  // Combinacao valida: 20 de gozo + 10 vendidos
  await campo(page, 'Nº de Dias').fill('20')
  await campo(page, 'Observação').fill('Vendeu 10 dias.')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)

  const { data: ferias } = await supabaseTest
    .from('ferias')
    .select('dias, dias_abono, observacao')
    .eq('colaborador_id', colaboradorId)
  expect(ferias).toHaveLength(1)
  expect(ferias![0]).toMatchObject({ dias: 20, dias_abono: 10, observacao: 'Vendeu 10 dias.' })

  await expect(page.getByRole('cell', { name: '10d' })).toBeVisible()

  // O abono precisa sair no CSV — e o numero que a folha usa
  await page.getByPlaceholder('Buscar colaborador...').fill(NOME_COLAB)
  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar CSV' }).click(),
  ]).then(([d]) => d)
  const caminho = await download.path()
  const conteudo = await import('node:fs').then(fs => fs.readFileSync(caminho!, 'utf8'))
  expect(conteudo).toContain('Abono (dias vendidos)')
  expect(conteudo.trim().split('\r\n')[1]).toContain(';10;')
})

test('Recrutamento: origem e motivo de saída com data carimbada', async ({ page }) => {
  await page.goto('/recrutamento')
  await page.getByRole('button', { name: 'Novo Candidato' }).first().click()

  await campo(page, 'Nome *').fill(CANDIDATO)
  await campo(page, 'Origem da candidatura').selectOption('LinkedIn')
  await page.getByRole('button', { name: 'Adicionar Candidato' }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)

  const { data: criados } = await supabaseTest
    .from('candidatos')
    .select('id, origem, motivo_desfecho, data_desfecho')
    .like('nome', '__TESTE_E2E__%')
  expect(criados).toHaveLength(1)
  // Sem motivo, nao pode existir data de desfecho
  expect(criados![0]).toMatchObject({
    origem: 'LinkedIn',
    motivo_desfecho: null,
    data_desfecho: null,
  })

  // Ao registrar o motivo, o sistema carimba a data sozinho
  const card = page.locator('.kanban-card').filter({ hasText: CANDIDATO })
  await card.getByText(CANDIDATO).click()
  await campo(page, 'Motivo de saída do processo').fill('Desistiu — aceitou outra proposta')
  await page.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)

  const hoje = new Date().toISOString().slice(0, 10)
  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('candidatos')
        .select('motivo_desfecho, data_desfecho, origem')
        .eq('id', criados![0].id)
        .single()
      return data
    }, { message: 'o motivo/data de desfecho nao foi gravado' })
    .toMatchObject({
      motivo_desfecho: 'Desistiu — aceitou outra proposta',
      data_desfecho: hoje,
      origem: 'LinkedIn', // editar nao pode perder a origem
    })
})
