import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'

// E2E de fluxo da pagina de Ocorrencias: valida campos obrigatorios, registra, edita,
// filtra e exclui — conferindo cada passo na tela E no banco. Ocorrencias alimenta o
// calculo de VR/VT em Beneficios (falta = desconto), entao erro aqui vira erro de
// dinheiro no beneficio do colaborador.

const NOME_COLAB = '__TESTE_E2E__ Colaborador Ocorrencia'
const DESCRICAO = '__TESTE_E2E__ falta registrada pelo teste'
const DESCRICAO_EDITADA = '__TESTE_E2E__ falta revisada pelo teste'
const DATA = '2026-07-08'

let colaboradorId: string

async function limparResiduos() {
  const { data: colabs } = await supabaseTest
    .from('colaboradores')
    .select('id')
    .like('nome', '__TESTE_E2E__%')

  for (const c of colabs ?? []) {
    await supabaseTest.from('ocorrencias').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('movimentacoes').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('colaboradores').delete().eq('id', c.id)
  }
  await supabaseTest.from('ocorrencias').delete().like('descricao', '__TESTE_E2E__%')
}

test.beforeAll(async () => {
  await limparResiduos()
  // O select do modal so lista colaboradores ATIVOS — o fixture precisa nascer ativo.
  const { data, error } = await supabaseTest
    .from('colaboradores')
    .insert({
      nome: NOME_COLAB,
      cpf: '999.888.777-55',
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

test('valida obrigatorios, registra, edita, filtra e exclui uma ocorrencia', async ({ page }) => {
  // O delete usa confirm() nativo — sem isso o Playwright dispensa o dialog e nada acontece.
  page.on('dialog', d => d.accept())

  await page.goto('/ocorrencias')
  await expect(page.getByRole('heading', { name: 'Ocorrências' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })
  const registrar = page.getByRole('button', { name: 'Registrar', exact: true })

  // ---------- VALIDACAO DE OBRIGATORIOS ----------
  await page.getByRole('button', { name: 'Nova Ocorrência' }).click()
  await registrar.click()
  await expect(page.getByText('Preencha colaborador, data e descrição.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible() // nao pode fechar nem salvar nada

  const { data: nadaCriado } = await supabaseTest
    .from('ocorrencias')
    .select('id')
    .eq('colaborador_id', colaboradorId)
  expect(nadaCriado).toHaveLength(0)

  // ---------- REGISTRAR ----------
  await page.getByLabel('Colaborador *').selectOption(colaboradorId)
  await page.getByLabel('Tipo', { exact: true }).selectOption('falta')
  await page.getByLabel('Data *').fill(DATA)
  await page.getByLabel('Severidade').selectOption('alta')
  await page.getByLabel('Horas').fill('8')
  await page.getByLabel('Descrição *').fill(DESCRICAO)

  await registrar.click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Ocorrência registrada.').first()).toBeVisible()

  // Confere na TELA
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()
  await expect(page.getByText(DESCRICAO)).toBeVisible()
  await expect(page.getByRole('cell', { name: '08/07/2026' })).toBeVisible()

  // Confere no BANCO
  const { data: criadas } = await supabaseTest
    .from('ocorrencias')
    .select('id, tipo, data_ocorrencia, severidade, horas, descricao, status')
    .eq('colaborador_id', colaboradorId)

  expect(criadas).toHaveLength(1)
  const criada = criadas![0]
  expect(criada).toMatchObject({
    tipo: 'falta',
    data_ocorrencia: DATA,
    severidade: 'alta',
    horas: 8,
    descricao: DESCRICAO,
    status: 'registrada',
  })

  // ---------- EDITAR ----------
  await page.getByRole('cell', { name: NOME_COLAB }).click()
  await expect(page.getByLabel('Descrição *')).toHaveValue(DESCRICAO)

  await page.getByLabel('Descrição *').fill(DESCRICAO_EDITADA)
  await page.getByLabel('Status').selectOption('resolvida')
  await page.getByLabel('Ação tomada').fill('Descontado em folha pelo teste automatizado.')

  await registrar.click()
  await expect(fecharModal).toHaveCount(0)

  const { data: editadas } = await supabaseTest
    .from('ocorrencias')
    .select('id, descricao, status, acao_tomada')
    .eq('colaborador_id', colaboradorId)

  // Editar nao pode virar um registro novo
  expect(editadas).toHaveLength(1)
  expect(editadas![0]).toMatchObject({
    id: criada.id,
    descricao: DESCRICAO_EDITADA,
    status: 'resolvida',
    acao_tomada: 'Descontado em folha pelo teste automatizado.',
  })

  // ---------- FILTRAR ----------
  const busca = page.getByPlaceholder('Buscar por colaborador, tipo ou descrição...')
  await busca.fill(NOME_COLAB)
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()

  await busca.fill('__NAO_EXISTE_ESSA_OCORRENCIA__')
  await expect(page.getByText('Nenhuma ocorrência encontrada')).toBeVisible()

  await busca.fill(NOME_COLAB)
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toBeVisible()

  // ---------- EXCLUIR ----------
  await page.getByRole('row', { name: new RegExp(NOME_COLAB) }).getByRole('button').click()
  await expect(page.getByText('Ocorrência excluída.').first()).toBeVisible()
  await expect(page.getByRole('cell', { name: NOME_COLAB })).toHaveCount(0)

  const { data: restantes } = await supabaseTest
    .from('ocorrencias')
    .select('id')
    .eq('colaborador_id', colaboradorId)
  expect(restantes).toHaveLength(0)
})
