# Gap Analysis — Sólides vs Sistema RH Rede Ideia

Levantado em 22/07/2026 navegando na conta Sólides **da própria Rede Ideia** (plano de 70 colaboradores, limite atingido — um dos motivos para o sistema próprio). Complementa o mapeamento da reunião com a Deise (11/06) — ver `2026-07-21 - Ajustes reuniao Deise (11-06).md`.

**Como ler:** cada módulo traz o que a Sólides faz de verdade (visto no acesso, não no site de marketing), o que já temos, e o que vale copiar. Prioridade sugerida no final.

---

## 1. Férias (CRUD admin da Sólides é SIMPLES — dá pra superar)

**Sólides (visto):** tabela Colaborador / Data Início / Data Término / Nº Dias / **Data de Vencimento**, com Visualizar/Editar/Apagar. Form: colaborador (select), início, término, nº dias, vencimento, **nº dias de abono + valor do abono** (venda de férias), checkbox "Usufruída?", observação. Tem também "Férias Coletivas" (atribuição em lote) e Exportar.
**Curioso:** o fluxo bonito que a Deise mostrou (solicitação pelo colaborador, aprovação, regras de 5/30 dias, anexo de comprovante) é do módulo **Sólides DP — que a Rede Ideia NÃO tem contratado** (aparece só como "Teste grátis"). Ou seja: ela usa o CRUD simples no dia a dia e deseja o fluxo do DP.
**Nosso estado:** lançamento básico já funciona (21/07) com vencimento e alertas 30d.
**Copiar/adaptar:**
- [ ] Campos de **abono** (nº dias + valor) no lançamento — já existe na tabela? (não — adicionar via migração manual ou campo em observação)
- [ ] **Férias coletivas** (lançar para vários colaboradores de uma vez)
- [ ] Exportar (CSV)
- [ ] Fase 2: fluxo de solicitação pelo colaborador com aprovação + regras (mín. 5 dias, sobra mín. 5, antecedência 30d — Deise vai passar a lista) + anexo de comprovante. **Aqui superamos a Sólides deles**, que não tem isso no plano atual.

## 2. Recrutamento (o módulo mais forte da Sólides — referência principal)

**Sólides (visto na vaga real de SDR):**
- Vagas com abas de status: Favoritas / Em andamento / **Atrasado** / **Em aprovação** / Reprovado / Cancelada / Concluída. Filtros: local, cargo, tipo de candidatura, tipo de recrutamento, vaga afirmativa/PCD, responsável.
- Card da vaga: posições disponíveis/totais, localidade, **participantes/total de CVs recebidos** (ex.: 241/243), prazo, status.
- Processo seletivo em **fases nomeadas**: 1. Análise de currículo → 2. Análise comportamental → 3. Questionário → 4. Pré-admissão → 5. Contratação (com contador por fase).
- Tabela de candidatos: data, nome, **% de aderência (habilidades e idiomas)**, perfil comportamental (primário+secundário), **origem** (LinkedIn, Indeed, Jobs, Portal de Vagas), status (Visualizado / Desistiu da participação / Desclassificado).
- Fluxos prontos: cancelar vaga exige **motivo** (alimenta métricas) + opção de **e-mail automático aos candidatos**; vaga preenchida sugere concluir + e-mail aos não selecionados; histórico de alterações da vaga; roteiro de entrevista gerado por IA (Copilot).
- **Portal público** (`redeideia.vagas.solides.com.br`): página da empresa (quem somos, missão/valores, depoimentos de colaboradores), lista de vagas com salário/local/modelo/nível, busca e filtro por cidade, **banco de talentos com candidatura espontânea**, login do candidato.
**Nosso estado:** kanban de arrastar (que a Deise PREFERE ao da Sólides), vagas/candidatos/testes CRUD ok.
**Copiar/adaptar (mantendo nosso kanban):**
- [ ] **Página pública de vagas** (F12) — o maior gap. v1: página estática por vaga com formulário (nome, contato, currículo upload, pretensão, LinkedIn) que insere direto em `candidatos` com origem="Portal". Não precisa login de candidato na v1.
- [ ] Campo **origem** do candidato (select: Portal, LinkedIn, Indeed, Indicação, E-mail...) + status "Desistiu"/"Desclassificado" além das etapas.
- [ ] Contador de posições (disponíveis/totais) e **prazo** com destaque de atrasada.
- [ ] Motivo de cancelamento/conclusão de vaga (histórico p/ métricas).
- [ ] Kanban → colaborador automático na fase Contratação (F10) — a Sólides chama de "Pré-admissão → Contratação".

## 3. Pagamentos / Holerites

**Sólides (visto):** fechamentos agrupados por competência (maio/2026...), cada um: tipo (Salário/13º/Férias), descrição, **nº de itens (74)**, **nº de divergentes**, data de criação, status. "Criar fechamento" → seleciona período → sobe a folha inteira → sistema separa por colaborador (match por nome) → conferência visual um a um → "enviar para todos" por e-mail.
**Nosso estado:** HoleritesPage é manual, um a um.
**Copiar:**
- [ ] Fechamento por competência com upload da folha em PDF único + **split automático por colaborador** (o PDF da folha tem 1 página por pessoa; match por nome) + tela de conferência + envio em lote por e-mail pessoal. É o F20 — a Deise validou explicitamente esse fluxo na call ("é melhor... então a gente implanta").
- [ ] Contador de "divergentes" (páginas sem match) — é o que dá confiança na conferência.

## 4. Registros / Ocorrências

**Sólides (visto):** tipos bem mais ricos que os nossos: Falta/Ausência, Atraso, **Promoção**, **Falha/Erro**, **Ideia/Contribuição**, **Recontratação**, Outros, Advertência, **Suspensão**, **Subperformance**, **Folga**. Classificação transversal: **Positivo / Negativo / Neutro**. Campo Valor/Qtd/Hs genérico. Comentário com Copilot (IA ajuda a redigir).
**Copiar:**
- [ ] Ampliar taxonomia de tipos (adicionar Promoção, Suspensão, Folga, Falha/Erro, Ideia/Contribuição, Subperformance, Recontratação)
- [ ] Classificação Positivo/Negativo/Neutro no registro (além do tipo)
- [ ] (fase 2, barato pra nós) botão "melhorar texto com IA" no comentário — Claude API

## 5. Feedbacks

**Sólides (visto):** mesma engine de ocorrências. Lista: data do feedback, colaborador, classificação (**Positivo / Para melhorar / Neutro** — igual ao nosso PAR!), **autor** (preenchido automático com o usuário logado), data de criação. Form: colaborador select, data, classificação radio, comentário + Copilot. Tem tela "Análise de Feedbacks" (dashboard).
**Nosso estado:** já equivalente após os fixes de 21/07 (select de colaborador, editar, status).
**Copiar:**
- [ ] Campo **autor** automático (precisa de noção de usuário logado — hoje o sistema não tem auth por pessoa; anotar como dependência)
- [ ] Mini-dashboard "Análise de Feedbacks" (por classificação, por colaborador, por mês)
- [ ] O aviso de próximo feedback (F9) a Sólides deles NÃO tem — diferencial nosso.

## 6. Ficha do Colaborador

**Sólides (visto no form):** além do que temos: **nome social**, sexo biológico separado de gênero, saudação, curso, nacionalidade/naturalidade, **Departamento/Cargo/Unidade como SELECTS de cadastros** (não texto livre), tipo de contrato com ~10 opções, **superior direto** (select de colaboradores), grau hierárquico, turno, moeda, **período de experiência (dias)**, matrícula, data/duração/vencimento de contrato, periculosidade/insalubridade, permissão de bater ponto, duplo vínculo, código externo (integração).
**Copiar (prioridade nos que destravam outras features):**
- [ ] **Cargo via select** dos cargos cadastrados (F4 — já pedido pela Deise) + Departamento/Setor via cadastro
- [ ] **Superior direto** — destrava o preenchimento automático do gestor no feedback (F8) e o aviso ao gestor (F9)
- [ ] Unidade como select (REDE GAÚCHA / IDEIA BUSINESS / REDE IDEIA / PROSPERAR — já são as empresas do grupo)
- [ ] Período de experiência em dias (alimenta o alerta 30/60/90 do dashboard com data real)
- [ ] (menores) nome social, matrícula, turno

## 7. Profiler (o "DISC" da Sólides)

**Sólides (visto):** base com 5.031 respostas. Fluxo: "Enviar Profiler" → candidato/colaborador recebe por e-mail → responde → perfil aparece como combinação de **Comunicador / Executor / Planejador / Analista** (primário + secundário, ex.: "EA", "PC"). Respostas antigas ficam **"Bloqueado"** — modelo de créditos, paga pra desbloquear! Há Engenharia de Cargo (perfil ideal por cargo), Busca de Perfil, Análise de Grupo, Matcher.
**Nosso plano (F5):** questionário DISC clássico (D/I/S/C — Deise prefere a nomenclatura padrão), disparo por e-mail, resultado no perfil do colaborador e do candidato. **Sem créditos/bloqueio — vantagem nossa.**
- [ ] DISC v1: formulário público com token (sem login), cálculo simples, resultado gravado em colaborador/candidato
- [ ] Perfil desejado por cargo (F7) — a "Engenharia de Cargo" deles
- [ ] % de aderência candidato×vaga usando DISC + requisitos (versão simples do matcher)

## 8. Módulos que a Rede Ideia NÃO tem na Sólides (oportunidade de superar)

- **Controle de Ponto / Sólides DP**: só tela de venda no plano deles. → A decisão do F16 (ponto próprio vs integração) continua com o Gustavo, mas saiba: hoje eles NÃO têm ponto na Sólides. A "folha ponto" que a Deise mostrou deve ser outro sistema/login.
- **Fluxo de férias com aprovação** (é do DP) — idem.
- **Benefícios (VR/VT)**: a Sólides tem "Sólides Benefícios" (cartão multibenefícios = produto financeiro, não a planilha da Deise). O F18 (automação da planilha VR/VT) não tem equivalente na Sólides deles — **é 100% diferencial nosso**.
- **Limite de 70 colaboradores atingido** + Profiler bloqueado por créditos + banner "Aumentar plano" em toda tela → argumento de negócio do sistema próprio.

## 9. Coisas da Sólides que NÃO vale copiar

- Navegação fragmentada em 4+ subdomínios (plataforma/system/hr/new .solides.com) — a Deise reclamou disso na call ("para cadastrar férias eu vou em outro sistema deles").
- Recrutamento sem kanban de arrastar (ela elogiou o nosso).
- Modelo de créditos/bloqueio do Profiler.
- Copilot/IA em tudo com upsell.

---

## Backlog priorizado (proposta de cronograma p/ Deise)

**Fase A — destravar cadastros (rápido, ~1 sprint):**
1. Cargo/Departamento/Unidade como selects + superior direto na ficha (destrava F8/F9)
2. Taxonomia rica de ocorrências + classificação P/N/N
3. Origem + status desistiu/desclassificado no candidato; posições/prazo na vaga
4. Abono + férias coletivas + exportar no módulo Férias

**Fase B — os 3 fluxos que a Deise mais pediu (~2-3 sprints):**
5. Holerites: fechamento por competência + upload da folha + split por colaborador + conferência + envio em lote (F20)
6. Página pública de vagas com candidatura direto no pipeline (F12) + kanban→colaborador (F10)
7. Fluxo de férias com solicitação/aprovação + regras + anexo (F13-15)

**Fase C — inteligência (~2 sprints):**
8. DISC v1 (disparo por e-mail, resultado no perfil) + perfil por cargo (F5/F7)
9. Aviso de próximo feedback + notificações de férias vencendo (sininho) (F9/F15)
10. Automação da planilha VR/VT (F18-19) — diferencial sem equivalente na Sólides
11. Dashboards: análise de feedbacks, métricas de recrutamento (tempo de fechamento, origem)

**Dependências externas (inalteradas):** Ideia Signer + e-mails (Márcio), decisão do ponto (Gustavo), regras de férias (Deise).
