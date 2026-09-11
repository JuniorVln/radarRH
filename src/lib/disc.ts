// Instrumento DISC próprio da Rede Ideia — tipos e ponte para o motor.
//
// ONDE MORA A LÓGICA
// O cálculo e o banco de 96 adjetivos ficam em `api/_disc-motor.js`, em JavaScript puro.
// Não é organização por capricho: a apuração precisa rodar nos DOIS lados — na tela do
// questionário e na função de servidor que grava o resultado (`api/disc.ts`) — e o
// empacotador de funções da Vercel não enxerga nada de dentro de `src/`. Arquivo único em
// JS é o que permite uma fonte só da verdade, sem cópia para sair de sincronia.
//
// Este arquivo guarda os tipos (que só existem em TypeScript) e reexporta os valores, para
// que todo o app continue importando de `lib/disc` como sempre fez.
//
// POR QUE O INSTRUMENTO É NOSSO
// O modelo DISC (Dominância, Influência, Estabilidade, Conformidade) vem de William
// Marston, "Emotions of Normal People" (1928) — construto fundacional de domínio público.
// O que NÃO é público são os bancos de itens dos instrumentos comerciais (Profiler da
// Sólides, DiSC® da Wiley, Style Insights da TTI). Copiar as perguntas deles seria copiar
// o produto deles. Os 96 adjetivos do motor foram redigidos aqui.
//
// FORMATO
// Escolha forçada em 24 tétrades: em cada bloco de 4 adjetivos — um de cada dimensão — a
// pessoa marca o que MAIS e o que MENOS a descreve. Desenho balanceado: cada dimensão
// aparece exatamente 24 vezes, então nenhuma sai na frente por aparecer mais.
//
// DOIS PERFIS
// - ADAPTADO: das respostas "mais". Como a pessoa acredita que precisa agir no trabalho.
// - NATURAL: das respostas "menos". O que ela rejeita revela, por oposição, como ela é
//   quando não está se controlando (sob pressão, cansaço).
// Divergência grande entre os dois é, em si, a informação útil.
//
// LIMITE QUE PRECISA SER DITO
// Instrumento ipsativo (a pessoa se compara consigo mesma, não com uma população). Os
// números NÃO comparam pessoas entre si e não têm validade de teste normativo. Serve para
// conversa de desenvolvimento — NÃO para reprovar candidato, demitir ou promover sozinho.
// A ressalva está em `RESSALVA_DE_USO` e deve aparecer na tela do resultado.

export type DimensaoDisc = 'D' | 'I' | 'S' | 'C'

/** Resposta de UM bloco: qual dimensão foi marcada como "mais" e qual como "menos". */
export type RespostaTetrade = { mais: DimensaoDisc; menos: DimensaoDisc }

export type PlacarDisc = Record<DimensaoDisc, number>

export type Tetrade = { D: string; I: string; S: string; C: string }

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

import {
  DIMENSOES as DIMENSOES_JS,
  RESSALVA_DE_USO as RESSALVA_JS,
  TETRADES as TETRADES_JS,
  calcularDisc as calcularDiscJS,
  respostaValida as respostaValidaJS,
} from '../../api/_disc-motor.js'

export const DIMENSOES: Record<DimensaoDisc, { nome: string; resumo: string; cor: string }> = DIMENSOES_JS
export const RESSALVA_DE_USO: string = RESSALVA_JS
export const TETRADES: Tetrade[] = TETRADES_JS

export const calcularDisc: (
  respostas: (RespostaTetrade | null | undefined)[],
  totalDeTetrades?: number
) => ResultadoDisc = calcularDiscJS

export const respostaValida: (r: Partial<RespostaTetrade>) => r is RespostaTetrade = respostaValidaJS
