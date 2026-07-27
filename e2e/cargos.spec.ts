import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E de fluxo de Cargos e Salarios: valida obrigatorio, cadastra, edita, filtra, exclui.

const TITULO = '__TESTE_E2E__ Cargo'
const TITULO_EDITADO = '__TESTE_E2E__ Cargo revisado'

async function limparResiduos() {
  await supabaseTest.from('cargos').delete().like('titulo', '__TESTE_E2E__%')
}

test.beforeAll(limparResiduos)
test.afterAll(limparResiduos)

test('valida obrigatorio, cadastra, edita, filtra e exclui um cargo', async ({ page }) => {
  page.on('dialog', d => d.accept())

  await page.goto('/cargos')
  await expect(page.getByRole('heading', { name: 'Cargos e Salários' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })

  // ---------- VALIDACAO ----------
  await page.getByRole('button', { name: 'Novo Cargo' }).click()
  await page.getByRole('button', { name: 'Salvar Cargo' }).click()
  await expect(page.getByText('Título do cargo é obrigatório.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  // ---------- CADASTRAR ----------
  await campo(page, 'Título *').fill(TITULO)
  await campo(page, 'Área').fill('QA Automatizado')
  await campo(page, 'Nível').selectOption('Sênior')
  // Campo com mascara de dinheiro: o valor digitado tem que virar numero no banco
  await campo(page, 'Salário mínimo').fill('2.500,00')
  await campo(page, 'Salário máximo').fill('3.200,50')
  await campo(page, 'Atribuições').fill('Escrever testes que realmente reprovam.')

  await page.getByRole('button', { name: 'Salvar Cargo' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Cargo cadastrado.').first()).toBeVisible()

  await expect(page.getByText(TITULO)).toBeVisible()

  const { data: criados } = await supabaseTest
    .from('cargos')
    .select('id, titulo, area, nivel, salario_min, salario_max, atribuicoes, status')
    .eq('titulo', TITULO)

  expect(criados).toHaveLength(1)
  const criado = criados![0]
  expect(criado).toMatchObject({
    area: 'QA Automatizado',
    nivel: 'Sênior',
    salario_min: 2500,
    salario_max: 3200.5,
    status: 'ativo',
  })

  // ---------- EDITAR ----------
  await page.getByText(TITULO).click()
  await expect(campo(page, 'Título *')).toHaveValue(TITULO)

  await campo(page, 'Título *').fill(TITULO_EDITADO)
  await campo(page, 'Status').selectOption('inativo')
  await page.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(fecharModal).toHaveCount(0)

  const { data: editados } = await supabaseTest
    .from('cargos')
    .select('id, titulo, status')
    .like('titulo', '__TESTE_E2E__%')

  expect(editados).toHaveLength(1) // editar nao pode duplicar
  expect(editados![0]).toMatchObject({ id: criado.id, titulo: TITULO_EDITADO, status: 'inativo' })

  // ---------- FILTRAR ----------
  const busca = page.getByPlaceholder('Buscar por cargo, área ou nível...')
  await busca.fill(TITULO_EDITADO)
  await expect(page.getByText(TITULO_EDITADO)).toBeVisible()

  await busca.fill('__NAO_EXISTE_ESSE_CARGO__')
  await expect(page.getByText('Nenhum cargo encontrado')).toBeVisible()

  await busca.fill(TITULO_EDITADO)

  // ---------- EXCLUIR ----------
  await page.getByRole('row', { name: new RegExp(TITULO_EDITADO) }).getByRole('button').click()
  await expect(page.getByText('Cargo excluído.').first()).toBeVisible()
  await expect(page.getByText(TITULO_EDITADO)).toHaveCount(0)

  const { data: restantes } = await supabaseTest
    .from('cargos')
    .select('id')
    .like('titulo', '__TESTE_E2E__%')
  expect(restantes).toHaveLength(0)
})
