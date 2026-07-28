// Instrumento DISC próprio da Rede Ideia.
//
// POR QUE ESCREVEMOS O NOSSO
// O modelo DISC (Dominância, Influência, Estabilidade, Conformidade) vem de William
// Marston, "Emotions of Normal People" (1928) — é construto fundacional de domínio
// público. O que NÃO é público são os bancos de itens dos instrumentos comerciais
// (Profiler da Sólides, DiSC® da Wiley, Style Insights da TTI). Copiar as perguntas
// deles seria copiar o produto deles. Os 96 adjetivos abaixo foram redigidos aqui, a
// partir das definições dos quatro construtos.
//
// FORMATO
// Escolha forçada em 24 tétrades, que é o desenho clássico do instrumento: em cada
// bloco de 4 adjetivos — um de cada dimensão — a pessoa marca o que MAIS a descreve e
// o que MENOS a descreve. Desenho balanceado: cada dimensão aparece exatamente 24
// vezes, uma por bloco, então nenhuma sai na frente por aparecer mais.
//
// DOIS PERFIS
// - ADAPTADO: das respostas "mais". É como a pessoa acredita que precisa agir no
//   trabalho — a máscara profissional.
// - NATURAL: das respostas "menos". O que a pessoa rejeita revela, por oposição, como
//   ela é quando não está se controlando (sob pressão, cansaço).
// Quando os dois perfis divergem muito, isso em si é a informação útil: a pessoa está
// gastando energia para se comportar de um jeito que não é o dela.
//
// LIMITE QUE PRECISA SER DITO
// Instrumento ipsativo (a pessoa se compara consigo mesma, não com uma população).
// Isso significa que os números NÃO comparam pessoas entre si e não têm validade
// estatística de teste normativo. Serve para conversa de desenvolvimento e
// autoconhecimento — NÃO para reprovar candidato, demitir ou promover sozinho.
// Essa ressalva está em `RESSALVA_DE_USO` e deve aparecer na tela do resultado.

export type DimensaoDisc = 'D' | 'I' | 'S' | 'C'

export const DIMENSOES: Record<DimensaoDisc, { nome: string; resumo: string; cor: string }> = {
  D: {
    nome: 'Dominância',
    resumo: 'Como a pessoa lida com problemas e desafios. Ritmo rápido, foco em resultado, tolera conflito.',
    cor: '#DC2626',
  },
  I: {
    nome: 'Influência',
    resumo: 'Como a pessoa lida com pessoas e persuasão. Comunicação, entusiasmo, articulação social.',
    cor: '#F59E0B',
  },
  S: {
    nome: 'Estabilidade',
    resumo: 'Como a pessoa lida com ritmo e mudança. Constância, paciência, cooperação, evita conflito.',
    cor: '#16A34A',
  },
  C: {
    nome: 'Conformidade',
    resumo: 'Como a pessoa lida com regras e procedimentos. Precisão, análise, cautela, qualidade.',
    cor: '#2563EB',
  },
}

export const RESSALVA_DE_USO =
  'Este é um instrumento de autoconhecimento e desenvolvimento, de resposta ipsativa: ' +
  'os resultados descrevem tendências de comportamento da própria pessoa e não comparam ' +
  'pessoas entre si. Não deve ser usado isoladamente como critério de contratação, ' +
  'promoção ou desligamento.'

export type Tetrade = { D: string; I: string; S: string; C: string }

/**
 * 24 tétrades. Cada uma traz exatamente um adjetivo de cada dimensão, e os quatro
 * são de intensidade parecida — se um bloco tivesse "líder nato" contra "quieto", a
 * escolha seria pela desejabilidade social, não pelo comportamento.
 */
export const TETRADES: Tetrade[] = [
  { D: 'Decidido',      I: 'Comunicativo',  S: 'Paciente',      C: 'Analítico' },
  { D: 'Direto',        I: 'Entusiasmado',  S: 'Calmo',         C: 'Detalhista' },
  { D: 'Competitivo',   I: 'Sociável',      S: 'Constante',     C: 'Cuidadoso' },
  { D: 'Determinado',   I: 'Persuasivo',    S: 'Leal',          C: 'Preciso' },
  { D: 'Ousado',        I: 'Otimista',      S: 'Prestativo',    C: 'Organizado' },
  { D: 'Exigente',      I: 'Expressivo',    S: 'Tranquilo',     C: 'Criterioso' },
  { D: 'Firme',         I: 'Animado',       S: 'Ponderado',     C: 'Metódico' },
  { D: 'Assertivo',     I: 'Extrovertido',  S: 'Cooperativo',   C: 'Cauteloso' },
  { D: 'Objetivo',      I: 'Envolvente',    S: 'Previsível',    C: 'Sistemático' },
  { D: 'Corajoso',      I: 'Falante',       S: 'Acolhedor',     C: 'Exato' },
  { D: 'Enérgico',      I: 'Espontâneo',    S: 'Sereno',        C: 'Rigoroso' },
  { D: 'Resoluto',      I: 'Caloroso',      S: 'Atencioso',     C: 'Questionador' },
  { D: 'Incisivo',      I: 'Inspirador',    S: 'Gentil',        C: 'Disciplinado' },
  { D: 'Independente',  I: 'Popular',       S: 'Estável',       C: 'Formal' },
  { D: 'Ambicioso',     I: 'Bem-humorado',  S: 'Discreto',      C: 'Técnico' },
  { D: 'Prático',       I: 'Receptivo',     S: 'Conciliador',   C: 'Conservador' },
  { D: 'Frontal',       I: 'Alegre',        S: 'Dedicado',      C: 'Meticuloso' },
  { D: 'Desafiador',    I: 'Carismático',   S: 'Moderado',      C: 'Perfeccionista' },
  { D: 'Autoconfiante', I: 'Criativo',      S: 'Compreensivo',  C: 'Lógico' },
  { D: 'Rápido',        I: 'Otimista assumido', S: 'Fiel',      C: 'Prudente' },
  { D: 'Insistente',    I: 'Expansivo',     S: 'Tolerante',     C: 'Reservado' },
  { D: 'Focado',        I: 'Simpático',     S: 'Ameno',         C: 'Normativo' },
  { D: 'Impositivo',    I: 'Convincente',   S: 'Perseverante',  C: 'Planejado' },
  { D: 'Arrojado',      I: 'Sorridente',    S: 'Harmonioso',    C: 'Minucioso' },
]

/** Resposta de UM bloco: qual dimensão foi marcada como "mais" e qual como "menos". */
export type RespostaTetrade = { mais: DimensaoDisc; menos: DimensaoDisc }

export type PlacarDisc = Record<DimensaoDisc, number>

export type ResultadoDisc = {
  /** Como a pessoa age no trabalho (respostas "mais"), em % de 0 a 100. */
  adaptado: PlacarDisc
  /** Como a pessoa tende a ser sob pressão (respostas "menos"), em % de 0 a 100. */
  natural: PlacarDisc
  /** Dimensão mais forte do perfil natural. */
  primario: DimensaoDisc
  /** Segunda mais forte, ou null quando não há segunda expressiva. */
  secundario: DimensaoDisc | null
  /** Sigla do perfil: "D", "DI", "SC"... — o formato que a Deise já conhece. */
  codigo: string
  /** Quanto o adaptado se afasta do natural (0 a 100). Alto = a pessoa está se forçando. */
  tensaoDeAdaptacao: number
  respondidas: number
  completo: boolean
}

const ZERADO = (): PlacarDisc => ({ D: 0, I: 0, S: 0, C: 0 })

/** Diferença mínima para considerar que existe um segundo perfil, e não só ruído. */
const MARGEM_SECUNDARIO = 10

function paraPercentual(contagem: PlacarDisc, total: number): PlacarDisc {
  if (total === 0) return ZERADO()
  const pct = ZERADO()
  for (const dim of Object.keys(pct) as DimensaoDisc[]) {
    pct[dim] = Math.round((contagem[dim] / total) * 100)
  }
  return pct
}

/**
 * Apura o resultado.
 *
 * ADAPTADO: conta direto quantas vezes a dimensão foi escolhida como "mais".
 * NATURAL: conta por OPOSIÇÃO — quantas vezes a dimensão NÃO foi rejeitada. Uma
 * dimensão que a pessoa nunca marca como "menos" é uma que ela não consegue negar em
 * si mesma, e é isso que aparece sob pressão.
 *
 * As respostas podem vir parciais (a pessoa parou no meio); o cálculo usa o que existe
 * e `completo` avisa se dá para confiar no resultado.
 */
export function calcularDisc(
  respostas: (RespostaTetrade | null | undefined)[],
  totalDeTetrades: number = TETRADES.length,
): ResultadoDisc {
  const validas = respostas.filter((r): r is RespostaTetrade => !!r && !!r.mais && !!r.menos)

  const mais = ZERADO()
  const rejeicoes = ZERADO()
  for (const r of validas) {
    mais[r.mais] += 1
    rejeicoes[r.menos] += 1
  }

  // "Não rejeitada" = respondeu o bloco e não apontou esta dimensão como a que menos
  // a descreve.
  const naoRejeitada = ZERADO()
  for (const dim of Object.keys(naoRejeitada) as DimensaoDisc[]) {
    naoRejeitada[dim] = validas.length - rejeicoes[dim]
  }

  const adaptado = paraPercentual(mais, validas.length)
  // O denominador aqui é 4x maior: cada bloco deixa 3 dimensões "não rejeitadas".
  const natural = paraPercentual(naoRejeitada, validas.length * 3)

  const ordenadas = (Object.keys(natural) as DimensaoDisc[]).sort((a, b) => {
    if (natural[b] !== natural[a]) return natural[b] - natural[a]
    // Empate no natural desempata pelo adaptado; persistindo, ordem fixa D,I,S,C
    // pra o resultado nunca depender da ordem em que o objeto foi montado.
    if (adaptado[b] !== adaptado[a]) return adaptado[b] - adaptado[a]
    return ['D', 'I', 'S', 'C'].indexOf(a) - ['D', 'I', 'S', 'C'].indexOf(b)
  })

  const primario = ordenadas[0]
  const candidatoSecundario = ordenadas[1]
  const secundario =
    validas.length > 0 && natural[primario] - natural[candidatoSecundario] < MARGEM_SECUNDARIO
      ? candidatoSecundario
      : null

  const tensaoDeAdaptacao = Math.round(
    (Object.keys(adaptado) as DimensaoDisc[]).reduce(
      (soma, dim) => soma + Math.abs(adaptado[dim] - natural[dim]),
      0,
    ) / 2,
  )

  return {
    adaptado,
    natural,
    primario,
    secundario,
    codigo: secundario ? `${primario}${secundario}` : primario,
    tensaoDeAdaptacao,
    respondidas: validas.length,
    completo: validas.length === totalDeTetrades,
  }
}

/** Valida um bloco antes de aceitar: "mais" e "menos" não podem ser a mesma coisa. */
export function respostaValida(r: Partial<RespostaTetrade>): r is RespostaTetrade {
  return !!r.mais && !!r.menos && r.mais !== r.menos
}
