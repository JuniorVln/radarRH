# Sistema de RH — o que tem que ter × o que já está pronto

Consolidado em 11/09/2026, juntando as três fontes que estavam separadas: a reunião com a Deise de
11/06 (`2026-07-21 - Ajustes reuniao Deise (11-06).md`), o gap analysis da Sólides
(`2026-07-22 - Gap Analysis Solides vs RH Rede Ideia.md`) e o que foi entregue depois disso.
Cada item foi conferido no código, não só na memória.

**Legenda:** `[x]` pronto · `[~]` parcial · `[ ]` não começou · `⏳` travado esperando outra pessoa

**Placar (11/09, noite):** 13 de 13 bugs resolvidos · 13 features inteiras · 7 parciais · 6 não começadas ·
3 travadas em terceiros.

**A tranca do login CAIU em 11/09.** O acesso agora é individual, com senha por pessoa, e quem decide o que
cada um enxerga é o banco. Com isso não sobrou nenhum bloqueio técnico: o que falta é só construir, e as
únicas esperas são o Ideia Signer (Márcio), a decisão do ponto (Gustavo) e as regras de férias (Deise).

---

## 🐛 Bugs da reunião de 11/06 — todos resolvidos

Corrigidos em 21/07 (commit `8e090f4`), revisados pelo Codex e os 3 restos fechados em 23/07 (`701657c`).

- [x] **B1** Dashboard não contabilizava admissões/demissões
- [x] **B2** Turnover ignorava demissão + readmissão (hoje dedupe por colaborador+data, headcount médio 12m)
- [x] **B3** Modal do feedback registrado não abria
- [x] **B4** Vaga cadastrada não abria
- [x] **B5** Provas e testes davam erro ao salvar
- [x] **B6** "Não há colaboradores ativos para avaliar" com ativos existindo
- [x] **B7** PDI não listava colaboradores
- [x] **B8** Não dava pra lançar férias
- [x] **B9** Cargo não reabria + faixa salarial quebrava com vírgula
- [x] **B10** Ocorrência criada não abria
- [x] **B11** Treinamento cadastrado não abria
- [x] **B12** Recado do mural não podia ser editado
- [x] **B13** Botão publicar do Feed RH não fazia nada

---

## 👤 Colaboradores e contratos

- [x] **F2** Demissão com data e valor de rescisão, gravando em `movimentacoes` (alimenta Dashboard e Turnover)
- [x] **F3** Filtros por Estagiário, PJ, Mensalista e Horista
- [ ] **F3b** Trocar "CLT" por "Mensalista" — ⏳ **não é ajuste de tela**: hoje são 69 CLT / 1 PJ / 1 Terceiro de verdade no banco; reclassificar é decisão trabalhista da Deise
- [x] **F4** Cargo escolhido por lista dos cargos ativos (datalist), sem digitar à mão
- [ ] **F1** Integração com o Ideia Signer para gerar contrato no cadastro — ⏳ **esperando acesso do Márcio** (só existe a configuração vazia em `lib/integrations.ts`)
- [ ] **Superior direto** na ficha — é o que destrava o gestor automático no feedback (item da Sólides)
- [ ] **Unidade / Departamento como select** de cadastro (hoje texto livre)
- [~] **Período de experiência**: o alerta de 30/60/90 dias já roda no Dashboard, calculado pela admissão; o campo próprio de dias não existe
- [ ] Nome social, matrícula e turno

## 🧠 DISC e Nine Box

- [x] **F5** Questionário DISC próprio e autoral — 96 adjetivos escritos por nós, 24 tétrades, perfil natural × adaptado, página pública `/disc/<token>` sem login, resultado grava em `colaboradores.perfil_disc`
- [~] **F5b** Disparo do DISC por e-mail — o link é gerado e o canal de envio já existe (F23 destravado); falta plugar
- [~] **F6** Nine Box — a tela existe; só fica confiável quando DISC e competências estiverem rodando com dado real
- [ ] **F7** Perfil DISC desejado por cargo (a "engenharia de cargo" da Sólides)
- [~] **% de aderência candidato × vaga** — o campo existe e é preenchido à mão; não há cálculo automático

## 💬 Feedback

- [x] **F8a** Colaborador escolhido por seleção, sem digitar nome (risco de homônimo resolvido)
- [ ] **F8b** Gestor responsável preenchido automático — falta só o campo de superior direto (o login, que era a outra metade, já existe)
- [x] **F9** Aviso de próximo feedback, por colaborador, pelo registro mais recente (`lib/feedbackAvisos.ts`) — **a Sólides deles não tem isso**
- [ ] Mini-dashboard de análise de feedbacks (por classificação, colaborador e mês)

## 🎯 Recrutamento

- [x] **F11** Aba de Banco de Talentos no pipeline
- [x] **F12** Página pública de vagas (`/vagas`) com candidatura caindo direto no pipeline, anti-spam por campo-armadilha e **sem chave nenhuma no navegador** — as funções de servidor filtram o que é público (salário fica fora)
- [x] **Origem do candidato** e **motivo/data de desfecho** (desistiu, desclassificado)
- [x] **Prazo e número de posições** da vaga
- [~] **F10** Kanban → colaborador: o botão "Contratar" leva ao cadastro pré-preenchido, mas **não cria sozinho** — colaborador exige CPF, cargo e setor; o candidato só vira `contratado` depois que o cadastro é salvo
- [ ] Motivo obrigatório ao cancelar/concluir vaga (alimenta métrica)
- [ ] Métricas de recrutamento (tempo de fechamento, origem)

## 🏖️ Férias

- [x] Lançamento com período aquisitivo e vencimento calculados automaticamente, com alerta de 30 dias
- [x] **Venda de dias (abono)** — `dias_abono`, 0 a 10, com trava no banco
- [x] Exportação CSV (com BOM e `;`, do jeito que o Excel em português abre certo)
- [ ] **F13** Solicitação pelo próprio colaborador, com aprovação do RH — **destravado**: o login por pessoa e o papel `colaborador` já existem, falta a tela e o fluxo de aprovação
- [ ] **F14** Regras de validação (mínimo 5 dias, não sobrar menos de 5, antecedência de 30) — ⏳ **a Deise ficou de passar a lista completa**
- [~] **F15** Aviso de férias vencendo: o alerta aparece na tela de férias; o sininho global não existe
- [ ] Férias coletivas (lançar para vários de uma vez)

## 🍽️ Benefícios VR/VT — **o diferencial que a Sólides não tem**

- [x] **F18** Cálculo automático lendo Ocorrências e Férias de verdade, com dias úteis e feriados regionais por localidade
- [x] **F19** Detalhamento por dia: expandir a linha mostra cada evento que compôs o valor
- [x] Seletor de competência, botão Recalcular e tela de exceções (ajuste manual com motivo)
- [x] Validado contra maio/2026 real: VR bateu exato nas 4 empresas (R$ 37.978,00) e VT em 3 de 4 — a diferença de R$ 84,80 na Rede Gaúcha é ambiguidade **da planilha original**, não do cálculo

## 💰 Holerites

- [x] Lançamento manual por colaborador, com líquido calculado
- [ ] **F20** Upload da folha inteira em PDF, separação automática por colaborador, tela de conferência e envio em lote — **é o fluxo que ela validou na call e o maior buraco que sobrou neste módulo**
- [ ] Contador de páginas sem correspondência ("divergentes")

## 📚 Treinamentos

- [x] **F21a** Link de acesso, carga horária e período na trilha; datas de início e conclusão carimbadas pelo sistema no progresso
- [ ] **F21b** Envio do treinamento ao colaborador e progresso da turma (quem concluiu, quem fica pro próximo ciclo)
- [ ] **F22** Certificado automático indo pra pasta de documentos do colaborador

## 📋 Ocorrências

- [x] Registro com tipo, severidade, ação tomada e status
- [ ] Taxonomia mais rica da Sólides: Promoção, Suspensão, Folga, Falha/Erro, Ideia/Contribuição, Subperformance, Recontratação
- [ ] Classificação transversal Positivo / Negativo / Neutro

## 🕐 Banco de horas

- [ ] **F16** Definir se o ponto é próprio ou integrado — ⏳ **pergunta aberta com o Gustavo**. Vale saber: a Rede Ideia **não tem** o módulo de ponto da Sólides contratado
- [ ] **F17** Envio do saldo ao colaborador

## 📣 Mural, Feed e comunicação

- [x] **F25** Data do evento no mural, separada da expiração, com evento futuro subindo pro topo
- [x] **F23** Disparo de e-mails — **DESTRAVADO em 11/09**, não dependia do Márcio: a Rede Ideia já tem domínio de envio próprio no Resend (`noreply@updates.pages.ideiabusiness.com.br`). Testado de verdade: enviado e recebido na caixa de entrada, sem cair em spam. Falta só ligar nos fluxos (DISC, holerites, treinamentos)
- [ ] **F24** Avisos por WhatsApp via Multichat — futuro, depois da migração Bix→Multichat
- [ ] **F26** Remover ContCoins (veio do sistema do contador e não tem uso hoje) — a página ainda está lá

---

## 🔧 Base que foi construída sem estar na lista dela

- [x] **71 colaboradores reais importados** pro banco (antes só havia 5 de teste), com a configuração de VR/VT de cada um
- [x] **Trava de acesso por senha** no site inteiro, inclusive nos arquivos do app — sem ela, CPF, salário e dados bancários ficavam abertos pra quem tivesse o link
- [x] **Suíte de testes em 4 camadas**: 29 de unidade, integração contra o banco real (com competência descartável que se limpa sozinha), 13 E2E cobrindo **todas** as telas que gravam dados, e smoke abrindo as 19 rotas com print de cada uma
- [x] **Regressão visual** comparando as 19 telas pixel a pixel
- [x] **CI no GitHub Actions** + rodada diária às 07:00 na máquina
- [x] **Banco migrado do Supabase pro Postgres da VPS** (07/09) — 31 tabelas e 511 linhas conferidas uma a uma
- [x] **Sistema de volta ao ar com PostgREST próprio** (11/09) — as 68 regras de acesso seguem valendo sem reescrita, e agora requisição sem token é recusada, o que o Supabase não fazia
- [x] **Autenticação de verdade, por pessoa** (11/09) — tela de login própria, senha criada por link de uso único no e-mail, sessão de 12h e sair funcionando. A senha única do site foi aposentada, e **o navegador não carrega mais chave nenhuma do banco**: quem autoriza é o token da pessoa
- [x] **Permissão por papel dentro do banco** (11/09) — as 68 regras `sempre verdadeiro` viraram regras que leem quem está logado. Provado com dois tokens: RH vê 71 colaboradores e 3 candidatos; um colaborador vê 1 e 0, e não consegue editar a ficha de outro
- [x] **Questionário DISC público virou função de servidor** (11/09) — era a única tela aberta que falava direto com o banco

---

## ⏳ O que está parado esperando outra pessoa

- **Márcio** — só o acesso ao Ideia Signer (F1). O e-mail **saiu desta lista em 11/09**: já temos domínio de envio da própria Rede Ideia funcionando.
- **Gustavo** — ponto próprio ou integração (F16).
- **Deise** — a lista completa de regras de férias (F14) e a decisão sobre reclassificar CLT/Mensalista (F3b).

## 📌 Deixado para depois de propósito

Nine Box completo (depende de DISC rodando), gamificação/ContCoins, calendário, e captação de vagas
pelo InfoJobs/LinkedIn.
