-- Autenticação por pessoa — parte 1 (aditiva, não muda o comportamento atual).
--
-- Contexto: até 11/09/2026 o sistema inteiro era protegido por UMA senha de site
-- (HTTP Basic no middleware.js) e todo mundo falava com o banco como `anon`. Isto aqui
-- prepara o terreno para login individual: colunas de acesso, convites e as funções que
-- leem QUEM está logado a partir do JWT que o PostgREST valida.
--
-- Esta parte NÃO mexe em policy nenhuma de propósito — rodar isto com o sistema no ar é
-- seguro. A troca das policies é a parte 2 (20260911_rls_por_papel.sql), que só entra
-- depois que a tela de login estiver publicada e funcionando.

BEGIN;

-- ---------------------------------------------------------------- acesso do colaborador
ALTER TABLE public.colaboradores
  ADD COLUMN IF NOT EXISTS email_login    text,
  ADD COLUMN IF NOT EXISTS senha_hash     text,
  ADD COLUMN IF NOT EXISTS papel          text NOT NULL DEFAULT 'colaborador',
  ADD COLUMN IF NOT EXISTS acesso_ativo   boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ultimo_acesso  timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'colaboradores_papel_check') THEN
    ALTER TABLE public.colaboradores
      ADD CONSTRAINT colaboradores_papel_check
      CHECK (papel IN ('admin', 'rh', 'gestor', 'colaborador'));
  END IF;
END
$$;

-- O login é sempre comparado em minúsculas; o índice garante que dois colaboradores não
-- disputem o mesmo e-mail de acesso (acontece: há um "JR Teste" demitido com o mesmo
-- endereço de uma pessoa ativa).
CREATE UNIQUE INDEX IF NOT EXISTS colaboradores_email_login_unico
  ON public.colaboradores (lower(email_login))
  WHERE email_login IS NOT NULL;

COMMENT ON COLUMN public.colaboradores.senha_hash IS
  'bcrypt. Nunca sai do servidor: o PostgREST não deve expor esta coluna a papel nenhum.';
COMMENT ON COLUMN public.colaboradores.acesso_ativo IS
  'false = pessoa existe no RH mas não entra no sistema. Desligar isto revoga o acesso sem apagar histórico.';

-- ------------------------------------------------------------------------- convites
-- Primeiro acesso e redefinição de senha. Guardamos o HASH do token, nunca o token:
-- se o banco vazar, os links em trânsito continuam inúteis.
CREATE TABLE IF NOT EXISTS public.acessos_convites (
  id             uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  colaborador_id uuid NOT NULL REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  token_hash     text NOT NULL,
  tipo           text NOT NULL CHECK (tipo IN ('primeiro_acesso', 'redefinicao')),
  expira_em      timestamptz NOT NULL,
  usado_em       timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS acessos_convites_colaborador ON public.acessos_convites (colaborador_id);
CREATE INDEX IF NOT EXISTS acessos_convites_token       ON public.acessos_convites (token_hash);

-- Ninguém fala com esta tabela pelo navegador: só as funções de servidor, que usam
-- service_role. RLS ligada e SEM policy = porta fechada para anon e authenticated.
ALTER TABLE public.acessos_convites ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------- quem está logado (lido do JWT)
-- O PostgREST publica os claims do token em request.jwt.claims. Mantemos o fallback para
-- app.user_id porque é assim que o adaptador de servidor (padrão Aion/Bravus) informa o
-- usuário quando fala com o banco fora do PostgREST.
CREATE OR REPLACE FUNCTION auth.uid() RETURNS uuid
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'sub', ''),
    nullif(current_setting('app.user_id', true), '')
  )::uuid
$$;

CREATE OR REPLACE FUNCTION auth.papel() RETURNS text
  LANGUAGE sql STABLE AS $$
  SELECT COALESCE(
    nullif(nullif(current_setting('request.jwt.claims', true), '')::json ->> 'papel', ''),
    nullif(current_setting('app.papel', true), ''),
    'colaborador'
  )
$$;

-- Atalho usado nas policies da parte 2. RH e admin enxergam a empresa inteira.
CREATE OR REPLACE FUNCTION auth.e_rh() RETURNS boolean
  LANGUAGE sql STABLE AS $$
  SELECT auth.papel() IN ('admin', 'rh')
$$;

GRANT EXECUTE ON FUNCTION auth.uid(), auth.papel(), auth.e_rh() TO anon, authenticated, service_role;

COMMIT;

NOTIFY pgrst, 'reload schema';
