import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Plus, Calendar, AlertTriangle, CheckCircle } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Tabs, Modal } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'

type FeriasTab = 'relatorio' | 'vencimento' | 'programacao'

export function ProvisaoFeriasPage() {
  const [tab, setTab] = useState<FeriasTab>('relatorio')
  const [search, setSearch] = useState('')
  const [showNovo, setShowNovo] = useState(false)

  return (
    <Layout title="Provisão de Férias" subtitle="Gestão e programação de férias dos colaboradores">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Com Férias Vencidas" value="0" icon={<AlertTriangle size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Vencendo em 30 dias" value="0" icon={<AlertTriangle size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Programadas" value="0" icon={<Calendar size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title="Gozadas (ano)" value="0" icon={<CheckCircle size={20} className="text-green-600" />} iconBg="bg-green-100" />
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
          <button className="btn-primary" onClick={() => setShowNovo(true)}>
            <Plus size={16} />
            Programar Férias
          </button>
        </div>

        <div className="p-4">
          {tab === 'relatorio' && (
            <div>
              <div className="mb-4">
                <SearchInput value={search} onChange={setSearch} placeholder="Buscar colaborador..." />
              </div>
              <EmptyState
                icon={<Calendar size={32} />}
                title="Nenhum dado de férias"
                description="As férias serão exibidas conforme os colaboradores forem cadastrados."
              />
            </div>
          )}

          {tab === 'vencimento' && (
            <div className="space-y-3">
              <div className="flex gap-2 mb-4">
                <span className="badge badge-red px-3 py-1">Vencidas</span>
                <span className="badge badge-yellow px-3 py-1">Próximas do vencimento</span>
                <span className="badge badge-blue px-3 py-1">No prazo</span>
              </div>
              <EmptyState
                icon={<AlertTriangle size={32} />}
                title="Nenhum vencimento no momento"
                description="As alertas de vencimento de férias serão exibidos aqui."
              />
            </div>
          )}

          {tab === 'programacao' && (
            <div>
              <EmptyState
                icon={<Calendar size={32} />}
                title="Nenhuma férias programada"
                description="Programe as férias dos colaboradores clicando em 'Programar Férias'."
                action={
                  <button className="btn-primary" onClick={() => setShowNovo(true)}>
                    <Plus size={16} />
                    Programar Férias
                  </button>
                }
              />
            </div>
          )}
        </div>
      </div>

      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Programar Férias">
        <div className="space-y-4">
          <div>
            <label className="label">Colaborador</label>
            <input className="input" placeholder="Selecione o colaborador" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Período Aquisitivo — Início</label>
              <input className="input" type="date" />
            </div>
            <div>
              <label className="label">Período Aquisitivo — Fim</label>
              <input className="input" type="date" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Início do Gozo</label>
              <input className="input" type="date" />
            </div>
            <div>
              <label className="label">Nº de Dias</label>
              <input className="input" type="number" placeholder="30" />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          <button className="btn-primary">Salvar</button>
        </div>
      </Modal>
    </Layout>
  )
}
