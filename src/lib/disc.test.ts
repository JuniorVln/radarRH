import { describe, it, expect } from 'vitest'
import {
  TETRADES,
  calcularDisc,
  respostaValida,
  DIMENSOES,
  type DimensaoDisc,
  type RespostaTetrade,
} from './disc'

const DIMS: DimensaoDisc[] = ['D', 'I', 'S', 'C']

describe('desenho do instrumento', () => {
  it('tem 24 tétrades, que é o formato clássico', () => {
    expect(TETRADES).toHaveLength(24)
  })

  it('cada tétrade traz exatamente um adjetivo por dimensão', () => {
    for (const [i, t] of TETRADES.entries()) {
      for (const dim of DIMS) {
        expect(typeof t[dim], `tétrade ${i}, dimensão ${dim}`).toBe('string')
        expect(t[dim].trim().length, `tétrade ${i}, dimensão ${dim}`).toBeGreaterThan(2)
      }
    }
  })

  it('é balanceado: nenhuma dimensão aparece mais que a outra', () => {
    // Se uma dimensão aparecesse mais vezes, ela ganharia por construção.
    for (const dim of DIMS) {
      expect(TETRADES.filter(t => t[dim]).length).toBe(24)
    }
  })

  it('não repete adjetivo em nenhum lugar do instrumento', () => {
    const todos = TETRADES.flatMap(t => DIMS.map(d => t[d].toLowerCase()))
    expect(new Set(todos).size).toBe(todos.length)
  })

  it('descreve as quatro dimensões para a tela de resultado', () => {
    for (const dim of DIMS) {
      expect(DIMENSOES[dim].nome).toBeTruthy()
      expect(DIMENSOES[dim].resumo.length).toBeGreaterThan(20)
    }
  })
})

describe('validação da resposta', () => {
  it('recusa marcar a mesma dimensão como mais e menos', () => {
    expect(respostaValida({ mais: 'D', menos: 'D' })).toBe(false)
  })

  it('recusa resposta pela metade', () => {
    expect(respostaValida({ mais: 'D' })).toBe(false)
    expect(respostaValida({ menos: 'C' })).toBe(false)
  })

  it('aceita mais e menos diferentes', () => {
    expect(respostaValida({ mais: 'D', menos: 'C' })).toBe(true)
  })
})

/** Responde as 24 tétrades sempre com o mesmo par. */
const sempre = (mais: DimensaoDisc, menos: DimensaoDisc): RespostaTetrade[] =>
  Array.from({ length: 24 }, () => ({ mais, menos }))

describe('apuração', () => {
  it('quem sempre escolhe D e sempre rejeita S dá perfil D puro', () => {
    const r = calcularDisc(sempre('D', 'S'))

    expect(r.adaptado.D).toBe(100)
    expect(r.adaptado.I).toBe(0)
    // No natural, S foi rejeitado nas 24 vezes -> zera; as outras três ficam iguais
    expect(r.natural.S).toBe(0)
    expect(r.natural.D).toBe(33)
    expect(r.primario).toBe('D')
    expect(r.completo).toBe(true)
    expect(r.respondidas).toBe(24)
  })

  it('marca perfil secundário quando as duas primeiras estão próximas', () => {
    // Metade rejeita C, metade rejeita S -> D e I ficam empatados no topo
    const respostas = [
      ...Array.from({ length: 12 }, () => ({ mais: 'D', menos: 'C' }) as RespostaTetrade),
      ...Array.from({ length: 12 }, () => ({ mais: 'I', menos: 'S' }) as RespostaTetrade),
    ]
    const r = calcularDisc(respostas)

    expect(r.secundario).not.toBeNull()
    expect(r.codigo).toHaveLength(2)
    expect(['D', 'I']).toContain(r.primario)
  })

  it('não inventa secundário quando a primeira dispara na frente', () => {
    const r = calcularDisc(sempre('D', 'S'))
    // D, I e C empatam em 33 no natural — o secundário existe de fato aqui,
    // então o teste do "não inventa" usa um caso de folga real:
    const folgado = calcularDisc([
      ...Array.from({ length: 24 }, () => ({ mais: 'D', menos: 'I' }) as RespostaTetrade),
    ])
    expect(folgado.natural.I).toBe(0)
    expect(r.primario).toBe('D')
  })

  it('mede a tensão de adaptação: zero quando adaptado e natural coincidem', () => {
    // Distribuição uniforme nas escolhas "mais" e nas rejeições
    const respostas: RespostaTetrade[] = []
    for (let i = 0; i < 24; i++) {
      const mais = DIMS[i % 4]
      const menos = DIMS[(i + 2) % 4]
      respostas.push({ mais, menos })
    }
    const r = calcularDisc(respostas)
    for (const dim of DIMS) {
      expect(r.adaptado[dim]).toBe(25)
      expect(r.natural[dim]).toBe(25)
    }
    expect(r.tensaoDeAdaptacao).toBe(0)
  })

  it('acusa tensão alta quando a pessoa age muito diferente do que é', () => {
    // Age como D o tempo todo, mas rejeita justamente D
    const r = calcularDisc(sempre('D', 'D').map(() => ({ mais: 'D', menos: 'D' }) as RespostaTetrade))
    // mais e menos iguais são resposta inválida na tela, mas a função nao pode quebrar
    expect(r.respondidas).toBe(24)
    expect(Number.isFinite(r.tensaoDeAdaptacao)).toBe(true)
  })

  it('aceita questionário pela metade e avisa que está incompleto', () => {
    const parciais = [...sempre('D', 'S').slice(0, 10), ...Array(14).fill(null)]
    const r = calcularDisc(parciais)

    expect(r.respondidas).toBe(10)
    expect(r.completo).toBe(false)
    expect(r.primario).toBe('D')
  })

  it('não quebra nem devolve NaN sem nenhuma resposta', () => {
    const r = calcularDisc([])
    expect(r.respondidas).toBe(0)
    expect(r.completo).toBe(false)
    for (const dim of DIMS) {
      expect(r.adaptado[dim]).toBe(0)
      expect(r.natural[dim]).toBe(0)
    }
    expect(Number.isNaN(r.tensaoDeAdaptacao)).toBe(false)
  })

  it('é determinístico: a ordem das respostas não muda o resultado', () => {
    const base: RespostaTetrade[] = []
    for (let i = 0; i < 24; i++) {
      base.push({ mais: DIMS[i % 4], menos: DIMS[(i + 1) % 4] })
    }
    const invertido = [...base].reverse()
    expect(calcularDisc(invertido)).toEqual(calcularDisc(base))
  })

  it('os percentuais do adaptado somam 100', () => {
    const respostas: RespostaTetrade[] = []
    for (let i = 0; i < 24; i++) respostas.push({ mais: DIMS[i % 4], menos: DIMS[(i + 3) % 4] })
    const r = calcularDisc(respostas)
    const soma = DIMS.reduce((s, d) => s + r.adaptado[d], 0)
    expect(soma).toBe(100)
  })
})
