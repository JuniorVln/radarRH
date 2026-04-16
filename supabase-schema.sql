-- ================================================================
-- Schema: Radar Gestão de Pessoas
-- ================================================================

-- Extensões
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================================================
-- COLABORADORES
-- ================================================================
CREATE TABLE IF NOT EXISTS colaboradores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  cpf TEXT,
  email TEXT,
  foto_url TEXT,
  cargo TEXT NOT NULL,
  setor TEXT NOT NULL,
  celula TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('CLT', 'Estagiário', 'Terceiro', 'PJ')),
  data_admissao DATE,
  data_nascimento DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'demitido')),
  perfil_disc TEXT CHECK (perfil_disc IN ('D', 'I', 'S', 'C')),
  salario NUMERIC(12, 2),
  telefone TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- FEEDBACKS (Metodologia PAR)
-- ================================================================
CREATE TABLE IF NOT EXISTS feedbacks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  gestor_nome TEXT,
  tipo_par TEXT NOT NULL CHECK (tipo_par IN ('PARE', 'AVANCE', 'REVEJA')),
  data_feedback DATE NOT NULL,
  proximo_feedback DATE,
  descricao TEXT,
  status TEXT DEFAULT 'realizado' CHECK (status IN ('pendente', 'realizado', 'atrasado')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- EVIDÊNCIAS
-- ================================================================
CREATE TABLE IF NOT EXISTS evidencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  registrado_por TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('positivo', 'negativo')),
  categoria TEXT,
  data DATE NOT NULL DEFAULT CURRENT_DATE,
  descricao TEXT NOT NULL,
  anexo_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- VAGAS
-- ================================================================
CREATE TABLE IF NOT EXISTS vagas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  setor TEXT,
  nivel TEXT,
  tipo_contrato TEXT,
  modelo_trabalho TEXT CHECK (modelo_trabalho IN ('Presencial', 'Híbrido', 'Remoto')),
  descricao TEXT,
  requisitos TEXT,
  status TEXT NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'fechada', 'pausada')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- CANDIDATOS
-- ================================================================
CREATE TABLE IF NOT EXISTS candidatos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  email TEXT,
  telefone TEXT,
  vaga_id UUID REFERENCES vagas(id) ON DELETE SET NULL,
  etapa_kanban TEXT NOT NULL DEFAULT 'triagem' CHECK (
    etapa_kanban IN ('triagem', 'entrevista_rh', 'entrevista_tecnica', 'proposta', 'contratado', 'reprovado')
  ),
  perfil_disc TEXT CHECK (perfil_disc IN ('D', 'I', 'S', 'C')),
  recomendacao_rh TEXT DEFAULT 'pendente' CHECK (recomendacao_rh IN ('sim', 'nao', 'pendente')),
  aderencia_vaga INTEGER CHECK (aderencia_vaga BETWEEN 0 AND 100),
  curriculum_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- EMAIL TEMPLATES
-- ================================================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo TEXT NOT NULL,
  tipo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- AVALIAÇÕES DE DESEMPENHO
-- ================================================================
CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  ciclo TEXT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'atrasado')),
  nota NUMERIC(3,1) CHECK (nota BETWEEN 0 AND 10),
  potencial INTEGER CHECK (potencial BETWEEN 1 AND 3),  -- 1=baixo, 2=médio, 3=alto
  desempenho INTEGER CHECK (desempenho BETWEEN 1 AND 3), -- 1=baixo, 2=médio, 3=alto
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- MOVIMENTAÇÕES (para cálculo de Turnover)
-- ================================================================
CREATE TABLE IF NOT EXISTS movimentacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('admissao', 'demissao', 'ferias', 'ajuste_salarial', 'promocao')),
  data DATE NOT NULL,
  descricao TEXT,
  valor NUMERIC(12, 2),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- FÉRIAS
-- ================================================================
CREATE TABLE IF NOT EXISTS ferias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  periodo_aquisitivo_inicio DATE NOT NULL,
  periodo_aquisitivo_fim DATE NOT NULL,
  vencimento DATE,
  gozo_programado DATE,
  dias INTEGER DEFAULT 30,
  status TEXT DEFAULT 'pendente' CHECK (status IN ('pendente', 'programada', 'gozada', 'vencida')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- BANCO DE HORAS
-- ================================================================
CREATE TABLE IF NOT EXISTS banco_horas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  mes TEXT NOT NULL, -- formato: YYYY-MM
  horas_trabalhadas NUMERIC(6, 2) DEFAULT 0,
  horas_previstas NUMERIC(6, 2) DEFAULT 220,
  saldo NUMERIC(6, 2) GENERATED ALWAYS AS (horas_trabalhadas - horas_previstas) STORED,
  UNIQUE(colaborador_id, mes)
);

-- ================================================================
-- TREINAMENTOS — TRILHAS
-- ================================================================
CREATE TABLE IF NOT EXISTS trilhas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  setor TEXT,
  descricao TEXT,
  status TEXT DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS trilha_colaborador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trilha_id UUID REFERENCES trilhas(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  progresso INTEGER DEFAULT 0 CHECK (progresso BETWEEN 0 AND 100),
  status TEXT DEFAULT 'nao_iniciado' CHECK (status IN ('nao_iniciado', 'em_andamento', 'concluido')),
  atualizado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(trilha_id, colaborador_id)
);

-- ================================================================
-- CONTCOINS
-- ================================================================
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
  tipo TEXT NOT NULL CHECK (tipo IN ('ganho', 'perda')),
  valor NUMERIC(10, 2) NOT NULL,
  motivo TEXT,
  data DATE DEFAULT CURRENT_DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- MURAL DE RECADOS
-- ================================================================
CREATE TABLE IF NOT EXISTS recados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  autor_nome TEXT,
  titulo TEXT NOT NULL,
  conteudo TEXT NOT NULL,
  data_expiracao DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- FEED RH
-- ================================================================
CREATE TABLE IF NOT EXISTS feed_posts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  autor_nome TEXT,
  conteudo TEXT NOT NULL,
  imagem_url TEXT,
  curtidas INTEGER DEFAULT 0,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- RLS (Row Level Security) — Desabilitado para admin
-- ================================================================
ALTER TABLE colaboradores ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilha_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE contcoins ENABLE ROW LEVEL SECURITY;
ALTER TABLE contcoins_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recados ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;

-- Políticas: acesso total para service role e authenticated
CREATE POLICY "Allow all for authenticated" ON colaboradores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON colaboradores FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON feedbacks FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON feedbacks FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON evidencias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON evidencias FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON vagas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON vagas FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON candidatos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON candidatos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON avaliacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON avaliacoes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON movimentacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON movimentacoes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON ferias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON ferias FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON banco_horas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON banco_horas FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON trilhas FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON trilhas FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON trilha_colaborador FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON trilha_colaborador FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON contcoins FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON contcoins FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON contcoins_transacoes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON contcoins_transacoes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON recados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON recados FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON feed_posts FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON feed_posts FOR ALL TO anon USING (true) WITH CHECK (true);
