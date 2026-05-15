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
