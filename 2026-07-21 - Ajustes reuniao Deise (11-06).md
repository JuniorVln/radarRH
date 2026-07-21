# Ajustes Sistema RH — Reunião com Deise (11/06/2026)

Fonte: gravação Fathom "Ajustes sistema RH" — https://fathom.video/share/8qtHST6-_teuPvhYKqCxvyRufhrUjnAA
Mapeado em 21/07/2026 a partir da transcrição completa.

Compromisso assumido na call: **primeiro fazer tudo funcionar (bugs), depois implementar as features novas; criar cronograma e compartilhar com a Deise.**

---

## 1. BUGS — coisas que não funcionam hoje

O padrão dominante: **registros criados não podem ser abertos/editados depois** (CRUD sem view/edit). Aparece em pelo menos 6 módulos.

| # | Módulo | Problema | Arquivo provável |
|---|--------|----------|------------------|
| B1 | Dashboard | Admissões/demissões não contabilizam (gráfico começa em jul/ago; demissões de teste não apareceram) | `src/pages/DashboardPage.tsx` |
| B2 | Turnover | Demissão + readmissão feitas não entram no cálculo | `src/pages/TurnoverPage.tsx` |
| B3 | Feedback | Modal do feedback registrado não abre — não dá pra consultar depois de criado | `src/pages/FeedbackPage.tsx` |
| B4 | Recrutamento — Vagas | Vaga cadastrada não abre mais / sem interação | `src/pages/RecrutamentoPage.tsx` |
| B5 | Recrutamento — Provas e testes | Preenche tudo mas o salvar dá erro | `src/pages/RecrutamentoPage.tsx` |
| B6 | Avaliação de desempenho | "Não há colaboradores ativos para avaliar" (com colaboradores ativos existindo) | `src/pages/AvaliacaoDesempenhoPage.tsx` |
| B7 | PDI | Não lista colaboradores para seleção (mesma causa provável do B6 — filtro de "ativo") | `src/pages/AvaliacaoDesempenhoPage.tsx` (ou página PDI) |
| B8 | Provisão de férias | Não consegue lançar férias | `src/pages/ProvisaoFeriasPage.tsx` |
| B9 | Cargos | (a) cargo cadastrado não reabre; (b) faixa salarial não aceita vírgula — "2000" virou R$ 2,00 e "2.500" virou 2,50 (máscara/parse do campo) | `src/pages/CargosPage.tsx`, `src/lib/masks.ts` |
| B10 | Ocorrências | Ocorrência criada não abre (não dá pra ver descrição/ação tomada) | `src/pages/OcorrenciasPage.tsx` |
| B11 | Treinamentos | Treinamento cadastrado não abre (Junior suspeitou de quebra na migração do sistema do Lucas/contador) | `src/pages/TreinamentosPage.tsx` |
| B12 | Mural de recados | Postagem feita não pode ser editada/modificada | `src/pages/MuralRecadosPage.tsx` |
| B13 | Feed RH | Botão publicar não faz nada (sem ação, sem erro visível) | `src/pages/FeedRHPage.tsx` |

## 2. FEATURES — melhorias pedidas pela Deise

### Colaboradores / Contratos
- **F1 — Integração Ideia Signer**: gerar contrato automaticamente ao cadastrar colaborador, com os dados já preenchidos (modelos prontos existem no Ideia Signer; ex.: "contrato de trabalho mensalista"). *Ação prévia: pedir acesso ao Márcio.*
- **F2 — Demissão com custo**: ao demitir, abrir campos **data da demissão** e **valor da rescisão** → histórico de custos com desligamentos. (`ColaboradorModal.tsx`)
- **F3 — Filtros de colaboradores**: trocar "CLT" por "Mensalista" (é redundante); manter Ativos / Mensalistas / Horistas e **adicionar Estagiários e PJs**.
- **F4 — Cargo via select**: no cadastro do colaborador, cargo escolhido de lista dos cargos já cadastrados (hoje é texto manual). Princípio geral combinado: **integrar internamente tudo que já existe no sistema, nunca duplicar dado**.

### DISC / Ninebox
- **F5 — Análise DISC**: implementar questionário DISC (base de perguntas fixa; pode aproveitar o do sistema do contador "Revoltado", só mudando nomenclatura para DISC padrão). Fluxo: sistema dispara e-mail no cadastro → pessoa responde → resultado volta pro perfil. (`PerfilComportamentalPage.tsx`, `AnaliseComportamentalModal.tsx`)
- **F6 — Ninebox**: fica **para depois** — depende da DISC + avaliação de competências prontas. (`NineBoxModal.tsx`)
- **F7 — DISC por cargo**: no cadastro do cargo, incluir o perfil DISC desejado (ex.: gestão = dominante, atendimento = comunicador) — alimenta o Ninebox e a análise de desempenho. (`CargosPage.tsx`)

### Feedback
- **F8 — Autocomplete de colaborador** no registro de feedback (não digitar nome manual — risco de homônimos); **gestor responsável preenchido automaticamente** a partir do colaborador selecionado.
- **F9 — Aviso de próximo feedback**: notificar o gestor (ex.: "faltam 10 dias para o feedback com fulano").

### Recrutamento
- **F10 — Kanban → colaborador automático**: arrastar candidato para "Contratação" converte em colaborador (preenche data de início; documentos enviados já entram no cadastro). Hoje é "tipo Trello" — só visual.
- **F11 — Banco de talentos**: criar a área/coluna no pipeline (hoje não existe onde cadastrar) + aba com **filtro por área da vaga** (ex.: filtrar só quem se candidatou a Atendimento).
- **F12 — Página pública de vaga** (modelo Solids): botão "criar vaga" gera página onde o candidato se cadastra sozinho (login Google/LinkedIn, pré-cadastro + currículo) e cai direto no pipeline — elimina cadastro manual de candidatos. Extras do modelo Solids que ela valorizou: link direto WhatsApp Web, campo de observações do candidato, histórico de candidaturas/entrevistas.

### Férias (modelo Solids — módulo grande)
- **F13 — Fluxo de solicitação**: o próprio colaborador solicita férias no sistema → chega como pendente pro RH → RH aprova → segue pra contabilidade. Campos: período aquisitivo, data início, qtd. dias, **venda de dias** (abono), justificativa livre + **anexo de comprovante** (ex.: print da autorização do supervisor).
- **F14 — Regras de validação**: mínimo 5 dias, não pode sobrar menos de 5 dias, antecedência mínima de 30 dias — bloqueiam o colaborador, admin consegue sobrepor. *Deise vai passar a lista completa de regras.*
- **F15 — Notificações de vencimento**: sininho/aviso de férias perto de vencer (diferencial sobre a Solids, que só mostra se você entrar lá).

### Banco de horas
- **F16 — Definir origem do ponto com o Gustavo**: ponto próprio (trabalhoso, exige registro/homologação) × integrar sistema externo. *Ação: perguntar ao Gustavo.*
- **F17 — Envio de saldo ao colaborador**: notificar saldo negativo/positivo pra pessoa conferir ponto/atestados e saber prazo pra compensar.

### Benefícios (VR/VT)
- **F18 — Automatizar a planilha**: sistema calcula dias úteis do mês, puxa atestados e faltas do colaborador e desconta VR/VT automaticamente; RH só edita exceções (ex.: home office extra). (`src/lib/beneficios.ts`, `BeneficiosPage.tsx`)
- **F19 — Detalhamento de descontos**: no cálculo por colaborador, mostrar quais dias e tipos de desconto compõem o valor (como a aba final da planilha dela).

### Holerites
- **F20 — Upload da folha inteira** (modelo Solids): anexa o PDF completo da folha → sistema separa por colaborador (match pelo nome do contracheque) → tela de conferência um a um → "enviar para todos" dispara por e-mail pessoal. (`HoleritesPage.tsx`)

### Treinamentos
- **F21 — Estrutura completa**: incluir link de acesso ao treinamento, envio ao colaborador (e-mail), progresso da turma (data de início, participantes, quem concluiu, quem fica pro próximo ciclo).
- **F22 — Certificado automático**: ao concluir, certificado gerado vai automaticamente pra pasta de documentos do colaborador.

### Comunicação / Integrações
- **F23 — Disparo de e-mails**: conectar sistema de envio (e-mail **pessoal** de cada colaborador é o canal oficial pra contracheque, treinamentos, pesquisas — o corporativo é compartilhado). *Junior ficou de ver com o Márcio.*
- **F24 — Integração Multichat/Ideia Chat** (futuro): avisos via WhatsApp quando a migração Bix→Multichat acontecer, cada colaborador com login próprio.

### Mural / Feed / Outros
- **F25 — Mural**: campo **data do evento** em destaque (além da data de expiração) — todo recado tem uma data ("dia tal muda o VR", "dia tal desligar a geladeira").
- **F26 — Remover ContCoins**: veio do sistema do contador, sem uso agora. Manter a ideia de gamificação pra quando o sistema estiver robusto (Deise gostou do conceito — prêmios por metas/cursos). (`ContCoinsPage.tsx`)

## 3. O que ficou explicitamente PARA DEPOIS
- Ninebox (F6) — depende de DISC + competências.
- Gamificação/ContCoins (F26) — amadurecer depois.
- Calendário — só depois que os módulos base funcionarem.
- Integração com InfoJobs/LinkedIn para captação de vagas — mencionado como direção futura.

## 4. Ações de destravamento (dependem de terceiros)
- Pedir ao **Márcio**: acesso ao Ideia Signer (F1) + sistema de disparo de e-mails (F23).
- Perguntar ao **Gustavo**: ponto próprio ou sistema externo (F16).
- **Deise**: vai passar as regras de férias (F14) e pode criar perfil de acesso à Solids pra referência de telas.
