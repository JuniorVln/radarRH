import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Users, Plus, Filter, Grid, List, BarChart2 } from 'lucide-react'
import { Badge, Modal, EmptyState, Avatar, SearchInput, Tabs } from '../components/ui'
import { TIPO_COLORS, DISC_COLORS, formatDate } from '../lib/utils'
import type { Colaborador } from '../lib/supabase'
import { NovoColaboradorModal } from '../components/modals/NovoColaboradorModal'
import { NineBoxModal } from '../components/modals/NineBoxModal'
import { AnaliseComportamentalModal } from '../components/modals/AnaliseComportamentalModal'
import { useNavigate } from 'react-router-dom'

type ViewMode = 'table' | 'grid'

const MOCK_COLABORADORES: Colaborador[] = []

export function ColaboradoresPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showNovo, setShowNovo] = useState(false)
  const [showNineBox, setShowNineBox] = useState(false)
  const [showAnalise, setShowAnalise] = useState(false)
  const [filterTipo, setFilterTipo] = useState('todos')
  const [filterSetor, setFilterSetor] = useState('todos')

  const colaboradores = MOCK_COLABORADORES.filter(c => {
    if (search && !c.nome.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTipo !== 'todos' && c.tipo !== filterTipo) return false
    if (filterSetor !== 'todos' && c.setor !== filterSetor) return false
    return true
  })

  const totals = {
    total: MOCK_COLABORADORES.filter(c => c.status === 'ativo').length,
    clt: MOCK_COLABORADORES.filter(c => c.tipo === 'CLT').length,
    estagiario: MOCK_COLABORADORES.filter(c => c.tipo === 'Estagiário').length,
    terceiro: MOCK_COLABORADORES.filter(c => c.tipo === 'Terceiro' || c.tipo === 'PJ').length,
  }

  return (
    <Layout title="Colaboradores" subtitle="Gestão do quadro de colaboradores">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="stat-card">
          <p className="text-sm text-gray-500">Total Ativos</p>
          <p className="text-3xl font-bold text-gray-900 mt-1">{totals.total}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">CLT</p>
          <p className="text-3xl font-bold text-blue-600 mt-1">{totals.clt}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Estagiários</p>
          <p className="text-3xl font-bold text-purple-600 mt-1">{totals.estagiario}</p>
        </div>
        <div className="stat-card">
          <p className="text-sm text-gray-500">Terceiros / PJ</p>
          <p className="text-3xl font-bold text-yellow-600 mt-1">{totals.terceiro}</p>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
          <div className="flex-1 min-w-48">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar colaborador..." />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={filterTipo}
              onChange={e => setFilterTipo(e.target.value)}
              className="input py-2 text-sm w-auto pr-8"
            >
              <option value="todos">Todos os tipos</option>
              <option value="CLT">CLT</option>
              <option value="Estagiário">Estagiário</option>
              <option value="Terceiro">Terceiro</option>
              <option value="PJ">PJ</option>
            </select>

            <button
              className="btn-secondary"
              onClick={() => setShowNineBox(true)}
            >
              <Grid size={16} />
              Nine Box
            </button>

            <button
              className="btn-secondary"
              onClick={() => setShowAnalise(true)}
            >
              <BarChart2 size={16} />
              Análise Comportamental
            </button>

            <button
              className="btn-primary"
              onClick={() => setShowNovo(true)}
            >
              <Plus size={16} />
              Novo Colaborador
            </button>
          </div>

          {/* View toggle */}
          <div className="flex border border-gray-200 rounded-lg overflow-hidden">
            <button
              className={`p-2 ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
              onClick={() => setViewMode('table')}
            >
              <List size={16} />
            </button>
            <button
              className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`}
              onClick={() => setViewMode('grid')}
            >
              <Grid size={16} />
            </button>
          </div>
        </div>

        {/* Table */}
        {colaboradores.length === 0 ? (
          <EmptyState
            icon={<Users size={32} />}
            title="Nenhum colaborador cadastrado"
            description="Adicione o primeiro colaborador clicando no botão acima."
            action={
              <button className="btn-primary" onClick={() => setShowNovo(true)}>
                <Plus size={16} />
                Novo Colaborador
              </button>
            }
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Colaborador</th>
                  <th>Cargo</th>
                  <th>Setor</th>
                  <th>Célula</th>
                  <th>Tipo</th>
                  <th>DISC</th>
                  <th>Admissão</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {colaboradores.map(c => (
                  <tr
                    key={c.id}
                    className="cursor-pointer"
                    onClick={() => navigate(`/colaboradores/${c.id}`)}
                  >
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={c.nome} photo={c.foto_url} size="sm" />
                        <div>
                          <p className="font-medium text-gray-900">{c.nome}</p>
                          <p className="text-xs text-gray-400">{c.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-gray-600">{c.cargo}</td>
                    <td className="text-gray-600">{c.setor}</td>
                    <td>
                      {c.celula ? <Badge variant="purple">{c.celula}</Badge> : <span className="text-gray-300">—</span>}
                    </td>
                    <td>
                      <Badge variant={c.tipo === 'CLT' ? 'blue' : c.tipo === 'Estagiário' ? 'purple' : 'yellow'}>
                        {c.tipo}
                      </Badge>
                    </td>
                    <td>
                      {c.perfil_disc ? (
                        <span
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold"
                          style={{ backgroundColor: DISC_COLORS[c.perfil_disc] }}
                        >
                          {c.perfil_disc}
                        </span>
                      ) : <span className="text-gray-300">—</span>}
                    </td>
                    <td className="text-gray-500 text-sm">{formatDate(c.data_admissao)}</td>
                    <td>
                      <Badge variant={c.status === 'ativo' ? 'green' : 'red'}>
                        {c.status}
                      </Badge>
                    </td>
                    <td>
                      <button
                        className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                        onClick={e => { e.stopPropagation(); navigate(`/colaboradores/${c.id}`) }}
                      >
                        Ver →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <NovoColaboradorModal open={showNovo} onClose={() => setShowNovo(false)} onSave={() => setShowNovo(false)} />
      <NineBoxModal open={showNineBox} onClose={() => setShowNineBox(false)} colaboradores={colaboradores} />
      <AnaliseComportamentalModal open={showAnalise} onClose={() => setShowAnalise(false)} colaboradores={colaboradores} />
    </Layout>
  )
}
