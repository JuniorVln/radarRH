import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E das melhorias do Bloco A (pedidos da reuniao com a Deise):
//  1. Cargo por selecao — o campo passa a oferecer os cargos cadastrados, mas continua
//     salvando o NOME no mesmo campo (nao migra registro antigo, nao trava cargo novo)
//  2. Contratar assistido — do card do candidato pro cadastro ja preenchido; o candidato
//     so vira "contratado" DEPOIS que o colaborador for salvo
//  3. Exportacao CSV de Ferias

const CARGO_CADASTRADO = '__TESTE_E2E__ Cargo Selecionavel'
const CANDIDATO = '__TESTE_E2E__ Candidato Contratacao'
const VAGA = '__TESTE_E2E__ Vaga Contratacao'
const NOME_COLAB_FERIAS = '__TESTE_E2E__ Colaborador CSV'

async function limparResiduos() {
  await supabaseTest.from('cargos').delete().like('titulo', '__TESTE_E2E__%')
  await supabaseTest.from('candidatos').delete().like('nome', '__TESTE_E2E__%')
  await supabaseTest.from('vagas').delete().like('titulo', '__TESTE_E2E__%')

  const { data: colabs } = await supabaseTest
    .from('colaboradores').select('id').like('nome', '__TESTE_E2E__%')
  for (const c of colabs ?? []) {
    await supabaseTest.from('ferias').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('movimentacoes').delete().eq('colaborador_id', c.id)
    await supabaseTest.from('colaboradores').delete().eq('id', c.id)
  }
}

test.beforeAll(limparResiduos)
test.afterAll(limparResiduos)

test('Cargo: o campo oferece os cargos cadastrados e salva o nome no mesmo campo', async ({ page }) => {
  const { data: cargo, error } = await supabaseTest
    .from('cargos')
    .insert({ titulo: CARGO_CADASTRADO, area: 'QA', nivel: 'Pleno', status: 'ativo' })
    .select()
    .single()
  expect(error).toBeNull()

  await page.goto('/colaboradores')
  await page.getByRole('button', { name: 'Novo Colaborador' }).first().click()

  // O campo Cargo vive na aba Contrato & Vinculo, que so e montada quando aberta —
  // o datalist nao existe no DOM antes disso.
  await page.getByRole('button', { name: 'Contrato & Vínculo' }).click()

  // O <datalist> alimenta o campo com os cargos ativos. Ele nao e visivel, entao a
  // checagem e sobre o DOM.
  const opcao = page.locator(`#cargos-cadastrados option[value="${CARGO_CADASTRADO}"]`)
  await expect(opcao).toHaveCount(1, { timeout: 15000 })

  // Cargo INATIVO nao pode continuar sendo oferecido. Sem recarregar e reabrir, esta
  // asserção nao vale nada — foi assim que um canario passou batido aqui.
  await supabaseTest.from('cargos').update({ status: 'inativo' }).eq('id', cargo!.id)
  await page.reload()
  await page.getByRole('button', { name: 'Novo Colaborador' }).first().click()
  await page.getByRole('button', { name: 'Contrato & Vínculo' }).click()
  // Escopado ao MEU cargo: a base tem outros cargos ativos de verdade, entao contar
  // todas as opcoes daria falso negativo.
  await expect(opcao).toHaveCount(0, { timeout: 15000 })

  // Cargo fora da lista continua podendo ser digitado — o campo nao vira prisao
  await page.getByRole('button', { name: 'Dados Pessoais' }).click()
  await page.getByLabel('Nome Completo *').fill('__TESTE_E2E__ Colaborador Cargo')
  await page.getByLabel('CPF *').fill('999.888.766-99')
  await page.getByRole('button', { name: 'Contrato & Vínculo' }).click()
  await page.getByLabel('Cargo *').fill(CARGO_CADASTRADO)
  await page.getByLabel('Setor *').fill('QA Automatizado')

  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)

  // O cargo continua sendo TEXTO na tabela colaboradores — nada de FK nova
  const { data: salvos } = await supabaseTest
    .from('colaboradores').select('cargo').eq('nome', '__TESTE_E2E__ Colaborador Cargo')
  expect(salvos).toHaveLength(1)
  expect(salvos![0].cargo).toBe(CARGO_CADASTRADO)
})

test('Contratar: leva o candidato pro cadastro e so o move depois de salvar', async ({ page }) => {
  const { data: vaga } = await supabaseTest
    .from('vagas')
    .insert({ titulo: VAGA, setor: 'QA Automatizado', nivel: 'Pleno', status: 'aberta' })
    .select()
    .single()

  const { data: candidato } = await supabaseTest
    .from('candidatos')
    .insert({
      nome: CANDIDATO,
      email: 'candidato@automatizado.local',
      telefone: '(41) 99999-0000',
      vaga_id: vaga!.id,
      etapa_kanban: 'proposta',
    })
    .select()
    .single()

  await page.goto('/recrutamento')
  const card = page.locator('.kanban-card').filter({ hasText: CANDIDATO })
  await expect(card).toBeVisible()
  await card.getByTitle('Contratar').click()

  // Foi pro cadastro de colaborador, ja aberto e preenchido com o que o candidato tinha
  await expect(page).toHaveURL(/\/colaboradores$/)
  await expect(page.getByLabel('Nome Completo *')).toHaveValue(CANDIDATO)
  await expect(campo(page, 'E-mail')).toHaveValue('candidato@automatizado.local')
  await page.getByRole('button', { name: 'Contrato & Vínculo' }).click()
  // Cargo e setor vem da vaga do candidato
  await expect(page.getByLabel('Cargo *')).toHaveValue(VAGA)
  await expect(page.getByLabel('Setor *')).toHaveValue('QA Automatizado')

  // ANTES de salvar, o candidato NAO pode ter mudado de etapa
  const { data: antes } = await supabaseTest
    .from('candidatos').select('etapa_kanban').eq('id', candidato!.id).single()
  expect(antes!.etapa_kanban).toBe('proposta')

  // O CPF continua obrigatorio — a contratacao nao pode furar a validacao
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByText('Preencha Nome e CPF obrigatoriamente.').first()).toBeVisible()

  await page.getByLabel('CPF *').fill('999.888.755-99')
  await page.getByRole('button', { name: 'Contrato & Vínculo' }).click()
  await page.getByLabel('Data Admissão').fill('2026-08-01')
  await page.getByRole('button', { name: 'Salvar', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Cancelar', exact: true })).toHaveCount(0)

  // Agora sim: colaborador criado E candidato movido
  const { data: criados } = await supabaseTest
    .from('colaboradores').select('id, nome, cargo, setor').eq('nome', CANDIDATO)
  expect(criados).toHaveLength(1)
  expect(criados![0]).toMatchObject({ cargo: VAGA, setor: 'QA Automatizado' })

  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('candidatos').select('etapa_kanban').eq('id', candidato!.id).single()
      return data?.etapa_kanban
    }, { message: 'o candidato nao foi movido pra contratado' })
    .toBe('contratado')
})

test('Férias: exporta CSV do que está na tela', async ({ page }) => {
  const { data: colab } = await supabaseTest
    .from('colaboradores')
    .insert({
      nome: NOME_COLAB_FERIAS,
      cpf: '999.888.744-99',
      cargo: 'Analista de Teste',
      setor: 'QA Automatizado',
      tipo: 'CLT',
      status: 'ativo',
      data_admissao: '2025-03-10',
    })
    .select()
    .single()

  await supabaseTest.from('ferias').insert({
    colaborador_id: colab!.id,
    periodo_aquisitivo_inicio: '2025-03-10',
    periodo_aquisitivo_fim: '2026-03-09',
    vencimento: '2027-03-09',
    gozo_programado: '2026-09-01',
    dias: 20,
    status: 'programada',
  })

  await page.goto('/provisao-ferias')
  await page.getByPlaceholder('Buscar colaborador...').fill(NOME_COLAB_FERIAS)
  await expect(page.getByRole('cell', { name: NOME_COLAB_FERIAS })).toBeVisible()

  const download = await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button', { name: 'Exportar CSV' }).click(),
  ]).then(([d]) => d)

  expect(download.suggestedFilename()).toMatch(/^ferias-\d{4}-\d{2}-\d{2}\.csv$/)

  const caminho = await download.path()
  const conteudo = await import('node:fs').then(fs => fs.readFileSync(caminho!, 'utf8'))

  // BOM pro Excel pt-BR nao quebrar acento, e ";" como separador
  expect(conteudo.charCodeAt(0)).toBe(0xfeff)
  expect(conteudo).toContain('Colaborador;Período aquisitivo início')
  // Exporta o RECORTE da busca, nao a tabela inteira
  const linhas = conteudo.trim().split('\r\n')
  expect(linhas).toHaveLength(2)
  expect(linhas[1]).toContain(NOME_COLAB_FERIAS)
  expect(linhas[1]).toContain('2026-09-01')
  expect(linhas[1]).toContain('programada')
})
