import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { Bell, Plus, X, Trash2 } from 'lucide-react'
import { EmptyState, Modal, Badge } from '../components/ui'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

const EMPTY = { titulo: '', conteudo: '', autor_nome: '', data_expiracao: '' }

export function MuralRecadosPage() {
  const [recados, setRecados] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovo, setShowNovo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })

  const fetchRecados = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('recados')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) toast.error('Erro ao carregar recados.')
    else setRecados(data || [])
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
    }
    if (form.autor_nome) payload.autor_nome = form.autor_nome
    if (form.data_expiracao) payload.data_expiracao = form.data_expiracao

    const { error } = await supabase.from('recados').insert(payload)
    setSaving(false)
    if (error) { toast.error('Erro ao publicar: ' + error.message); return }
    toast.success('Recado publicado!')
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
        <button className="btn-primary" onClick={() => setShowNovo(true)}>
          <Plus size={16} /> Novo Recado
        </button>
      </div>

      {loading ? (
        <div className="py-16 text-center text-gray-400">Carregando...</div>
      ) : recados.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="col-span-full">
            <EmptyState icon={<Bell size={32} />} title="Mural vazio" description="Publique recados e comunicados para toda a equipe aqui."
              action={<button className="btn-primary" onClick={() => setShowNovo(true)}><Plus size={16} />Novo Recado</button>} />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recados.map(r => {
            const expired = r.data_expiracao && r.data_expiracao < hoje
            return (
              <div key={r.id} className={`bg-white border rounded-xl p-5 shadow-sm relative ${expired ? 'opacity-60' : ''}`}>
                <button onClick={() => handleDelete(r.id)} className="absolute top-3 right-3 text-gray-300 hover:text-red-500 transition">
                  <X size={16} />
                </button>
                {expired && <div className="mb-2"><Badge variant="red">Expirado</Badge></div>}
                <h3 className="font-semibold text-gray-900 pr-6">{r.titulo}</h3>
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

      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Novo Recado">
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
            <label className="label">Data de Expiração (opcional)</label>
            <input className="input" type="date" value={form.data_expiracao} onChange={e => setForm(p => ({ ...p, data_expiracao: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">O recado será marcado como expirado após esta data.</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Publicando...' : 'Publicar'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
