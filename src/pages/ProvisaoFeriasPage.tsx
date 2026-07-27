import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Plus, Calendar, AlertTriangle, CheckCircle, Trash2 } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Tabs, Modal } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import type { Colaborador, Ferias } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

type FeriasTab = 'relatorio' | 'vencimento' | 'programacao'

const EMPTY_FORM = {
  colaborador_id: '',
  periodo_aquisitivo_inicio: '',
  periodo_aquisitivo_fim: '',
  vencimento: '',
  gozo_programado: '',
  dias: '30',
  status: 'pendente' as Ferias['status'],
}

function addYears(dateStr: string, years: number, minusOneDay = false) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y + years, m - 1, d)
  if (minusOneDay) date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}

function daysUntil(dateStr: string | null) {
  if (!dateStr) return null
  const [y, m, d] = dateStr.split('-').map(Number)
  const target = new Date(y, m - 1, d).getTime()
  const today = new Date()
  const now = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return Math.round((target - now) / 86400000)
}

export function ProvisaoFeriasPage() {
  const [tab, setTab] = useState<FeriasTab>('relatorio')
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [ferias, setFerias] = useState<Ferias[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [editing, setEditing] = useState<Ferias | null>(null)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [feriasRes, colsRes] = await Promise.all([
      supabase.from('ferias').select('*').order('vencimento', { ascending: true }),
      supabase.from('colaboradores').select('*').order('nome'),
    ])
    if (feriasRes.error) toast.error('Erro ao carregar férias: ' + feriasRes.error.message)
    setFerias((feriasRes.data || []) as Ferias[])
    setColaboradores((colsRes.data || []) as Colaborador[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const nomeDe = useCallback((id: string | null) =>
    colaboradores.find(c => c.id === id)?.nome || 'Colaborador', [colaboradores])

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (f: Ferias) => {
    setEditing(f)
    setForm({
      colaborador_id: f.colaborador_id || '',
      periodo_aquisitivo_inicio: f.periodo_aquisitivo_inicio || '',
      periodo_aquisitivo_fim: f.periodo_aquisitivo_fim || '',
      vencimento: f.vencimento || '',
      gozo_programado: f.gozo_programado || '',
      dias: String(f.dias ?? 30),
      status: f.status || 'pendente',
    })
    setShowModal(true)
  }

  const setInicioAquisitivo = (value: string) => {
    setForm(p => ({
      ...p,
      periodo_aquisitivo_inicio: value,
      // Período aquisitivo = 12 meses; vencimento = fim do período concessivo (12 meses depois)
      periodo_aquisitivo_fim: p.periodo_aquisitivo_fim || (value ? addYears(value, 1, true) : ''),
      vencimento: p.vencimento || (value ? addYears(value, 2, true) : ''),
    }))
  }

  const handleSave = async () => {
    if (!form.colaborador_id || !form.periodo_aquisitivo_inicio || !form.periodo_aquisitivo_fim) {
      toast.error('Preencha colaborador e período aquisitivo.')
      return
    }
    setSaving(true)
    const payload = {
      colaborador_id: form.colaborador_id,
      periodo_aquisitivo_inicio: form.periodo_aquisitivo_inicio,
      periodo_aquisitivo_fim: form.periodo_aquisitivo_fim,
      vencimento: form.vencimento || null,
      gozo_programado: form.gozo_programado || null,
      dias: Number(form.dias) || 30,
      status: form.gozo_programado && form.status === 'pendente' ? 'programada' : form.status,
    }
    const { error } = editing
      ? await supabase.from('ferias').update(payload).eq('id', editing.id)
      : await supabase.from('ferias').insert(payload)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar férias: ' + error.message); return }
    toast.success(editing ? 'Férias atualizadas.' : 'Férias lançadas.')
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este registro de férias?')) return
    await supabase.from('ferias').delete().eq('id', id)
    toast.success('Registro excluído.')
    fetchData()
  }

  const feriasComVencimento = useMemo(() => ferias.map(f => {
    const diasVenc = daysUntil(f.vencimento)
    const vencida = f.status !== 'gozada' && diasVenc != null && diasVenc < 0
    const proxima = f.status !== 'gozada' && diasVenc != null && diasVenc >= 0 && diasVenc <= 30
    return { ...f, diasVenc, vencida, proxima }
  }), [ferias])

  const stats = useMemo(() => {
    const anoAtual = String(new Date().getFullYear())
    return {
      vencidas: feriasComVencimento.filter(f => f.vencida).length,
      vencendo30: feriasComVencimento.filter(f => f.proxima).length,
      programadas: ferias.filter(f => f.status === 'programada').length,
      gozadasAno: ferias.filter(f => f.status === 'gozada' && (f.gozo_programado || '').startsWith(anoAtual)).length,
    }
  }, [ferias, feriasComVencimento])

  const filtradas = feriasComVencimento.filter(f =>
    !search || nomeDe(f.colaborador_id).toLowerCase().includes(search.toLowerCase()))

  const statusBadge = (f: typeof feriasComVencimento[number]) => {
    if (f.status === 'gozada') return <Badge variant="green">Gozada</Badge>
    if (f.vencida) return <Badge variant="red">Vencida</Badge>
    if (f.status === 'programada') return <Badge variant="blue">Programada</Badge>
    if (f.proxima) return <Badge variant="yellow">Vence em {f.diasVenc}d</Badge>
    return <Badge variant="gray">Pendente</Badge>
  }

  const tabela = (items: typeof feriasComVencimento) => (
    <div className="overflow-x-auto">
      <table className="data-table">
        <thead>
          <tr>
            <th>Colaborador</th>
            <th>Período aquisitivo</th>
            <th>Vencimento</th>
            <th>Gozo programado</th>
            <th>Dias</th>
            <th>Status</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {items.map(f => (
            <tr key={f.id} className="cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => openEdit(f)}>
              <td className="font-medium text-gray-900">{nomeDe(f.colaborador_id)}</td>
              <td className="text-gray-500 text-sm">{formatDate(f.periodo_aquisitivo_inicio)} — {formatDate(f.periodo_aquisitivo_fim)}</td>
              <td className="text-gray-500 text-sm">{f.vencimento ? formatDate(f.vencimento) : '—'}</td>
              <td className="text-gray-500 text-sm">{f.gozo_programado ? formatDate(f.gozo_programado) : '—'}</td>
              <td className="text-gray-500 text-sm">{f.dias}</td>
              <td>{statusBadge(f)}</td>
              <td onClick={e => e.stopPropagation()}>
                <button onClick={() => handleDelete(f.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                  <Trash2 size={15} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )

  return (
    <Layout title="Provisão de Férias" subtitle="Gestão e programação de férias dos colaboradores">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Com Férias Vencidas" value={loading ? '—' : String(stats.vencidas)} icon={<AlertTriangle size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Vencendo em 30 dias" value={loading ? '—' : String(stats.vencendo30)} icon={<AlertTriangle size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Programadas" value={loading ? '—' : String(stats.programadas)} icon={<Calendar size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title="Gozadas (ano)" value={loading ? '—' : String(stats.gozadasAno)} icon={<CheckCircle size={20} className="text-green-600" />} iconBg="bg-green-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Tabs
            tabs={[
              { label: 'Relatório', value: 'relatorio' },
              { label: 'Gestão por Vencimento', value: 'vencimento' },
              { label: 'Programação', value: 'programacao' },
            ]}
            value={tab}
            onChange={v => setTab(v as FeriasTab)}
          />
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16} />
            Programar Férias
          </button>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar colaborador..." />
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">Carregando...</div>
          ) : tab === 'relatorio' ? (
            filtradas.length === 0 ? (
              <EmptyState icon={<Calendar size={32} />} title="Nenhum dado de férias" description="Lance os períodos aquisitivos dos colaboradores em 'Programar Férias'."
                action={<button className="btn-primary" onClick={openNew}><Plus size={16} />Programar Férias</button>} />
            ) : tabela(filtradas)
          ) : tab === 'vencimento' ? (
            (() => {
              const comVencimento = [...filtradas].filter(f => f.status !== 'gozada').sort((a, b) => (a.diasVenc ?? 9999) - (b.diasVenc ?? 9999))
              return comVencimento.length === 0 ? (
                <EmptyState icon={<AlertTriangle size={32} />} title="Nenhum vencimento no momento" description="Os alertas de vencimento aparecem conforme os períodos lançados." />
              ) : (
                <div>
                  <div className="flex gap-2 mb-4">
                    <span className="badge badge-red px-3 py-1">Vencidas</span>
                    <span className="badge badge-yellow px-3 py-1">Próximas do vencimento (30 dias)</span>
                    <span className="badge badge-blue px-3 py-1">No prazo</span>
                  </div>
                  {tabela(comVencimento)}
                </div>
              )
            })()
          ) : (
            (() => {
              const programadas = filtradas.filter(f => f.status === 'programada')
              return programadas.length === 0 ? (
                <EmptyState icon={<Calendar size={32} />} title="Nenhuma férias programada" description="Programe as férias dos colaboradores clicando em 'Programar Férias'."
                  action={<button className="btn-primary" onClick={openNew}><Plus size={16} />Programar Férias</button>} />
              ) : tabela(programadas)
            })()
          )}
        </div>
      </div>

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Férias' : 'Programar Férias'}>
        <div className="space-y-4">
          <div>
            <label className="label" htmlFor="ferias-colaborador">Colaborador *</label>
            <select id="ferias-colaborador" className="input" value={form.colaborador_id} onChange={e => setForm(p => ({ ...p, colaborador_id: e.target.value }))}>
              <option value="">Selecione o colaborador</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ferias-aquisitivo-inicio">Período Aquisitivo — Início *</label>
              <input id="ferias-aquisitivo-inicio" className="input" type="date" value={form.periodo_aquisitivo_inicio} onChange={e => setInicioAquisitivo(e.target.value)} />
            </div>
            <div>
              <label className="label" htmlFor="ferias-aquisitivo-fim">Período Aquisitivo — Fim *</label>
              <input id="ferias-aquisitivo-fim" className="input" type="date" value={form.periodo_aquisitivo_fim} onChange={e => setForm(p => ({ ...p, periodo_aquisitivo_fim: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ferias-vencimento">Vencimento (limite p/ gozo)</label>
              <input id="ferias-vencimento" className="input" type="date" value={form.vencimento} onChange={e => setForm(p => ({ ...p, vencimento: e.target.value }))} />
            </div>
            <div>
              <label className="label" htmlFor="ferias-status">Status</label>
              <select id="ferias-status" className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as Ferias['status'] }))}>
                <option value="pendente">Pendente</option>
                <option value="programada">Programada</option>
                <option value="gozada">Gozada</option>
                <option value="vencida">Vencida</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="ferias-gozo">Início do Gozo</label>
              <input id="ferias-gozo" className="input" type="date" value={form.gozo_programado} onChange={e => setForm(p => ({ ...p, gozo_programado: e.target.value }))} />
            </div>
            <div>
              <label className="label" htmlFor="ferias-dias">Nº de Dias</label>
              <input id="ferias-dias" className="input" type="number" min="1" max="30" value={form.dias} onChange={e => setForm(p => ({ ...p, dias: e.target.value }))} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Salvar'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
