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

  // Com avaliacao pendente, o RH copia o MESMO link — nao existe caminho que gere um
  // segundo pendente sem cancelar o anterior. (O botao de trocar de link e testado
  // no teste "cancelar e gerar novo link mata o anterior".)
  await page.getByRole('button', { name: 'Copiar link' }).click()

  const { data: depois } = await supabaseTest
    .from('disc_avaliacoes').select('id').eq('colaborador_id', colaboradorId)
  expect(depois, 'existe mais de uma avaliacao pendente').toHaveLength(1)

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

// ---------------------------------------------------------------------------
// Ajustes vindos da revisão do Codex: link cancelado, resposta duplicada e
// consistência entre a avaliação e o perfil do colaborador.
// ---------------------------------------------------------------------------

test('token cancelado não abre o questionário', async ({ page }) => {
  const { data: av } = await supabaseTest
    .from('disc_avaliacoes')
    .insert({ colaborador_id: colaboradorId, token: '__teste_cancelado__', status: 'cancelado' })
    .select()
    .single()

  await page.goto(`/disc/${av!.token}`)
  await expect(page.getByText('Link inválido ou cancelado')).toBeVisible()
  // E o questionário não pode estar acessível por baixo do aviso
  await expect(page.getByText('Bloco 1')).toHaveCount(0)

  await supabaseTest.from('disc_avaliacoes').delete().eq('id', av!.id)
})

test('segundo envio não sobrescreve o resultado já registrado', async ({ page }) => {
  await supabaseTest.from('disc_avaliacoes').delete().eq('colaborador_id', colaboradorId)

  const { data: av } = await supabaseTest
    .from('disc_avaliacoes')
    .insert({ colaborador_id: colaboradorId, token: '__teste_duplo__', status: 'pendente' })
    .select()
    .single()

  // A pessoa abre o link e responde tudo, mas ainda NAO enviou.
  await page.goto(`/disc/${av!.token}`)
  for (let i = 0; i < TETRADES.length; i++) {
    await page.getByLabel(`Mais: ${TETRADES[i].D}`).click()
    await page.getByLabel(`Menos: ${TETRADES[i].S}`).click()
    if (i < TETRADES.length - 1) await page.getByRole('button', { name: 'Próximo' }).click()
  }

  // Enquanto isso, o mesmo link foi respondido em outro lugar (outra aba, ou dois
  // cliques em Finalizar quase juntos). Simulamos fechando a avaliacao pelo banco.
  const resultadoQueVale = { primario: 'C', secundario: null, codigo: 'C', completo: true }
  await supabaseTest
    .from('disc_avaliacoes')
    .update({
      status: 'respondido',
      resultado: resultadoQueVale,
      respostas: [],
      respondido_em: new Date().toISOString(),
    })
    .eq('id', av!.id)

  // Agora ela clica em Finalizar. O app precisa RECUSAR, e nao sobrescrever.
  await page.getByRole('button', { name: 'Finalizar' }).click()
  await expect(page.getByText(/já foi respondido ou o link foi cancelado/i)).toBeVisible()

  const { data: depois } = await supabaseTest
    .from('disc_avaliacoes').select('resultado, respostas').eq('id', av!.id).single()

  expect((depois!.resultado as any).primario, 'o segundo envio sobrescreveu').toBe('C')
  expect(depois!.respostas, 'as respostas foram sobrescritas').toHaveLength(0)

  await supabaseTest.from('disc_avaliacoes').delete().eq('id', av!.id)
})

test('cancelar e gerar novo link mata o anterior', async ({ page }) => {
  page.on('dialog', d => d.accept())

  await supabaseTest.from('disc_avaliacoes').delete().eq('colaborador_id', colaboradorId)
  await supabaseTest.from('colaboradores').update({ perfil_disc: null }).eq('id', colaboradorId)

  await page.goto('/colaboradores')
  await page.getByPlaceholder('Buscar por nome, email ou cargo...').fill(NOME_COLAB)
  await page.getByRole('row', { name: new RegExp(NOME_COLAB) }).getByTitle('DISC').click()

  await page.getByRole('button', { name: 'Gerar link' }).click()
  await expect(page.getByText('Aguardando resposta')).toBeVisible()

  const { data: primeira } = await supabaseTest
    .from('disc_avaliacoes').select('id, token').eq('colaborador_id', colaboradorId).single()

  // O botão agora avisa o que faz de verdade
  const trocar = page.getByRole('button', { name: 'Cancelar e gerar novo' })
  await expect(trocar).toBeVisible()
  await trocar.click()
  await expect(trocar).toBeEnabled()

  const { data: todas } = await supabaseTest
    .from('disc_avaliacoes')
    .select('id, token, status')
    .eq('colaborador_id', colaboradorId)

  const anterior = todas!.find(a => a.id === primeira!.id)
  const nova = todas!.find(a => a.id !== primeira!.id)

  expect(anterior!.status, 'o link anterior continuou valendo').toBe('cancelado')
  expect(nova, 'não gerou link novo').toBeTruthy()
  expect(nova!.status).toBe('pendente')

  // E o link antigo realmente deixou de abrir
  await page.goto(`/disc/${primeira!.token}`)
  await expect(page.getByText('Link inválido ou cancelado')).toBeVisible()

  await supabaseTest.from('disc_avaliacoes').delete().eq('colaborador_id', colaboradorId)
})
