import { test, expect } from '@playwright/test'
import { supabaseTest } from './supabaseTestClient'
import { campo } from './campos'

// E2E de fluxo do Recrutamento — a maior tela do sistema, com 5 abas e 5 tabelas
// diferentes. Cobre os fluxos que gravam: vaga, candidato, teste tecnico, template
// de e-mail e o vinculo candidato<->teste.
//
// NAO cobre o arrastar-e-soltar do kanban (dnd-kit). A mudanca de etapa e testada
// pelo select que cada card tem, que chama exatamente a mesma funcao do drop.

const VAGA = '__TESTE_E2E__ Vaga'
const VAGA_EDITADA = '__TESTE_E2E__ Vaga revisada'
const CANDIDATO = '__TESTE_E2E__ Candidato'
const TESTE = '__TESTE_E2E__ Teste tecnico'
const TEMPLATE = '__TESTE_E2E__ Template'

async function limparResiduos() {
  const { data: cands } = await supabaseTest
    .from('candidatos').select('id').like('nome', '__TESTE_E2E__%')
  for (const c of cands ?? []) {
    await supabaseTest.from('candidatos_testes').delete().eq('candidato_id', c.id)
    await supabaseTest.from('candidatos').delete().eq('id', c.id)
  }

  const { data: testes } = await supabaseTest
    .from('testes_tecnicos').select('id').like('nome', '__TESTE_E2E__%')
  for (const t of testes ?? []) {
    await supabaseTest.from('candidatos_testes').delete().eq('teste_id', t.id)
    await supabaseTest.from('testes_tecnicos').delete().eq('id', t.id)
  }

  await supabaseTest.from('vagas').delete().like('titulo', '__TESTE_E2E__%')
  await supabaseTest.from('email_templates').delete().like('nome', '__TESTE_E2E__%')
}

test.beforeAll(limparResiduos)
test.afterAll(limparResiduos)

test('vaga, candidato, teste tecnico, template e vinculo teste-candidato', async ({ page }) => {
  page.on('dialog', d => d.accept())

  await page.goto('/recrutamento')
  await expect(page.getByRole('heading', { name: 'Recrutamento' }).first()).toBeVisible()

  const fecharModal = page.getByRole('button', { name: 'Cancelar', exact: true })

  // ================= VAGA =================
  await page.getByRole('button', { name: 'Vagas', exact: true }).click()
  await page.getByRole('button', { name: 'Nova Vaga' }).first().click()

  await page.getByRole('button', { name: 'Publicar Vaga' }).click()
  await expect(page.getByText('Título é obrigatório.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  await campo(page, 'Título da vaga *').fill(VAGA)
  await campo(page, 'Setor').fill('QA Automatizado')
  await campo(page, 'Quantidade de vagas').fill('3')
  await campo(page, 'Salário mínimo').fill('4.000,00')
  await campo(page, 'Salário máximo').fill('6.500,00')
  await page.getByRole('button', { name: 'Publicar Vaga' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Vaga publicada.').first()).toBeVisible()

  const { data: vagas } = await supabaseTest
    .from('vagas')
    .select('id, titulo, setor, numero_vagas, salario_min, salario_max')
    .like('titulo', '__TESTE_E2E__%')

  expect(vagas).toHaveLength(1)
  const vaga = vagas![0]
  expect(vaga).toMatchObject({
    setor: 'QA Automatizado',
    numero_vagas: 3,
    salario_min: 4000,
    salario_max: 6500,
  })

  // Editar a vaga nao pode duplicar
  await page.getByRole('heading', { name: VAGA }).click()
  await campo(page, 'Título da vaga *').fill(VAGA_EDITADA)
  await page.getByRole('button', { name: 'Salvar Alterações' }).click()
  await expect(fecharModal).toHaveCount(0)

  const { data: vagasEditadas } = await supabaseTest
    .from('vagas').select('id, titulo').like('titulo', '__TESTE_E2E__%')
  expect(vagasEditadas).toHaveLength(1)
  expect(vagasEditadas![0]).toMatchObject({ id: vaga.id, titulo: VAGA_EDITADA })

  // ================= TESTE TECNICO =================
  await page.getByRole('button', { name: 'Testes', exact: true }).click()
  await page.getByRole('button', { name: 'Novo Teste' }).first().click()

  await page.getByRole('button', { name: 'Salvar Teste' }).click()
  await expect(page.getByText('Título do teste é obrigatório.').first()).toBeVisible()

  await campo(page, 'Título *').fill(TESTE)
  await campo(page, 'Área').fill('QA Automatizado')
  await campo(page, 'Tempo (min)').fill('45')
  await campo(page, 'Pontuação').fill('100')
  await page.getByRole('button', { name: 'Salvar Teste' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Teste técnico registrado.').first()).toBeVisible()

  const { data: testes } = await supabaseTest
    .from('testes_tecnicos')
    .select('id, nome, area, tempo_estimado_minutos, pontuacao_maxima')
    .like('nome', '__TESTE_E2E__%')

  expect(testes).toHaveLength(1)
  // Pegadinha de schema documentada no projeto: a coluna e "nome", nao "titulo"
  expect(testes![0]).toMatchObject({
    nome: TESTE,
    area: 'QA Automatizado',
    tempo_estimado_minutos: 45,
    pontuacao_maxima: 100,
  })

  // ================= TEMPLATE DE E-MAIL =================
  await page.getByRole('button', { name: 'Templates', exact: true }).click()
  await page.getByRole('button', { name: 'Novo Template' }).first().click()

  await page.getByRole('button', { name: 'Salvar Template' }).click()
  await expect(page.getByText('Nome e assunto são obrigatórios.').first()).toBeVisible()

  await campo(page, 'Nome *').fill(TEMPLATE)
  await campo(page, 'Assunto *').fill('Convite para entrevista')
  await campo(page, 'Mensagem').fill('Mensagem gerada pelo teste automatizado.')
  await page.getByRole('button', { name: 'Salvar Template' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Template salvo.').first()).toBeVisible()

  const { data: templates } = await supabaseTest
    .from('email_templates').select('id, nome, assunto').like('nome', '__TESTE_E2E__%')
  expect(templates).toHaveLength(1)
  expect(templates![0]).toMatchObject({ assunto: 'Convite para entrevista' })

  // ================= CANDIDATO =================
  await page.getByRole('button', { name: 'Pipeline', exact: true }).click()
  await page.getByRole('button', { name: 'Novo Candidato' }).first().click()

  await page.getByRole('button', { name: 'Adicionar Candidato' }).click()
  await expect(page.getByText('Nome é obrigatório.').first()).toBeVisible()

  // E-mail sem @ tem que barrar antes de gravar
  await campo(page, 'Nome *').fill(CANDIDATO)
  await campo(page, 'Email').fill('email-invalido')
  await page.getByRole('button', { name: 'Adicionar Candidato' }).click()
  await expect(page.getByText('E-mail inválido.').first()).toBeVisible()
  await expect(fecharModal).toBeVisible()

  await campo(page, 'Email').fill('teste@automatizado.local')
  await campo(page, 'Vaga').selectOption(vaga.id)
  await campo(page, 'Aderência (%)').fill('80')
  await page.getByRole('button', { name: 'Adicionar Candidato' }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Candidato adicionado.').first()).toBeVisible()

  const { data: candidatos } = await supabaseTest
    .from('candidatos')
    .select('id, nome, email, vaga_id, aderencia_vaga, etapa_kanban')
    .like('nome', '__TESTE_E2E__%')

  expect(candidatos).toHaveLength(1)
  const candidato = candidatos![0]
  expect(candidato).toMatchObject({
    email: 'teste@automatizado.local',
    vaga_id: vaga.id,
    aderencia_vaga: 80,
    etapa_kanban: 'triagem',
  })

  // ---------- MOVER DE ETAPA ----------
  // Mesma funcao que o arrastar-e-soltar chama, so que pelo select do card.
  const card = page.locator('.kanban-card').filter({ hasText: CANDIDATO })
  await card.getByRole('combobox').selectOption('proposta')

  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('candidatos').select('etapa_kanban').eq('id', candidato.id).single()
      return data?.etapa_kanban
    }, { message: 'a mudanca de etapa nao chegou no banco' })
    .toBe('proposta')

  // ---------- VINCULAR TESTE AO CANDIDATO ----------
  // exact:true nos cliques abaixo: o botao do CARD tem title "Vincular teste" e o do
  // MODAL diz "Vincular Teste" — getByRole ignora maiusculas e casaria com os dois.
  await card.getByTitle('Vincular teste').click()
  await page.getByRole('button', { name: 'Vincular Teste', exact: true }).click()
  await expect(page.getByText('Selecione um teste.').first()).toBeVisible()

  await campo(page, 'Teste *').selectOption(testes![0].id)
  await campo(page, 'Status').selectOption('enviado')
  await campo(page, 'Resultado').fill('75')
  await page.getByRole('button', { name: 'Vincular Teste', exact: true }).click()
  await expect(fecharModal).toHaveCount(0)
  await expect(page.getByText('Teste vinculado ao candidato.').first()).toBeVisible()

  const { data: vinculos } = await supabaseTest
    .from('candidatos_testes')
    .select('candidato_id, teste_id, status, resultado_score')
    .eq('candidato_id', candidato.id)

  expect(vinculos).toHaveLength(1)
  expect(vinculos![0]).toMatchObject({
    teste_id: testes![0].id,
    status: 'enviado',
    resultado_score: 75,
  })

  // ================= EXCLUSOES =================
  await card.getByTitle('Excluir').click()
  await expect
    .poll(async () => {
      const { data } = await supabaseTest
        .from('candidatos').select('id').like('nome', '__TESTE_E2E__%')
      return data?.length
    })
    .toBe(0)

  await page.getByRole('button', { name: 'Vagas', exact: true }).click()
  await page.locator('div.cursor-pointer.rounded-xl').filter({ hasText: VAGA_EDITADA }).getByRole('button').click()
  await expect(page.getByText('Vaga excluída.').first()).toBeVisible()

  await page.getByRole('button', { name: 'Testes', exact: true }).click()
  await page.locator('div.cursor-pointer.rounded-xl').filter({ hasText: TESTE }).getByRole('button').click()
  await expect(page.getByText('Teste excluído.').first()).toBeVisible()

  await page.getByRole('button', { name: 'Templates', exact: true }).click()
  await page.locator('div.rounded-xl').filter({ hasText: TEMPLATE }).last().getByRole('button').click()
  await expect(page.getByText('Template excluído.').first()).toBeVisible()

  for (const [tabela, coluna] of [['vagas', 'titulo'], ['testes_tecnicos', 'nome'], ['email_templates', 'nome']] as const) {
    const { data } = await supabaseTest.from(tabela).select('id').like(coluna, '__TESTE_E2E__%')
    expect(data, `sobrou lixo em ${tabela}`).toHaveLength(0)
  }
})
