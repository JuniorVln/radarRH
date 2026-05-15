SET search_path TO public;

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
  email_pessoal TEXT,
  email_corporativo TEXT,
  foto_url TEXT,
  cargo TEXT NOT NULL,
  setor TEXT NOT NULL,
  celula TEXT,
  unidade TEXT,
  cnpj_unidade TEXT,
  tipo TEXT NOT NULL CHECK (tipo IN ('CLT', 'Estagiário', 'Terceiro', 'PJ', 'Mensalista', 'Horista')),
  data_admissao DATE,
  data_nascimento DATE,
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo', 'demitido')),
  perfil_disc TEXT CHECK (perfil_disc IN ('D', 'I', 'S', 'C')),
  salario NUMERIC(12, 2),
  telefone TEXT,
  genero TEXT,
  raca_etnia TEXT,
  estado_civil TEXT,
  escolaridade TEXT,
  pcd BOOLEAN DEFAULT FALSE,
  tipo_pcd TEXT,
  nome_mae TEXT,
  nome_pai TEXT,
  contato_emergencia_nome TEXT,
  contato_emergencia_parentesco TEXT,
  contato_emergencia_telefone TEXT,
  contato_principal TEXT,
  endereco JSONB DEFAULT '{}'::jsonb,
  rg TEXT,
  rg_orgao_uf TEXT,
  pis_pasep TEXT,
  ctps TEXT,
  titulo_eleitor TEXT,
  dados_bancarios JSONB DEFAULT '{}'::jsonb,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- DEPENDENTES
-- ================================================================
CREATE TABLE IF NOT EXISTS dependentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  parentesco TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- ANEXOS DE COLABORADOR
-- ================================================================
CREATE TABLE IF NOT EXISTS anexos_colaborador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_documento TEXT NOT NULL DEFAULT 'Documento pessoal',
  arquivo_url TEXT,
  ocr_status TEXT NOT NULL DEFAULT 'pendente' CHECK (ocr_status IN ('pendente', 'processando', 'concluido', 'erro')),
  ocr_resultado JSONB,
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
  area TEXT,
  numero_vagas INTEGER DEFAULT 1,
  salario_min NUMERIC(12, 2),
  salario_max NUMERIC(12, 2),
  data_limite DATE,
  empresa TEXT,
  localidade TEXT,
  prioridade TEXT CHECK (prioridade IN ('baixa', 'media', 'alta')),
  responsavel TEXT,
  motivo_abertura TEXT,
  beneficios TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- TESTES TÉCNICOS
-- ================================================================
CREATE TABLE IF NOT EXISTS testes_tecnicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  link_externo TEXT,
  area TEXT,
  tempo_estimado_minutos INTEGER,
  pontuacao_maxima NUMERIC(8, 2),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vagas_testes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vaga_id UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  teste_id UUID NOT NULL REFERENCES testes_tecnicos(id) ON DELETE CASCADE,
  UNIQUE(vaga_id, teste_id)
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
  area TEXT,
  observacoes_internas TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- RESULTADOS DE TESTES (Candidatos)
-- ================================================================
CREATE TABLE IF NOT EXISTS candidatos_testes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  teste_id UUID NOT NULL REFERENCES testes_tecnicos(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'enviado', 'concluido', 'avaliado')),
  resultado_score NUMERIC(8, 2),
  observacoes TEXT,
  concluido_em DATE,
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
  tipo TEXT CHECK (tipo IN ('email', 'whatsapp', 'ambos')),
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
-- PDI (Plano de Desenvolvimento Individual)
-- ================================================================
CREATE TABLE IF NOT EXISTS pdis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'em_andamento' CHECK (status IN ('planejado', 'em_andamento', 'concluido', 'suspenso')),
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
-- CARGOS E SALÁRIOS
-- ================================================================
CREATE TABLE IF NOT EXISTS cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  area TEXT,
  nivel TEXT NOT NULL,
  descricao TEXT,
  atribuicoes TEXT,
  requisitos TEXT,
  salario_min NUMERIC(12, 2),
  salario_max NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'ativo' CHECK (status IN ('ativo', 'inativo')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- OCORRÊNCIAS
-- ================================================================
CREATE TABLE IF NOT EXISTS ocorrencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('advertencia', 'falta', 'atraso', 'ausencia', 'elogio', 'outro')),
  data_ocorrencia DATE NOT NULL,
  severidade TEXT CHECK (severidade IN ('baixa', 'media', 'alta')),
  horas NUMERIC(6, 2),
  descricao TEXT NOT NULL,
  acao_tomada TEXT,
  status TEXT NOT NULL DEFAULT 'registrada' CHECK (status IN ('registrada', 'em_analise', 'resolvida', 'cancelada')),
  anexo_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- HOLERITES E INFORMES
-- ================================================================
CREATE TABLE IF NOT EXISTS holerites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  competencia TEXT NOT NULL,
  salario_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  proventos NUMERIC(12, 2) NOT NULL DEFAULT 0,
  descontos NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_liquido NUMERIC(12, 2) NOT NULL DEFAULT 0,
  arquivo_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'disponivel', 'enviado', 'cancelado')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS informes_rendimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  ano_base INTEGER NOT NULL,
  rendimentos_tributaveis NUMERIC(12, 2) NOT NULL DEFAULT 0,
  imposto_retido NUMERIC(12, 2) NOT NULL DEFAULT 0,
  arquivo_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho' CHECK (status IN ('rascunho', 'disponivel', 'enviado')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- BENEFÍCIOS
-- ================================================================
CREATE TABLE IF NOT EXISTS beneficios_periodos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competencia TEXT NOT NULL UNIQUE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  dias_uteis INTEGER NOT NULL DEFAULT 0,
  dias_home_office INTEGER NOT NULL DEFAULT 0,
  feriados_nacionais JSONB NOT NULL DEFAULT '[]'::jsonb,
  feriados_regionais JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'calculado', 'fechado')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficios_configuracoes_colaborador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  empresa TEXT NOT NULL,
  localidade TEXT,
  valor_vr_diario NUMERIC(10, 2) NOT NULL DEFAULT 0,
  recebe_frutas BOOLEAN NOT NULL DEFAULT FALSE,
  valor_frutas_mensal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tipo_transporte TEXT NOT NULL DEFAULT 'HOME OFFICE'
    CHECK (tipo_transporte IN ('TRI', 'TEU', 'COMBUSTIVEL', 'HOME OFFICE', 'BROCHIER', 'OUTRO')),
  valor_vt_diario NUMERIC(10, 2) NOT NULL DEFAULT 0,
  vt_fixo_mensal NUMERIC(10, 2),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficios_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periodo_id UUID NOT NULL REFERENCES beneficios_periodos(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('falta', 'atestado', 'ferias', 'feriado_regional', 'home_office_extra', 'ajuste_manual')),
  data_inicio DATE,
  data_fim DATE,
  dias NUMERIC(6, 2) NOT NULL DEFAULT 0,
  impacta_vr BOOLEAN NOT NULL DEFAULT TRUE,
  impacta_vt BOOLEAN NOT NULL DEFAULT TRUE,
  valor_ajuste_vr NUMERIC(10, 2),
  valor_ajuste_vt NUMERIC(10, 2),
  motivo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficios_resultados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periodo_id UUID NOT NULL REFERENCES beneficios_periodos(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  empresa TEXT NOT NULL,
  tipo_transporte TEXT NOT NULL,
  dias_uteis_vr NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_uteis_vt NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_home_office NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_ferias NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_faltas NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_atestados NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_feriados_regionais NUMERIC(6, 2) NOT NULL DEFAULT 0,
  total_vr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_vt NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ajuste_manual_vr NUMERIC(10, 2),
  ajuste_manual_vt NUMERIC(10, 2),
  motivo_ajuste TEXT,
  calculado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(periodo_id, colaborador_id)
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
ALTER TABLE anexos_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedbacks ENABLE ROW LEVEL SECURITY;
ALTER TABLE evidencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos ENABLE ROW LEVEL SECURITY;
ALTER TABLE avaliacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE movimentacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ferias ENABLE ROW LEVEL SECURITY;
ALTER TABLE banco_horas ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficios_periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficios_configuracoes_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficios_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficios_resultados ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilhas ENABLE ROW LEVEL SECURITY;
ALTER TABLE trilha_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE contcoins ENABLE ROW LEVEL SECURITY;
ALTER TABLE contcoins_transacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE recados ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE testes_tecnicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE vagas_testes ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidatos_testes ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE pdis ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ocorrencias ENABLE ROW LEVEL SECURITY;
ALTER TABLE holerites ENABLE ROW LEVEL SECURITY;
ALTER TABLE informes_rendimentos ENABLE ROW LEVEL SECURITY;

-- Políticas: acesso total para service role e authenticated
-- (Adicionando para as novas tabelas)
CREATE POLICY "Allow all for authenticated" ON testes_tecnicos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON testes_tecnicos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON vagas_testes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON vagas_testes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON candidatos_testes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON candidatos_testes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON email_templates FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON email_templates FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON pdis FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON pdis FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON cargos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON cargos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON ocorrencias FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON ocorrencias FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON holerites FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON holerites FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON informes_rendimentos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON informes_rendimentos FOR ALL TO anon USING (true) WITH CHECK (true);

-- Políticas: acesso total para service role e authenticated
CREATE POLICY "Allow all for authenticated" ON colaboradores FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON colaboradores FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON dependentes FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON dependentes FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON anexos_colaborador FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON anexos_colaborador FOR ALL TO anon USING (true) WITH CHECK (true);

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

CREATE POLICY "Allow all for authenticated" ON beneficios_periodos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON beneficios_periodos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON beneficios_configuracoes_colaborador FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON beneficios_configuracoes_colaborador FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON beneficios_eventos FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON beneficios_eventos FOR ALL TO anon USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated" ON beneficios_resultados FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "Allow all anon" ON beneficios_resultados FOR ALL TO anon USING (true) WITH CHECK (true);

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

-- Migracoes incrementais consolidadas: Fase 01 a 05.
-- Todas as statements usam IF NOT EXISTS / ADD COLUMN IF NOT EXISTS -- seguro reexecutar.
SET search_path TO public;

-- Migracao incremental da Fase 01.
-- Preserva dados existentes e adiciona os campos iniciados no cadastro de colaboradores.

ALTER TABLE colaboradores
  ADD COLUMN IF NOT EXISTS genero TEXT,
  ADD COLUMN IF NOT EXISTS email_pessoal TEXT,
  ADD COLUMN IF NOT EXISTS email_corporativo TEXT,
  ADD COLUMN IF NOT EXISTS unidade TEXT,
  ADD COLUMN IF NOT EXISTS cnpj_unidade TEXT,
  ADD COLUMN IF NOT EXISTS raca_etnia TEXT,
  ADD COLUMN IF NOT EXISTS estado_civil TEXT,
  ADD COLUMN IF NOT EXISTS escolaridade TEXT,
  ADD COLUMN IF NOT EXISTS pcd BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS tipo_pcd TEXT,
  ADD COLUMN IF NOT EXISTS nome_mae TEXT,
  ADD COLUMN IF NOT EXISTS nome_pai TEXT,
  ADD COLUMN IF NOT EXISTS contato_emergencia_nome TEXT,
  ADD COLUMN IF NOT EXISTS contato_emergencia_parentesco TEXT,
  ADD COLUMN IF NOT EXISTS contato_emergencia_telefone TEXT,
  ADD COLUMN IF NOT EXISTS contato_principal TEXT,
  ADD COLUMN IF NOT EXISTS endereco JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS rg TEXT,
  ADD COLUMN IF NOT EXISTS rg_orgao_uf TEXT,
  ADD COLUMN IF NOT EXISTS pis_pasep TEXT,
  ADD COLUMN IF NOT EXISTS ctps TEXT,
  ADD COLUMN IF NOT EXISTS titulo_eleitor TEXT,
  ADD COLUMN IF NOT EXISTS dados_bancarios JSONB DEFAULT '{}'::jsonb;

ALTER TABLE colaboradores
  DROP CONSTRAINT IF EXISTS colaboradores_tipo_check;

ALTER TABLE colaboradores
  ADD CONSTRAINT colaboradores_tipo_check
  CHECK (tipo IN ('CLT', 'Estagiário', 'Terceiro', 'PJ', 'Mensalista', 'Horista'));

CREATE TABLE IF NOT EXISTS dependentes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  parentesco TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anexos_colaborador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  tipo_documento TEXT NOT NULL DEFAULT 'Documento pessoal',
  arquivo_url TEXT,
  ocr_status TEXT NOT NULL DEFAULT 'pendente' CHECK (ocr_status IN ('pendente', 'processando', 'concluido', 'erro')),
  ocr_resultado JSONB,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE dependentes ENABLE ROW LEVEL SECURITY;
ALTER TABLE anexos_colaborador ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dependentes'
      AND policyname = 'Allow all for authenticated'
  ) THEN
    CREATE POLICY "Allow all for authenticated" ON dependentes
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'dependentes'
      AND policyname = 'Allow all anon'
  ) THEN
    CREATE POLICY "Allow all anon" ON dependentes
      FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'anexos_colaborador'
      AND policyname = 'Allow all for authenticated'
  ) THEN
    CREATE POLICY "Allow all for authenticated" ON anexos_colaborador
      FOR ALL TO authenticated USING (true) WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'anexos_colaborador'
      AND policyname = 'Allow all anon'
  ) THEN
    CREATE POLICY "Allow all anon" ON anexos_colaborador
      FOR ALL TO anon USING (true) WITH CHECK (true);
  END IF;
END $$;
-- Migracao incremental da Fase 03.
-- Modelo de competencias, configuracoes, eventos e resultados de beneficios.

CREATE TABLE IF NOT EXISTS beneficios_periodos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  competencia TEXT NOT NULL UNIQUE,
  periodo_inicio DATE NOT NULL,
  periodo_fim DATE NOT NULL,
  dias_uteis INTEGER NOT NULL DEFAULT 0,
  dias_home_office INTEGER NOT NULL DEFAULT 0,
  feriados_nacionais JSONB NOT NULL DEFAULT '[]'::jsonb,
  feriados_regionais JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'aberto' CHECK (status IN ('aberto', 'calculado', 'fechado')),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficios_configuracoes_colaborador (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  empresa TEXT NOT NULL,
  localidade TEXT,
  valor_vr_diario NUMERIC(10, 2) NOT NULL DEFAULT 0,
  recebe_frutas BOOLEAN NOT NULL DEFAULT FALSE,
  valor_frutas_mensal NUMERIC(10, 2) NOT NULL DEFAULT 0,
  tipo_transporte TEXT NOT NULL DEFAULT 'HOME OFFICE'
    CHECK (tipo_transporte IN ('TRI', 'TEU', 'COMBUSTIVEL', 'HOME OFFICE', 'BROCHIER', 'OUTRO')),
  valor_vt_diario NUMERIC(10, 2) NOT NULL DEFAULT 0,
  vt_fixo_mensal NUMERIC(10, 2),
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficios_eventos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periodo_id UUID NOT NULL REFERENCES beneficios_periodos(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('falta', 'atestado', 'ferias', 'feriado_regional', 'home_office_extra', 'ajuste_manual')),
  data_inicio DATE,
  data_fim DATE,
  dias NUMERIC(6, 2) NOT NULL DEFAULT 0,
  impacta_vr BOOLEAN NOT NULL DEFAULT TRUE,
  impacta_vt BOOLEAN NOT NULL DEFAULT TRUE,
  valor_ajuste_vr NUMERIC(10, 2),
  valor_ajuste_vt NUMERIC(10, 2),
  motivo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS beneficios_resultados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  periodo_id UUID NOT NULL REFERENCES beneficios_periodos(id) ON DELETE CASCADE,
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  empresa TEXT NOT NULL,
  tipo_transporte TEXT NOT NULL,
  dias_uteis_vr NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_uteis_vt NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_home_office NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_ferias NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_faltas NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_atestados NUMERIC(6, 2) NOT NULL DEFAULT 0,
  dias_feriados_regionais NUMERIC(6, 2) NOT NULL DEFAULT 0,
  total_vr NUMERIC(10, 2) NOT NULL DEFAULT 0,
  total_vt NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ajuste_manual_vr NUMERIC(10, 2),
  ajuste_manual_vt NUMERIC(10, 2),
  motivo_ajuste TEXT,
  calculado_em TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(periodo_id, colaborador_id)
);

ALTER TABLE beneficios_periodos ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficios_configuracoes_colaborador ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficios_eventos ENABLE ROW LEVEL SECURITY;
ALTER TABLE beneficios_resultados ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'beneficios_periodos',
    'beneficios_configuracoes_colaborador',
    'beneficios_eventos',
    'beneficios_resultados'
  ]
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = 'Allow all for authenticated'
    ) THEN
      EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', table_name);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = 'Allow all anon'
    ) THEN
      EXECUTE format('CREATE POLICY "Allow all anon" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', table_name);
    END IF;
  END LOOP;
END $$;
-- Fase 4 - Recrutamento, Avaliacoes, Nine Box e PDI
-- Migração incremental e idempotente para alinhar o banco às telas da fase 4.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

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
  area TEXT,
  numero_vagas INTEGER DEFAULT 1,
  salario_min NUMERIC(12, 2),
  salario_max NUMERIC(12, 2),
  data_limite DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE vagas ADD COLUMN IF NOT EXISTS empresa TEXT;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS localidade TEXT;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS prioridade TEXT;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS responsavel TEXT;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS motivo_abertura TEXT;
ALTER TABLE vagas ADD COLUMN IF NOT EXISTS beneficios TEXT;

CREATE TABLE IF NOT EXISTS testes_tecnicos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  link_externo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE testes_tecnicos ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE testes_tecnicos ADD COLUMN IF NOT EXISTS tempo_estimado_minutos INTEGER;
ALTER TABLE testes_tecnicos ADD COLUMN IF NOT EXISTS pontuacao_maxima NUMERIC(8, 2);

CREATE TABLE IF NOT EXISTS vagas_testes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vaga_id UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  teste_id UUID NOT NULL REFERENCES testes_tecnicos(id) ON DELETE CASCADE,
  UNIQUE(vaga_id, teste_id)
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
  area TEXT,
  observacoes_internas TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidatos_testes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  candidato_id UUID NOT NULL REFERENCES candidatos(id) ON DELETE CASCADE,
  teste_id UUID NOT NULL REFERENCES testes_tecnicos(id) ON DELETE CASCADE,
  observacoes TEXT,
  concluido_em DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE candidatos_testes ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pendente';
ALTER TABLE candidatos_testes ADD COLUMN IF NOT EXISTS resultado_score NUMERIC(8, 2);

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'candidatos_testes'
      AND column_name = 'nota'
  ) THEN
    UPDATE candidatos_testes
    SET resultado_score = COALESCE(resultado_score, nota)
    WHERE resultado_score IS NULL;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo TEXT NOT NULL,
  tipo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE CASCADE,
  ciclo TEXT NOT NULL,
  data_inicio DATE,
  data_fim DATE,
  status TEXT DEFAULT 'pendente',
  nota NUMERIC(3, 1),
  potencial INTEGER,
  desempenho INTEGER,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  titulo TEXT NOT NULL,
  descricao TEXT,
  objetivo TEXT,
  data_inicio DATE NOT NULL,
  data_fim DATE,
  status TEXT NOT NULL DEFAULT 'em_andamento',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vagas_status_check') THEN
    ALTER TABLE vagas ADD CONSTRAINT vagas_status_check CHECK (status IN ('aberta', 'fechada', 'pausada'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vagas_modelo_trabalho_check') THEN
    ALTER TABLE vagas ADD CONSTRAINT vagas_modelo_trabalho_check CHECK (modelo_trabalho IN ('Presencial', 'Híbrido', 'Remoto'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'vagas_prioridade_check') THEN
    ALTER TABLE vagas ADD CONSTRAINT vagas_prioridade_check CHECK (prioridade IN ('baixa', 'media', 'alta'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidatos_etapa_kanban_check') THEN
    ALTER TABLE candidatos ADD CONSTRAINT candidatos_etapa_kanban_check CHECK (etapa_kanban IN ('triagem', 'entrevista_rh', 'entrevista_tecnica', 'proposta', 'contratado', 'reprovado'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidatos_perfil_disc_check') THEN
    ALTER TABLE candidatos ADD CONSTRAINT candidatos_perfil_disc_check CHECK (perfil_disc IN ('D', 'I', 'S', 'C'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidatos_recomendacao_rh_check') THEN
    ALTER TABLE candidatos ADD CONSTRAINT candidatos_recomendacao_rh_check CHECK (recomendacao_rh IN ('sim', 'nao', 'pendente'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidatos_aderencia_vaga_check') THEN
    ALTER TABLE candidatos ADD CONSTRAINT candidatos_aderencia_vaga_check CHECK (aderencia_vaga BETWEEN 0 AND 100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'candidatos_testes_status_check') THEN
    ALTER TABLE candidatos_testes ADD CONSTRAINT candidatos_testes_status_check CHECK (status IN ('pendente', 'enviado', 'concluido', 'avaliado'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'email_templates_tipo_check') THEN
    ALTER TABLE email_templates ADD CONSTRAINT email_templates_tipo_check CHECK (tipo IN ('email', 'whatsapp', 'ambos'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avaliacoes_status_check') THEN
    ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_status_check CHECK (status IN ('pendente', 'em_andamento', 'concluido', 'atrasado'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avaliacoes_nota_check') THEN
    ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_nota_check CHECK (nota BETWEEN 0 AND 10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avaliacoes_potencial_check') THEN
    ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_potencial_check CHECK (potencial BETWEEN 1 AND 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'avaliacoes_desempenho_check') THEN
    ALTER TABLE avaliacoes ADD CONSTRAINT avaliacoes_desempenho_check CHECK (desempenho BETWEEN 1 AND 3);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'pdis_status_check') THEN
    ALTER TABLE pdis ADD CONSTRAINT pdis_status_check CHECK (status IN ('planejado', 'em_andamento', 'concluido', 'suspenso'));
  END IF;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['vagas', 'testes_tecnicos', 'vagas_testes', 'candidatos', 'candidatos_testes', 'email_templates', 'avaliacoes', 'pdis']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = 'Allow all for authenticated'
    ) THEN
      EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', table_name);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = 'Allow all anon'
    ) THEN
      EXECUTE format('CREATE POLICY "Allow all anon" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', table_name);
    END IF;
  END LOOP;
END $$;
-- Fase 5 - Cargos, Ocorrencias, Holerites e Integracoes

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS cargos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo TEXT NOT NULL,
  area TEXT,
  nivel TEXT NOT NULL,
  descricao TEXT,
  atribuicoes TEXT,
  requisitos TEXT,
  salario_min NUMERIC(12, 2),
  salario_max NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'ativo',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ocorrencias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  tipo TEXT NOT NULL,
  data_ocorrencia DATE NOT NULL,
  severidade TEXT,
  horas NUMERIC(6, 2),
  descricao TEXT NOT NULL,
  acao_tomada TEXT,
  status TEXT NOT NULL DEFAULT 'registrada',
  anexo_url TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS holerites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  competencia TEXT NOT NULL,
  salario_base NUMERIC(12, 2) NOT NULL DEFAULT 0,
  proventos NUMERIC(12, 2) NOT NULL DEFAULT 0,
  descontos NUMERIC(12, 2) NOT NULL DEFAULT 0,
  valor_liquido NUMERIC(12, 2) NOT NULL DEFAULT 0,
  arquivo_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS informes_rendimentos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  colaborador_id UUID REFERENCES colaboradores(id) ON DELETE SET NULL,
  ano_base INTEGER NOT NULL,
  rendimentos_tributaveis NUMERIC(12, 2) NOT NULL DEFAULT 0,
  imposto_retido NUMERIC(12, 2) NOT NULL DEFAULT 0,
  arquivo_url TEXT,
  status TEXT NOT NULL DEFAULT 'rascunho',
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'cargos_status_check') THEN
    ALTER TABLE cargos ADD CONSTRAINT cargos_status_check CHECK (status IN ('ativo', 'inativo'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ocorrencias_tipo_check') THEN
    ALTER TABLE ocorrencias ADD CONSTRAINT ocorrencias_tipo_check CHECK (tipo IN ('advertencia', 'falta', 'atraso', 'ausencia', 'elogio', 'outro'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ocorrencias_severidade_check') THEN
    ALTER TABLE ocorrencias ADD CONSTRAINT ocorrencias_severidade_check CHECK (severidade IN ('baixa', 'media', 'alta'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ocorrencias_status_check') THEN
    ALTER TABLE ocorrencias ADD CONSTRAINT ocorrencias_status_check CHECK (status IN ('registrada', 'em_analise', 'resolvida', 'cancelada'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'holerites_status_check') THEN
    ALTER TABLE holerites ADD CONSTRAINT holerites_status_check CHECK (status IN ('rascunho', 'disponivel', 'enviado', 'cancelado'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'informes_rendimentos_status_check') THEN
    ALTER TABLE informes_rendimentos ADD CONSTRAINT informes_rendimentos_status_check CHECK (status IN ('rascunho', 'disponivel', 'enviado'));
  END IF;
END $$;

DO $$
DECLARE
  table_name TEXT;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['cargos', 'ocorrencias', 'holerites', 'informes_rendimentos']
  LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', table_name);

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = 'Allow all for authenticated'
    ) THEN
      EXECUTE format('CREATE POLICY "Allow all for authenticated" ON %I FOR ALL TO authenticated USING (true) WITH CHECK (true)', table_name);
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM pg_policies
      WHERE schemaname = 'public'
        AND tablename = table_name
        AND policyname = 'Allow all anon'
    ) THEN
      EXECUTE format('CREATE POLICY "Allow all anon" ON %I FOR ALL TO anon USING (true) WITH CHECK (true)', table_name);
    END IF;
  END LOOP;
END $$;
