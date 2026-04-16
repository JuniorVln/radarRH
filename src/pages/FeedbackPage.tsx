import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { MessageSquare, Plus, CheckCircle, XCircle, Clock } from 'lucide-react'
import { Badge, EmptyState, Avatar, SearchInput, Modal } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { formatDate } from '../lib/utils'

type PARType = 'PARE' | 'AVANCE' | 'REVEJA'

const PAR_COLORS: Record<PARType, string> = {
  PARE: 'red',
  AVANCE: 'green',
  REVEJA: 'yellow',
}

interface NovoFeedbackForm {
  colaborador_nome: string
  tipo_par: PARType
  data_feedback: string
  proximo_feedback: string
  descricao: string
}

export function FeedbackPage() {
  const [search, setSearch] = useState('')
  const [showNovo, setShowNovo] = useState(false)
  const [form, setForm] = useState<NovoFeedbackForm>({
    colaborador_nome: '',
    tipo_par: 'AVANCE',
    data_feedback: '',
    proximo_feedback: '',
    descricao: '',
  })

  return (
    <Layout title="Painel do Feedback" subtitle="Metodologia PAR — Pare, Avance, Reveja">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Feedbacks do Mês" value="0" icon={<MessageSquare size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Em dia" value="0" icon={<CheckCircle size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Atrasados" value="0" icon={<XCircle size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Pendentes" value="0" icon={<Clock size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
      </div>

      {/* Metodologia PAR */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {(['PARE', 'AVANCE', 'REVEJA'] as PARType[]).map(tipo => (
          <div key={tipo} className={`rounded-xl p-4 border ${
            tipo === 'PARE' ? 'bg-red-50 border-red-200' :
            tipo === 'AVANCE' ? 'bg-green-50 border-green-200' :
            'bg-yellow-50 border-yellow-200'
          }`}>
            <p className={`text-sm font-bold ${
              tipo === 'PARE' ? 'text-red-700' :
              tipo === 'AVANCE' ? 'text-green-700' :
              'text-yellow-700'
            }`}>{tipo}</p>
            <p className="text-xs text-gray-500 mt-1">
              {tipo === 'PARE' ? 'O que precisa parar de fazer' :
              tipo === 'AVANCE' ? 'O que continuar e aprimorar' :
              'O que revisar e ajustar'}
            </p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <div className="flex-1 max-w-sm">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar colaborador..." />
          </div>
          <button className="btn-primary" onClick={() => setShowNovo(true)}>
            <Plus size={16} />
            Registrar Feedback
          </button>
        </div>

        <EmptyState
          icon={<MessageSquare size={32} />}
          title="Nenhum feedback registrado"
          description="Registre o primeiro feedback utilizando a metodologia PAR."
          action={
            <button className="btn-primary" onClick={() => setShowNovo(true)}>
              <Plus size={16} />
              Registrar Feedback
            </button>
          }
        />
      </div>

      {/* Modal */}
      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Registrar Feedback PAR">
        <div className="space-y-4">
          <div>
            <label className="label">Colaborador</label>
            <input className="input" placeholder="Nome do colaborador" value={form.colaborador_nome} onChange={e => setForm(p => ({ ...p, colaborador_nome: e.target.value }))} />
          </div>
          <div>
            <label className="label">Tipo (PAR)</label>
            <div className="grid grid-cols-3 gap-2">
              {(['PARE', 'AVANCE', 'REVEJA'] as PARType[]).map(tipo => (
                <button
                  key={tipo}
                  className={`py-2 rounded-lg text-sm font-medium border transition-all ${
                    form.tipo_par === tipo
                      ? tipo === 'PARE' ? 'bg-red-600 text-white border-red-600'
                      : tipo === 'AVANCE' ? 'bg-green-600 text-white border-green-600'
                      : 'bg-yellow-500 text-white border-yellow-500'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => setForm(p => ({ ...p, tipo_par: tipo }))}
                >
                  {tipo}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data do Feedback</label>
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
          <button className="btn-primary">Salvar Feedback</button>
        </div>
      </Modal>
    </Layout>
  )
}
