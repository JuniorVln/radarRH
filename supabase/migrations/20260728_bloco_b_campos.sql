-- Bloco B — campos novos pedidos na reunião com a Deise (11/06).
-- Rodar UMA vez no SQL Editor do Supabase (projeto bycpifryzynsiabkpejo).
--
-- Seguro de rodar: só ADICIONA colunas, todas opcionais, com IF NOT EXISTS.
-- Não altera, não remove e não reescreve nenhum dado existente. Rodar duas vezes
-- não causa erro nem efeito duplicado.
--
-- Depois de rodar, o PostgREST precisa recarregar o cache de schema — o NOTIFY no
-- fim faz isso. Sem ele, a API continua respondendo como se as colunas não existissem.

-- ============================================================
-- 1. MURAL DE RECADOS — data do evento
-- ============================================================
-- Hoje só existe data_expiracao (quando o recado SAI do mural), que é outra coisa:
-- o recado da confraternização pode expirar depois da festa. Este campo é a data do
-- acontecimento em si, pra aparecer no card e permitir ordenar por "o que vem aí".
ALTER TABLE recados
  ADD COLUMN IF NOT EXISTS data_evento date;

COMMENT ON COLUMN recados.data_evento IS
  'Data do acontecimento noticiado (festa, reunião, prazo). Não confundir com data_expiracao, que é quando o recado sai do mural.';

-- ============================================================
-- 2. TREINAMENTOS — link, período e acompanhamento por participante
-- ============================================================
ALTER TABLE trilhas
  ADD COLUMN IF NOT EXISTS link_url text,
  ADD COLUMN IF NOT EXISTS carga_horaria numeric,
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_fim date;

COMMENT ON COLUMN trilhas.link_url IS 'Link do curso/material da trilha (YouTube, PDF, plataforma externa).';
COMMENT ON COLUMN trilhas.carga_horaria IS 'Carga horária em horas. Usada no certificado.';

-- Por participante: quando começou e quando concluiu. O progresso e o status já
-- existem em trilha_colaborador; faltavam as datas pra saber quem travou no meio.
ALTER TABLE trilha_colaborador
  ADD COLUMN IF NOT EXISTS data_inicio date,
  ADD COLUMN IF NOT EXISTS data_conclusao date;

COMMENT ON COLUMN trilha_colaborador.data_conclusao IS 'Preenchida quando o progresso chega a 100%. Base para emitir o certificado.';

-- ============================================================
-- 3. FÉRIAS — abono pecuniário (venda de dias)
-- ============================================================
-- A CLT permite vender até 1/3 do período (10 dias de 30). Hoje o sistema só guarda
-- "dias", sem separar o que foi gozado do que foi vendido — então o cálculo de
-- benefício e o valor a pagar ficam incompletos.
ALTER TABLE ferias
  ADD COLUMN IF NOT EXISTS dias_abono integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS observacao text;

COMMENT ON COLUMN ferias.dias_abono IS
  'Dias vendidos (abono pecuniário). A coluna "dias" continua sendo os dias de gozo. Limite legal: 1/3 do período.';

-- Trava no banco, não só na tela: 0 a 10 dias. Vale mesmo se alguém escrever
-- direto pela API. Criada só se ainda não existir.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'ferias_dias_abono_limite'
  ) THEN
    ALTER TABLE ferias
      ADD CONSTRAINT ferias_dias_abono_limite CHECK (dias_abono >= 0 AND dias_abono <= 10);
  END IF;
END $$;

-- ============================================================
-- 4. RECRUTAMENTO — origem e desfecho do candidato
-- ============================================================
-- Sem "origem" não dá pra responder "de onde vêm os candidatos que contratamos",
-- que é o dado que decide onde anunciar vaga.
ALTER TABLE candidatos
  ADD COLUMN IF NOT EXISTS origem text,
  ADD COLUMN IF NOT EXISTS motivo_desfecho text,
  ADD COLUMN IF NOT EXISTS data_desfecho date;

COMMENT ON COLUMN candidatos.origem IS 'Como o candidato chegou: Indicação, LinkedIn, InfoJobs, Site, Banco de talentos, Outro.';
COMMENT ON COLUMN candidatos.motivo_desfecho IS 'Por que saiu do processo (desistência, desclassificação). Preenchido ao mover para Banco/Reprovado.';

-- ============================================================
-- Recarrega o cache de schema da API (obrigatório)
-- ============================================================
NOTIFY pgrst, 'reload schema';

-- ============================================================
-- Conferência — deve retornar 11 linhas
-- ============================================================
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE (table_name = 'recados'            AND column_name = 'data_evento')
   OR (table_name = 'trilhas'            AND column_name IN ('link_url','carga_horaria','data_inicio','data_fim'))
   OR (table_name = 'trilha_colaborador' AND column_name IN ('data_inicio','data_conclusao'))
   OR (table_name = 'ferias'             AND column_name IN ('dias_abono','observacao'))
   OR (table_name = 'candidatos'         AND column_name IN ('origem','motivo_desfecho','data_desfecho'))
ORDER BY table_name, column_name;
