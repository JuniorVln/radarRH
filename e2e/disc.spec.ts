import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { TETRADES } from '../src/lib/disc'

// E2E do DISC de ponta a ponta: o RH gera o link, a pessoa responde os 24 blocos na
// pagina publica (sem login), e o resultado volta pro sistema.

const NOME_COLAB = '__TESTE_E2E__ Colaborador DISC'

let colaboradorId: string

async function limparResiduos() {
  const { data: colabs } = await supabaseTest
    .from('colaboradores').select('id').like('nome', '__TESTE_E2E__%')
  for (const c of colabs ?? []) {
    await supabaseTest.from('disc_avaliacoes').delete().eq('colaborador_id', c.id)
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
      cpf: '999.888.722-88',
      cargo: 'Analista de Teste',
      setor: 'QA Automatizado',
      tipo: 'CLT',
      status: 'ativo',
      data_admissao: '2026-01-05',
    })
    .select()
    .single()
  expect(error).toBeNull()
  colaboradorId = data!.id
})

test.afterAll(limparResiduos)

test('link inválido não expõe nada e explica o que fazer', async ({ page }) => {
  await page.goto('/disc/token-que-nao-existe')
  await expect(page.getByText('Link inválido')).toBeVisible()
  await expect(page.getByText('Peça um link novo ao RH.')).toBeVisible()
})

test('RH gera o link, a pessoa responde e o perfil volta pro sistema', async ({ page }) => {
  // ---------- RH GERA O LINK ----------
  await page.goto('/colaboradores')
  await page.getByPlaceholder('Buscar por nome, email ou cargo...').fill(NOME_COLAB)
  await page.getByRole('row', { name: new RegExp(NOME_COLAB) }).getByTitle('DISC').click()

  await expect(page.getByText('Ainda não aplicado.')).toBeVisible()
  await page.getByRole('button', { name: 'Gerar link' }).click()
  await expect(page.getByText('Aguardando resposta')).toBeVisible()

  const { data: avaliacoes } = await supabaseTest
    .from('disc_avaliacoes')
    .select('id, token, status, respostas, resultado')
    .eq('colaborador_id', colaboradorId)

  expect(avaliacoes).toHaveLength(1)
  const avaliacao = avaliacoes![0]
  expect(avaliacao.status).toBe('pendente')
  expect(avaliacao.resultado).toBeNull()

  // Clicar de novo NAO pode criar um segundo link — a pessoa receberia dois.
  // Esperar o botao voltar de "Gerando..." e o que garante que a gravacao terminou:
  // consultar o banco logo apos o clique lia ANTES do insert chegar, e o teste passava
  // mesmo com o bug plantado (canario provou isso).
  const botaoGerar = page.getByRole('button', { name: 'Gerar novo link' })
  await botaoGerar.click()
  await expect(botaoGerar).toBeEnabled()

  const { data: depois } = await supabaseTest
    .from('disc_avaliacoes').select('id').eq('colaborador_id', colaboradorId)
  expect(depois, 'gerou link duplicado').toHaveLength(1)

  // ---------- A PESSOA RESPONDE (pagina publica, sem login) ----------
  await page.goto(`/disc/${avaliacao.token}`)
  await expect(page.getByRole('heading', { name: 'Perfil comportamental' })).toBeVisible()
  // A pagina publica nao pode trazer o menu do sistema de RH junto
  await expect(page.getByRole('link', { name: 'Colaboradores' })).toHaveCount(0)

  for (let i = 0; i < TETRADES.length; i++) {
    await expect(page.getByText(`Bloco ${i + 1}`)).toBeVisible()

    // Responde sempre D como "mais" e S como "menos" -> perfil D previsivel
    await page.getByLabel(`Mais: ${TETRADES[i].D}`).click()
    await page.getByLabel(`Menos: ${TETRADES[i].S}`).click()

    if (i < TETRADES.length - 1) {
      await page.getByRole('button', { name: 'Próximo' }).click()
    }
  }

  await expect(page.getByText('24 de 24')).toBeVisible()
  await page.getByRole('button', { name: 'Finalizar' }).click()

  await expect(page.getByText('Respostas registradas. Obrigado!')).toBeVisible()
  // Resultado na tela da propria pessoa
  await expect(page.getByText('Perfil natural')).toBeVisible()
  await expect(page.getByText('Perfil adaptado')).toBeVisible()
  await expect(page.getByText('Tensão de adaptação')).toBeVisible()
  // A ressalva de uso PRECISA aparecer — sem ela a tela sugere precisao que o
  // instrumento nao tem.
  await expect(page.getByText(/não deve ser usado isoladamente/i)).toBeVisible()

  // ---------- CONFERE NO BANCO ----------
  const { data: fechada } = await supabaseTest
    .from('disc_avaliacoes')
    .select('status, respostas, resultado, respondido_em')
    .eq('id', avaliacao.id)
    .single()

  expect(fechada!.status).toBe('respondido')
  expect(fechada!.respondido_em).not.toBeNull()
  expect(fechada!.respostas).toHaveLength(24)

  const resultado = fechada!.resultado as any
  expect(resultado.primario).toBe('D')
  expect(resultado.completo).toBe(true)
  expect(resultado.adaptado.D).toBe(100)
  expect(resultado.natural.S).toBe(0) // S foi rejeitado nas 24 vezes

  // A letra principal tem que voltar pro colaborador — e a coluna que a tabela de
  // colaboradores, o Nine Box e a Analise Comportamental ja leem.
  const { data: colab } = await supabaseTest
    .from('colaboradores').select('perfil_disc').eq('id', colaboradorId).single()
  expect(colab!.perfil_disc).toBe('D')

  // ---------- O RH VE O RESULTADO ----------
  await page.goto('/colaboradores')
  await page.getByPlaceholder('Buscar por nome, email ou cargo...').fill(NOME_COLAB)
  await page.getByRole('row', { name: new RegExp(NOME_COLAB) }).getByTitle('DISC').click()
  await expect(page.getByText('Respondido')).toBeVisible()
  await expect(page.getByText('Perfil natural')).toBeVisible()

  // Responder de novo pelo mesmo link nao pode reabrir o questionario
  await page.goto(`/disc/${avaliacao.token}`)
  await expect(page.getByText('Perfil natural')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Finalizar' })).toHaveCount(0)
})

test('não deixa avançar sem marcar mais e menos diferentes', async ({ page }) => {
  const { data: nova } = await supabaseTest
    .from('disc_avaliacoes')
    .insert({ colaborador_id: colaboradorId, token: '__teste_validacao__', status: 'pendente' })
    .select()
    .single()

  await page.goto(`/disc/${nova!.token}`)

  const proximo = page.getByRole('button', { name: 'Próximo' })
  await expect(proximo).toBeDisabled()

  // Só "mais" não basta
  await page.getByLabel(`Mais: ${TETRADES[0].D}`).click()
  await expect(proximo).toBeDisabled()

  // Marcar a MESMA palavra em menos tem que limpar o mais, não valer os dois
  await page.getByLabel(`Menos: ${TETRADES[0].D}`).click()
  await expect(proximo).toBeDisabled()

  // Palavras diferentes liberam
  await page.getByLabel(`Mais: ${TETRADES[0].I}`).click()
  await expect(proximo).toBeEnabled()

  await supabaseTest.from('disc_avaliacoes').delete().eq('id', nova!.id)
})
