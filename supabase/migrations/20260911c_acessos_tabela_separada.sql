-- Autenticação por pessoa — parte 1c: o acesso vira TABELA SEPARADA.
--
-- POR QUE ESTA CORREÇÃO EXISTE (erro cometido e desfeito em 11/09/2026)
-- A primeira tentativa guardou `senha_hash` dentro de `colaboradores` e tentou escondê-lo
-- com permissão por coluna. Funciona no papel e quebra na prática: para revogar UMA coluna
-- é preciso revogar a permissão da tabela inteira, e aí o `select=*` que o front usa em
-- dezenas de telas passa a responder `permission denied for table colaboradores`.
-- Conferido na hora, contra a API publicada — não é teoria.
--
-- Desenho certo: credencial em tabela própria, com RLS ligada e SEM policy para o
-- navegador. Assim `colaboradores` volta a ser uma tabela normal (o `*` funciona) e o hash
-- da senha simplesmente não existe do ponto de vista de quem fala pelo browser. Quem mexe
-- em credencial é só a função de servidor, que usa a chave de serviço.

BEGIN;

-- 1) devolve o acesso normal a colaboradores (desfaz a permissão por coluna)
REVOKE SELECT, INSERT, UPDATE, REFERENCES ON public.colaboradores FROM anon, authenticated;
GRANT ALL ON public.colaboradores TO anon, authenticated, service_role;

-- 2) tira de colaboradores as colunas de credencial criadas na parte 1 (estavam vazias)
DROP INDEX IF EXISTS public.colaboradores_email_login_unico;
ALTER TABLE public.colaboradores
  DROP COLUMN IF EXISTS email_login,
  DROP COLUMN IF EXISTS senha_hash,
  DROP COLUMN IF EXISTS papel,
  DROP COLUMN IF EXISTS acesso_ativo,
  DROP COLUMN IF EXISTS ultimo_acesso;
ALTER TABLE public.colaboradores DROP CONSTRAINT IF EXISTS colaboradores_papel_check;

-- 3) a tabela de acesso, separada
CREATE TABLE IF NOT EXISTS public.acessos (
  colaborador_id uuid PRIMARY KEY REFERENCES public.colaboradores(id) ON DELETE CASCADE,
  email_login    text NOT NULL,
  senha_hash     text,
  papel          text NOT NULL DEFAULT 'colaborador'
                 CHECK (papel IN ('admin', 'rh', 'gestor', 'colaborador')),
  ativo          boolean NOT NULL DEFAULT true,
  ultimo_acesso  timestamptz,
  criado_em      timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS acessos_email_login_unico ON public.acessos (lower(email_login));

COMMENT ON TABLE  public.acessos IS
  'Credenciais de login. RLS ligada e sem policy: invisível para quem fala pelo navegador. Só as funções de servidor (service_role) leem e escrevem aqui.';
COMMENT ON COLUMN public.acessos.senha_hash IS 'bcrypt, custo 12. NULL = convite pendente, ainda sem senha definida.';
COMMENT ON COLUMN public.acessos.ativo IS 'false revoga o acesso sem apagar a pessoa nem o histórico.';

-- RLS ligada, nenhuma policy: porta fechada para anon e authenticated.
-- service_role tem BYPASSRLS, então as funções de servidor continuam passando.
ALTER TABLE public.acessos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.acessos FORCE ROW LEVEL SECURITY;

REVOKE ALL ON public.acessos FROM anon, authenticated;
GRANT ALL ON public.acessos TO service_role;

-- mesma coisa para os convites criados na parte 1
REVOKE ALL ON public.acessos_convites FROM anon, authenticated;
GRANT ALL ON public.acessos_convites TO service_role;
ALTER TABLE public.acessos_convites FORCE ROW LEVEL SECURITY;

COMMIT;

NOTIFY pgrst, 'reload schema';
