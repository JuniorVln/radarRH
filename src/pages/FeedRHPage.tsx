import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { Rss, Plus, Heart, Trash2, Image } from 'lucide-react'
import { EmptyState, Modal, Avatar } from '../components/ui'
import { supabase } from '../lib/supabase'
import { formatDate } from '../lib/utils'
import toast from 'react-hot-toast'

const EMPTY = { autor_nome: '', conteudo: '', imagem_url: '' }

export function FeedRHPage() {
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showNovo, setShowNovo] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY })

  const fetchPosts = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('feed_posts')
      .select('*')
      .order('criado_em', { ascending: false })
    if (error) toast.error('Erro ao carregar o feed.')
    else setPosts(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchPosts() }, [fetchPosts])

  const handlePublicar = async () => {
    if (!form.conteudo.trim()) {
      toast.error('Escreva a mensagem da publicação.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('feed_posts').insert({
      autor_nome: form.autor_nome || 'Equipe RH',
      conteudo: form.conteudo.trim(),
      imagem_url: form.imagem_url || null,
    })
    setSaving(false)
    if (error) { toast.error('Erro ao publicar: ' + error.message); return }
    toast.success('Publicação feita!')
    setForm({ ...EMPTY })
    setShowNovo(false)
    fetchPosts()
  }

  const handleCurtir = async (post: any) => {
    const { error } = await supabase.from('feed_posts').update({ curtidas: (post.curtidas || 0) + 1 }).eq('id', post.id)
    if (!error) fetchPosts()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir esta publicação?')) return
    await supabase.from('feed_posts').delete().eq('id', id)
    toast.success('Publicação excluída.')
    fetchPosts()
  }

  return (
    <Layout title="Feed RH" subtitle="Publicações e novidades do time de Recursos Humanos">
      <div className="max-w-2xl mx-auto">
        {/* Compose */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Avatar name="RH" size="md" />
            <div className="flex-1">
              <button
                className="w-full text-left px-4 py-2.5 rounded-lg bg-gray-50 border border-gray-200 text-gray-400 text-sm hover:bg-gray-100 transition-colors"
                onClick={() => setShowNovo(true)}
              >
                Compartilhe uma novidade com a equipe...
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
            <button className="btn-ghost text-xs" onClick={() => setShowNovo(true)}>
              <Image size={14} />
              Foto
            </button>
            <button className="btn-primary ml-auto text-xs" onClick={() => setShowNovo(true)}>
              Publicar
            </button>
          </div>
        </div>

        {/* Feed */}
        {loading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : posts.length === 0 ? (
          <EmptyState
            icon={<Rss size={32} />}
            title="Feed vazio"
            description="Publique novidades, comunicados e conquistas da equipe de RH."
            action={
              <button className="btn-primary" onClick={() => setShowNovo(true)}>
                <Plus size={16} />
                Nova Publicação
              </button>
            }
          />
        ) : (
          <div className="space-y-4">
            {posts.map(p => (
              <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Avatar name={p.autor_nome || 'Equipe RH'} size="md" />
                    <div>
                      <p className="font-semibold text-gray-900 text-sm">{p.autor_nome || 'Equipe RH'}</p>
                      <p className="text-xs text-gray-400">{formatDate(p.criado_em)}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(p.id)} className="text-gray-300 hover:text-red-500 transition p-1">
                    <Trash2 size={15} />
                  </button>
                </div>
                <p className="text-sm text-gray-700 mt-3 whitespace-pre-wrap leading-relaxed">{p.conteudo}</p>
                {p.imagem_url && (
                  <img src={p.imagem_url} alt="" className="mt-3 rounded-lg max-h-96 w-full object-cover" />
                )}
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
                  <button onClick={() => handleCurtir(p)} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-pink-600 transition px-2 py-1 rounded-lg hover:bg-pink-50">
                    <Heart size={16} className={p.curtidas > 0 ? 'fill-pink-500 text-pink-500' : ''} />
                    {p.curtidas || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Nova Publicação">
        <div className="space-y-4">
          <div>
            <label className="label">Autor</label>
            <input className="input" placeholder="Equipe RH" value={form.autor_nome} onChange={e => setForm(p => ({ ...p, autor_nome: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mensagem *</label>
            <textarea
              className="input h-28 resize-none"
              placeholder="O que você quer compartilhar com a equipe?"
              value={form.conteudo}
              onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))}
            />
          </div>
          <div>
            <label className="label">Imagem (URL)</label>
            <input className="input" placeholder="https://..." value={form.imagem_url} onChange={e => setForm(p => ({ ...p, imagem_url: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handlePublicar} disabled={saving}>{saving ? 'Publicando...' : 'Publicar'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
