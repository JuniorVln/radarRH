import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bycpifryzynsiabkpejo.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY // usar service_role key aqui

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const schema = `
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  foto_url TEXT,
  cargo TEXT NOT NULL,
  setor TEXT NOT NULL,
  celula TEXT,
  tipo TEXT NOT NULL DEFAULT 'CLT',
  data_admissao DATE,
  data_nascimento DATE,
  status TEXT NOT NULL DEFAULT 'ativo',
  perfil_disc TEXT,
  salario NUMERIC(12, 2),
  telefone TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  gestor_nome TEXT,
  tipo_par TEXT NOT NULL,
  data_feedback DATE NOT NULL,
  proximo_feedback DATE,
  descricao TEXT,
  status TEXT DEFAULT 'realizado',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  registrado_por TEXT,
  tipo TEXT NOT NULL,
  categoria TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vagas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  setor TEXT,
  nivel TEXT,
  tipo_contrato TEXT,
  modelo_trabalho TEXT,
  descricao TEXT,
  requisitos TEXT,
  status TEXT NOT NULL DEFAULT 'aberta',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  vaga_id UUID REFERENCES vagas(id) ON DELETE SET NULL,
  etapa_kanban TEXT NOT NULL DEFAULT 'triagem',
  perfil_disc TEXT,
  recomendacao_rh TEXT DEFAULT 'pendente',
  aderencia_vaga INTEGER,
  curriculum_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  ciclo TEXT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  status TEXT DEFAULT 'pendente',
  nota NUMERIC(3,1),
  potencial INTEGER,
  desempenho INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  data DATE NOT NULL,
  descricao TEXT,
  valor NUMERIC(12, 2),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ferias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  periodo_aquisitivo_inicio DATE NOT NULL,
  periodo_aquisitivo_fim DATE NOT NULL,
  vencimento DATE,
  gozo_programado DATE,
  dias INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pendente',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trilhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  setor TEXT,
  descricao TEXT,
  status TEXT DEFAULT 'ativo',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trilha_colaborador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trilha_id UUID REFERENCES trilhas(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  progresso INTEGER DEFAULT 0,
  status TEXT DEFAULT 'nao_iniciado',
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contcoins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE UNIQUE,
  saldo NUMERIC(10, 2) DEFAULT 0,
  ganhos_total NUMERIC(10, 2) DEFAULT 0,
  perdas_total NUMERIC(10, 2) DEFAULT 0,
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS contcoins_transacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  valor NUMERIC(10, 2) NOT NULL,
  motivo TEXT,
  data DATE DEFAULT CURRENT_DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  autor_nome TEXT,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  data_expiracao DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  autor_nome TEXT,
  conteudo TEXT NOT NULL,
  imagem_url TEXT,
  curtidas INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);
`

async function runMigration() {
  const { error } = await supabase.rpc('exec_sql', { sql: schema })
  if (error) {
    console.error('Erro:', error)
  } else {
    console.log('Schema criado com sucesso!')
  }
}

runMigration()
