# Checklist Fase 01 - Radar RH / Rede Ideia

Legenda:
- `[ ]` pendente
- `[~]` em andamento
- `[x]` concluido
- `[!]` bloqueado ou precisa validacao

## Fase 0 - Estabilizacao e Build

- [x] Corrigir o estado quebrado deixado pelo Gemini CLI.
- [x] Criar este checklist de acompanhamento.
- [x] Corrigir tipos ausentes e duplicados em `src/lib/supabase.ts`.
- [x] Corrigir incompatibilidades de props em componentes UI.
- [x] Remover filtros/toolbars duplicados em `ColaboradoresPage`.
- [x] Corrigir schema SQL com tabela `dependentes` e policies validas.
- [x] Criar migracao incremental inicial para colaboradores e dependentes.
- [x] Rodar `npm run build` sem erros.
- [x] Rodar `npm run dev` para revisao visual.
- [x] Abrir app no navegador embutido. Validado em 15/05/2026 via Playwright MCP em http://localhost:5173.

## Fase 1 - Schema e Cadastro Completo de Colaboradores

- [x] Criar migracao incremental preservando dados existentes.
- [x] Expandir cadastro com dados pessoais, diversidade, PCD, endereco e emergencia.
- [x] Expandir dados contratuais, documentos e dados bancarios.
- [x] Persistir dependentes com insert/update/delete.
- [x] Preparar anexos com status de OCR sem integracao real.
- [x] Validar fluxo visual de criar, editar e excluir colaborador. Validado em 15/05/2026: CRUD completo funciona. Bugs encontrados: (1) validacao exige Cargo+Setor mas nao navega para aba Contrato ao falhar; (2) tabelas `dependentes` e `anexos_colaborador` retornam 404 no Supabase (migracao pendente).

## Fase 2 - Dashboard, Feedbacks, Anexos e Alertas

- [x] Dashboard com vinculos completos: CLT, Estagiario, Terceiro, PJ, Mensalista e Horista.
- [x] Dashboard com aniversariantes do mes e tempo de casa.
- [x] Dashboard com resumo de ferias: saindo, em ferias e retornando.
- [x] Renomear feedbacks para Positivo, Neutro e A Melhorar.
- [x] Criar alertas contratuais de experiencia: 30, 60 e 90 dias.
- [x] Validar visualmente Dashboard e Feedbacks. Validado em 15/05/2026: ambos carregam com dados reais. Bugs encontrados no Dashboard: (1) erro de hidratacao React - Skeleton (<div>) dentro de <p> no StatCard; (2) query de ferias retorna HTTP 400 (sintaxe de join incorreta no Supabase).

## Fase 3 - Motor de Beneficios

- [x] Criar modelo de periodo de beneficios por competencia.
- [x] Implementar calculo de VR.
- [x] Implementar calculo de VT.
- [x] Implementar regras de frutas, home office, feriados, faltas, atestados e ferias.
- [x] Gerar totais por empresa e tipo de transporte.
- [x] Conferir resultados contra a planilha de maio/2026.

## Fase 4 - Recrutamento, Avaliacoes, Nine Box e PDI

- [x] Ampliar cadastro de vagas.
- [x] Preparar templates de comunicacao por e-mail e WhatsApp via adapter.
- [x] Organizar banco de talentos por area.
- [x] Registrar provas/testes tecnicos.
- [x] Tornar Nine Box dependente de dados reais quando disponiveis.
- [x] Criar modulo inicial de PDI.

## Fase 5 - Cargos, Ocorrencias, Holerites e Integracoes

- [x] Criar cargos, niveis, atribuicoes, requisitos e faixas salariais.
- [x] Criar registro de ocorrencias, advertencias, faltas, atrasos e ausencias.
- [x] Preparar holerites e informe de rendimentos.
- [x] Criar adapters stubs para OCR, WhatsApp, portal de vagas, e-mail e Ideia Signer.
- [x] Documentar configuracoes necessarias para provedores reais.

## Observacoes de Iteracao Visual

- Servidor local esperado: `http://localhost:5173`.
- Servidor iniciado nesta rodada: `http://127.0.0.1:5173/`.
- Servidor iniciado em 11/05/2026 para revisar Fase 4: `http://127.0.0.1:5174/` respondeu HTTP 200.
- Servidor confirmado em 11/05/2026 apos Fase 5: `http://127.0.0.1:5174/` respondeu HTTP 200.
- Servidor confirmado em 03/05/2026: `http://127.0.0.1:5173/` respondeu HTTP 200.
- `npm run build` passou em 02/05/2026 apos Fase 0.
- `npm run build` passou em 02/05/2026 apos Fase 1.
- `npm run build` passou em 03/05/2026 apos ajustes iniciais da Fase 2.
- `npm run build` passou em 04/05/2026 apos Fase 3.
- `npm run build` passou em 11/05/2026 apos Fase 4.
- `npm run build` passou em 11/05/2026 apos Fase 5.
- Fase 1 implementada: modal de colaborador agora tem abas para dados pessoais, contrato, documentos, dependentes e anexos/OCR.
- Fase 2 implementada parcialmente: Dashboard ganhou vinculos completos, aniversariantes, tempo de casa, resumo de ferias e alertas 30/60/90; Feedbacks exibe Positivo, Neutro e A Melhorar preservando valores internos existentes.
- Fase 3 implementada: modulo Beneficios com motor de calculo de VR/VT, modelo de competencia, eventos de desconto, totais por empresa/transporte e conferencia contra `Fase 01/Benefícios - 05-26.xlsx`.
- Fase 4 implementada: Recrutamento ganhou cadastro ampliado de vagas, templates por canal, banco de talentos por area, testes tecnicos e vinculo de testes a candidatos; Avaliacao ganhou ciclos reais, preenchimento de nota/desempenho/potencial, Nine Box com dados reais e modulo inicial de PDI.
- Fase 5 implementada: modulos de Cargos, Ocorrencias, Holerites/Informes e Integracoes; adapters stubs criados para OCR, WhatsApp, portal de vagas, e-mail e Ideia Signer; migracao incremental adicionada.
- Revisar primeiro: Dashboard, Colaboradores, Modal de colaborador e Feedbacks.
- Revisar tambem: Recrutamento e Avaliacao de Desempenho apos Fase 4.
- Revisar tambem: Cargos, Ocorrencias, Holerites e Integracoes apos Fase 5.
- Revisao visual completa realizada em 15/05/2026 via Playwright MCP.
- PASSOU: Dashboard (dados reais), Feedback (Positivo/Neutro/A Melhorar), Colaboradores CRUD, Recrutamento (pipeline kanban), Avaliacao de Desempenho (empty state correto), Ocorrencias, Holerites, Integracoes (5 adapters stub documentados).
- BUGS CORRIGIDOS EM 15/05/2026:
  - [B1] RESOLVIDO: StatCard.tsx linha 20 - trocado <p> por <div> no wrapper do valor. Sem mais erro de hidratacao React.
  - [B2] RESOLVIDO: DashboardPage.tsx - removido join colaboradores da query ferias; lookup local via colaboradorNomeMap construido a partir dos dados ja carregados. Sem mais HTTP 400.
  - [B3] RESOLVIDO: ColaboradorModal.tsx - validacao agora navega para aba correta antes do toast: 'pessoais' se nome/cpf vazio, 'contratuais' se cargo/setor vazio.
  - [B4] PENDENTE (requer SQL manual): tabelas dependentes e anexos_colaborador ausentes no Supabase. Rodar supabase/migrations/ALL_MIGRATIONS_CONSOLIDATED.sql no Supabase SQL Editor.
  - [B5] PENDENTE (requer SQL manual): tabela cargos sem policies no Supabase. Incluida no mesmo script ALL_MIGRATIONS_CONSOLIDATED.sql.
