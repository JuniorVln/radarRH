import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { Users, Plus, Grid, List, BarChart2, Trash2, Pencil } from 'lucide-react'
import { Badge, Modal, EmptyState, Avatar, SearchInput } from '../components/ui'
import { DISC_COLORS, formatDate } from '../lib/utils'
import type { Colaborador } from '../lib/supabase'
import { supabase } from '../lib/supabase'
import { NovoColaboradorModal } from '../components/modals/NovoColaboradorModal'
import { NineBoxModal } from '../components/modals/NineBoxModal'
import { AnaliseComportamentalModal } from '../components/modals/AnaliseComportamentalModal'
import toast from 'react-hot-toast'

type ViewMode = 'table' | 'grid'

export function ColaboradoresPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [viewMode, setViewMode] = useState<ViewMode>('table')
  const [showNovo, setShowNovo] = useState(false)
  const [showNineBox, setShowNineBox] = useState(false)
  const [showAnalise, setShowAnalise] = useState(false)
  const [filterTipo, setFilterTipo] = useState('todos')
  const [confirmDelete, setConfirmDelete] = useState<Colaborador | null>(null)

  const fetchColaboradores = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('colaboradores')
      .select('*')
      .order('nome')
    if (error) toast.error('Erro ao carregar colaboradores.')
    else setColaboradores(data || [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchColaboradores() }, [fetchColaboradores])

  const handleDelete = async (c: Colaborador) => {
    const { error } = await supabase.from('colaboradores').delete().eq('id', c.id)
    if (error) toast.error('Erro ao excluir.')
    else { toast.success('Colaborador excluído.'); fetchColaboradores() }
    setConfirmDelete(null)
  }

  const filtered = colaboradores.filter(c => {
    if (search && !c.nome.toLowerCase().includes(search.toLowerCase())) return false
    if (filterTipo !== 'todos' && c.tipo !== filterTipo) return false
    return true
  })

  const totals = {
    total: colaboradores.filter(c => c.status === 'ativo').length,
    clt: colaboradores.filter(c => c.tipo === 'CLT').length,
    estagiario: colaboradores.filter(c => c.tipo === 'Estagiário').length,
    terceiro: colaboradores.filter(c => c.tipo === 'Terceiro' || c.tipo === 'PJ').length,
  }

  return (
    <Layout title="Colaboradores" subtitle="Gestão do quadro de colaboradores">
      <div className="animate-fade-in">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="stat-card">
            <p className="text-sm text-gray-500">Total Ativos</p>
            {loading ? <div className="h-9 w-12 skeleton mt-1" /> : <p className="text-3xl font-bold text-gray-900 mt-1">{totals.total}</p>}
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500">CLT</p>
            {loading ? <div className="h-9 w-12 skeleton mt-1" /> : <p className="text-3xl font-bold text-blue-600 mt-1">{totals.clt}</p>}
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500">Estagiários</p>
            {loading ? <div className="h-9 w-12 skeleton mt-1" /> : <p className="text-3xl font-bold text-purple-600 mt-1">{totals.estagiario}</p>}
          </div>
          <div className="stat-card">
            <p className="text-sm text-gray-500">Terceiros / PJ</p>
            {loading ? <div className="h-9 w-12 skeleton mt-1" /> : <p className="text-3xl font-bold text-yellow-600 mt-1">{totals.terceiro}</p>}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center gap-3 p-4 border-b border-gray-100">
            <div className="flex-1 min-w-48">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar colaborador..." />
            </div>
            <div className="flex items-center gap-2">
              <select value={filterTipo} onChange={e => setFilterTipo(e.target.value)} className="input py-2 text-sm w-auto pr-8">
                <option value="todos">Todos os tipos</option>
                <option value="CLT">CLT</option>
                <option value="Estagiário">Estagiário</option>
                <option value="Terceiro">Terceiro</option>
                <option value="PJ">PJ</option>
              </select>
              <button className="btn-secondary" onClick={() => setShowNineBox(true)}>
                <Grid size={16} /> Nine Box
              </button>
              <button className="btn-secondary" onClick={() => setShowAnalise(true)}>
                <BarChart2 size={16} /> Análise DISC
              </button>
              <button className="btn-primary" onClick={() => setShowNovo(true)}>
                <Plus size={16} /> Novo Colaborador
              </button>
            </div>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button className={`p-2 ${viewMode === 'table' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`} onClick={() => setViewMode('table')}><List size={16} /></button>
              <button className={`p-2 ${viewMode === 'grid' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-400 hover:bg-gray-50'}`} onClick={() => setViewMode('grid')}><Grid size={16} /></button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-12 w-full skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              icon={<Users size={32} />}
              title="Nenhum colaborador encontrado"
              description={search ? 'Tente ajustar o filtro.' : 'Adicione o primeiro colaborador clicando no botão acima.'}
              action={!search && (
                <button className="btn-primary" onClick={() => setShowNovo(true)}>
                  <Plus size={16} /> Novo Colaborador
                </button>
              )}
            />
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
              {filtered.map(c => (
                <div key={c.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow text-center">
                  <div className="flex justify-center mb-3"><Avatar name={c.nome} photo={c.foto_url} size="lg" /></div>
                  <p className="font-semibold text-gray-900 text-sm">{c.nome}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{c.cargo}</p>
                  <p className="text-xs text-gray-400">{c.setor}</p>
                  <div className="flex items-center justify-center gap-2 mt-3">
                    <Badge variant={c.tipo === 'CLT' ? 'blue' : c.tipo === 'Estagiário' ? 'purple' : 'yellow'}>{c.tipo}</Badge>
                    {c.perfil_disc && (
                      <span className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: DISC_COLORS[c.perfil_disc] }}>{c.perfil_disc}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
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
                  {filtered.map(c => (
                    <tr key={c.id}>
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
                      <td>{c.celula ? <Badge variant="purple">{c.celula}</Badge> : <span className="text-gray-300">—</span>}</td>
                      <td>
                        <Badge variant={c.tipo === 'CLT' ? 'blue' : c.tipo === 'Estagiário' ? 'purple' : 'yellow'}>{c.tipo}</Badge>
                      </td>
                      <td>
                        {c.perfil_disc ? (
                          <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: DISC_COLORS[c.perfil_disc] }}>{c.perfil_disc}</span>
                        ) : <span className="text-gray-300">—</span>}
                      </td>
                      <td className="text-gray-500 text-sm">{formatDate(c.data_admissao)}</td>
                      <td>
                        <Badge variant={c.status === 'ativo' ? 'green' : 'red'}>{c.status}</Badge>
                      </td>
                      <td>
                        <button onClick={() => setConfirmDelete(c)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 transition">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modais */}
      <NovoColaboradorModal open={showNovo} onClose={() => setShowNovo(false)} onSaved={fetchColaboradores} />
      <NineBoxModal open={showNineBox} onClose={() => setShowNineBox(false)} colaboradores={filtered} />
      <AnaliseComportamentalModal open={showAnalise} onClose={() => setShowAnalise(false)} colaboradores={filtered} />

      {/* Confirm Delete */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Excluir Colaborador">
        <p className="text-gray-600">Tem certeza que deseja excluir <strong>{confirmDelete?.nome}</strong>? Esta ação não pode ser desfeita.</p>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setConfirmDelete(null)}>Cancelar</button>
          <button className="btn-danger" onClick={() => confirmDelete && handleDelete(confirmDelete)}>Excluir</button>
        </div>
      </Modal>
    </Layout>
  )
}
