import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Bell, Plus, Calendar, X } from 'lucide-react'
import { EmptyState, Modal, Badge } from '../components/ui'
import { formatDate } from '../lib/utils'

export function MuralRecadosPage() {
  const [showNovo, setShowNovo] = useState(false)
  const [form, setForm] = useState({ titulo: '', conteudo: '', data_expiracao: '' })

  return (
    <Layout title="Mural de Recados" subtitle="Comunicados e recados para a equipe">
      <div className="flex items-center justify-between mb-6">
        <div />
        <button className="btn-primary" onClick={() => setShowNovo(true)}>
          <Plus size={16} />
          Novo Recado
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="col-span-full">
          <EmptyState
            icon={<Bell size={32} />}
            title="Mural vazio"
            description="Publique recados e comunicados para toda a equipe aqui."
            action={
              <button className="btn-primary" onClick={() => setShowNovo(true)}>
                <Plus size={16} />
                Novo Recado
              </button>
            }
          />
        </div>
      </div>

      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Novo Recado">
        <div className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input className="input" placeholder="Ex: Atualização de benefícios" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mensagem *</label>
            <textarea className="input h-28 resize-none" placeholder="Digite o recado para a equipe..." value={form.conteudo} onChange={e => setForm(p => ({ ...p, conteudo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Data de Expiração (opcional)</label>
            <input className="input" type="date" value={form.data_expiracao} onChange={e => setForm(p => ({ ...p, data_expiracao: e.target.value }))} />
            <p className="text-xs text-gray-400 mt-1">O recado será removido automaticamente após esta data.</p>
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
