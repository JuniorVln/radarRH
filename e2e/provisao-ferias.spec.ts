import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'

// E2E de fluxo da Provisao de Ferias: valida obrigatorios, programa, confere o
// preenchimento automatico do periodo/vencimento, edita, filtra, navega pelas abas
// e exclui. Ferias entra no calculo de VR/VT (dia de ferias desconta beneficio),
// entao erro aqui tambem vira erro de dinheiro.

const NOME_COLAB = '__TESTE_E2E__ Colaborador Ferias'
const AQUISITIVO_INICIO = '2025-03-10'
const GOZO = '2026-09-01'

let colaboradorId: string

async function limparResiduos() {
  const { data: colabs } = await supabaseTest
    .from('colaboradores')
    .select('id')
    .like('nome', '__TESTE_E2E__%')

  for (const c of colabs ?? []) {
    await supabaseTest.from('ferias').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('ocorrencias').delete().eq('colaborador_id', c.id)
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
      cpf: '999.888.777-44',
      cargo: 'Analista de Teste',
      setor: 'QA Automatizado',
      tipo: 'CLT',
      status: 'ativo',
      data_admissao: '2025-03-10',
    })
    .select()
    .single()

  expect(error, 'nao consegui criar o colaborador de teste').toBeNull()
  colaboradorId = data!.id
})

test.afterAll(limparResiduos)

test('valida obrigatorios, programa, edita, filtra e exclui um periodo de ferias', async ({ page }) => {
  page.on('dialog', d => d.accept()) // o excluir usa confirm() nativo

  await page.goto('/provisao-ferias')
  await expect(page.getByRole('heading', { name: 'Provisão de Férias' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })

  // ---------- VALIDACAO DE OBRIGATORIOS ----------
  await page.getByRole('button', { name: 'Programar Férias' }).first().click()
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Preencha colaborador e período aquisitivo.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  // ---------- PROGRAMAR ----------
  await page.getByLabel('Colaborador *').selectOption(colaboradorId)
  await page.getByLabel('Período Aquisitivo — Início *').fill(AQUISITIVO_INICIO)

  // A tela deriva sozinha o fim do aquisitivo (+1 ano) e o vencimento (+2 anos).
  // Se essa regra quebrar, o RH programa ferias com prazo errado — vai verificado.
  await expect(page.getByLabel('Período Aquisitivo — Fim *')).toHaveValue('2026-03-09')
  await expect(page.getByLabel('Vencimento (limite p/ gozo)')).toHaveValue('2027-03-09')

  await page.getByLabel('Início do Gozo').fill(GOZO)
  await page.getByLabel('Nº de Dias').fill('20')

  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Férias lançadas.').first()).toBeVisible()

  // Confere na TELA
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()

  // Confere no BANCO
  const { data: criadas } = await supabaseTest
    .from('ferias')
    .select('id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim, vencimento, gozo_programado, dias, status')
    .eq('colaborador_id', colaboradorId)

  expect(criadas).toHaveLength(1)
  const criada = criadas![0]
  expect(criada).toMatchObject({
    periodo_aquisitivo_inicio: AQUISITIVO_INICIO,
    periodo_aquisitivo_fim: '2026-03-09',
    vencimento: '2027-03-09',
    gozo_programado: GOZO,
    dias: 20,
    // regra da tela: com gozo preenchido, "pendente" vira "programada" sozinho
    status: 'programada',
  })

  // ---------- ABAS ----------
  // A programada tem que aparecer na aba Programação (e a aba nao pode explodir)
  await page.getByRole('button', { name: 'Programação' }).click()
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()
  await page.getByRole('button', { name: 'Gestão por Vencimento' }).click()
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()
  await page.getByRole('button', { name: 'Relatório' }).click()
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()

  // ---------- EDITAR ----------
  await page.getByRole('cell', { name: NOME_COLAB }).click()
  await expect(page.getByLabel('Nº de Dias')).toHaveValue('20')

  await page.getByLabel('Nº de Dias').fill('30')
  await page.getByLabel('Status').selectOption('gozada')
  await page.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(fecharModal).toHaveCount(0)

  const { data: editadas } = await supabaseTest
    .from('ferias')
    .select('id, dias, status')
    .eq('colaborador_id', colaboradorId)

  expect(editadas).toHaveLength(1) // editar nao pode criar registro novo
  expect(editadas![0]).toMatchObject({ id: criada.id, dias: 30, status: 'gozada' })

  // ---------- FILTRAR ----------
  const busca = page.getByPlaceholder('Buscar colaborador...')
  await busca.fill(NOME_COLAB)
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()

  await busca.fill('__NAO_EXISTE_ESSE_COLABORADOR__')
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toHaveCount(0)

  await busca.fill(NOME_COLAB)
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()

  // ---------- EXCLUIR ----------
  await page.getByRole('row', { name: new RegExp(NOME_COLAB) }).getByRole('button').click()
  await expect(page.getByText('Registro excluído.').first()).toBeVisible()
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toHaveCount(0)

  const { data: restantes } = await supabaseTest
    .from('ferias')
    .select('id')
    .eq('colaborador_id', colaboradorId)
  expect(restantes).toHaveLength(0)
})
