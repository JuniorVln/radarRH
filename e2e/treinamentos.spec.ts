import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E de fluxo de Treinamentos: cria trilha, atribui a um colaborador e mexe no
// progresso. O progresso e o ponto sensivel: alem de gravar o numero, ele DERIVA o
// status sozinho (0 = nao iniciado, 1-99 = em andamento, 100 = concluido) e salva no
// blur, sem botao. Se derivar errado, o RH ve gente "concluida" que nao terminou.

const NOME_COLAB = '__TESTE_E2E__ Colaborador Trilha'
const TRILHA = '__TESTE_E2E__ Trilha'
const TRILHA_EDITADA = '__TESTE_E2E__ Trilha revisada'

let colaboradorId: string

async function limparResiduos() {
  const { data: trilhas } = await supabaseTest
    .from('trilhas')
    .select('id')
    .like('nome', '__TESTE_E2E__%')

  for (const t of trilhas ?? []) {
    await supabaseTest.from('trilha_colaborador').delete().eq('trilha_id', t.id)
    await supabaseTest.from('trilhas').delete().eq('id', t.id)
  }

  const { data: colabs } = await supabaseTest
    .from('colaboradores')
    .select('id')
    .like('nome', '__TESTE_E2E__%')

  for (const c of colabs ?? []) {
    await supabaseTest.from('trilha_colaborador').delete().eq('colaborador_id', c.id)
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
      cpf: '999.888.776-99',
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

test('cria trilha, atribui a colaborador, move o progresso e exclui', async ({ page }) => {
  page.on('dialog', d => d.accept())

  await page.goto('/treinamentos')
  await expect(page.getByRole('heading', { name: 'Treinamentos' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })

  // ---------- VALIDACAO ----------
  await page.getByRole('button', { name: 'Nova Trilha' }).first().click()
  await page.getByRole('button', { name: 'Criar Trilha' }).click()
  await expect(page.getByText('Nome é obrigatório.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  // ---------- CRIAR TRILHA ----------
  await campo(page, 'Nome da Trilha *').fill(TRILHA)
  await campo(page, 'Setor (opcional)').fill('QA Automatizado')
  await campo(page, 'Descrição').fill('Trilha criada pelo teste automatizado.')
  await page.getByRole('button', { name: 'Criar Trilha' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Trilha criada!').first()).toBeVisible()

  await expect(page.getByRole('heading', { name: TRILHA })).toBeVisible()

  const { data: trilhas } = await supabaseTest
    .from('trilhas')
    .select('id, nome, setor, status')
    .like('nome', '__TESTE_E2E__%')

  expect(trilhas).toHaveLength(1)
  const trilha = trilhas![0]
  expect(trilha).toMatchObject({ setor: 'QA Automatizado', status: 'ativo' })

  // ---------- ATRIBUIR AO COLABORADOR ----------
  // O botao "Atribuir Trilha" so existe na aba de progresso — na aba de trilhas o
  // botao primario e o "Nova Trilha".
  await page.getByRole('button', { name: 'Progresso Colaboradores' }).click()
  await page.getByRole('button', { name: 'Atribuir Trilha' }).first().click()
  await page.getByRole('button', { name: 'Atribuir', exact: true }).click()
  await expect(page.getByText('Selecione a trilha e o colaborador.').first()).toBeVisible()

  await campo(page, 'Trilha *').selectOption(trilha.id)
  // Nome inexistente nao pode gravar
  await campo(page, 'Colaborador *').fill('__NAO_EXISTE_ESSE_COLABORADOR__')
  await page.getByRole('button', { name: 'Atribuir', exact: true }).click()
  await expect(page.getByText('Colaborador não encontrado. Verifique o nome.').first()).toBeVisible()

  await campo(page, 'Colaborador *').fill(NOME_COLAB)
  await campo(page, 'Progresso inicial (%)').fill('0')
  await page.getByRole('button', { name: 'Atribuir', exact: true }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Trilha atribuída ao colaborador!').first()).toBeVisible()

  const { data: atribuicoes } = await supabaseTest
    .from('trilha_colaborador')
    .select('id, progresso, status')
    .eq('colaborador_id', colaboradorId)

  expect(atribuicoes).toHaveLength(1)
  const atribuicaoId = atribuicoes![0].id

  // ---------- MOVER O PROGRESSO ----------
  const linha = page.getByRole('row', { name: new RegExp(NOME_COLAB) })
  await expect(linha).toBeVisible()

  const lerAtribuicao = async () => {
    const { data } = await supabaseTest
      .from('trilha_colaborador')
      .select('progresso, status')
      .eq('id', atribuicaoId)
      .single()
    return data
  }

  // 40% => tem que virar "em andamento" sozinho
  await linha.getByRole('spinbutton').fill('40')
  await linha.getByRole('spinbutton').blur()
  await expect.poll(lerAtribuicao, { message: 'progresso 40 nao chegou no banco' })
    .toMatchObject({ progresso: 40, status: 'em_andamento' })

  // 100% => tem que virar "concluido" sozinho
  await linha.getByRole('spinbutton').fill('100')
  await linha.getByRole('spinbutton').blur()
  await expect.poll(lerAtribuicao, { message: 'progresso 100 nao concluiu a trilha' })
    .toMatchObject({ progresso: 100, status: 'concluido' })

  // ---------- EDITAR E EXCLUIR A TRILHA ----------
  await page.getByRole('button', { name: 'Gerenciar Trilhas' }).click()
  await page.getByRole('heading', { name: TRILHA }).click()
  await campo(page, 'Nome da Trilha *').fill(TRILHA_EDITADA)
  await page.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(fecharModal).toHaveCount(0)

  const { data: editadas } = await supabaseTest
    .from('trilhas')
    .select('id, nome')
    .like('nome', '__TESTE_E2E__%')
  expect(editadas).toHaveLength(1) // editar nao pode duplicar
  expect(editadas![0]).toMatchObject({ id: trilha.id, nome: TRILHA_EDITADA })

  // Ancoro pela classe do card: o titulo fica numa div aninhada, entao pegar a div
  // "mais interna que contem o titulo" acha o wrapper de texto, que nao tem o botao.
  const cartao = page.locator('div.cursor-pointer.rounded-xl').filter({ hasText: TRILHA_EDITADA })
  await cartao.getByRole('button').click()
  await expect(page.getByText('Trilha excluída.').first()).toBeVisible()

  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('trilhas')
        .select('id')
        .like('nome', '__TESTE_E2E__%')
      return data?.length
    })
    .toBe(0)
})
