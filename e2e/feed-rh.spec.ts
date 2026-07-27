import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E de fluxo do Feed RH: valida obrigatorio, publica, curte (incrementa contador
// no banco sem botao de salvar) e exclui.

const CONTEUDO = '__TESTE_E2E__ publicacao do teste automatizado'

async function limparResiduos() {
  await supabaseTest.from('feed_posts').delete().like('conteudo', '__TESTE_E2E__%')
}

test.beforeAll(limparResiduos)
test.afterAll(limparResiduos)

test('valida obrigatorio, publica, curte e exclui uma publicacao', async ({ page }) => {
  page.on('dialog', d => d.accept()) // excluir usa confirm() nativo

  await page.goto('/feed-rh')
  await expect(page.getByRole('heading', { name: 'Feed RH' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })
  const publicarModal = page.getByRole('button', { name: 'Publicar', exact: true }).last()

  // ---------- VALIDACAO ----------
  await page.getByText('Compartilhe uma novidade com a equipe...').click()
  await publicarModal.click()
  await expect(page.getByText('Escreva a mensagem da publicação.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  // ---------- PUBLICAR ----------
  await campo(page, 'Autor').fill('QA Automatizado')
  await campo(page, 'Mensagem *').fill(CONTEUDO)
  await publicarModal.click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Publicação feita!').first()).toBeVisible()

  await expect(page.getByText(CONTEUDO)).toBeVisible()

  const { data: criados } = await supabaseTest
    .from('feed_posts')
    .select('id, conteudo, autor_nome, curtidas')
    .like('conteudo', '__TESTE_E2E__%')

  expect(criados).toHaveLength(1)
  const criado = criados![0]
  expect(criado).toMatchObject({ autor_nome: 'QA Automatizado', curtidas: 0 })

  // ---------- CURTIR ----------
  // Incrementa direto no banco, sem botao de salvar — se parar de gravar, o numero
  // ate sobe na tela e volta ao recarregar. Por isso confiro no banco.
  const post = page.locator('div').filter({ hasText: CONTEUDO }).last()
  await post.getByRole('button', { name: '0' }).click()

  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('feed_posts')
        .select('curtidas')
        .eq('id', criado.id)
        .single()
      return data?.curtidas
    }, { message: 'a curtida nao chegou no banco' })
    .toBe(1)

  // ---------- EXCLUIR ----------
  await post.getByRole('button').first().click()
  await expect(page.getByText('Publicação excluída.').first()).toBeVisible()
  await expect(page.getByText(CONTEUDO)).toHaveCount(0)

  const { data: restantes } = await supabaseTest
    .from('feed_posts')
    .select('id')
    .like('conteudo', '__TESTE_E2E__%')
  expect(restantes).toHaveLength(0)
})
