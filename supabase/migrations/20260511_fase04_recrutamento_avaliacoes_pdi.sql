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
