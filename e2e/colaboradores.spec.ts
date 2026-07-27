import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'

// E2E de fluxo da pagina de Colaboradores: cria, confere na tela E no banco, edita,
// filtra pela busca e exclui. E o cadastro que alimenta Beneficios, Ferias, Turnover
// e Avaliacao — se salvar quebra aqui, quebra o sistema inteiro.
//
// Os dados de teste sao marcados com __TESTE_E2E__ e removidos no inicio e no fim,
// entao rodar isso contra o banco real nao suja o cadastro da Deise.

const NOME = '__TESTE_E2E__ Colaborador'
const NOME_EDITADO = '__TESTE_E2E__ Colaborador (editado)'
const CPF = '999.888.777-66'
const CARGO = 'Analista de Teste'
const CARGO_EDITADO = 'Coordenador de Teste'
const SETOR = 'QA Automatizado'

// Salva e espera o modal REALMENTE fechar antes de conferir o banco.
// Duas armadilhas ja pegas aqui:
//  - o toast nao serve de sinal: o react-hot-toast do save anterior ainda esta na tela,
//    entao a assercao passa na hora e a leitura acontece antes do UPDATE chegar;
//  - o proprio botao "Salvar" nao serve: ele vira "Salvando..." durante a requisicao,
//    entao esperar ele sumir tambem passa cedo demais.
// O "Cancelar" fica igual do inicio ao fim e so some quando o modal fecha de verdade.
async function salvarEEsperarFechar(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)
}

async function limparResiduos() {
  const { data } = await supabaseTest
    .from('colaboradores')
    .select('id')
    .like('nome', '__TESTE_E2E__%')

  for (const c of data ?? []) {
    // movimentacoes tem FK pro colaborador; apaga primeiro pra nao travar o delete
    await supabaseTest.from('movimentacoes').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('colaboradores').delete().eq('id', c.id)
  }
}

test.beforeAll(limparResiduos)
test.afterAll(limparResiduos)

test('cria, edita, filtra e exclui um colaborador', async ({ page }) => {
  await page.goto('/colaboradores')
  await expect(page.getByRole('heading', { name: 'Colaboradores' }).first()).toBeVisible()

  // ---------- CRIAR ----------
  await page.getByRole('button', { name: 'Novo Colaborador' }).first().click()
  await expect(page.getByText('Novo Colaborador', { exact: true }).last()).toBeVisible()

  await page.getByLabel('Nome Completo *').fill(NOME)
  await page.getByLabel('CPF *').fill(CPF)

  await page.getByRole('button', { name: 'Contrato & Vínculo' }).click()
  await page.getByLabel('Cargo *').fill(CARGO)
  await page.getByLabel('Setor *').fill(SETOR)
  await page.getByLabel('Tipo de Contrato').selectOption('CLT')
  await page.getByLabel('Data Admissão').fill('2026-07-01')

  await salvarEEsperarFechar(page)
  await expect(page.getByText('Salvo com sucesso!').first()).toBeVisible()

  // Confere na TELA
  await page.getByPlaceholder('Buscar por nome, email ou cargo...').fill(NOME)
  await expect(page.getByRole('cell', { name: NOME })).toBeVisible()
  await expect(page.getByRole('cell', { name: CARGO, exact: true })).toBeVisible()

  // Confere no BANCO — a tela pode mostrar estado local sem ter persistido
  const { data: criados } = await supabaseTest
    .from('colaboradores')
    .select('id, nome, cpf, cargo, setor, tipo, status, data_admissao')
    .eq('nome', NOME)

  expect(criados).toHaveLength(1)
  const criado = criados![0]
  expect(criado).toMatchObject({
    cpf: CPF,
    cargo: CARGO,
    setor: SETOR,
    tipo: 'CLT',
    status: 'ativo',
    data_admissao: '2026-07-01',
  })

  // O salvamento tem que ter gerado a movimentacao de admissao — e dela que o
  // Dashboard e o Turnover se alimentam. Ja quebrou antes, entao vai verificado.
  const { data: movs } = await supabaseTest
    .from('movimentacoes')
    .select('tipo, data')
    .eq('colaborador_id', criado.id)

  expect(movs).toHaveLength(1)
  expect(movs![0]).toMatchObject({ tipo: 'admissao', data: '2026-07-01' })

  // ---------- EDITAR ----------
  await page.getByRole('cell', { name: NOME }).click()
  await expect(page.getByText('Editar Colaborador').last()).toBeVisible()

  await page.getByLabel('Nome Completo *').fill(NOME_EDITADO)
  await page.getByRole('button', { name: 'Contrato & Vínculo' }).click()
  await page.getByLabel('Cargo *').fill(CARGO_EDITADO)
  await salvarEEsperarFechar(page)

  const { data: editados } = await supabaseTest
    .from('colaboradores')
    .select('id, nome, cargo')
    .eq('id', criado.id)
    .single()

  expect(editados).toMatchObject({ nome: NOME_EDITADO, cargo: CARGO_EDITADO })

  // Editar nao pode duplicar o registro nem criar movimentacao nova
  const { data: movsDepois } = await supabaseTest
    .from('movimentacoes')
    .select('tipo')
    .eq('colaborador_id', criado.id)
  expect(movsDepois).toHaveLength(1)

  // ---------- FILTRAR ----------
  const busca = page.getByPlaceholder('Buscar por nome, email ou cargo...')
  await busca.fill(NOME_EDITADO)
  await expect(page.getByRole('cell', { name: NOME_EDITADO })).toBeVisible()

  await busca.fill('__NAO_EXISTE_ESSE_COLABORADOR__')
  await expect(page.getByText('Nenhum colaborador encontrado')).toBeVisible()

  await busca.fill(NOME_EDITADO)
  await expect(page.getByRole('cell', { name: NOME_EDITADO })).toBeVisible()

  // ---------- EXCLUIR ----------
  const linha = page.getByRole('row', { name: new RegExp(NOME_EDITADO.replace(/[()]/g, '\\$&')) })
  await linha.getByTitle('Excluir').click()

  await expect(page.getByText('Esta ação não pode ser desfeita.')).toBeVisible()
  // .btn-danger distingue o "Excluir" do modal de confirmacao do iconezinho da linha,
  // que tambem tem nome acessivel "Excluir" (via title).
  await page.locator('button.btn-danger', { hasText: 'Excluir' }).click()
  await expect(page.getByText('Colaborador excluído.').first()).toBeVisible()

  await expect(page.getByRole('cell', { name: NOME_EDITADO })).toHaveCount(0)

  const { data: restantes } = await supabaseTest
    .from('colaboradores')
    .select('id')
    .eq('id', criado.id)
  expect(restantes).toHaveLength(0)
})
