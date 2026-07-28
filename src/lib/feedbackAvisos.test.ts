import { describe, it, expect } from 'vitest'
import { calcularAvisosFeedback, diasAte, type FeedbackParaAviso } from './feedbackAvisos'

const HOJE = '2026-07-28'

const fb = (
  id: string,
  colaborador_id: string | null,
  data_feedback: string | null,
  proximo_feedback: string | null,
): FeedbackParaAviso => ({ id, colaborador_id, data_feedback, proximo_feedback })

describe('diasAte', () => {
  it('conta dias no futuro e no passado', () => {
    expect(diasAte('2026-07-31', HOJE)).toBe(3)
    expect(diasAte('2026-07-28', HOJE)).toBe(0)
    expect(diasAte('2026-07-20', HOJE)).toBe(-8)
  })

  it('atravessa virada de mes e de ano sem escorregar', () => {
    expect(diasAte('2026-08-01', HOJE)).toBe(4)
    expect(diasAte('2027-01-01', '2026-12-30')).toBe(2)
  })
})

describe('calcularAvisosFeedback', () => {
  it('separa vencidos de proximos e ignora o que esta longe', () => {
    const { vencidos, proximos } = calcularAvisosFeedback(
      [
        fb('1', 'ana', '2026-04-01', '2026-07-01'), // venceu ha 27 dias
        fb('2', 'bruno', '2026-07-01', '2026-07-30'), // vence em 2 dias
        fb('3', 'carla', '2026-07-01', '2026-12-01'), // longe, nao entra
      ],
      HOJE,
    )

    expect(vencidos.map(v => v.colaboradorId)).toEqual(['ana'])
    expect(proximos.map(v => v.colaboradorId)).toEqual(['bruno'])
    expect(vencidos[0].diasRestantes).toBe(-27)
    expect(proximos[0].diasRestantes).toBe(2)
  })

  it('conta cada colaborador UMA vez, pelo feedback mais recente', () => {
    // Este e o ponto do agrupamento: sem ele, a Ana apareceria 2x como atrasada,
    // sendo que o feedback mais novo dela ja reagendou pra frente.
    const { vencidos, proximos } = calcularAvisosFeedback(
      [
        fb('1', 'ana', '2026-01-10', '2026-03-10'),
        fb('2', 'ana', '2026-07-20', '2026-08-02'),
      ],
      HOJE,
    )

    expect(vencidos).toHaveLength(0)
    expect(proximos).toHaveLength(1)
    expect(proximos[0].proximoFeedback).toBe('2026-08-02')
  })

  it('trata hoje como proximo, nao como vencido', () => {
    const { vencidos, proximos } = calcularAvisosFeedback(
      [fb('1', 'ana', '2026-07-01', HOJE)],
      HOJE,
    )
    expect(vencidos).toHaveLength(0)
    expect(proximos[0].diasRestantes).toBe(0)
  })

  it('ignora registro sem colaborador ou sem proxima data', () => {
    const { vencidos, proximos } = calcularAvisosFeedback(
      [
        fb('1', null, '2026-07-01', '2026-07-02'),
        fb('2', 'ana', '2026-07-01', null),
      ],
      HOJE,
    )
    expect(vencidos).toHaveLength(0)
    expect(proximos).toHaveLength(0)
  })

  it('lista o mais urgente primeiro', () => {
    const { vencidos } = calcularAvisosFeedback(
      [
        fb('1', 'ana', '2026-06-01', '2026-07-25'),
        fb('2', 'bruno', '2026-01-01', '2026-02-01'),
      ],
      HOJE,
    )
    expect(vencidos.map(v => v.colaboradorId)).toEqual(['bruno', 'ana'])
  })
})
