// Avisos de feedback a partir de `feedbacks.proximo_feedback` — coluna que ja era
// preenchida no cadastro e nao alimentava nada na tela.
//
// Regra: o aviso e POR COLABORADOR, olhando o registro mais recente dele. Sem isso, um
// colaborador com 5 feedbacks antigos apareceria 5 vezes na lista de atrasados, e o
// painel viraria ruido que ninguem olha.

export type FeedbackParaAviso = {
  id: string
  colaborador_id: string | null
  data_feedback: string | null
  proximo_feedback: string | null
}

export type AvisoFeedback = {
  colaboradorId: string
  proximoFeedback: string
  diasRestantes: number
}

const JANELA_PROXIMOS_DIAS = 7

function paraData(iso: string) {
  const [a, m, d] = iso.split('-').map(Number)
  return new Date(a, m - 1, d)
}

export function diasAte(alvoIso: string, hojeIso: string): number {
  const alvo = paraData(alvoIso).getTime()
  const hoje = paraData(hojeIso).getTime()
  return Math.round((alvo - hoje) / 86400000)
}

/**
 * Separa os colaboradores cujo proximo feedback ja venceu dos que vencem nos
 * proximos 7 dias. `hojeIso` entra por parametro pra funcao ser deterministica
 * (e testavel sem depender do relogio da maquina).
 */
export function calcularAvisosFeedback(
  feedbacks: FeedbackParaAviso[],
  hojeIso: string,
): { vencidos: AvisoFeedback[]; proximos: AvisoFeedback[] } {
  const maisRecentePorColaborador = new Map<string, FeedbackParaAviso>()

  for (const f of feedbacks) {
    if (!f.colaborador_id || !f.proximo_feedback) continue
    const atual = maisRecentePorColaborador.get(f.colaborador_id)
    const refNova = f.data_feedback || f.proximo_feedback
    const refAtual = atual ? atual.data_feedback || atual.proximo_feedback : null
    if (!atual || (refAtual != null && refNova > refAtual)) {
      maisRecentePorColaborador.set(f.colaborador_id, f)
    }
  }

  const vencidos: AvisoFeedback[] = []
  const proximos: AvisoFeedback[] = []

  for (const f of maisRecentePorColaborador.values()) {
    const dias = diasAte(f.proximo_feedback!, hojeIso)
    const aviso: AvisoFeedback = {
      colaboradorId: f.colaborador_id!,
      proximoFeedback: f.proximo_feedback!,
      diasRestantes: dias,
    }
    if (dias < 0) vencidos.push(aviso)
    else if (dias <= JANELA_PROXIMOS_DIAS) proximos.push(aviso)
  }

  // Mais urgente primeiro nos dois casos
  vencidos.sort((a, b) => a.diasRestantes - b.diasRestantes)
  proximos.sort((a, b) => a.diasRestantes - b.diasRestantes)

  return { vencidos, proximos }
}
