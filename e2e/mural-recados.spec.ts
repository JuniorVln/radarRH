import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E de fluxo do Mural de Recados: valida obrigatorios, publica, edita e exclui.
// A tela e de cards (nao tabela), entao a ancora e o card que contem o titulo.

const TITULO = '__TESTE_E2E__ Recado'
const TITULO_EDITADO = '__TESTE_E2E__ Recado revisado'
const CONTEUDO = 'Mensagem publicada pelo teste automatizado.'

async function limparResiduos() {
  await supabaseTest.from('recados').delete().like('titulo', '__TESTE_E2E__%')
}

test.beforeAll(limparResiduos)
test.afterAll(limparResiduos)

test('valida obrigatorios, publica, edita e exclui um recado', async ({ page }) => {
  page.on('dialog', d => d.accept())

  await page.goto('/mural-recados')
  await expect(page.getByRole('heading', { name: 'Mural de Recados' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })

  // ---------- VALIDACAO ----------
  await page.getByRole('button', { name: 'Novo Recado' }).first().click()
  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect(page.getByText('Título e mensagem são obrigatórios.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  // ---------- PUBLICAR ----------
  await campo(page, 'Título *').fill(TITULO)
  await campo(page, 'Autor').fill('QA Automatizado')
  await campo(page, 'Mensagem *').fill(CONTEUDO)

  await page.getByRole('button', { name: 'Publicar', exact: true }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Recado publicado!').first()).toBeVisible()

  await expect(page.getByRole('heading', { name: TITULO })).toBeVisible()
  await expect(page.getByText(CONTEUDO)).toBeVisible()

  const { data: criados } = await supabaseTest
    .from('recados')
    .select('id, titulo, conteudo, autor_nome')
    .like('titulo', '__TESTE_E2E__%')

  expect(criados).toHaveLength(1)
  const criado = criados![0]
  expect(criado).toMatchObject({ conteudo: CONTEUDO, autor_nome: 'QA Automatizado' })

  // ---------- EDITAR ----------
  await page.getByRole('heading', { name: TITULO }).click()
  await expect(campo(page, 'Título *')).toHaveValue(TITULO)

  await campo(page, 'Título *').fill(TITULO_EDITADO)
  await page.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(fecharModal).toHaveCount(0)

  const { data: editados } = await supabaseTest
    .from('recados')
    .select('id, titulo')
    .like('titulo', '__TESTE_E2E__%')

  expect(editados).toHaveLength(1) // editar nao pode duplicar
  expect(editados![0]).toMatchObject({ id: criado.id, titulo: TITULO_EDITADO })

  // ---------- EXCLUIR ----------
  // O X fica dentro do card; ancoro pelo card que contem o titulo pra nao apagar outro.
  const card = page.locator('div').filter({ has: page.getByRole('heading', { name: TITULO_EDITADO }) }).last()
  await card.getByRole('button').first().click()
  await expect(page.getByText('Recado excluído.').first()).toBeVisible()
  await expect(page.getByRole('heading', { name: TITULO_EDITADO })).toHaveCount(0)

  const { data: restantes } = await supabaseTest
    .from('recados')
    .select('id')
    .like('titulo', '__TESTE_E2E__%')
  expect(restantes).toHaveLength(0)
})
