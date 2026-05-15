export type TipoTransporte =
  | 'TRI'
  | 'TEU'
  | 'COMBUSTIVEL'
  | 'HOME OFFICE'
  | 'BROCHIER'
  | 'OUTRO'

export interface BeneficioPeriodo {
  competencia: string
  periodoInicio: string
  periodoFim: string
  diasUteis: number
  diasHomeOffice: number
  feriadosNacionais: string[]
  feriadosRegionais: { data: string; localidade: string; descricao: string }[]
}

export interface BeneficioColaboradorInput {
  colaboradorId?: string
  nome: string
  empresa: string
  localidade?: string
  valorVrDiario: number
  recebeFrutas?: boolean
  valorFrutasMensal?: number
  transporte: TipoTransporte
  valorVtDiario?: number
  vtFixoMensal?: number
  diasUteisVr?: number
  diasUteisVt?: number
  diasHomeOffice?: number
  diasFerias?: number
  diasFaltas?: number
  diasAtestados?: number
  diasFeriadosRegionais?: number
  ajusteManualVr?: number
  ajusteManualVt?: number
}

export interface BeneficioColaboradorResultado extends BeneficioColaboradorInput {
  diasDescontoVr: number
  diasDescontoVt: number
  vrBruto: number
  vrDesconto: number
  totalVr: number
  vtBruto: number
  vtDesconto: number
  totalVt: number
}

export interface BeneficioTotais {
  totalVr: number
  totalVt: number
  porEmpresa: Record<string, { colaboradores: number; totalVr: number; totalVt: number }>
  vtPorTransporte: Record<TipoTransporte, number>
}

const MS_PER_DAY = 24 * 60 * 60 * 1000

export const PERIODO_BENEFICIOS_MAIO_2026: BeneficioPeriodo = {
  competencia: '2026-05',
  periodoInicio: '2026-03-20',
  periodoFim: '2026-04-19',
  diasUteis: 20,
  diasHomeOffice: 8,
  feriadosNacionais: [],
  feriadosRegionais: [
    { data: '2026-04-17', localidade: 'Brochier', descricao: 'Feriado Brochier' },
  ],
}

export const CONFERENCIA_PLANILHA_MAIO_2026 = [
  {
    empresa: 'Rede Ideia',
    colaboradores: 35,
    totalVr: 20303,
    totalVt: 3779.8,
    vtPorTransporte: {
      BROCHIER: 0,
      COMBUSTIVEL: 1646.8,
      'HOME OFFICE': 0,
      TEU: 871.6,
      TRI: 1261.4,
    },
  },
  {
    empresa: 'Rede Gaucha',
    colaboradores: 19,
    totalVr: 10352,
    totalVt: 3086.2,
    vtPorTransporte: {
      BROCHIER: 0,
      COMBUSTIVEL: 1951.4,
      'HOME OFFICE': 0,
      TEU: 361,
      TRI: 773.8,
    },
  },
  {
    empresa: 'Business',
    colaboradores: 7,
    totalVr: 4185,
    totalVt: 751.2,
    vtPorTransporte: {
      COMBUSTIVEL: 212,
      'HOME OFFICE': 0,
      TEU: 200,
      TRI: 339.2,
    },
  },
  {
    empresa: 'Prosperar',
    colaboradores: 5,
    totalVr: 3138,
    totalVt: 965.6,
    vtPorTransporte: {
      COMBUSTIVEL: 747.6,
      TEU: 218,
    },
  },
] as const

export const BENEFICIOS_MAIO_2026_AMOSTRA: BeneficioColaboradorInput[] = [
  {
    nome: 'DANIELLY RENATA HERZER',
    empresa: 'Rede Ideia',
    localidade: 'Brochier',
    valorVrDiario: 31,
    recebeFrutas: true,
    valorFrutasMensal: 20,
    transporte: 'BROCHIER',
    diasUteisVr: 20,
    diasUteisVt: 20,
    diasFeriadosRegionais: 1,
  },
  {
    nome: 'BRUNO DA SILVA CAMARA',
    empresa: 'Rede Ideia',
    valorVrDiario: 31,
    transporte: 'HOME OFFICE',
    diasUteisVr: 20,
    diasUteisVt: 20,
    diasFerias: 19,
    diasFaltas: 1,
  },
  {
    nome: 'CAROLINE KARNAL DOS SANTOS',
    empresa: 'Rede Ideia',
    valorVrDiario: 31,
    transporte: 'COMBUSTIVEL',
    valorVtDiario: 10.6,
    diasUteisVr: 20,
    diasUteisVt: 20,
    diasHomeOffice: 8,
  },
  {
    nome: 'AMANDA FRAGA EMERIM',
    empresa: 'Rede Gaucha',
    valorVrDiario: 31,
    transporte: 'COMBUSTIVEL',
    vtFixoMensal: 500,
    diasUteisVr: 20,
  },
  {
    nome: 'TAINARA PEREIRA DE OLIVEIRA',
    empresa: 'Prosperar',
    valorVrDiario: 31,
    recebeFrutas: true,
    valorFrutasMensal: 20,
    transporte: 'TEU',
    valorVtDiario: 21.8,
    diasUteisVr: 20,
    diasUteisVt: 20,
    diasHomeOffice: 8,
    diasAtestados: 2,
  },
]

function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

function formatLocalDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100
}

function nonNegative(value: number | undefined) {
  return Math.max(0, value ?? 0)
}

export function contarDiasUteis(inicio: string, fim: string, feriados: string[] = []) {
  const holidaySet = new Set(feriados)
  const start = parseLocalDate(inicio)
  const end = parseLocalDate(fim)
  let total = 0

  for (let time = start.getTime(); time <= end.getTime(); time += MS_PER_DAY) {
    const date = new Date(time)
    const day = date.getDay()
    if (day !== 0 && day !== 6 && !holidaySet.has(formatLocalDate(date))) {
      total += 1
    }
  }

  return total
}

export function contarDiasHomeOffice(inicio: string, fim: string, feriados: string[] = []) {
  const holidaySet = new Set(feriados)
  const start = parseLocalDate(inicio)
  const end = parseLocalDate(fim)
  let total = 0

  for (let time = start.getTime(); time <= end.getTime(); time += MS_PER_DAY) {
    const date = new Date(time)
    const day = date.getDay()
    if ((day === 1 || day === 5) && !holidaySet.has(formatLocalDate(date))) {
      total += 1
    }
  }

  return total
}

export function calcularBeneficioColaborador(
  input: BeneficioColaboradorInput,
  periodo: BeneficioPeriodo = PERIODO_BENEFICIOS_MAIO_2026
): BeneficioColaboradorResultado {
  const diasUteisVr = input.diasUteisVr ?? periodo.diasUteis
  const diasUteisVt = input.diasUteisVt ?? periodo.diasUteis
  const diasHomeOffice = input.diasHomeOffice ?? (input.transporte === 'HOME OFFICE' ? periodo.diasHomeOffice : 0)
  const diasFerias = nonNegative(input.diasFerias)
  const diasFaltas = nonNegative(input.diasFaltas)
  const diasAtestados = nonNegative(input.diasAtestados)
  const diasFeriadosRegionais = nonNegative(input.diasFeriadosRegionais)
  const diasDescontoVr = diasFerias + diasFaltas + diasAtestados + diasFeriadosRegionais
  const diasDescontoVt = diasHomeOffice + diasFerias + diasFaltas + diasAtestados + diasFeriadosRegionais
  const frutas = input.recebeFrutas ? nonNegative(input.valorFrutasMensal) : 0
  const vrBruto = input.valorVrDiario * diasUteisVr
  const vrDesconto = input.valorVrDiario * diasDescontoVr
  const totalVrCalculado = roundMoney(Math.max(0, vrBruto - vrDesconto) + frutas)
  const valorVtDiario = nonNegative(input.valorVtDiario)
  const vtBruto = input.vtFixoMensal ?? valorVtDiario * diasUteisVt
  const vtDesconto = input.vtFixoMensal ? 0 : valorVtDiario * diasDescontoVt
  const totalVtCalculado = roundMoney(Math.max(0, vtBruto - vtDesconto))

  return {
    ...input,
    diasDescontoVr,
    diasDescontoVt,
    vrBruto: roundMoney(vrBruto),
    vrDesconto: roundMoney(vrDesconto),
    totalVr: input.ajusteManualVr ?? totalVrCalculado,
    vtBruto: roundMoney(vtBruto),
    vtDesconto: roundMoney(vtDesconto),
    totalVt: input.ajusteManualVt ?? totalVtCalculado,
  }
}

export function gerarTotaisBeneficios(resultados: BeneficioColaboradorResultado[]): BeneficioTotais {
  const initialVtPorTransporte: Record<TipoTransporte, number> = {
    TRI: 0,
    TEU: 0,
    COMBUSTIVEL: 0,
    'HOME OFFICE': 0,
    BROCHIER: 0,
    OUTRO: 0,
  }

  return resultados.reduce<BeneficioTotais>(
    (acc, item) => {
      acc.totalVr = roundMoney(acc.totalVr + item.totalVr)
      acc.totalVt = roundMoney(acc.totalVt + item.totalVt)
      acc.vtPorTransporte[item.transporte] = roundMoney(acc.vtPorTransporte[item.transporte] + item.totalVt)

      if (!acc.porEmpresa[item.empresa]) {
        acc.porEmpresa[item.empresa] = { colaboradores: 0, totalVr: 0, totalVt: 0 }
      }

      acc.porEmpresa[item.empresa].colaboradores += 1
      acc.porEmpresa[item.empresa].totalVr = roundMoney(acc.porEmpresa[item.empresa].totalVr + item.totalVr)
      acc.porEmpresa[item.empresa].totalVt = roundMoney(acc.porEmpresa[item.empresa].totalVt + item.totalVt)

      return acc
    },
    { totalVr: 0, totalVt: 0, porEmpresa: {}, vtPorTransporte: initialVtPorTransporte }
  )
}
