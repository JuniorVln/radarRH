import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { UserPlus, Plus, Briefcase, Users, Mail, Star } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Tabs, Modal, Avatar } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'

type RecrutamentoTab = 'candidatos' | 'vagas' | 'templates' | 'banco_talentos'

const ETAPAS_KANBAN = [
  { key: 'triagem', label: 'Triagem', color: 'bg-gray-100' },
  { key: 'entrevista_rh', label: 'Entrevista RH', color: 'bg-blue-50' },
  { key: 'entrevista_tecnica', label: 'Entrevista Técnica', color: 'bg-purple-50' },
  { key: 'proposta', label: 'Proposta', color: 'bg-yellow-50' },
  { key: 'contratado', label: 'Contratado', color: 'bg-green-50' },
]

export function RecrutamentoPage() {
  const [tab, setTab] = useState<RecrutamentoTab>('candidatos')
  const [showNovaVaga, setShowNovaVaga] = useState(false)
  const [showNovoTemplate, setShowNovoTemplate] = useState(false)
  const [search, setSearch] = useState('')

  return (
    <Layout title="Recrutamento" subtitle="Gestão de candidatos, vagas e processos seletivos">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Vagas Abertas" value="0" icon={<Briefcase size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Candidatos Ativos" value="0" icon={<Users size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title="Em Processo" value="0" icon={<UserPlus size={20} className="text-purple-600" />} iconBg="bg-purple-100" />
        <StatCard title="Contratados (mês)" value="0" icon={<Star size={20} className="text-green-600" />} iconBg="bg-green-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <Tabs
            tabs={[
              { label: 'Pipeline de Candidatos', value: 'candidatos' },
              { label: 'Vagas', value: 'vagas' },
              { label: 'Templates de Email', value: 'templates' },
              { label: 'Banco de Talentos', value: 'banco_talentos' },
            ]}
            value={tab}
            onChange={v => setTab(v as RecrutamentoTab)}
          />
          <div className="flex gap-2">
            {tab === 'vagas' && (
              <button className="btn-primary" onClick={() => setShowNovaVaga(true)}>
                <Plus size={16} />Nova Vaga
              </button>
            )}
            {tab === 'templates' && (
              <button className="btn-primary" onClick={() => setShowNovoTemplate(true)}>
                <Plus size={16} />Novo Template
              </button>
            )}
            {tab === 'candidatos' && (
              <button className="btn-primary">
                <Plus size={16} />Novo Candidato
              </button>
            )}
          </div>
        </div>

        {/* Kanban — Candidatos */}
        {tab === 'candidatos' && (
          <div className="p-4">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {ETAPAS_KANBAN.map(etapa => (
                <div key={etapa.key} className={`kanban-col flex-shrink-0 ${etapa.color}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-semibold text-gray-700">{etapa.label}</h4>
                    <span className="badge badge-gray text-xs">0</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-center py-8 text-gray-400 text-xs">
                      Nenhum candidato
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Vagas */}
        {tab === 'vagas' && (
          <div className="p-4">
            <EmptyState
              icon={<Briefcase size={32} />}
              title="Nenhuma vaga cadastrada"
              description="Cadastre vagas para iniciar o processo seletivo."
              action={
                <button className="btn-primary" onClick={() => setShowNovaVaga(true)}>
                  <Plus size={16} />Nova Vaga
                </button>
              }
            />
          </div>
        )}

        {/* Templates */}
        {tab === 'templates' && (
          <div className="p-4">
            <EmptyState
              icon={<Mail size={32} />}
              title="Nenhum template criado"
              description="Crie templates de e-mail para comunicar candidatos automaticamente. Use variáveis como {{nome_candidato}}."
              action={
                <button className="btn-primary" onClick={() => setShowNovoTemplate(true)}>
                  <Plus size={16} />Novo Template
                </button>
              }
            />
          </div>
        )}

        {/* Banco de Talentos */}
        {tab === 'banco_talentos' && (
          <div className="p-4">
            <div className="mb-4">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar candidato no banco..." />
            </div>
            <EmptyState
              icon={<Users size={32} />}
              title="Banco de talentos vazio"
              description="Candidatos reprovados ou indicados ficam aqui para futuras oportunidades."
            />
          </div>
        )}
      </div>

      {/* Modal Nova Vaga */}
      <Modal open={showNovaVaga} onClose={() => setShowNovaVaga(false)} title="Nova Vaga" maxWidth="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Título da Vaga *</label>
            <input className="input" placeholder="Ex: Analista de Recursos Humanos" />
          </div>
          <div>
            <label className="label">Setor</label>
            <input className="input" placeholder="Ex: RH" />
          </div>
          <div>
            <label className="label">Nível</label>
            <select className="input">
              <option>Júnior</option><option>Pleno</option><option>Sênior</option><option>Especialista</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo de Contrato</label>
            <select className="input">
              <option>CLT</option><option>Estagiário</option><option>PJ</option>
            </select>
          </div>
          <div>
            <label className="label">Modelo de Trabalho</label>
            <select className="input">
              <option>Presencial</option><option>Híbrido</option><option>Remoto</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Descrição</label>
            <textarea className="input h-24 resize-none" placeholder="Descrição da vaga..." />
          </div>
          <div className="col-span-2">
            <label className="label">Requisitos</label>
            <textarea className="input h-20 resize-none" placeholder="Ex: Graduação em Administração, 2 anos de experiência..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovaVaga(false)}>Cancelar</button>
          <button className="btn-primary">Publicar Vaga</button>
        </div>
      </Modal>

      {/* Modal Template */}
      <Modal open={showNovoTemplate} onClose={() => setShowNovoTemplate(false)} title="Novo Template de Email">
        <div className="space-y-4">
          <div>
            <label className="label">Nome do Template</label>
            <input className="input" placeholder="Ex: Aprovação — Entrevista RH" />
          </div>
          <div>
            <label className="label">Assunto</label>
            <input className="input" placeholder="Ex: Parabéns, {{nome_candidato}}!" />
          </div>
          <div>
            <label className="label">Corpo do Email</label>
            <textarea className="input h-32 resize-none" placeholder="Olá {{nome_candidato}}, ..." />
          </div>
          <p className="text-xs text-gray-400">Variáveis disponíveis: {'{{nome_candidato}}'}, {'{{vaga}}'}, {'{{empresa}}'}, {'{{data}}'}</p>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovoTemplate(false)}>Cancelar</button>
          <button className="btn-primary">Salvar Template</button>
        </div>
      </Modal>
    </Layout>
  )
}
