-- Autenticação por pessoa — parte 2: as regras de acesso passam a olhar QUEM está logado.
--
-- O QUE MUDA
-- Até aqui as 68 policies herdadas do Supabase eram todas `USING (true)`: qualquer um que
-- alcançasse a API via qualquer chave lia a empresa inteira — CPF, salário, dados bancários.
-- A proteção real era a senha única do site. Agora quem decide é o banco, lendo `sub` e
-- `papel` de dentro do JWT que o PostgREST valida.
--
-- O papel `anon` deixa de existir na prática: sem login não há leitura nenhuma. As páginas
-- públicas (portal de vagas e questionário DISC) não dependem disso — elas falam com
-- funções de servidor, que usam a chave de serviço e filtram o que pode sair.
--
-- RODAR SÓ DEPOIS que a tela de login estiver publicada: a partir daqui, front sem sessão
-- não lê nada.

BEGIN;

-- ------------------------------------------------------------------ limpeza das policies
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname FROM pg_policies
    WHERE schemaname = 'public' AND tablename NOT IN ('acessos', 'acessos_convites')
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END
$$;

-- Sem login não se fala com o banco. Tirar o GRANT é cinto além do suspensório: mesmo que
-- uma policy nasça larga um dia, o papel anônimo não alcança as tabelas.
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.tablename);
  END LOOP;
END
$$;

-- ------------------------------------------------------------------------- policies novas
DO $$
DECLARE
  t text;
  -- Tabelas que guardam a vida de UMA pessoa: o dono vê a própria linha, o RH vê todas.
  pessoais text[] := ARRAY[
    'anexos_colaborador','avaliacoes','banco_horas','beneficios_configuracoes_colaborador',
    'beneficios_eventos','beneficios_resultados','contcoins','contcoins_transacoes',
    'dependentes','disc_avaliacoes','evidencias','feedbacks','ferias','holerites',
    'informes_rendimentos','movimentacoes','ocorrencias','pdis','trilha_colaborador'
  ];
  -- Catálogo da empresa: todo mundo logado lê, só o RH escreve.
  catalogo text[] := ARRAY[
    'cargos','trilhas','testes_tecnicos','email_templates','beneficios_periodos',
    'feed_posts','recados','vagas'
  ];
  -- Processo seletivo: dado de candidato não é da empresa inteira.
  so_rh text[] := ARRAY['candidatos','candidatos_testes','vagas_testes'];
BEGIN
  FOREACH t IN ARRAY pessoais LOOP
    EXECUTE format($f$
      CREATE POLICY "le o que e seu, RH le tudo" ON public.%I FOR SELECT TO authenticated
        USING (auth.e_rh() OR colaborador_id = auth.uid());
      CREATE POLICY "RH escreve" ON public.%I FOR INSERT TO authenticated
        WITH CHECK (auth.e_rh());
      CREATE POLICY "RH altera" ON public.%I FOR UPDATE TO authenticated
        USING (auth.e_rh()) WITH CHECK (auth.e_rh());
      CREATE POLICY "RH apaga" ON public.%I FOR DELETE TO authenticated
        USING (auth.e_rh());
    $f$, t, t, t, t);
  END LOOP;

  -- Exceção: o próprio colaborador marca o andamento do treinamento dele.
  CREATE POLICY "dono atualiza o proprio progresso" ON public.trilha_colaborador
    FOR UPDATE TO authenticated
    USING (colaborador_id = auth.uid()) WITH CHECK (colaborador_id = auth.uid());

  FOREACH t IN ARRAY catalogo LOOP
    EXECUTE format($f$
      CREATE POLICY "todo mundo logado le" ON public.%I FOR SELECT TO authenticated
        USING (true);
      CREATE POLICY "RH escreve" ON public.%I FOR INSERT TO authenticated
        WITH CHECK (auth.e_rh());
      CREATE POLICY "RH altera" ON public.%I FOR UPDATE TO authenticated
        USING (auth.e_rh()) WITH CHECK (auth.e_rh());
      CREATE POLICY "RH apaga" ON public.%I FOR DELETE TO authenticated
        USING (auth.e_rh());
    $f$, t, t, t, t);
  END LOOP;

  FOREACH t IN ARRAY so_rh LOOP
    EXECUTE format($f$
      CREATE POLICY "somente RH" ON public.%I FOR ALL TO authenticated
        USING (auth.e_rh()) WITH CHECK (auth.e_rh());
    $f$, t);
  END LOOP;
END
$$;

-- colaboradores: a ficha de todo mundo é o coração do sistema, então vai escrita à mão.
CREATE POLICY "RH ve todos, pessoa ve a si" ON public.colaboradores FOR SELECT TO authenticated
  USING (auth.e_rh() OR id = auth.uid());
CREATE POLICY "RH cadastra" ON public.colaboradores FOR INSERT TO authenticated
  WITH CHECK (auth.e_rh());
CREATE POLICY "RH edita" ON public.colaboradores FOR UPDATE TO authenticated
  USING (auth.e_rh()) WITH CHECK (auth.e_rh());
CREATE POLICY "RH remove" ON public.colaboradores FOR DELETE TO authenticated
  USING (auth.e_rh());

COMMIT;

NOTIFY pgrst, 'reload schema';
