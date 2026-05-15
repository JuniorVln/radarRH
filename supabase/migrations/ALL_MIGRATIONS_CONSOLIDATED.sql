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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  colaborador_id UUID NOT NULL REFERENCES colaboradores(id) ON DELETE CASCADE,
  nome TEXT NOT NULL,
  parentesco TEXT,
  cpf TEXT,
  rg TEXT,
  data_nascimento DATE,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS anexos_colaborador (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS vagas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo TEXT NOT NULL,
  descricao TEXT,
  link_externo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE testes_tecnicos ADD COLUMN IF NOT EXISTS area TEXT;
ALTER TABLE testes_tecnicos ADD COLUMN IF NOT EXISTS tempo_estimado_minutos INTEGER;
ALTER TABLE testes_tecnicos ADD COLUMN IF NOT EXISTS pontuacao_maxima NUMERIC(8, 2);

CREATE TABLE IF NOT EXISTS vagas_testes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vaga_id UUID NOT NULL REFERENCES vagas(id) ON DELETE CASCADE,
  teste_id UUID NOT NULL REFERENCES testes_tecnicos(id) ON DELETE CASCADE,
  UNIQUE(vaga_id, teste_id)
);

CREATE TABLE IF NOT EXISTS candidatos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  assunto TEXT NOT NULL,
  corpo TEXT NOT NULL,
  tipo TEXT,
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS tipo TEXT;

CREATE TABLE IF NOT EXISTS avaliacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE IF NOT EXISTS cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
