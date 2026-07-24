import { supabase } from './supabase'
import type {
  BeneficioConfiguracaoColaborador,
  BeneficioEvento,
  BeneficioPeriodoRow,
  BeneficioResultado,
  Colaborador,
  Ferias,
  Ocorrencia,
} from './supabase'
import {
  calcularBeneficioColaborador,
  contarDiasHomeOffice,
  contarDiasUteis,
  diasFeriasNoPeriodo,
  formatLocalDate,
} from './beneficios'

/**
 * Ciclo de folha da Rede Ideia: a competência "AAAA-MM" cobre o período de
 * apuração do dia 20 do mês (M-2) ao dia 19 do mês (M-1).
 * Ex.: competência 2026-05 -> período 20/03/2026 a 19/04/2026.
 */
export function datasDoPeriodo(competencia: string) {
  const [ano, mes] = competencia.split('-').map(Number)
  const periodo_inicio = formatLocalDate(new Date(ano, mes - 3, 20))
  const periodo_fim = formatLocalDate(new Date(ano, mes - 2, 19))
  return { periodo_inicio, periodo_fim }
}

export function competenciaAtual() {
  const hoje = new Date()
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}`
}

export function proximaCompetencia(competencia: string) {
  const [ano, mes] = competencia.split('-').map(Number)
  const data = new Date(ano, mes, 1) // mes já é o índice do mês seguinte (0-indexed = mes atual 1-indexed)
  return `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, '0')}`
}

export async function listarPeriodos(): Promise<BeneficioPeriodoRow[]> {
  const { data, error } = await supabase
    .from('beneficios_periodos')
    .select('*')
    .order('competencia', { ascending: false })
  if (error) throw error
  return (data || []) as BeneficioPeriodoRow[]
}

export async function obterOuCriarPeriodo(competencia: string): Promise<BeneficioPeriodoRow> {
  const existente = await supabase
    .from('beneficios_periodos')
    .select('*')
    .eq('competencia', competencia)
    .maybeSingle()
  if (existente.error) throw existente.error
  if (existente.data) return existente.data as BeneficioPeriodoRow

  const { periodo_inicio, periodo_fim } = datasDoPeriodo(competencia)
  const dias_uteis = contarDiasUteis(periodo_inicio, periodo_fim)
  const dias_home_office = contarDiasHomeOffice(periodo_inicio, periodo_fim)

  const { data, error } = await supabase
    .from('beneficios_periodos')
    .insert({
      competencia,
      periodo_inicio,
      periodo_fim,
      dias_uteis,
      dias_home_office,
      feriados_nacionais: [],
      feriados_regionais: [],
      status: 'aberto',
    })
    .select()
    .single()
  if (error) throw error
  return data as BeneficioPeriodoRow
}

export async function listarConfiguracoes(): Promise<BeneficioConfiguracaoColaborador[]> {
  const { data, error } = await supabase
    .from('beneficios_configuracoes_colaborador')
    .select('*')
    .order('empresa')
  if (error) throw error
  return (data || []) as BeneficioConfiguracaoColaborador[]
}

export async function salvarConfiguracao(
  payload: Omit<BeneficioConfiguracaoColaborador, 'id' | 'criado_em'>,
  id?: string
) {
  const { error } = id
    ? await supabase.from('beneficios_configuracoes_colaborador').update(payload).eq('id', id)
    : await supabase.from('beneficios_configuracoes_colaborador').insert(payload)
  if (error) throw error
}

export async function excluirConfiguracao(id: string) {
  const { error } = await supabase.from('beneficios_configuracoes_colaborador').delete().eq('id', id)
  if (error) throw error
}

export interface ResultadoComColaborador extends BeneficioResultado {
  colaborador?: Pick<Colaborador, 'nome' | 'foto_url'> | null
}

export async function listarResultados(periodoId: string): Promise<ResultadoComColaborador[]> {
  const [resultadosRes, colaboradoresRes] = await Promise.all([
    supabase.from('beneficios_resultados').select('*').eq('periodo_id', periodoId),
    supabase.from('colaboradores').select('id, nome, foto_url'),
  ])
  if (resultadosRes.error) throw resultadosRes.error
  if (colaboradoresRes.error) throw colaboradoresRes.error
  const byId = new Map((colaboradoresRes.data || []).map((c: any) => [c.id, c]))
  return ((resultadosRes.data || []) as BeneficioResultado[]).map(r => ({
    ...r,
    colaborador: r.colaborador_id ? byId.get(r.colaborador_id) || null : null,
  }))
}

export async function listarEventos(periodoId: string, colaboradorId: string): Promise<BeneficioEvento[]> {
  const { data, error } = await supabase
    .from('beneficios_eventos')
    .select('*')
    .eq('periodo_id', periodoId)
    .eq('colaborador_id', colaboradorId)
    .order('data_inicio')
  if (error) throw error
  return (data || []) as BeneficioEvento[]
}

export async function salvarAjusteManual(
  resultadoId: string,
  ajusteVr: number | null,
  ajusteVt: number | null,
  motivo: string | null
) {
  const { error } = await supabase
    .from('beneficios_resultados')
    .update({ ajuste_manual_vr: ajusteVr, ajuste_manual_vt: ajusteVt, motivo_ajuste: motivo })
    .eq('id', resultadoId)
  if (error) throw error
}

/**
 * Motor de cálculo: para cada colaborador com configuração de benefícios ativa,
 * puxa automaticamente faltas/ausências (Ocorrências) e férias (Provisão de Férias)
 * dentro do período, aplica feriados regionais configurados no período, calcula
 * VR/VT com as fórmulas de src/lib/beneficios.ts, grava o detalhamento por dia em
 * beneficios_eventos e o total em beneficios_resultados. Ajustes manuais já
 * lançados (ajuste_manual_vr/vt) são preservados entre recálculos.
 */
export async function calcularCompetencia(periodoId: string) {
  const periodoRes = await supabase.from('beneficios_periodos').select('*').eq('id', periodoId).single()
  if (periodoRes.error || !periodoRes.data) throw periodoRes.error || new Error('Período não encontrado.')
  const periodo = periodoRes.data as BeneficioPeriodoRow

  const [configsRes, colaboradoresRes, ocorrenciasRes, feriasRes, ajustesRes] = await Promise.all([
    supabase.from('beneficios_configuracoes_colaborador').select('*').eq('ativo', true),
    supabase.from('colaboradores').select('*').eq('status', 'ativo'),
    supabase
      .from('ocorrencias')
      .select('*')
      .in('tipo', ['falta', 'ausencia'])
      .neq('status', 'cancelada')
      .gte('data_ocorrencia', periodo.periodo_inicio)
      .lte('data_ocorrencia', periodo.periodo_fim),
    supabase.from('ferias').select('*').not('gozo_programado', 'is', null),
    supabase
      .from('beneficios_resultados')
      .select('id, colaborador_id, ajuste_manual_vr, ajuste_manual_vt, motivo_ajuste')
      .eq('periodo_id', periodoId),
  ])
  if (configsRes.error) throw configsRes.error
  if (colaboradoresRes.error) throw colaboradoresRes.error
  if (ocorrenciasRes.error) throw ocorrenciasRes.error
  if (feriasRes.error) throw feriasRes.error
  if (ajustesRes.error) throw ajustesRes.error

  const configs = (configsRes.data || []) as BeneficioConfiguracaoColaborador[]
  const colaboradoresAtivosPorId = new Map(((colaboradoresRes.data || []) as Colaborador[]).map(c => [c.id, c]))
  const ocorrencias = (ocorrenciasRes.data || []) as Ocorrencia[]
  const todasFerias = (feriasRes.data || []) as Ferias[]
  const ajustesExistentes = new Map(
    (ajustesRes.data || []).map((r: any) => [r.colaborador_id, r])
  )

  // Limpa o detalhamento gerado automaticamente da última vez que essa competência
  // foi calculada, para não duplicar eventos a cada recálculo.
  await supabase.from('beneficios_eventos').delete().eq('periodo_id', periodoId)

  const eventosParaInserir: Omit<BeneficioEvento, 'id' | 'criado_em'>[] = []
  const resultadosParaGravar: Omit<BeneficioResultado, 'id' | 'calculado_em'>[] = []

  for (const config of configs) {
    const colaborador = config.colaborador_id ? colaboradoresAtivosPorId.get(config.colaborador_id) : undefined
    if (!config.colaborador_id || !colaborador) continue
    const colaboradorId = config.colaborador_id

    const ocorrenciasColab = ocorrencias.filter(o => o.colaborador_id === colaboradorId)
    const diasFaltas = ocorrenciasColab.filter(o => o.tipo === 'falta').length
    const diasAtestados = ocorrenciasColab.filter(o => o.tipo === 'ausencia').length
    for (const o of ocorrenciasColab) {
      eventosParaInserir.push({
        periodo_id: periodoId,
        colaborador_id: colaboradorId,
        tipo: o.tipo === 'ausencia' ? 'atestado' : 'falta',
        data_inicio: o.data_ocorrencia,
        data_fim: null,
        dias: 1,
        impacta_vr: true,
        impacta_vt: true,
        valor_ajuste_vr: null,
        valor_ajuste_vt: null,
        motivo: o.descricao,
      })
    }

    let diasFerias = 0
    for (const f of todasFerias.filter(f => f.colaborador_id === colaboradorId && f.gozo_programado)) {
      const dias = diasFeriasNoPeriodo(f.gozo_programado as string, f.dias, periodo.periodo_inicio, periodo.periodo_fim)
      if (dias > 0) {
        diasFerias += dias
        eventosParaInserir.push({
          periodo_id: periodoId,
          colaborador_id: colaboradorId,
          tipo: 'ferias',
          data_inicio: f.gozo_programado,
          data_fim: null,
          dias,
          impacta_vr: true,
          impacta_vt: true,
          valor_ajuste_vr: null,
          valor_ajuste_vt: null,
          motivo: `Férias programadas (${dias} dia(s) dentro do período)`,
        })
      }
    }

    let diasFeriadosRegionais = 0
    for (const feriado of periodo.feriados_regionais || []) {
      if (
        feriado.localidade &&
        config.localidade === feriado.localidade &&
        feriado.data >= periodo.periodo_inicio &&
        feriado.data <= periodo.periodo_fim
      ) {
        diasFeriadosRegionais += 1
        eventosParaInserir.push({
          periodo_id: periodoId,
          colaborador_id: colaboradorId,
          tipo: 'feriado_regional',
          data_inicio: feriado.data,
          data_fim: null,
          dias: 1,
          impacta_vr: true,
          impacta_vt: true,
          valor_ajuste_vr: null,
          valor_ajuste_vt: null,
          motivo: feriado.descricao || `Feriado regional - ${feriado.localidade}`,
        })
      }
    }

    // Regime híbrido (seg/sex em home office) só desconta VT de quem tem VT variável
    // por dia — quem é 100% remoto (HOME OFFICE), tem VT fixo mensal ou é BROCHIER
    // (ônibus fretado/regional) não tem essa variável a descontar.
    const regimeHibrido =
      ['TRI', 'TEU', 'COMBUSTIVEL'].includes(config.tipo_transporte) &&
      config.valor_vt_diario > 0 &&
      !config.vt_fixo_mensal
    const diasHomeOffice = regimeHibrido ? periodo.dias_home_office : 0

    const calculo = calcularBeneficioColaborador(
      {
        nome: colaborador.nome,
        empresa: config.empresa,
        localidade: config.localidade || undefined,
        valorVrDiario: config.valor_vr_diario,
        recebeFrutas: config.recebe_frutas,
        valorFrutasMensal: config.valor_frutas_mensal,
        transporte: config.tipo_transporte,
        valorVtDiario: config.valor_vt_diario,
        vtFixoMensal: config.vt_fixo_mensal || undefined,
        diasUteisVr: periodo.dias_uteis,
        diasUteisVt: periodo.dias_uteis,
        diasHomeOffice,
        diasFerias,
        diasFaltas,
        diasAtestados,
        diasFeriadosRegionais,
      },
      {
        competencia: periodo.competencia,
        periodoInicio: periodo.periodo_inicio,
        periodoFim: periodo.periodo_fim,
        diasUteis: periodo.dias_uteis,
        diasHomeOffice: periodo.dias_home_office,
        feriadosNacionais: periodo.feriados_nacionais,
        feriadosRegionais: periodo.feriados_regionais,
      }
    )

    const ajusteExistente = ajustesExistentes.get(colaboradorId) as any

    resultadosParaGravar.push({
      periodo_id: periodoId,
      colaborador_id: colaboradorId,
      empresa: config.empresa,
      tipo_transporte: config.tipo_transporte,
      dias_uteis_vr: periodo.dias_uteis,
      dias_uteis_vt: periodo.dias_uteis,
      dias_home_office: diasHomeOffice,
      dias_ferias: diasFerias,
      dias_faltas: diasFaltas,
      dias_atestados: diasAtestados,
      dias_feriados_regionais: diasFeriadosRegionais,
      total_vr: calculo.totalVr,
      total_vt: calculo.totalVt,
      // Ajustes manuais (casos atípicos) são preservados entre recálculos.
      ajuste_manual_vr: ajusteExistente?.ajuste_manual_vr ?? null,
      ajuste_manual_vt: ajusteExistente?.ajuste_manual_vt ?? null,
      motivo_ajuste: ajusteExistente?.motivo_ajuste ?? null,
    })
  }

  if (eventosParaInserir.length > 0) {
    const { error } = await supabase.from('beneficios_eventos').insert(eventosParaInserir)
    if (error) throw error
  }

  if (resultadosParaGravar.length > 0) {
    const { error } = await supabase
      .from('beneficios_resultados')
      .upsert(resultadosParaGravar, { onConflict: 'periodo_id,colaborador_id' })
    if (error) throw error
  }

  await supabase.from('beneficios_periodos').update({ status: 'calculado' }).eq('id', periodoId)
}
