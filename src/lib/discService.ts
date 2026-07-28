// Camada de dados do DISC: cria a avaliação, entrega pelo token e grava o resultado.
// O motor de apuração fica em src/lib/disc.ts (puro, testável sem banco).

import { supabase } from './supabase'
import { calcularDisc, TETRADES, type ResultadoDisc, type RespostaTetrade } from './disc'

export type AvaliacaoDisc = {
  id: string
  colaborador_id: string | null
  candidato_id: string | null
  token: string
  status: 'pendente' | 'respondido' | 'cancelado'
  respostas: (RespostaTetrade | null)[] | null
  resultado: ResultadoDisc | null
  criado_em: string
  respondido_em: string | null
}

/**
 * Token do link público. Não é identificador sequencial de propósito: com id
 * incremental, quem recebesse um link conseguiria adivinhar o dos outros e responder
 * (ou ler) no lugar deles.
 */
function gerarToken(): string {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function linkDoQuestionario(token: string): string {
  return `${window.location.origin}/disc/${token}`
}

/**
 * Abre uma avaliação para um colaborador ou candidato e devolve o link.
 * Se já houver uma pendente, devolve a mesma em vez de criar outra — senão cada
 * clique em "Aplicar DISC" geraria um link novo e a pessoa receberia três.
 */
export async function abrirAvaliacao(
  alvo: { colaboradorId?: string; candidatoId?: string },
): Promise<AvaliacaoDisc> {
  const coluna = alvo.colaboradorId ? 'colaborador_id' : 'candidato_id'
  const valor = alvo.colaboradorId || alvo.candidatoId
  if (!valor) throw new Error('Informe o colaborador ou o candidato.')

  const { data: pendente } = await supabase
    .from('disc_avaliacoes')
    .select('*')
    .eq(coluna, valor)
    .eq('status', 'pendente')
    .maybeSingle()

  if (pendente) return pendente as AvaliacaoDisc

  const { data, error } = await supabase
    .from('disc_avaliacoes')
    .insert({
      colaborador_id: alvo.colaboradorId || null,
      candidato_id: alvo.candidatoId || null,
      token: gerarToken(),
      status: 'pendente',
    })
    .select()
    .single()

  if (error) throw new Error(error.message)
  return data as AvaliacaoDisc
}

export async function buscarPorToken(token: string): Promise<AvaliacaoDisc | null> {
  const { data } = await supabase
    .from('disc_avaliacoes')
    .select('*')
    .eq('token', token)
    .maybeSingle()
  return (data as AvaliacaoDisc) || null
}

export async function listarDoColaborador(colaboradorId: string): Promise<AvaliacaoDisc[]> {
  const { data } = await supabase
    .from('disc_avaliacoes')
    .select('*')
    .eq('colaborador_id', colaboradorId)
    .order('criado_em', { ascending: false })
  return (data as AvaliacaoDisc[]) || []
}

/**
 * Fecha a avaliação: apura, grava o resultado completo e reflete a letra principal
 * em colaboradores/candidatos.perfil_disc — a coluna que as telas antigas já leem.
 */
export async function finalizarAvaliacao(
  avaliacao: AvaliacaoDisc,
  respostas: (RespostaTetrade | null)[],
): Promise<ResultadoDisc> {
  const resultado = calcularDisc(respostas, TETRADES.length)

  const { error } = await supabase
    .from('disc_avaliacoes')
    .update({
      respostas,
      resultado,
      status: 'respondido',
      respondido_em: new Date().toISOString(),
    })
    .eq('id', avaliacao.id)

  if (error) throw new Error(error.message)

  // A coluna perfil_disc guarda UMA letra (é o que as telas atuais esperam), então
  // vai o primário. O perfil completo, com os dois gráficos, fica em disc_avaliacoes.
  const tabela = avaliacao.colaborador_id ? 'colaboradores' : 'candidatos'
  const id = avaliacao.colaborador_id || avaliacao.candidato_id
  if (id) {
    await supabase.from(tabela).update({ perfil_disc: resultado.primario }).eq('id', id)
  }

  return resultado
}
