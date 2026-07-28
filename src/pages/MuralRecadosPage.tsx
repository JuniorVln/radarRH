import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { Bell, CalendarDays, Plus, X, Trash2 } from 'lucide-react'
import { EmptyState, Modal, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

const EMPTY = { titulo: '', conteudo: '', autor_nome: '', data_evento: '', data_expiracao: '' }

export function MuralRecadosPage() {
  const [recados, setRecados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovo, setShowNovo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })
  const [editing, setEditing] = useState<any | null>(null)

  const openNovo = () => {
    setEditing(null)
    setForm({ ...EMPTY })
    setShowNovo(true)
  }

  const openEdit = (r: any) => {
    setEditing(r)
    setForm({
      titulo: r.titulo || '',
      conteudo: r.conteudo || '',
      autor_nome: r.autor_nome || '',
      data_evento: r.data_evento || '',
      data_expiracao: r.data_expiracao || '',
    })
    setShowNovo(true)
  }

  const fetchRecados = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recados')
      .select('*')
      .order('criado_em', { ascending: false })
    // Evento que ainda vai acontecer sobe pro topo, do mais proximo pro mais distante.
    // O resto (sem data ou ja passado) segue por data de publicacao. Ordenar no cliente
    // porque e uma regra composta que o order() do PostgREST nao expressa.
    const hojeIso = new Date().toISOString().slice(0, 10)
    const ordenados = (data || []).slice().sort((a: any, b: any) => {
      const futuroA = a.data_evento && a.data_evento >= hojeIso
      const futuroB = b.data_evento && b.data_evento >= hojeIso
      if (futuroA && futuroB) return a.data_evento.localeCompare(b.data_evento)
      if (futuroA) return -1
      if (futuroB) return 1
      return 0
    })
    if (error) toast.error('Erro ao carregar recados.')
    else setRecados(ordenados)
    setLoading(false)
  }, [])

  useEffect(() => { fetchRecados() }, [fetchRecados])

  const handleSave = async () => {
    if (!form.titulo.trim() || !form.conteudo.trim()) {
      toast.error('Título e mensagem são obrigatórios.')
      return
    }
    setSaving(true)
    const payload: any = {
      titulo: form.titulo,
      conteudo: form.conteudo,
      autor_nome: form.autor_nome || null,
      data_evento: form.data_evento || null,
      data_expiracao: form.data_expiracao || null,
    }

    const { error } = editing
      ? await supabase.from('recados').update(payload).eq('id', editing.id)
      : await supabase.from('recados').insert(payload)
    setSaving(false)
    if (error) { toast.error('Erro ao publicar: ' + error.message); return }
    toast.success(editing ? 'Recado atualizado!' : 'Recado publicado!')
    setEditing(null)
    setForm({ ...EMPTY })
    setShowNovo(false)
    fetchRecados()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('recados').delete().eq('id', id)
    toast.success('Recado excluído.')
    fetchRecados()
  }

  const hoje = new Date().toISOString().split('T')[0]

  return (
    <Layout title="Mural de Recados" subtitle="Comunicados e recados para a equipe">
      <div className="flex items-center justify-between mb-6">
        <div />
        <button className="btn-primary" onClick={openNovo}>
          <Plus size={16} /> Novo Recado
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Carregando...</div>
      ) : recados.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full">
            <EmptyState icon={<Bell size={32} />} title="Mural vazio" description="Publique recados e comunicados para toda a equipe aqui."
              action={<button className="btn-primary" onClick={openNovo}><Plus size={16} />Novo Recado</button>} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recados.map(r => {
            const expired = r.data_expiracao && r.data_expiracao < hoje
            return (
              <div key={r.id} onClick={() => openEdit(r)} className={`bg-white border rounded-xl p-5 shadow-sm relative cursor-pointer hover:border-indigo-200 transition ${expired ? 'opacity-60' : ''}`}>
                <button onClick={e => { e.stopPropagation(); handleDelete(r.id) }} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition">
                  <X size={16} />
                </button>
                {expired && <div className="mb-2"><Badge variant="red">Expirado</Badge></div>}
                <h3 className="font-semibold text-gray-900 pr-6">{r.titulo}</h3>
                {r.data_evento && (
                  <div className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium ${
                    r.data_evento >= hoje ? 'bg-indigo-50 text-indigo-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <CalendarDays size={13} />
                    {r.data_evento === hoje ? 'Hoje' : formatDate(r.data_evento)}
                  </div>
                )}
                <p className="text-sm text-gray-600 mt-2 leading-relaxed">{r.conteudo}</p>
                <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                  <span className="text-xs text-gray-400">{r.autor_nome || 'Equipe RH'}</span>
                  <span className="text-xs text-gray-400">{formatDate(r.criado_em)}</span>
                </div>
                {r.data_expiracao && (
                  <p className="text-xs text-gray-400 mt-1">Expira em: {formatDate(r.data_expiracao)}</p>
                )}
              </div>
            )
          })}
        </div>
      )}

      <Modal open={showNovo} onClose={() => setShowNovo(false)} title={editing ? 'Editar Recado' : 'Novo Recado'}>
        <div className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input className="input" placeholder="Ex: Atualização de benefícios" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Autor</label>
            <input className="input" placeholder="Nome ou setor" value={form.autor_nome} onChange={e => setForm(p => ({ ...p, autor_nome: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mensagem *</label>
            <textarea className="input h-28 resize-none" placeholder="Digite o recado para a equipe..." value={form.conteudo} onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Data do Evento (opcional)</label>
            <input className="input" type="date" value={form.data_evento} onChange={e => setForm(p => ({ ...p, data_evento: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">Quando o acontecimento é. Eventos futuros aparecem primeiro no mural.</p>
          </div>
          <div>
            <label className="label">Data de Expiração (opcional)</label>
            <input className="input" type="date" value={form.data_expiracao} onChange={e => setForm(p => ({ ...p, data_expiracao: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">O recado será marcado como expirado após esta data.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Publicando...' : editing ? 'Salvar Alterações' : 'Publicar'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
