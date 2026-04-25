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
    '[Radar RH] Variáveis de ambiente do Supabase ausentes. ' +
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
      feedbacks: { Row: Feedback; Insert: Omit<Feedback, 'id' | 'criado_em'>; Update: Partial<Feedback> }
      evidencias: { Row: Evidencia; Insert: Omit<Evidencia, 'id' | 'criado_em'>; Update: Partial<Evidencia> }
      vagas: { Row: Vaga; Insert: Omit<Vaga, 'id' | 'criado_em'>; Update: Partial<Vaga> }
      candidatos: { Row: Candidato; Insert: Omit<Candidato, 'id' | 'criado_em'>; Update: Partial<Candidato> }
    }
  }
}

export interface Colaborador {
  id: string
  nome: string
  cpf: string
  email: string
  foto_url: string | null
  cargo: string
  setor: string
  celula: string | null
  tipo: 'CLT' | 'Estagiário' | 'Terceiro' | 'PJ'
  data_admissao: string
  data_nascimento: string | null
  status: 'ativo' | 'inativo' | 'demitido'
  perfil_disc: 'D' | 'I' | 'S' | 'C' | null
  salario: number | null
  telefone: string | null
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
  criado_em: string
}

export interface Avaliacao {
  id: string
  colaborador_id: string
  ciclo: string
  data_inicio: string
  data_fim: string
  status: 'pendente' | 'em_andamento' | 'concluido' | 'atrasado'
  nota: number | null
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
