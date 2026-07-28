-- DISC — tabela das avaliações.
-- Rodar UMA vez no SQL Editor do Supabase (projeto bycpifryzynsiabkpejo).
--
-- Seguro: só CRIA coisa nova. Não altera nem remove nada do que existe.
-- A coluna colaboradores.perfil_disc (letra única D/I/S/C) continua como está e passa
-- a ser preenchida com o perfil PRIMÁRIO — assim as telas que já mostram o DISC
-- seguem funcionando sem mudança.

create table if not exists disc_avaliacoes (
  id uuid primary key default gen_random_uuid(),

  -- Uma avaliação é de um colaborador OU de um candidato, nunca dos dois.
  colaborador_id uuid references colaboradores(id) on delete cascade,
  candidato_id   uuid references candidatos(id)    on delete cascade,

  -- Token do link público. É por ele que a pessoa responde, sem precisar de login.
  token text unique not null,

  status text not null default 'pendente',  -- pendente | respondido | cancelado

  -- Respostas cruas (uma entrada por tétrade) e o resultado apurado.
  -- Guardamos as respostas para poder reapurar se a regra de cálculo mudar,
  -- sem ter que pedir pra pessoa responder de novo.
  respostas jsonb,
  resultado jsonb,

  criado_em      timestamptz not null default now(),
  respondido_em  timestamptz
);

-- Exatamente um dos dois vínculos preenchido.
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'disc_avaliacoes_um_vinculo') then
    alter table disc_avaliacoes add constraint disc_avaliacoes_um_vinculo
      check ((colaborador_id is not null) <> (candidato_id is not null));
  end if;
end $$;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'disc_avaliacoes_status') then
    alter table disc_avaliacoes add constraint disc_avaliacoes_status
      check (status in ('pendente', 'respondido', 'cancelado'));
  end if;
end $$;

create index if not exists disc_avaliacoes_colaborador_idx on disc_avaliacoes (colaborador_id);
create index if not exists disc_avaliacoes_candidato_idx   on disc_avaliacoes (candidato_id);
create index if not exists disc_avaliacoes_token_idx       on disc_avaliacoes (token);

-- RLS no mesmo modelo do resto do sistema por enquanto (liberado), mas já escrito
-- como política nomeada — quando a autenticação entrar, é só trocar esta policy
-- em vez de descobrir que a tabela estava sem nenhuma.
alter table disc_avaliacoes enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where tablename = 'disc_avaliacoes' and policyname = 'disc_acesso_total_temporario'
  ) then
    create policy disc_acesso_total_temporario on disc_avaliacoes
      for all using (true) with check (true);
  end if;
end $$;

notify pgrst, 'reload schema';

-- Conferência — deve retornar 1 linha
select table_name, (select count(*) from information_schema.columns
                    where table_name = 'disc_avaliacoes') as colunas
from information_schema.tables
where table_name = 'disc_avaliacoes';
