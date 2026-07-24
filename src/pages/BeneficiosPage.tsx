import React, { useCallback, useEffect, useMemo, useState } from 'react'
import toast from 'react-hot-toast'
import { Layout } from '../components/layout/Layout'
import { Badge, EmptyState, Modal, SearchInput, Tabs } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import {
  CalendarDays,
  ClipboardList,
  Grape,
  Home,
  ListChecks,
  Plus,
  RefreshCw,
  Settings,
  Train,
  Trash2,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import type { BeneficioConfiguracaoColaborador, BeneficioEvento, BeneficioPeriodoRow, BeneficioTipoTransporte, Colaborador } from '../lib/supabase'
import { formatCurrency, formatDate } from '../lib/utils'
import {
  ResultadoComColaborador,
  calcularCompetencia,
  competenciaAtual,
  excluirConfiguracao,
  listarConfiguracoes,
  listarEventos,
  listarPeriodos,
  listarResultados,
  obterOuCriarPeriodo,
  proximaCompetencia,
  salvarAjusteManual,
  salvarConfiguracao,
} from '../lib/beneficiosService'

type BeneficiosTab = 'resumo' | 'calculo' | 'configuracoes'

const TRANSPORTES: BeneficioTipoTransporte[] = ['TRI', 'TEU', 'COMBUSTIVEL', 'HOME OFFICE', 'BROCHIER', 'OUTRO']

const EMPTY_CONFIG = {
  colaborador_id: '',
  empresa: '',
  localidade: '',
  valor_vr_diario: '31',
  recebe_frutas: false,
  valor_frutas_mensal: '0',
  tipo_transporte: 'HOME OFFICE' as BeneficioTipoTransporte,
  valor_vt_diario: '0',
  vt_fixo_mensal: '',
}

const EMPTY_AJUSTE = { ajuste_manual_vr: '', ajuste_manual_vt: '', motivo_ajuste: '' }

function competenciaLabel(competencia: string) {
  const [ano, mes] = competencia.split('-')
  return `${mes}/${ano}`
}

function eventoLabel(tipo: BeneficioEvento['tipo']) {
  switch (tipo) {
    case 'falta': return 'Falta'
    case 'atestado': return 'Atestado / ausência'
    case 'ferias': return 'Férias'
    case 'feriado_regional': return 'Feriado regional'
    case 'home_office_extra': return 'Home office extra'
    case 'ajuste_manual': return 'Ajuste manual'
    default: return tipo
  }
}

export function BeneficiosPage() {
  const [tab, setTab] = useState<BeneficiosTab>('resumo')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [calculando, setCalculando] = useState(false)

  const [periodos, setPeriodos] = useState<BeneficioPeriodoRow[]>([])
  const [periodoId, setPeriodoId] = useState<string>('')
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [configuracoes, setConfiguracoes] = useState<BeneficioConfiguracaoColaborador[]>([])
  const [resultados, setResultados] = useState<ResultadoComColaborador[]>([])

  const [detalheAberto, setDetalheAberto] = useState<ResultadoComColaborador | null>(null)
  const [eventosDetalhe, setEventosDetalhe] = useState<BeneficioEvento[]>([])

  const [ajusteAberto, setAjusteAberto] = useState<ResultadoComColaborador | null>(null)
  const [formAjuste, setFormAjuste] = useState({ ...EMPTY_AJUSTE })
  const [salvandoAjuste, setSalvandoAjuste] = useState(false)

  const [showConfigModal, setShowConfigModal] = useState(false)
  const [editingConfig, setEditingConfig] = useState<BeneficioConfiguracaoColaborador | null>(null)
  const [formConfig, setFormConfig] = useState({ ...EMPTY_CONFIG })
  const [savingConfig, setSavingConfig] = useState(false)

  const periodoAtual = useMemo(() => periodos.find(p => p.id === periodoId) || null, [periodos, periodoId])

  const colaboradorPorId = useMemo(() => new Map(colaboradores.map(c => [c.id, c])), [colaboradores])

  const carregarPeriodos = useCallback(async () => {
    let lista = await listarPeriodos()
    if (lista.length === 0) {
      await obterOuCriarPeriodo(competenciaAtual())
      lista = await listarPeriodos()
    }
    setPeriodos(lista)
    return lista
  }, [])

  const carregarDadosBase = useCallback(async () => {
    const { data } = await supabase.from('colaboradores').select('*').order('nome')
    setColaboradores((data || []) as Colaborador[])
    setConfiguracoes(await listarConfiguracoes())
  }, [])

  const carregarResultados = useCallback(async (id: string) => {
    if (!id) { setResultados([]); return }
    setResultados(await listarResultados(id))
  }, [])

  useEffect(() => {
    (async () => {
      setLoading(true)
      try {
        const lista = await carregarPeriodos()
        await carregarDadosBase()
        if (lista.length > 0) {
          setPeriodoId(lista[0].id)
          await carregarResultados(lista[0].id)
        }
      } catch (err: any) {
        toast.error('Erro ao carregar benefícios: ' + err.message)
      } finally {
        setLoading(false)
      }
    })()
  }, [carregarPeriodos, carregarDadosBase, carregarResultados])

  const trocarPeriodo = async (id: string) => {
    setPeriodoId(id)
    setLoading(true)
    await carregarResultados(id)
    setLoading(false)
  }

  const criarNovaCompetencia = async () => {
    const base = periodos[0]?.competencia || competenciaAtual()
    const proxima = proximaCompetencia(base)
    if (periodos.some(p => p.competencia === proxima)) {
      toast.error(`Competência ${competenciaLabel(proxima)} já existe.`)
      return
    }
    try {
      const novo = await obterOuCriarPeriodo(proxima)
      toast.success(`Competência ${competenciaLabel(proxima)} criada.`)
      const lista = await carregarPeriodos()
      setPeriodos(lista)
      setPeriodoId(novo.id)
      await carregarResultados(novo.id)
    } catch (err: any) {
      toast.error('Erro ao criar competência: ' + err.message)
    }
  }

  const recalcular = async () => {
    if (!periodoId) return
    setCalculando(true)
    try {
      await calcularCompetencia(periodoId)
      await carregarResultados(periodoId)
      const lista = await listarPeriodos()
      setPeriodos(lista)
      toast.success('Recalculado — faltas, atestados e férias puxados automaticamente do sistema.')
    } catch (err: any) {
      toast.error('Erro ao recalcular: ' + err.message)
    } finally {
      setCalculando(false)
    }
  }

  const abrirDetalhe = async (r: ResultadoComColaborador) => {
    setDetalheAberto(r)
    if (r.colaborador_id) {
      setEventosDetalhe(await listarEventos(periodoId, r.colaborador_id))
    }
  }

  const abrirAjuste = (r: ResultadoComColaborador) => {
    setAjusteAberto(r)
    setFormAjuste({
      ajuste_manual_vr: r.ajuste_manual_vr != null ? String(r.ajuste_manual_vr) : '',
      ajuste_manual_vt: r.ajuste_manual_vt != null ? String(r.ajuste_manual_vt) : '',
      motivo_ajuste: r.motivo_ajuste || '',
    })
  }

  const salvarAjuste = async () => {
    if (!ajusteAberto) return
    if ((formAjuste.ajuste_manual_vr || formAjuste.ajuste_manual_vt) && !formAjuste.motivo_ajuste.trim()) {
      toast.error('Descreva o motivo do ajuste.')
      return
    }
    setSalvandoAjuste(true)
    try {
      await salvarAjusteManual(
        ajusteAberto.id,
        formAjuste.ajuste_manual_vr ? Number(formAjuste.ajuste_manual_vr) : null,
        formAjuste.ajuste_manual_vt ? Number(formAjuste.ajuste_manual_vt) : null,
        formAjuste.motivo_ajuste.trim() || null
      )
      toast.success('Ajuste salvo.')
      setAjusteAberto(null)
      await carregarResultados(periodoId)
    } catch (err: any) {
      toast.error('Erro ao salvar ajuste: ' + err.message)
    } finally {
      setSalvandoAjuste(false)
    }
  }

  const totais = useMemo(() => {
    const porEmpresa: Record<string, { colaboradores: number; totalVr: number; totalVt: number }> = {}
    let totalVr = 0
    let totalVt = 0
    for (const r of resultados) {
      const vr = r.ajuste_manual_vr ?? r.total_vr
      const vt = r.ajuste_manual_vt ?? r.total_vt
      totalVr += vr
      totalVt += vt
      if (!porEmpresa[r.empresa]) porEmpresa[r.empresa] = { colaboradores: 0, totalVr: 0, totalVt: 0 }
      porEmpresa[r.empresa].colaboradores += 1
      porEmpresa[r.empresa].totalVr += vr
      porEmpresa[r.empresa].totalVt += vt
    }
    return { totalVr, totalVt, porEmpresa }
  }, [resultados])

  const resultadosFiltrados = resultados.filter(r => {
    const nome = r.colaborador?.nome || ''
    const term = search.toLowerCase()
    return !term || nome.toLowerCase().includes(term) || r.empresa.toLowerCase().includes(term) || r.tipo_transporte.toLowerCase().includes(term)
  })

  // ---- Configurações (VR/VT por colaborador) ----
  const colaboradoresSemConfig = useMemo(() => {
    const comConfig = new Set(configuracoes.map(c => c.colaborador_id))
    return colaboradores.filter(c => c.status === 'ativo' && !comConfig.has(c.id))
  }, [colaboradores, configuracoes])

  const openNewConfig = () => {
    setEditingConfig(null)
    setFormConfig({ ...EMPTY_CONFIG })
    setShowConfigModal(true)
  }

  const openEditConfig = (c: BeneficioConfiguracaoColaborador) => {
    setEditingConfig(c)
    setFormConfig({
      colaborador_id: c.colaborador_id || '',
      empresa: c.empresa,
      localidade: c.localidade || '',
      valor_vr_diario: String(c.valor_vr_diario),
      recebe_frutas: c.recebe_frutas,
      valor_frutas_mensal: String(c.valor_frutas_mensal),
      tipo_transporte: c.tipo_transporte,
      valor_vt_diario: String(c.valor_vt_diario),
      vt_fixo_mensal: c.vt_fixo_mensal != null ? String(c.vt_fixo_mensal) : '',
    })
    setShowConfigModal(true)
  }

  const selecionarColaboradorConfig = (id: string) => {
    const colaborador = colaboradorPorId.get(id)
    setFormConfig(p => ({ ...p, colaborador_id: id, empresa: colaborador?.unidade || p.empresa }))
  }

  const salvarConfig = async () => {
    if (!formConfig.colaborador_id || !formConfig.empresa) {
      toast.error('Selecione o colaborador e a empresa.')
      return
    }
    setSavingConfig(true)
    try {
      await salvarConfiguracao(
        {
          colaborador_id: formConfig.colaborador_id,
          empresa: formConfig.empresa,
          localidade: formConfig.localidade || null,
          valor_vr_diario: Number(formConfig.valor_vr_diario) || 0,
          recebe_frutas: formConfig.recebe_frutas,
          valor_frutas_mensal: Number(formConfig.valor_frutas_mensal) || 0,
          tipo_transporte: formConfig.tipo_transporte,
          valor_vt_diario: Number(formConfig.valor_vt_diario) || 0,
          vt_fixo_mensal: formConfig.vt_fixo_mensal ? Number(formConfig.vt_fixo_mensal) : null,
          ativo: true,
        },
        editingConfig?.id
      )
      toast.success(editingConfig ? 'Configuração atualizada.' : 'Configuração criada.')
      setShowConfigModal(false)
      await carregarDadosBase()
    } catch (err: any) {
      toast.error('Erro ao salvar configuração: ' + err.message)
    } finally {
      setSavingConfig(false)
    }
  }

  const removerConfig = async (id: string) => {
    if (!confirm('Remover esta configuração de benefícios? O colaborador deixa de entrar no cálculo automático.')) return
    try {
      await excluirConfiguracao(id)
      toast.success('Configuração removida.')
      await carregarDadosBase()
    } catch (err: any) {
      toast.error('Erro ao remover: ' + err.message)
    }
  }

  return (
    <Layout title="Benefícios" subtitle="VR, VT e frutas calculados automaticamente a partir de Ocorrências e Férias">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <select
          className="input w-auto"
          value={periodoId}
          onChange={e => trocarPeriodo(e.target.value)}
        >
          {periodos.map(p => (
            <option key={p.id} value={p.id}>
              Competência {competenciaLabel(p.competencia)} {p.status === 'calculado' ? '· calculado' : '· aberto'}
            </option>
          ))}
        </select>
        <button className="btn-secondary" onClick={criarNovaCompetencia}>
          <Plus size={16} />
          Nova competência
        </button>
        <button className="btn-primary" onClick={recalcular} disabled={calculando || !periodoId}>
          <RefreshCw size={16} className={calculando ? 'animate-spin' : ''} />
          {calculando ? 'Recalculando...' : 'Recalcular (puxar Ocorrências + Férias)'}
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Competência"
          value={periodoAtual ? competenciaLabel(periodoAtual.competencia) : '—'}
          subtitle={periodoAtual ? `${formatDate(periodoAtual.periodo_inicio)} a ${formatDate(periodoAtual.periodo_fim)}` : ''}
          icon={<CalendarDays size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-100"
        />
        <StatCard
          title="Dias Úteis"
          value={periodoAtual?.dias_uteis ?? '—'}
          subtitle={periodoAtual ? `${periodoAtual.dias_home_office} dias de home office (seg/sex)` : ''}
          icon={<Home size={20} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Total VR"
          value={formatCurrency(totais.totalVr)}
          subtitle={`${resultados.length} colaborador(es) calculado(s)`}
          icon={<Grape size={20} className="text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard
          title="Total VT"
          value={formatCurrency(totais.totalVt)}
          subtitle="Somado por empresa e transporte"
          icon={<Train size={20} className="text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            tabs={[
              { label: 'Resumo', value: 'resumo' },
              { label: 'Cálculo por colaborador', value: 'calculo' },
              { label: 'Configurações', value: 'configuracoes' },
            ]}
            value={tab}
            onChange={value => setTab(value as BeneficiosTab)}
          />
          {tab === 'configuracoes' && (
            <button className="btn-primary" onClick={openNewConfig}>
              <Plus size={16} />
              Configurar colaborador
            </button>
          )}
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-14 skeleton" />)}
          </div>
        ) : tab === 'resumo' ? (
          resultados.length === 0 ? (
            <EmptyState
              icon={<ClipboardList size={32} />}
              title="Nenhum cálculo para esta competência ainda"
              description="Clique em 'Recalcular' para puxar faltas, atestados e férias automaticamente e gerar os valores de VR/VT."
              action={<button className="btn-primary" onClick={recalcular}><RefreshCw size={16} />Recalcular agora</button>}
            />
          ) : (
            <div className="p-5">
              <h3 className="font-semibold text-gray-900 mb-3">Totais por empresa</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Colaboradores</th>
                      <th>Total VR</th>
                      <th>Total VT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(totais.porEmpresa).map(([empresa, t]) => (
                      <tr key={empresa}>
                        <td className="font-medium text-gray-900">{empresa}</td>
                        <td>{t.colaboradores}</td>
                        <td>{formatCurrency(t.totalVr)}</td>
                        <td>{formatCurrency(t.totalVt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )
        ) : tab === 'calculo' ? (
          <div className="p-5">
            <div className="mb-4 max-w-md">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar colaborador, empresa ou transporte..." />
            </div>
            {resultadosFiltrados.length === 0 ? (
              <EmptyState icon={<ClipboardList size={32} />} title="Nada calculado ainda" description="Recalcule a competência para ver os valores por colaborador." />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>Empresa</th>
                      <th>Faltas/Atest./Férias</th>
                      <th>Total VR</th>
                      <th>Transporte</th>
                      <th>Total VT</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadosFiltrados.map(r => {
                      const vrFinal = r.ajuste_manual_vr ?? r.total_vr
                      const vtFinal = r.ajuste_manual_vt ?? r.total_vt
                      return (
                        <tr key={r.id} className="cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => abrirDetalhe(r)}>
                          <td className="font-medium text-gray-900">{r.colaborador?.nome || 'Colaborador removido'}</td>
                          <td>{r.empresa}</td>
                          <td className="text-sm text-gray-500">
                            {r.dias_faltas || 0}f · {r.dias_atestados || 0}a · {r.dias_ferias || 0}fér
                          </td>
                          <td>
                            {formatCurrency(vrFinal)}
                            {r.ajuste_manual_vr != null && <Badge variant="yellow" size="sm">ajustado</Badge>}
                          </td>
                          <td><Badge variant={r.tipo_transporte === 'HOME OFFICE' ? 'blue' : 'gray'}>{r.tipo_transporte}</Badge></td>
                          <td>
                            {formatCurrency(vtFinal)}
                            {r.ajuste_manual_vt != null && <Badge variant="yellow" size="sm">ajustado</Badge>}
                          </td>
                          <td onClick={e => e.stopPropagation()}>
                            <button className="btn-secondary !py-1 !px-2 text-xs" onClick={() => abrirAjuste(r)}>Ajustar</button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          <div className="p-5">
            {colaboradoresSemConfig.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
                {colaboradoresSemConfig.length} colaborador(es) ativo(s) ainda sem configuração de benefícios — não entram no cálculo automático até serem configurados.
              </div>
            )}
            {configuracoes.length === 0 ? (
              <EmptyState icon={<Settings size={32} />} title="Nenhuma configuração cadastrada" description="Configure o VR/VT de cada colaborador para que o cálculo automático funcione." action={<button className="btn-primary" onClick={openNewConfig}><Plus size={16} />Configurar colaborador</button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>Empresa</th>
                      <th>VR diário</th>
                      <th>Frutas</th>
                      <th>Transporte</th>
                      <th>VT</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {configuracoes.map(c => (
                      <tr key={c.id} className="cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => openEditConfig(c)}>
                        <td className="font-medium text-gray-900">{c.colaborador_id ? colaboradorPorId.get(c.colaborador_id)?.nome || '—' : '—'}</td>
                        <td>{c.empresa}{c.localidade ? ` · ${c.localidade}` : ''}</td>
                        <td>{formatCurrency(c.valor_vr_diario)}</td>
                        <td>{c.recebe_frutas ? formatCurrency(c.valor_frutas_mensal) : '—'}</td>
                        <td><Badge variant={c.tipo_transporte === 'HOME OFFICE' ? 'blue' : 'gray'}>{c.tipo_transporte}</Badge></td>
                        <td>{c.vt_fixo_mensal ? `${formatCurrency(c.vt_fixo_mensal)}/mês` : formatCurrency(c.valor_vt_diario) + '/dia'}</td>
                        <td onClick={e => e.stopPropagation()}>
                          <button className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" onClick={() => removerConfig(c.id)}>
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Detalhamento por dia (o que compõe o desconto) */}
      <Modal open={!!detalheAberto} onClose={() => setDetalheAberto(null)} title={detalheAberto ? `Detalhamento — ${detalheAberto.colaborador?.nome || ''}` : ''} size="lg">
        {detalheAberto && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Total VR</p>
                <p className="font-bold text-gray-900">{formatCurrency(detalheAberto.ajuste_manual_vr ?? detalheAberto.total_vr)}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-gray-500">Total VT</p>
                <p className="font-bold text-gray-900">{formatCurrency(detalheAberto.ajuste_manual_vt ?? detalheAberto.total_vt)}</p>
              </div>
            </div>
            {(detalheAberto.ajuste_manual_vr != null || detalheAberto.ajuste_manual_vt != null) && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm">
                <p className="font-medium text-yellow-900">Ajuste manual aplicado</p>
                <p className="text-yellow-700">{detalheAberto.motivo_ajuste || 'Sem motivo registrado.'}</p>
              </div>
            )}
            <div>
              <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2"><ListChecks size={16} />Eventos que compõem o desconto</h4>
              {eventosDetalhe.length === 0 ? (
                <p className="text-sm text-gray-400">Nenhuma falta, atestado, férias ou feriado regional neste período — desconto zero.</p>
              ) : (
                <div className="space-y-2">
                  {eventosDetalhe.map(ev => (
                    <div key={ev.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2 text-sm">
                      <div>
                        <Badge variant="gray" size="sm">{eventoLabel(ev.tipo)}</Badge>
                        <span className="ml-2 text-gray-600">{ev.motivo}</span>
                      </div>
                      <div className="text-gray-500 text-xs">
                        {ev.data_inicio ? formatDate(ev.data_inicio) : ''} · {ev.dias} dia(s)
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Ajuste manual (casos atípicos) */}
      <Modal open={!!ajusteAberto} onClose={() => setAjusteAberto(null)} title={ajusteAberto ? `Ajuste manual — ${ajusteAberto.colaborador?.nome || ''}` : ''}>
        <p className="text-sm text-gray-500 mb-4">
          Use quando o cálculo automático não reflete um caso específico (ex.: dia extra de home office, regra de transporte diferente). Deixe em branco para voltar a usar o valor calculado.
        </p>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Valor final de VR</label>
              <input className="input" type="number" step="0.01" value={formAjuste.ajuste_manual_vr} onChange={e => setFormAjuste(p => ({ ...p, ajuste_manual_vr: e.target.value }))} placeholder={ajusteAberto ? String(ajusteAberto.total_vr) : ''} />
            </div>
            <div>
              <label className="label">Valor final de VT</label>
              <input className="input" type="number" step="0.01" value={formAjuste.ajuste_manual_vt} onChange={e => setFormAjuste(p => ({ ...p, ajuste_manual_vt: e.target.value }))} placeholder={ajusteAberto ? String(ajusteAberto.total_vt) : ''} />
            </div>
          </div>
          <div>
            <label className="label">Motivo</label>
            <textarea className="input h-20 resize-none" value={formAjuste.motivo_ajuste} onChange={e => setFormAjuste(p => ({ ...p, motivo_ajuste: e.target.value }))} placeholder="Ex.: colaborador fez 1 dia extra de home office nesta competência" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setAjusteAberto(null)}>Cancelar</button>
          <button className="btn-primary" onClick={salvarAjuste} disabled={salvandoAjuste}>{salvandoAjuste ? 'Salvando...' : 'Salvar ajuste'}</button>
        </div>
      </Modal>

      {/* Configuração de VR/VT por colaborador */}
      <Modal open={showConfigModal} onClose={() => setShowConfigModal(false)} title={editingConfig ? 'Configuração de Benefícios' : 'Configurar Colaborador'} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Colaborador *</label>
            <select className="input" value={formConfig.colaborador_id} disabled={!!editingConfig} onChange={e => selecionarColaboradorConfig(e.target.value)}>
              <option value="">Selecione</option>
              {(editingConfig ? colaboradores.filter(c => c.id === editingConfig.colaborador_id) : colaboradoresSemConfig).map(c => (
                <option key={c.id} value={c.id}>{c.nome}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Empresa / Unidade *</label>
            <input className="input" value={formConfig.empresa} onChange={e => setFormConfig(p => ({ ...p, empresa: e.target.value }))} placeholder="Ex.: Rede Ideia" />
          </div>
          <div>
            <label className="label">Localidade (para feriado regional)</label>
            <input className="input" value={formConfig.localidade} onChange={e => setFormConfig(p => ({ ...p, localidade: e.target.value }))} placeholder="Ex.: Brochier" />
          </div>
          <div>
            <label className="label">Valor VR diário</label>
            <input className="input" type="number" step="0.01" value={formConfig.valor_vr_diario} onChange={e => setFormConfig(p => ({ ...p, valor_vr_diario: e.target.value }))} />
          </div>
          <div className="flex items-end gap-2">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={formConfig.recebe_frutas} onChange={e => setFormConfig(p => ({ ...p, recebe_frutas: e.target.checked }))} />
              Recebe frutas (valor fixo mensal)
            </label>
          </div>
          {formConfig.recebe_frutas && (
            <div>
              <label className="label">Valor de frutas (mensal)</label>
              <input className="input" type="number" step="0.01" value={formConfig.valor_frutas_mensal} onChange={e => setFormConfig(p => ({ ...p, valor_frutas_mensal: e.target.value }))} />
            </div>
          )}
          <div>
            <label className="label">Tipo de transporte</label>
            <select className="input" value={formConfig.tipo_transporte} onChange={e => setFormConfig(p => ({ ...p, tipo_transporte: e.target.value as BeneficioTipoTransporte }))}>
              {TRANSPORTES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Valor VT diário</label>
            <input className="input" type="number" step="0.01" value={formConfig.valor_vt_diario} onChange={e => setFormConfig(p => ({ ...p, valor_vt_diario: e.target.value }))} />
          </div>
          <div>
            <label className="label">VT fixo mensal (casos de combustível fechado)</label>
            <input className="input" type="number" step="0.01" value={formConfig.vt_fixo_mensal} onChange={e => setFormConfig(p => ({ ...p, vt_fixo_mensal: e.target.value }))} placeholder="Deixe em branco se for por dia" />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowConfigModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={salvarConfig} disabled={savingConfig}>{savingConfig ? 'Salvando...' : 'Salvar'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
