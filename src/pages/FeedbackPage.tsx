import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { MessageSquare, Plus, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Modal } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

type FeedbackType = 'PARE' | 'AVANCE' | 'REVEJA'

const PAR_CONFIG = {
  AVANCE: { title: 'Positivo', label: 'Reconhecimento de comportamento ou entrega desejada', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'green' as const },
  REVEJA: { title: 'Neutro', label: 'Alinhamento, acompanhamento ou observação sem criticidade', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'yellow' as const },
  PARE: { title: 'A Melhorar', label: 'Ponto de ajuste com expectativa clara de evolução', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'red' as const },
}

const EMPTY_FORM = {
  colaborador_id: '',
  gestor_nome: '',
  tipo_par: 'AVANCE' as FeedbackType,
  data_feedback: new Date().toISOString().split('T')[0],
  proximo_feedback: '',
  descricao: '',
  status: 'realizado' as 'pendente' | 'realizado' | 'atrasado',
}

type ColabOption = { id: string; nome: string }

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<ColabOption[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<any | null>(null)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [fbRes, colRes] = await Promise.all([
      supabase.from('feedbacks').select('*').order('data_feedback', { ascending: false }),
      supabase.from('colaboradores').select('id, nome').eq('status', 'ativo').order('nome'),
    ])
    if (fbRes.error) toast.error('Erro ao carregar feedbacks.')
    else setFeedbacks(fbRes.data || [])
    if (colRes.data) setColaboradores(colRes.data as ColabOption[])
    setLoading(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const nomeColaborador = (f: any) => {
    const c = colaboradores.find(c => c.id === f.colaborador_id)
    return c?.nome || f.gestor_nome || '—'
  }

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_FORM })
    setShowModal(true)
  }

  const openEdit = (f: any) => {
    setEditing(f)
    setForm({
      colaborador_id: f.colaborador_id || '',
      gestor_nome: f.gestor_nome || '',
      tipo_par: f.tipo_par || 'AVANCE',
      data_feedback: f.data_feedback || '',
      proximo_feedback: f.proximo_feedback || '',
      descricao: f.descricao || '',
      status: f.status || 'realizado',
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.colaborador_id || !form.data_feedback) {
      toast.error('Colaborador e data são obrigatórios.')
      return
    }
    setSaving(true)
    const colabNome = colaboradores.find(c => c.id === form.colaborador_id)?.nome || null
    const payload: any = {
      colaborador_id: form.colaborador_id,
      gestor_nome: form.gestor_nome || colabNome,
      tipo_par: form.tipo_par,
      data_feedback: form.data_feedback,
      proximo_feedback: form.proximo_feedback || null,
      descricao: form.descricao || null,
      status: form.status,
    }
    const { error } = editing
      ? await supabase.from('feedbacks').update(payload).eq('id', editing.id)
      : await supabase.from('feedbacks').insert(payload)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success(editing ? 'Feedback atualizado!' : 'Feedback registrado!')
    setForm({ ...EMPTY_FORM })
    setEditing(null)
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este feedback?')) return
    await supabase.from('feedbacks').delete().eq('id', id)
    toast.success('Feedback excluído.')
    setShowModal(false)
    setEditing(null)
    fetchData()
  }

  const filtered = feedbacks.filter(f =>
    !search || nomeColaborador(f).toLowerCase().includes(search.toLowerCase()) ||
    (f.descricao || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: feedbacks.length,
    emDia: feedbacks.filter(f => f.status === 'realizado').length,
    atrasados: feedbacks.filter(f => f.status === 'atrasado').length,
    pendentes: feedbacks.filter(f => f.status === 'pendente').length,
  }

  return (
    <Layout title="Painel do Feedback" subtitle="Registros Positivo, Neutro e A Melhorar">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Feedbacks Registrados" value={String(stats.total)} icon={<MessageSquare size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Realizados" value={String(stats.emDia)} icon={<CheckCircle size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Atrasados" value={String(stats.atrasados)} icon={<XCircle size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Pendentes" value={String(stats.pendentes)} icon={<Clock size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
      </div>

      {/* Tipos de feedback */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(Object.entries(PAR_CONFIG) as [FeedbackType, typeof PAR_CONFIG.PARE][]).map(([tipo, cfg]) => (
          <div key={tipo} className={`rounded-xl p-4 border ${cfg.bg} ${cfg.border}`}>
            <p className={`text-sm font-bold ${cfg.text}`}>{cfg.title}</p>
            <p className="text-xs text-gray-500 mt-1">{cfg.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex-1 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por colaborador..." />
          </div>
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16} /> Registrar Feedback
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<MessageSquare size={32} />} title="Nenhum feedback registrado" description="Registre o primeiro feedback como Positivo, Neutro ou A Melhorar."
            action={<button className="btn-primary" onClick={openNew}><Plus size={16} />Registrar Feedback</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Tipo</th>
                  <th>Data</th>
                  <th>Próximo Feedback</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id} className="cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => openEdit(f)}>
                    <td className="font-medium text-gray-900">{nomeColaborador(f)}</td>
                    <td>
                      <Badge variant={PAR_CONFIG[f.tipo_par as FeedbackType]?.badge || 'gray'}>{PAR_CONFIG[f.tipo_par as FeedbackType]?.title || f.tipo_par}</Badge>
                    </td>
                    <td className="text-gray-500 text-sm">{formatDate(f.data_feedback)}</td>
                    <td className="text-gray-500 text-sm">{f.proximo_feedback ? formatDate(f.proximo_feedback) : '—'}</td>
                    <td className="text-gray-500 text-sm max-w-xs truncate">{f.descricao || '—'}</td>
                    <td>
                      <Badge variant={f.status === 'realizado' ? 'green' : f.status === 'atrasado' ? 'red' : 'yellow'}>{f.status}</Badge>
                    </td>
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
        )}
      </div>

      {/* Modal criar/editar */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Feedback' : 'Registrar Feedback'}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Colaborador *</label>
              <select className="input" value={form.colaborador_id} onChange={e => setForm(p => ({ ...p, colaborador_id: e.target.value }))}>
                <option value="">Selecione</option>
                {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Gestor / Responsável</label>
              <input className="input" placeholder="Nome do gestor" value={form.gestor_nome} onChange={e => setForm(p => ({ ...p, gestor_nome: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Tipo</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PAR_CONFIG) as FeedbackType[]).map(tipo => {
                const cfg = PAR_CONFIG[tipo]
                const isSelected = form.tipo_par === tipo
                return (
                  <button key={tipo} className={`py-2 rounded-lg text-sm font-medium border transition-all ${isSelected ? `${cfg.bg} ${cfg.text} ${cfg.border} border-2` : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setForm(p => ({ ...p, tipo_par: tipo }))}>
                    {cfg.title}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Data do Feedback *</label>
              <input className="input" type="date" value={form.data_feedback} onChange={e => setForm(p => ({ ...p, data_feedback: e.target.value }))} />
            </div>
            <div>
              <label className="label">Próximo Feedback</label>
              <input className="input" type="date" value={form.proximo_feedback} onChange={e => setForm(p => ({ ...p, proximo_feedback: e.target.value }))} />
            </div>
            <div>
              <label className="label">Status</label>
              <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof form.status }))}>
                <option value="realizado">Realizado</option>
                <option value="pendente">Pendente</option>
                <option value="atrasado">Atrasado</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input h-32 resize-none" placeholder="Descreva o feedback..." value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-between gap-3 mt-5 pt-4 border-t border-gray-100">
          <div>
            {editing && (
              <button className="btn-danger" onClick={() => handleDelete(editing.id)}>
                <Trash2 size={15} /> Excluir
              </button>
            )}
          </div>
          <div className="flex gap-3">
            <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Salvar Feedback'}</button>
          </div>
        </div>
      </Modal>
    </Layout>
  )
}
