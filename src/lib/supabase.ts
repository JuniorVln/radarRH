import { createClient, SupabaseClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''



export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey)

// Sem as envs configuradas, o createClient do supabase-js lança no import
// ("supabaseUrl is required"), o que quebra toda a aplicação e gera tela branca.
// Em vez disso, avisamos no console e exportamos um stub inerte para que a UI
// continue renderizando (sem dados) e o erro fique visível ao desenvolvedor.
function createStubClient(): SupabaseClient {
  const missingEnvError = {
    message:
      'Supabase não configurado. Defina VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no ambiente (Vercel > Settings > Environment Variables).',
  }

  const emptyResult = { data: [] as unknown[], error: missingEnvError }
  const singleResult = { data: null, error: missingEnvError }

  const queryBuilder: any = {
    select: () => queryBuilder,
    insert: () => Promise.resolve(singleResult),
    update: () => queryBuilder,
    delete: () => queryBuilder,
    upsert: () => Promise.resolve(singleResult),
    eq: () => queryBuilder,
    neq: () => queryBuilder,
    in: () => queryBuilder,
    ilike: () => queryBuilder,
    order: () => queryBuilder,
    limit: () => queryBuilder,
    single: () => Promise.resolve(singleResult),
    maybeSingle: () => Promise.resolve(singleResult),
    then: (resolve: (v: typeof emptyResult) => unknown) => resolve(emptyResult),
  }

  return {
    from: () => queryBuilder,
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve(singleResult),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
      }),
    },
  } as unknown as SupabaseClient
}

if (!isSupabaseConfigured) {
  console.error(
    '[Recursos Humanos - Rede Ideia] Variáveis de ambiente do Supabase ausentes. ' +
      'Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY no Vercel e faça redeploy.'
  )
}

export const supabase: SupabaseClient = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey)
  : createStubClient()

export type Database = {
  public: {
    Tables: {
      colaboradores: { Row: Colaborador; Insert: Omit<Colaborador, 'id' | 'criado_em'>; Update: Partial<Colaborador> }
      dependentes: { Row: Dependente; Insert: Omit<Dependente, 'id' | 'criado_em'>; Update: Partial<Dependente> }
      anexos_colaborador: { Row: AnexoColaborador; Insert: Omit<AnexoColaborador, 'id' | 'criado_em'>; Update: Partial<AnexoColaborador> }
      feedbacks: { Row: Feedback; Insert: Omit<Feedback, 'id' | 'criado_em'>; Update: Partial<Feedback> }
      evidencias: { Row: Evidencia; Insert: Omit<Evidencia, 'id' | 'criado_em'>; Update: Partial<Evidencia> }
      vagas: { Row: Vaga; Insert: Omit<Vaga, 'id' | 'criado_em'>; Update: Partial<Vaga> }
      vagas_testes: { Row: VagaTeste; Insert: Omit<VagaTeste, 'id'>; Update: Partial<VagaTeste> }
      candidatos: { Row: Candidato; Insert: Omit<Candidato, 'id' | 'criado_em'>; Update: Partial<Candidato> }
      testes_tecnicos: { Row: TesteTecnico; Insert: Omit<TesteTecnico, 'id' | 'criado_em'>; Update: Partial<TesteTecnico> }
      candidatos_testes: { Row: CandidatoTeste; Insert: Omit<CandidatoTeste, 'id' | 'criado_em'>; Update: Partial<CandidatoTeste> }
      email_templates: { Row: EmailTemplate; Insert: Omit<EmailTemplate, 'id' | 'criado_em'>; Update: Partial<EmailTemplate> }
      avaliacoes: { Row: Avaliacao; Insert: Omit<Avaliacao, 'id' | 'criado_em'>; Update: Partial<Avaliacao> }
      pdis: { Row: PDI; Insert: Omit<PDI, 'id' | 'criado_em'>; Update: Partial<PDI> }
      cargos: { Row: Cargo; Insert: Omit<Cargo, 'id' | 'criado_em'>; Update: Partial<Cargo> }
      ocorrencias: { Row: Ocorrencia; Insert: Omit<Ocorrencia, 'id' | 'criado_em'>; Update: Partial<Ocorrencia> }
      holerites: { Row: Holerite; Insert: Omit<Holerite, 'id' | 'criado_em'>; Update: Partial<Holerite> }
      informes_rendimentos: { Row: InformeRendimento; Insert: Omit<InformeRendimento, 'id' | 'criado_em'>; Update: Partial<InformeRendimento> }
      beneficios_periodos: { Row: BeneficioPeriodoRow; Insert: Omit<BeneficioPeriodoRow, 'id' | 'criado_em'>; Update: Partial<BeneficioPeriodoRow> }
      beneficios_configuracoes_colaborador: { Row: BeneficioConfiguracaoColaborador; Insert: Omit<BeneficioConfiguracaoColaborador, 'id' | 'criado_em'>; Update: Partial<BeneficioConfiguracaoColaborador> }
      beneficios_eventos: { Row: BeneficioEvento; Insert: Omit<BeneficioEvento, 'id' | 'criado_em'>; Update: Partial<BeneficioEvento> }
      beneficios_resultados: { Row: BeneficioResultado; Insert: Omit<BeneficioResultado, 'id' | 'calculado_em'>; Update: Partial<BeneficioResultado> }
    }
  }
}

export type TipoColaborador = 'CLT' | 'Estagiário' | 'Terceiro' | 'PJ' | 'Mensalista' | 'Horista'

export interface EnderecoColaborador {
  cep: string
  rua: string
  numero: string
  bairro: string
  cidade: string
  uf: string
  complemento?: string
}

export interface DadosBancarios {
  banco: string
  agencia: string
  conta: string
  tipo_conta?: string
}

export interface Colaborador {
  id: string
  nome: string
  cpf: string
  email: string
  email_pessoal: string | null
  email_corporativo: string | null
  foto_url: string | null
  cargo: string
  setor: string
  celula: string | null
  unidade: string | null
  cnpj_unidade: string | null
  tipo: TipoColaborador
  data_admissao: string
  data_nascimento: string | null
  status: 'ativo' | 'inativo' | 'demitido'
  perfil_disc: 'D' | 'I' | 'S' | 'C' | null
  salario: number | null
  telefone: string | null
  genero: string | null
  raca_etnia: string | null
  estado_civil: string | null
  escolaridade: string | null
  pcd: boolean | null
  tipo_pcd: string | null
  nome_mae: string | null
  nome_pai: string | null
  contato_emergencia_nome: string | null
  contato_emergencia_parentesco: string | null
  contato_emergencia_telefone: string | null
  contato_principal: string | null
  endereco: EnderecoColaborador | null
  rg: string | null
  rg_orgao_uf: string | null
  pis_pasep: string | null
  ctps: string | null
  titulo_eleitor: string | null
  dados_bancarios: DadosBancarios | null
  criado_em: string
}

export interface Dependente {
  id: string
  colaborador_id: string
  nome: string
  parentesco: string | null
  cpf: string | null
  rg: string | null
  data_nascimento: string | null
  criado_em: string
}

export interface AnexoColaborador {
  id: string
  colaborador_id: string
  nome: string
  tipo_documento: string
  arquivo_url: string | null
  ocr_status: 'pendente' | 'processando' | 'concluido' | 'erro'
  ocr_resultado: Record<string, unknown> | null
  criado_em: string
}

export interface Feedback {
  id: string
  colaborador_id: string
  gestor_id: string
  tipo_par: 'PARE' | 'AVANCE' | 'REVEJA'
  data_feedback: string
  proximo_feedback: string | null
  descricao: string
  status: 'pendente' | 'realizado' | 'atrasado'
  criado_em: string
}

export interface Evidencia {
  id: string
  colaborador_id: string
  registrado_por: string
  tipo: 'positivo' | 'negativo'
  categoria: string
  data: string
  descricao: string
  anexo_url: string | null
  criado_em: string
}

export interface Vaga {
  id: string
  titulo: string
  setor: string
  nivel: string
  tipo_contrato: string
  modelo_trabalho: 'Presencial' | 'Híbrido' | 'Remoto'
  descricao: string
  requisitos: string
  status: 'aberta' | 'fechada' | 'pausada'
  numero_vagas: number
  salario_min: number | null
  salario_max: number | null
  data_limite: string | null
  empresa: string | null
  area: string | null
  localidade: string | null
  prioridade: 'baixa' | 'media' | 'alta' | null
  responsavel: string | null
  motivo_abertura: string | null
  beneficios: string | null
  criado_em: string
}

export interface Candidato {
  id: string
  nome: string
  email: string
  telefone: string | null
  vaga_id: string | null
  etapa_kanban: 'triagem' | 'entrevista_rh' | 'entrevista_tecnica' | 'proposta' | 'contratado' | 'reprovado'
  perfil_disc: 'D' | 'I' | 'S' | 'C' | null
  recomendacao_rh: 'sim' | 'nao' | 'pendente'
  aderencia_vaga: number | null
  curriculum_url: string | null
  area: string | null
  observacoes_internas: string | null
  criado_em: string
}

export interface TesteTecnico {
  id: string
  nome: string
  descricao: string | null
  vaga_id: string | null
  area: string | null
  tempo_estimado_minutos: number | null
  pontuacao_maxima: number | null
  criado_em: string
}

export interface VagaTeste {
  id: string
  vaga_id: string
  teste_id: string
}

export interface CandidatoTeste {
  id: string
  candidato_id: string
  teste_id: string
  status: 'pendente' | 'enviado' | 'concluido' | 'avaliado'
  resultado_score: number | null
  observacoes: string | null
  nota: number | null
  anexo_url: string | null
  data_realizacao: string | null
  criado_em: string
}

export interface EmailTemplate {
  id: string
  nome: string
  assunto: string
  corpo: string
  tipo: 'email' | 'whatsapp' | 'ambos' | null
  criado_em: string
}

export interface PDI {
  id: string
  colaborador_id: string
  titulo: string
  descricao: string | null
  // A coluna "objetivo" não existe no banco; o objetivo fica em metas.objetivo
  metas: { objetivo?: string } | null
  data_inicio: string
  data_fim: string | null
  status: 'planejado' | 'em_andamento' | 'concluido' | 'suspenso'
  criado_em: string
}

export interface Movimentacao {
  id: string
  colaborador_id: string | null
  tipo: 'admissao' | 'demissao' | 'ferias' | 'ajuste_salarial' | 'promocao'
  data: string
  descricao: string | null
  valor: number | null
  criado_em: string
}

export interface Cargo {
  id: string
  titulo: string
  area: string | null
  nivel: string
  descricao: string | null
  atribuicoes: string | null
  requisitos: string | null
  salario_min: number | null
  salario_max: number | null
  status: 'ativo' | 'inativo'
  criado_em: string
}

export interface Ocorrencia {
  id: string
  colaborador_id: string | null
  tipo: 'advertencia' | 'falta' | 'atraso' | 'ausencia' | 'elogio' | 'outro'
  data_ocorrencia: string
  severidade: 'baixa' | 'media' | 'alta' | null
  horas: number | null
  descricao: string
  acao_tomada: string | null
  status: 'registrada' | 'em_analise' | 'resolvida' | 'cancelada'
  anexo_url: string | null
  criado_em: string
}

export interface Holerite {
  id: string
  colaborador_id: string | null
  competencia: string
  salario_base: number
  proventos: number
  descontos: number
  valor_liquido: number
  arquivo_url: string | null
  status: 'rascunho' | 'disponivel' | 'enviado' | 'cancelado'
  criado_em: string
}

export interface InformeRendimento {
  id: string
  colaborador_id: string | null
  ano_base: number
  rendimentos_tributaveis: number
  imposto_retido: number
  arquivo_url: string | null
  status: 'rascunho' | 'disponivel' | 'enviado'
  criado_em: string
}

export type BeneficioPeriodoStatus = 'aberto' | 'calculado' | 'fechado'
export type BeneficioTipoTransporte = 'TRI' | 'TEU' | 'COMBUSTIVEL' | 'HOME OFFICE' | 'BROCHIER' | 'OUTRO'
export type BeneficioEventoTipo =
  | 'falta'
  | 'atestado'
  | 'ferias'
  | 'feriado_regional'
  | 'home_office_extra'
  | 'ajuste_manual'

export interface BeneficioPeriodoRow {
  id: string
  competencia: string
  periodo_inicio: string
  periodo_fim: string
  dias_uteis: number
  dias_home_office: number
  feriados_nacionais: string[]
  feriados_regionais: { data: string; localidade: string; descricao: string }[]
  status: BeneficioPeriodoStatus
  criado_em: string
}

export interface BeneficioConfiguracaoColaborador {
  id: string
  colaborador_id: string | null
  empresa: string
  localidade: string | null
  valor_vr_diario: number
  recebe_frutas: boolean
  valor_frutas_mensal: number
  tipo_transporte: BeneficioTipoTransporte
  valor_vt_diario: number
  vt_fixo_mensal: number | null
  ativo: boolean
  criado_em: string
}

export interface BeneficioEvento {
  id: string
  periodo_id: string
  colaborador_id: string | null
  tipo: BeneficioEventoTipo
  data_inicio: string | null
  data_fim: string | null
  dias: number
  impacta_vr: boolean
  impacta_vt: boolean
  valor_ajuste_vr: number | null
  valor_ajuste_vt: number | null
  motivo: string | null
  criado_em: string
}

export interface BeneficioResultado {
  id: string
  periodo_id: string
  colaborador_id: string | null
  empresa: string
  tipo_transporte: BeneficioTipoTransporte
  dias_uteis_vr: number
  dias_uteis_vt: number
  dias_home_office: number
  dias_ferias: number
  dias_faltas: number
  dias_atestados: number
  dias_feriados_regionais: number
  total_vr: number
  total_vt: number
  ajuste_manual_vr: number | null
  ajuste_manual_vt: number | null
  motivo_ajuste: string | null
  calculado_em: string
}

export interface Avaliacao {
  id: string
  colaborador_id: string
  ciclo: string
  data_inicio: string
  data_fim: string
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado'
  nota: number | null
  desempenho: 1 | 2 | 3 | null // 1: Baixo, 2: Médio, 3: Alto
  potencial: 1 | 2 | 3 | null // 1: Baixo, 2: Médio, 3: Alto
  criado_em: string
}

export interface Ferias {
  id: string
  colaborador_id: string
  periodo_aquisitivo_inicio: string
  periodo_aquisitivo_fim: string
  vencimento: string
  gozo_programado: string | null
  dias: number
  status: 'pendente' | 'programada' | 'gozada' | 'vencida'
  criado_em: string
}

export interface Trilha {
  id: string
  nome: string
  setor: string | null
  descricao: string
  status: 'ativo' | 'inativo'
  criado_em: string
}

export interface TrilhaColaborador {
  id: string
  trilha_id: string
  colaborador_id: string
  progresso: number
  status: 'nao_iniciado' | 'em_andamento' | 'concluido'
  atualizad_em: string
}

export interface ContCoin {
  id: string
  colaborador_id: string
  saldo: number
  ganhos_total: number
  perdas_total: number
  atualizado_em: string
}

export interface BancoHoras {
  id: string
  colaborador_id: string
  mes: string
  horas_trabalhadas: number
  horas_previstas: number
  saldo: number
}

export interface Recado {
  id: string
  autor_id: string
  titulo: string
  conteudo: string
  data_expiracao: string | null
  criado_em: string
}
