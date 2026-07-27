import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CalendarDays, Clock, Plus, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Layout } from '../components/layout/Layout'
import { Avatar, Badge, EmptyState, Modal, SearchInput } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import type { Colaborador, Ocorrencia } from '../lib/supabase'

type OcorrenciaComColaborador = Ocorrencia & { colaborador?: Pick<Colaborador, 'nome' | 'cargo' | 'foto_url'> | null }

const EMPTY_OCORRENCIA = {
  colaborador_id: '',
  tipo: 'falta' as const,
  data_ocorrencia: '',
  severidade: 'media' as const,
  horas: '',
  descricao: '',
  acao_tomada: '',
  status: 'registrada' as const,
}

function typeVariant(tipo: Ocorrencia['tipo']) {
  if (tipo === 'advertencia') return 'red'
  if (tipo === 'falta' || tipo === 'atraso' || tipo === 'ausencia') return 'yellow'
  if (tipo === 'elogio') return 'green'
  return 'gray'
}

function statusVariant(status: Ocorrencia['status']) {
  if (status === 'resolvida') return 'green'
  if (status === 'em_analise') return 'blue'
  if (status === 'cancelada') return 'gray'
  return 'yellow'
}

export function OcorrenciasPage() {
  const [ocorrencias, setOcorrencias] = useState<OcorrenciaComColaborador[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_OCORRENCIA })
  const [editing, setEditing] = useState<OcorrenciaComColaborador | null>(null)

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_OCORRENCIA })
    setShowModal(true)
  }

  const openEdit = (o: OcorrenciaComColaborador) => {
    setEditing(o)
    setForm({
      colaborador_id: o.colaborador_id || '',
      tipo: o.tipo as typeof EMPTY_OCORRENCIA.tipo,
      data_ocorrencia: o.data_ocorrencia || '',
      severidade: (o.severidade || 'media') as typeof EMPTY_OCORRENCIA.severidade,
      horas: o.horas != null ? String(o.horas) : '',
      descricao: o.descricao || '',
      acao_tomada: o.acao_tomada || '',
      status: o.status as typeof EMPTY_OCORRENCIA.status,
    })
    setShowModal(true)
  }

  const fetchData = async () => {
    setLoading(true)
    // Join client-side: o banco real não tem a FK ocorrencias→colaboradores (embed do PostgREST falha)
    const [ocorrenciasRes, colaboradoresRes] = await Promise.all([
      supabase.from('ocorrencias').select('*').order('data_ocorrencia', { ascending: false }),
      supabase.from('colaboradores').select('*').order('nome'),
    ])
    if (ocorrenciasRes.error) toast.error('Erro ao carregar ocorrências.')
    if (colaboradoresRes.error) toast.error('Erro ao carregar colaboradores.')
    const todosColabs = (colaboradoresRes.data || []) as Colaborador[]
    const byId = new Map(todosColabs.map(c => [c.id, c]))
    setOcorrencias(((ocorrenciasRes.data || []) as Ocorrencia[]).map(o => {
      const c = o.colaborador_id ? byId.get(o.colaborador_id) : undefined
      return { ...o, colaborador: c ? { nome: c.nome, cargo: c.cargo, foto_url: c.foto_url } : null }
    }))
    setColaboradores(todosColabs.filter(c => c.status === 'ativo'))
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const filtered = ocorrencias.filter(o => {
    const term = search.toLowerCase()
    return !term ||
      o.colaborador?.nome.toLowerCase().includes(term) ||
      o.tipo.toLowerCase().includes(term) ||
      o.descricao.toLowerCase().includes(term)
  })

  const stats = useMemo(() => ({
    total: ocorrencias.length,
    abertas: ocorrencias.filter(o => o.status === 'registrada' || o.status === 'em_analise').length,
    faltas: ocorrencias.filter(o => o.tipo === 'falta').length,
    atrasos: ocorrencias.filter(o => o.tipo === 'atraso').length,
  }), [ocorrencias])

  const handleSave = async () => {
    if (!form.colaborador_id || !form.data_ocorrencia || !form.descricao.trim()) {
      toast.error('Preencha colaborador, data e descrição.')
      return
    }

    setSaving(true)
    const payload = {
      colaborador_id: form.colaborador_id,
      tipo: form.tipo,
      data_ocorrencia: form.data_ocorrencia,
      severidade: form.severidade,
      horas: form.horas ? Number(form.horas) : null,
      descricao: form.descricao.trim(),
      acao_tomada: form.acao_tomada || null,
      status: form.status,
    }
    const { error } = editing
      ? await supabase.from('ocorrencias').update(payload).eq('id', editing.id)
      : await supabase.from('ocorrencias').insert({ ...payload, anexo_url: null })
    setSaving(false)

    if (error) {
      toast.error('Erro ao registrar ocorrência: ' + error.message)
      return
    }

    toast.success(editing ? 'Ocorrência atualizada.' : 'Ocorrência registrada.')
    setEditing(null)
    setForm({ ...EMPTY_OCORRENCIA })
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta ocorrência?')) return
    const { error } = await supabase.from('ocorrencias').delete().eq('id', id)
    if (error) toast.error('Erro ao excluir ocorrência.')
    else {
      toast.success('Ocorrência excluída.')
      fetchData()
    }
  }

  return (
    <Layout title="Ocorrências" subtitle="Advertências, faltas, atrasos e ausências">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Registros" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.total)} icon={<AlertTriangle size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Em aberto" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.abertas)} icon={<Clock size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Faltas" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.faltas)} icon={<CalendarDays size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Atrasos" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.atrasos)} icon={<Clock size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por colaborador, tipo ou descrição..." className="flex-1 min-w-[220px] max-w-md" />
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16} />
            Nova Ocorrência
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<AlertTriangle size={32} />} title="Nenhuma ocorrência encontrada" description="Registre faltas, atrasos, ausências e advertências para manter histórico." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Severidade</th>
                  <th>Status</th>
                  <th>Descrição</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => openEdit(o)}>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={o.colaborador?.nome || 'Colaborador'} photo={o.colaborador?.foto_url} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{o.colaborador?.nome || 'Colaborador removido'}</p>
                          <p className="text-xs text-gray-400">{o.colaborador?.cargo || '-'}</p>
                        </div>
                      </div>
                    </td>
                    <td><Badge variant={typeVariant(o.tipo)}>{o.tipo}</Badge></td>
                    <td>{new Date(o.data_ocorrencia + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                    <td>{o.severidade || '-'}</td>
                    <td><Badge variant={statusVariant(o.status)}>{o.status}</Badge></td>
                    <td className="max-w-sm"><p className="line-clamp-2">{o.descricao}</p></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" onClick={() => handleDelete(o.id)}>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Ocorrência' : 'Nova Ocorrência'} maxWidth="max-w-2xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label" htmlFor="ocorrencia-colaborador">Colaborador *</label>
            <select id="ocorrencia-colaborador" className="input" value={form.colaborador_id} onChange={e => setForm(p => ({ ...p, colaborador_id: e.target.value }))}>
              <option value="">Selecione</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ocorrencia-status">Status</label>
            <select id="ocorrencia-status" className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof form.status }))}>
              <option value="registrada">Registrada</option>
              <option value="em_analise">Em análise</option>
              <option value="resolvida">Resolvida</option>
              <option value="cancelada">Cancelada</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ocorrencia-tipo">Tipo</label>
            <select id="ocorrencia-tipo" className="input" value={form.tipo} onChange={e => setForm(p => ({ ...p, tipo: e.target.value as typeof form.tipo }))}>
              <option value="advertencia">Advertência</option>
              <option value="falta">Falta</option>
              <option value="atraso">Atraso</option>
              <option value="ausencia">Ausência</option>
              <option value="elogio">Elogio</option>
              <option value="outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ocorrencia-data">Data *</label>
            <input id="ocorrencia-data" className="input" type="date" value={form.data_ocorrencia} onChange={e => setForm(p => ({ ...p, data_ocorrencia: e.target.value }))} />
          </div>
          <div>
            <label className="label" htmlFor="ocorrencia-severidade">Severidade</label>
            <select id="ocorrencia-severidade" className="input" value={form.severidade} onChange={e => setForm(p => ({ ...p, severidade: e.target.value as typeof form.severidade }))}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className="label" htmlFor="ocorrencia-horas">Horas</label>
            <input id="ocorrencia-horas" className="input" type="number" step="0.25" value={form.horas} onChange={e => setForm(p => ({ ...p, horas: e.target.value }))} placeholder="Ex: 1.5" />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="ocorrencia-descricao">Descrição *</label>
            <textarea id="ocorrencia-descricao" className="input h-24 resize-none" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="label" htmlFor="ocorrencia-acao">Ação tomada</label>
            <textarea id="ocorrencia-acao" className="input h-20 resize-none" value={form.acao_tomada} onChange={e => setForm(p => ({ ...p, acao_tomada: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Registrar'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
