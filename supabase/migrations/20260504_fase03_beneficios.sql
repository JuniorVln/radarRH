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
