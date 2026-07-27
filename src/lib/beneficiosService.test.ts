import { describe, expect, it } from 'vitest'
import { competenciaAtual, datasDoPeriodo, proximaCompetencia } from './beneficiosService'

describe('datasDoPeriodo', () => {
  it('competência de maio/2026 cobre 20/03 a 19/04', () => {
    expect(datasDoPeriodo('2026-05')).toEqual({ periodo_inicio: '2026-03-20', periodo_fim: '2026-04-19' })
  })

  it('competência de janeiro vira o ano corretamente (20/nov a 19/dez do ano anterior)', () => {
    expect(datasDoPeriodo('2026-01')).toEqual({ periodo_inicio: '2025-11-20', periodo_fim: '2025-12-19' })
  })

  it('competência de fevereiro cruza a virada de ano (20/dez a 19/jan)', () => {
    expect(datasDoPeriodo('2026-02')).toEqual({ periodo_inicio: '2025-12-20', periodo_fim: '2026-01-19' })
  })
})

describe('proximaCompetencia', () => {
  it('avança um mês normalmente', () => {
    expect(proximaCompetencia('2026-05')).toBe('2026-06')
  })

  it('vira o ano em dezembro -> janeiro', () => {
    expect(proximaCompetencia('2026-12')).toBe('2027-01')
  })
})

describe('competenciaAtual', () => {
  it('retorna competência no formato AAAA-MM', () => {
    expect(competenciaAtual()).toMatch(/^\d{4}-\d{2}$/)
  })
})
