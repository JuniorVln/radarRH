import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Rss, Plus, Heart, MessageCircle, Share2, Image } from 'lucide-react'
import { EmptyState, Modal, Avatar } from '../components/ui'

export function FeedRHPage() {
  const [showNovo, setShowNovo] = useState(false)
  const [form, setForm] = useState({ conteudo: '' })

  return (
    <Layout title="Feed RH" subtitle="Publicações e novidades do time de Recursos Humanos">
      <div className="max-w-2xl mx-auto">
        {/* Compose */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex items-start gap-3">
            <Avatar name="Admin" size="md" />
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
      </div>

      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Nova Publicação">
        <div className="space-y-4">
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
            <input className="input" placeholder="https://..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          <button className="btn-primary">Publicar</button>
        </div>
      </Modal>
    </Layout>
  )
}
