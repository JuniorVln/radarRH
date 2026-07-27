import { describe, expect, it } from 'vitest'
import {
  calcularBeneficioColaborador,
  contarDiasHomeOffice,
  contarDiasUteis,
  diasFeriasNoPeriodo,
  gerarTotaisBeneficios,
} from './beneficios'
import type { BeneficioPeriodo } from './beneficios'

const PERIODO_MAIO_2026: BeneficioPeriodo = {
  competencia: '2026-05',
  periodoInicio: '2026-03-20',
  periodoFim: '2026-04-19',
  diasUteis: 20,
  diasHomeOffice: 8,
  feriadosNacionais: ['2026-04-03'], // Sexta-feira Santa
  feriadosRegionais: [{ data: '2026-04-17', localidade: 'Brochier', descricao: 'Feriado Brochier' }],
}

describe('contarDiasUteis', () => {
  it('conta dias úteis do período de maio/2026 excluindo fins de semana e feriado nacional', () => {
    // 20/03 a 19/04/2026 = 31 dias corridos; excluindo sáb/dom e a Sexta-feira Santa (03/04)
    expect(contarDiasUteis('2026-03-20', '2026-04-19', ['2026-04-03'])).toBe(20)
  })

  it('sem lista de feriados, conta só exclui fins de semana', () => {
    expect(contarDiasUteis('2026-03-20', '2026-04-19')).toBe(21)
  })

  it('período de um único dia útil retorna 1', () => {
    expect(contarDiasUteis('2026-03-23', '2026-03-23')).toBe(1) // segunda-feira
  })

  it('período de um único fim de semana retorna 0', () => {
    expect(contarDiasUteis('2026-03-21', '2026-03-21')).toBe(0) // sábado
  })

  it('fim antes do início retorna 0 sem entrar em loop infinito', () => {
    expect(contarDiasUteis('2026-04-19', '2026-03-20')).toBe(0)
  })
})

describe('contarDiasHomeOffice', () => {
  it('conta segundas e sextas do período de maio/2026', () => {
    expect(contarDiasHomeOffice('2026-03-20', '2026-04-19')).toBe(9)
  })

  it('excluindo feriado que cai numa sexta', () => {
    expect(contarDiasHomeOffice('2026-03-20', '2026-04-19', ['2026-04-03'])).toBe(8)
  })
})

describe('diasFeriasNoPeriodo', () => {
  it('férias totalmente dentro do período', () => {
    expect(diasFeriasNoPeriodo('2026-03-25', 5, '2026-03-20', '2026-04-19')).toBe(5)
  })

  it('férias começando antes do período e terminando dentro', () => {
    // início 2026-03-10, 15 dias -> termina 2026-03-24; overlap com período (20/03 a 19/04) = 20,21,22,23,24 = 5 dias
    expect(diasFeriasNoPeriodo('2026-03-10', 15, '2026-03-20', '2026-04-19')).toBe(5)
  })

  it('férias começando dentro do período e terminando depois', () => {
    // início 2026-04-15, 10 dias -> termina 2026-04-24; overlap = 15,16,17,18,19 = 5 dias
    expect(diasFeriasNoPeriodo('2026-04-15', 10, '2026-03-20', '2026-04-19')).toBe(5)
  })

  it('férias totalmente fora do período (antes)', () => {
    expect(diasFeriasNoPeriodo('2026-01-01', 10, '2026-03-20', '2026-04-19')).toBe(0)
  })

  it('férias totalmente fora do período (depois)', () => {
    expect(diasFeriasNoPeriodo('2026-06-01', 10, '2026-03-20', '2026-04-19')).toBe(0)
  })

  it('sem data de início ou zero dias retorna 0', () => {
    expect(diasFeriasNoPeriodo('', 10, '2026-03-20', '2026-04-19')).toBe(0)
    expect(diasFeriasNoPeriodo('2026-03-25', 0, '2026-03-20', '2026-04-19')).toBe(0)
  })
})

describe('calcularBeneficioColaborador', () => {
  it('colaborador padrão sem descontos', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6 },
      PERIODO_MAIO_2026
    )
    expect(r.vrBruto).toBe(620) // 31 * 20
    expect(r.totalVr).toBe(620)
    expect(r.vtBruto).toBe(212) // 10.6 * 20
    expect(r.totalVt).toBe(212)
  })

  it('desconta faltas e atestados do VR e do VT', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasFaltas: 2, diasAtestados: 1 },
      PERIODO_MAIO_2026
    )
    // desconto = 31 * 3 = 93 -> VR = 620-93=527
    expect(r.totalVr).toBe(527)
    expect(r.totalVt).toBe(212 - 10.6 * 3)
  })

  it('home office parcial desconta só do VT, não do VR', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'COMBUSTIVEL', valorVtDiario: 10.6, diasHomeOffice: 8 },
      PERIODO_MAIO_2026
    )
    expect(r.totalVr).toBe(620) // sem desconto de VR
    expect(r.totalVt).toBe(212 - 10.6 * 8) // 127.2
  })

  it('frutas soma no VR e não sofre desconto de faltas', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'BROCHIER', recebeFrutas: true, valorFrutasMensal: 20, diasFaltas: 5 },
      PERIODO_MAIO_2026
    )
    expect(r.totalVr).toBe((620 - 31 * 5) + 20)
  })

  it('VT fixo mensal ignora dias úteis/desconto', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'COMBUSTIVEL', vtFixoMensal: 500, diasFaltas: 10, diasHomeOffice: 8 },
      PERIODO_MAIO_2026
    )
    expect(r.totalVt).toBe(500)
  })

  it('ajuste manual sobrescreve o total calculado', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Gaucha', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 25.5, ajusteManualVt: 361 },
      PERIODO_MAIO_2026
    )
    expect(r.totalVt).toBe(361)
    expect(r.vtBruto).toBe(510) // o bruto calculado continua exposto para auditoria
  })

  it('valorVrDiario zero produz VR zero mesmo com dias úteis normais', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Ideia', valorVrDiario: 0, transporte: 'TRI', valorVtDiario: 10.6 },
      PERIODO_MAIO_2026
    )
    expect(r.totalVr).toBe(0)
  })

  it('desconto nunca deixa o total negativo (excesso de faltas)', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6, diasFaltas: 999 },
      PERIODO_MAIO_2026
    )
    expect(r.totalVr).toBe(0)
    expect(r.totalVt).toBe(0)
  })

  it('feriado regional só desconta quem tem esse dado explícito (não é automático na função pura)', () => {
    const r = calcularBeneficioColaborador(
      { nome: 'Teste', empresa: 'Rede Ideia', localidade: 'Brochier', valorVrDiario: 31, transporte: 'BROCHIER', diasFeriadosRegionais: 1 },
      PERIODO_MAIO_2026
    )
    expect(r.totalVr).toBe(620 - 31)
  })
})

describe('gerarTotaisBeneficios', () => {
  it('agrega totais por empresa e por tipo de transporte', () => {
    const resultados = [
      calcularBeneficioColaborador({ nome: 'A', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6 }, PERIODO_MAIO_2026),
      calcularBeneficioColaborador({ nome: 'B', empresa: 'Rede Ideia', valorVrDiario: 31, transporte: 'TEU', valorVtDiario: 20 }, PERIODO_MAIO_2026),
      calcularBeneficioColaborador({ nome: 'C', empresa: 'Business', valorVrDiario: 31, transporte: 'TRI', valorVtDiario: 10.6 }, PERIODO_MAIO_2026),
    ]
    const totais = gerarTotaisBeneficios(resultados)
    expect(totais.porEmpresa['Rede Ideia'].colaboradores).toBe(2)
    expect(totais.porEmpresa['Business'].colaboradores).toBe(1)
    expect(totais.vtPorTransporte.TRI).toBe(212 * 2) // A + C
    expect(totais.totalVr).toBe(620 * 3)
  })
})
