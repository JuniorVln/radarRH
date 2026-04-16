import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { MessageSquare, Plus, CheckCircle, XCircle, Clock, Trash2 } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Modal } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

type PARType = 'PARE' | 'AVANCE' | 'REVEJA'

const PAR_CONFIG = {
  PARE: { label: 'O que precisa parar de fazer', bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'red' as const },
  AVANCE: { label: 'O que continuar e aprimorar', bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'green' as const },
  REVEJA: { label: 'O que revisar e ajustar', bg: 'bg-yellow-50', border: 'border-yellow-200', text: 'text-yellow-700', badge: 'yellow' as const },
}

const EMPTY_FORM = {
  colaborador_nome: '',
  gestor_nome: '',
  tipo_par: 'AVANCE' as PARType,
  data_feedback: new Date().toISOString().split('T')[0],
  proximo_feedback: '',
  descricao: '',
}

export function FeedbackPage() {
  const [feedbacks, setFeedbacks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNovo, setShowNovo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_FORM })

  const fetchFeedbacks = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('feedbacks')
      .select('*')
      .order('data_feedback', { ascending: false })
    if (error) toast.error('Erro ao carregar feedbacks.')
    else setFeedbacks(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchFeedbacks() }, [fetchFeedbacks])

  const handleSave = async () => {
    if (!form.colaborador_nome.trim() || !form.data_feedback) {
      toast.error('Colaborador e data são obrigatórios.')
      return
    }
    setSaving(true)
    const payload: any = {
      tipo_par: form.tipo_par,
      data_feedback: form.data_feedback,
      descricao: form.descricao || null,
      status: 'realizado',
    }
    // Armazena nome do colaborador no campo gestor_nome como workaround
    // (feedbacks não tem campo texto direto de nome de colaborador sem FK)
    // Por simplicidade usamos gestor_nome para colaborador e descricao para detalhe
    payload.gestor_nome = form.colaborador_nome
    if (form.gestor_nome) payload.descricao = `Gestor: ${form.gestor_nome}\n\n${form.descricao}`
    if (form.proximo_feedback) payload.proximo_feedback = form.proximo_feedback

    // Tenta buscar colaborador por nome para preencher FK
    const { data: colabs } = await supabase
      .from('colaboradores')
      .select('id')
      .ilike('nome', `%${form.colaborador_nome}%`)
      .limit(1)

    if (colabs && colabs.length > 0) {
      payload.colaborador_id = colabs[0].id
    }

    const { error } = await supabase.from('feedbacks').insert(payload)
    setSaving(false)
    if (error) { toast.error('Erro ao salvar: ' + error.message); return }
    toast.success('Feedback registrado!')
    setForm({ ...EMPTY_FORM })
    setShowNovo(false)
    fetchFeedbacks()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('feedbacks').delete().eq('id', id)
    toast.success('Feedback excluído.')
    fetchFeedbacks()
  }

  const filtered = feedbacks.filter(f =>
    !search || (f.gestor_nome || '').toLowerCase().includes(search.toLowerCase()) ||
    (f.descricao || '').toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    total: feedbacks.length,
    emDia: feedbacks.filter(f => f.status === 'realizado').length,
    atrasados: feedbacks.filter(f => f.status === 'atrasado').length,
    pendentes: feedbacks.filter(f => f.status === 'pendente').length,
  }

  return (
    <Layout title="Painel do Feedback" subtitle="Metodologia PAR — Pare, Avance, Reveja">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Feedbacks Registrados" value={String(stats.total)} icon={<MessageSquare size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Realizados" value={String(stats.emDia)} icon={<CheckCircle size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Atrasados" value={String(stats.atrasados)} icon={<XCircle size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Pendentes" value={String(stats.pendentes)} icon={<Clock size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
      </div>

      {/* Metodologia PAR */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(Object.entries(PAR_CONFIG) as [PARType, typeof PAR_CONFIG.PARE][]).map(([tipo, cfg]) => (
          <div key={tipo} className={`rounded-xl p-4 border ${cfg.bg} ${cfg.border}`}>
            <p className={`text-sm font-bold ${cfg.text}`}>{tipo}</p>
            <p className="text-xs text-gray-500 mt-1">{cfg.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex-1 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar por colaborador..." />
          </div>
          <button className="btn-primary" onClick={() => setShowNovo(true)}>
            <Plus size={16} /> Registrar Feedback
          </button>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<MessageSquare size={32} />} title="Nenhum feedback registrado" description="Registre o primeiro feedback utilizando a metodologia PAR."
            action={<button className="btn-primary" onClick={() => setShowNovo(true)}><Plus size={16} />Registrar Feedback</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Tipo (PAR)</th>
                  <th>Data</th>
                  <th>Próximo Feedback</th>
                  <th>Descrição</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(f => (
                  <tr key={f.id}>
                    <td className="font-medium text-gray-900">{f.gestor_nome || '—'}</td>
                    <td>
                      <Badge variant={PAR_CONFIG[f.tipo_par as PARType]?.badge || 'gray'}>{f.tipo_par}</Badge>
                    </td>
                    <td className="text-gray-500 text-sm">{formatDate(f.data_feedback)}</td>
                    <td className="text-gray-500 text-sm">{f.proximo_feedback ? formatDate(f.proximo_feedback) : '—'}</td>
                    <td className="text-gray-500 text-sm max-w-xs truncate">{f.descricao || '—'}</td>
                    <td>
                      <Badge variant={f.status === 'realizado' ? 'green' : f.status === 'atrasado' ? 'red' : 'yellow'}>{f.status}</Badge>
                    </td>
                    <td>
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

      {/* Modal */}
      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Registrar Feedback PAR">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Colaborador *</label>
              <input className="input" placeholder="Nome do colaborador" value={form.colaborador_nome} onChange={e => setForm(p => ({ ...p, colaborador_nome: e.target.value }))} />
            </div>
            <div>
              <label className="label">Gestor / Responsável</label>
              <input className="input" placeholder="Nome do gestor" value={form.gestor_nome} onChange={e => setForm(p => ({ ...p, gestor_nome: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Tipo (PAR)</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PAR_CONFIG) as PARType[]).map(tipo => {
                const cfg = PAR_CONFIG[tipo]
                const isSelected = form.tipo_par === tipo
                return (
                  <button key={tipo} className={`py-2 rounded-lg text-sm font-medium border transition-all ${isSelected ? `${cfg.bg} ${cfg.text} ${cfg.border} border-2` : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'}`}
                    onClick={() => setForm(p => ({ ...p, tipo_par: tipo }))}>
                    {tipo}
                  </button>
                )
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data do Feedback *</label>
              <input className="input" type="date" value={form.data_feedback} onChange={e => setForm(p => ({ ...p, data_feedback: e.target.value }))} />
            </div>
            <div>
              <label className="label">Próximo Feedback</label>
              <input className="input" type="date" value={form.proximo_feedback} onChange={e => setForm(p => ({ ...p, proximo_feedback: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input h-24 resize-none" placeholder="Descreva o feedback..." value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Feedback'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
