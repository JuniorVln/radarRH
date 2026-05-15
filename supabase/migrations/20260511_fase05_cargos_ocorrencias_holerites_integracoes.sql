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
