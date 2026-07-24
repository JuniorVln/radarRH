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

export function parseLocalDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatLocalDate(date: Date) {
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

/**
 * Conta quantos dias de um intervalo de férias [gozoInicio, gozoInicio + diasGozo - 1]
 * caem dentro do período de folha [periodoInicio, periodoFim].
 */
export function diasFeriasNoPeriodo(
  gozoInicio: string,
  diasGozo: number,
  periodoInicio: string,
  periodoFim: string
) {
  if (!gozoInicio || diasGozo <= 0) return 0
  const inicioGozo = parseLocalDate(gozoInicio).getTime()
  const fimGozo = inicioGozo + (diasGozo - 1) * MS_PER_DAY
  const inicioPeriodo = parseLocalDate(periodoInicio).getTime()
  const fimPeriodo = parseLocalDate(periodoFim).getTime()
  const inicioOverlap = Math.max(inicioGozo, inicioPeriodo)
  const fimOverlap = Math.min(fimGozo, fimPeriodo)
  if (fimOverlap < inicioOverlap) return 0
  return Math.round((fimOverlap - inicioOverlap) / MS_PER_DAY) + 1
}

export function calcularBeneficioColaborador(
  input: BeneficioColaboradorInput,
  periodo: BeneficioPeriodo
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
