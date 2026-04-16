import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { BookOpen, Plus } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Tabs, Modal, ProgressBar } from '../components/ui'

type TreinamentosTab = 'trilhas' | 'colaboradores'

export function TreinamentosPage() {
  const [tab, setTab] = useState<TreinamentosTab>('trilhas')
  const [showNova, setShowNova] = useState(false)
  const [search, setSearch] = useState('')

  return (
    <Layout title="Treinamentos" subtitle="Gerenciamento de trilhas de aprendizagem e progresso dos colaboradores">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Tabs
            tabs={[
              { label: 'Gerenciar Trilhas', value: 'trilhas' },
              { label: 'Gestão de Colaboradores', value: 'colaboradores' },
            ]}
            value={tab}
            onChange={v => setTab(v as TreinamentosTab)}
          />
          {tab === 'trilhas' && (
            <button className="btn-primary" onClick={() => setShowNova(true)}>
              <Plus size={16} />
              Nova Trilha
            </button>
          )}
        </div>

        <div className="p-4">
          <div className="mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder={tab === 'trilhas' ? 'Buscar trilha...' : 'Buscar colaborador...'} />
          </div>

          {tab === 'trilhas' && (
            <EmptyState
              icon={<BookOpen size={32} />}
              title="Nenhuma trilha cadastrada"
              description="Crie trilhas de aprendizagem para estruturar o desenvolvimento dos colaboradores."
              action={
                <button className="btn-primary" onClick={() => setShowNova(true)}>
                  <Plus size={16} />
                  Nova Trilha
                </button>
              }
            />
          )}

          {tab === 'colaboradores' && (
            <EmptyState
              icon={<BookOpen size={32} />}
              title="Nenhum progresso registrado"
              description="O progresso dos colaboradores nas trilhas aparecerá aqui."
            />
          )}
        </div>
      </div>

      <Modal open={showNova} onClose={() => setShowNova(false)} title="Nova Trilha de Treinamento">
        <div className="space-y-4">
          <div>
            <label className="label">Nome da Trilha *</label>
            <input className="input" placeholder="Ex: Onboarding — Departamento Pessoal" />
          </div>
          <div>
            <label className="label">Setor (opcional)</label>
            <input className="input" placeholder="Ex: DP, RH, Comercial" />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input h-24 resize-none" placeholder="Descreva os objetivos desta trilha..." />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input">
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNova(false)}>Cancelar</button>
          <button className="btn-primary">Criar Trilha</button>
        </div>
      </Modal>
    </Layout>
  )
}
