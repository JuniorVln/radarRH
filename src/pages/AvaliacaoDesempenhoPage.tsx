import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Target, Plus, Calendar, CheckCircle, Clock } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Tabs, Modal } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'

type AvaliacaoTab = 'colaboradores' | 'calendario' | 'relatorios'

export function AvaliacaoDesempenhoPage() {
  const [tab, setTab] = useState<AvaliacaoTab>('colaboradores')
  const [showNovo, setShowNovo] = useState(false)

  return (
    <Layout title="Avaliação de Desempenho" subtitle="Ciclos de avaliação e acompanhamento de performance">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Taxa de Conclusão" value="0%" icon={<CheckCircle size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Avaliações Pendentes" value="0" icon={<Clock size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Avaliações Atrasadas" value="0" icon={<Target size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Ciclos Ativos" value="0" icon={<Target size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { label: 'Colaboradores', value: 'colaboradores' },
              { label: 'Calendário', value: 'calendario' },
              { label: 'Relatórios', value: 'relatorios' },
            ]}
            value={tab}
            onChange={v => setTab(v as AvaliacaoTab)}
          />
          <button className="btn-primary" onClick={() => setShowNovo(true)}>
            <Plus size={16} />
            Novo Ciclo
          </button>
        </div>

        <div className="p-4">
          {tab === 'colaboradores' && (
            <EmptyState
              icon={<Target size={32} />}
              title="Nenhum ciclo de avaliação ativo"
              description="Crie um novo ciclo de avaliação para começar a acompanhar o desempenho dos colaboradores."
              action={
                <button className="btn-primary" onClick={() => setShowNovo(true)}>
                  <Plus size={16} />
                  Novo Ciclo
                </button>
              }
            />
          )}

          {tab === 'calendario' && (
            <div>
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(d => (
                  <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">{d}</div>
                ))}
              </div>
              <EmptyState
                icon={<Calendar size={32} />}
                title="Calendário de avaliações"
                description="As avaliações agendadas aparecerão no calendário."
              />
            </div>
          )}

          {tab === 'relatorios' && (
            <EmptyState
              icon={<Target size={32} />}
              title="Relatórios em breve"
              description="Os relatórios de desempenho estarão disponíveis após os primeiros ciclos de avaliação."
            />
          )}
        </div>
      </div>

      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Novo Ciclo de Avaliação">
        <div className="space-y-4">
          <div>
            <label className="label">Nome do Ciclo *</label>
            <input className="input" placeholder="Ex: Avaliação Q1 2025" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data de Início</label>
              <input className="input" type="date" />
            </div>
            <div>
              <label className="label">Data de Encerramento</label>
              <input className="input" type="date" />
            </div>
          </div>
          <div>
            <label className="label">Colaboradores</label>
            <select className="input">
              <option value="todos">Todos os colaboradores ativos</option>
              <option value="selecionar">Selecionar manualmente</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo de Avaliação</label>
            <select className="input">
              <option>360° (autoavaliação + pares + gestor)</option>
              <option>Gestor → Liderado</option>
              <option>Autoavaliação</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          <button className="btn-primary">Criar Ciclo</button>
        </div>
      </Modal>
    </Layout>
  )
}
