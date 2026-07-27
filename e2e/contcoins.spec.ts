import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E de fluxo do ContCoins. O interessante aqui nao e o CRUD e sim o ACUMULADOR:
// cada transacao grava em contcoins_transacoes E recalcula o saldo em contcoins
// (saldo, ganhos_total, perdas_total). Se essa conta escorregar, o ranking mente
// e ninguem percebe olhando a tela.

const NOME_COLAB = '__TESTE_E2E__ Colaborador ContCoins'

let colaboradorId: string

async function limparResiduos() {
  const { data: colabs } = await supabaseTest
    .from('colaboradores')
    .select('id')
    .like('nome', '__TESTE_E2E__%')

  for (const c of colabs ?? []) {
    await supabaseTest.from('contcoins_transacoes').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('contcoins').delete().eq('colaborador_id', c.id)
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
      cpf: '999.888.777-22',
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

async function saldoDoTeste() {
  const { data } = await supabaseTest
    .from('contcoins')
    .select('saldo, ganhos_total, perdas_total')
    .eq('colaborador_id', colaboradorId)
    .maybeSingle()
  return data
}

test('valida entrada e mantem o saldo coerente em ganho e desconto', async ({ page }) => {
  await page.goto('/contcoins')
  await expect(page.getByRole('heading', { name: 'ContCoins' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })
  const registrar = page.getByRole('button', { name: 'Registrar', exact: true })

  // ---------- VALIDACOES ----------
  await page.getByRole('button', { name: 'Nova Transação' }).first().click()
  await registrar.click()
  await expect(page.getByText('Colaborador e valor são obrigatórios.').first()).toBeVisible()

  // Valor tem que ser positivo
  await campo(page, 'Colaborador *').fill(NOME_COLAB)
  await campo(page, 'Valor (CC) *').fill('0')
  await registrar.click()
  await expect(page.getByText('Valor inválido.').first()).toBeVisible()

  // Nome que nao existe nao pode gravar nada
  await campo(page, 'Colaborador *').fill('__NAO_EXISTE_ESSE_COLABORADOR__')
  await campo(page, 'Valor (CC) *').fill('10')
  await registrar.click()
  await expect(page.getByText('Colaborador não encontrado.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()
  expect(await saldoDoTeste()).toBeNull()

  // ---------- GANHO ----------
  await campo(page, 'Colaborador *').fill(NOME_COLAB)
  await campo(page, 'Valor (CC) *').fill('50')
  await campo(page, 'Motivo').fill('Ganho lancado pelo teste automatizado.')
  await registrar.click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Transação registrada!').first()).toBeVisible()

  await expect.poll(saldoDoTeste, { message: 'o saldo do ganho nao foi criado' })
    .toMatchObject({ saldo: 50, ganhos_total: 50, perdas_total: 0 })

  // ---------- DESCONTO ----------
  await page.getByRole('button', { name: 'Nova Transação' }).first().click()
  await campo(page, 'Colaborador *').fill(NOME_COLAB)
  await page.getByRole('button', { name: '− Desconto' }).click()
  await campo(page, 'Valor (CC) *').fill('20')
  await campo(page, 'Motivo').fill('Desconto lancado pelo teste automatizado.')
  await registrar.click()
  await expect(fecharModal).toHaveCount(0)

  // 50 ganhos − 20 de desconto = saldo 30, mas os TOTAIS acumulam separados
  await expect.poll(saldoDoTeste, { message: 'o desconto nao bateu no saldo' })
    .toMatchObject({ saldo: 30, ganhos_total: 50, perdas_total: 20 })

  // As duas transacoes tem que estar registradas no extrato
  const { data: transacoes } = await supabaseTest
    .from('contcoins_transacoes')
    .select('tipo, valor')
    .eq('colaborador_id', colaboradorId)
    .order('valor', { ascending: false })

  expect(transacoes).toHaveLength(2)
  expect(transacoes![0]).toMatchObject({ tipo: 'ganho', valor: 50 })
  expect(transacoes![1]).toMatchObject({ tipo: 'desconto', valor: 20 })
})
