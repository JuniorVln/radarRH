import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { BookOpen, Plus, Trash2, Users } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Tabs, Modal, ProgressBar } from '../components/ui'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

type TreinamentosTab = 'trilhas' | 'colaboradores'

const EMPTY_TRILHA = { nome: '', setor: '', descricao: '', status: 'ativo' as const }
const EMPTY_ATRIB = { trilha_id: '', colaborador_nome: '', progresso: '0' }

export function TreinamentosPage() {
  const [tab, setTab] = useState<TreinamentosTab>('trilhas')
  const [trilhas, setTrilhas] = useState<any[]>([])
  const [progresso, setProgresso] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showNova, setShowNova] = useState(false)
  const [showAtrib, setShowAtrib] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_TRILHA })
  const [formAtrib, setFormAtrib] = useState({ ...EMPTY_ATRIB })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [trilhasRes, progRes, colabsRes] = await Promise.all([
      supabase.from('trilhas').select('*').order('nome'),
      supabase.from('trilha_colaborador').select('*').order('atualizad_em', { ascending: false }),
      supabase.from('colaboradores').select('id, nome, setor').order('nome'),
    ])
    if (trilhasRes.data) setTrilhas(trilhasRes.data)
    if (progRes.data) setProgresso(progRes.data)
    if (colabsRes.data) setColaboradores(colabsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSaveTrilha = async () => {
    if (!form.nome.trim()) { toast.error('Nome é obrigatório.'); return }
    setSaving(true)
    const payload: any = { nome: form.nome, descricao: form.descricao || null, status: form.status }
    if (form.setor) payload.setor = form.setor
    const { error } = await supabase.from('trilhas').insert(payload)
    setSaving(false)
    if (error) { toast.error('Erro ao criar trilha: ' + error.message); return }
    toast.success('Trilha criada!')
    setForm({ ...EMPTY_TRILHA })
    setShowNova(false)
    fetchAll()
  }

  const handleAtribuir = async () => {
    if (!formAtrib.trilha_id || !formAtrib.colaborador_nome.trim()) {
      toast.error('Selecione a trilha e o colaborador.')
      return
    }
    // Busca colaborador pelo nome
    const { data: colabs } = await supabase.from('colaboradores').select('id').ilike('nome', `%${formAtrib.colaborador_nome}%`).limit(1)
    if (!colabs || colabs.length === 0) {
      toast.error('Colaborador não encontrado. Verifique o nome.')
      return
    }
    setSaving(true)
    const { error } = await supabase.from('trilha_colaborador').insert({
      trilha_id: formAtrib.trilha_id,
      colaborador_id: colabs[0].id,
      progresso: Number(formAtrib.progresso) || 0,
      status: 'nao_iniciado',
    })
    setSaving(false)
    if (error) { toast.error('Erro: ' + error.message); return }
    toast.success('Trilha atribuída ao colaborador!')
    setFormAtrib({ ...EMPTY_ATRIB })
    setShowAtrib(false)
    fetchAll()
  }

  const handleDeleteTrilha = async (id: string) => {
    await supabase.from('trilhas').delete().eq('id', id)
    toast.success('Trilha excluída.')
    fetchAll()
  }

  const trilhasFiltradas = trilhas.filter(t => !search || t.nome.toLowerCase().includes(search.toLowerCase()))

  // Junta progresso com nomes de trilha e colaborador
  const progressoComNomes = progresso.map(p => ({
    ...p,
    trilhaNome: trilhas.find(t => t.id === p.trilha_id)?.nome || '—',
    colaboradorNome: colaboradores.find(c => c.id === p.colaborador_id)?.nome || '—',
  })).filter(p => !search || p.colaboradorNome.toLowerCase().includes(search.toLowerCase()) || p.trilhaNome.toLowerCase().includes(search.toLowerCase()))

  return (
    <Layout title="Treinamentos" subtitle="Gerenciamento de trilhas de aprendizagem e progresso dos colaboradores">
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { label: 'Gerenciar Trilhas', value: 'trilhas' },
              { label: 'Progresso Colaboradores', value: 'colaboradores' },
            ]}
            value={tab}
            onChange={v => setTab(v as TreinamentosTab)}
          />
          <div className="flex gap-2">
            {tab === 'trilhas' && (
              <button className="btn-primary" onClick={() => setShowNova(true)}>
                <Plus size={16} /> Nova Trilha
              </button>
            )}
            {tab === 'colaboradores' && (
              <button className="btn-primary" onClick={() => setShowAtrib(true)}>
                <Plus size={16} /> Atribuir Trilha
              </button>
            )}
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <SearchInput value={search} onChange={setSearch} placeholder={tab === 'trilhas' ? 'Buscar trilha...' : 'Buscar colaborador ou trilha...'} />
          </div>

          {loading ? (
            <div className="py-16 text-center text-gray-400">Carregando...</div>
          ) : tab === 'trilhas' ? (
            trilhasFiltradas.length === 0 ? (
              <EmptyState icon={<BookOpen size={32} />} title="Nenhuma trilha cadastrada" description="Crie trilhas de aprendizagem para estruturar o desenvolvimento dos colaboradores."
                action={<button className="btn-primary" onClick={() => setShowNova(true)}><Plus size={16} />Nova Trilha</button>} />
            ) : (
              <div className="space-y-3">
                {trilhasFiltradas.map(t => (
                  <div key={t.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:shadow-sm transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{t.nome}</h4>
                        <Badge variant={t.status === 'ativo' ? 'green' : 'gray'}>{t.status}</Badge>
                      </div>
                      {t.setor && <p className="text-sm text-gray-500">{t.setor}</p>}
                      {t.descricao && <p className="text-xs text-gray-400 mt-1">{t.descricao}</p>}
                      <p className="text-xs text-gray-400 mt-2">
                        {progresso.filter(p => p.trilha_id === t.id).length} colaboradores atribuídos
                      </p>
                    </div>
                    <button onClick={() => handleDeleteTrilha(t.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 ml-4">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )
          ) : (
            progressoComNomes.length === 0 ? (
              <EmptyState icon={<Users size={32} />} title="Nenhum progresso registrado" description="Atribua trilhas a colaboradores para acompanhar o progresso."
                action={<button className="btn-primary" onClick={() => setShowAtrib(true)}><Plus size={16} />Atribuir Trilha</button>} />
            ) : (
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Colaborador</th>
                      <th>Trilha</th>
                      <th>Status</th>
                      <th>Progresso</th>
                    </tr>
                  </thead>
                  <tbody>
                    {progressoComNomes.map(p => (
                      <tr key={p.id}>
                        <td className="font-medium text-gray-900">{p.colaboradorNome}</td>
                        <td className="text-gray-600">{p.trilhaNome}</td>
                        <td>
                          <Badge variant={p.status === 'concluido' ? 'green' : p.status === 'em_andamento' ? 'blue' : 'gray'}>
                            {p.status === 'nao_iniciado' ? 'Não iniciado' : p.status === 'em_andamento' ? 'Em andamento' : 'Concluído'}
                          </Badge>
                        </td>
                        <td>
                          <div className="flex items-center gap-2 min-w-32">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-indigo-500 h-2 rounded-full transition-all" style={{ width: `${p.progresso}%` }} />
                            </div>
                            <span className="text-xs text-gray-500 w-10">{p.progresso}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
        </div>
      </div>

      {/* Modal Nova Trilha */}
      <Modal open={showNova} onClose={() => setShowNova(false)} title="Nova Trilha de Treinamento">
        <div className="space-y-4">
          <div>
            <label className="label">Nome da Trilha *</label>
            <input className="input" placeholder="Ex: Onboarding — Departamento Pessoal" value={form.nome} onChange={e => setForm(p => ({ ...p, nome: e.target.value }))} />
          </div>
          <div>
            <label className="label">Setor (opcional)</label>
            <input className="input" placeholder="Ex: DP, RH, Comercial" value={form.setor} onChange={e => setForm(p => ({ ...p, setor: e.target.value }))} />
          </div>
          <div>
            <label className="label">Descrição</label>
            <textarea className="input h-24 resize-none" placeholder="Descreva os objetivos desta trilha..." value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as any }))}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNova(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveTrilha} disabled={saving}>{saving ? 'Salvando...' : 'Criar Trilha'}</button>
        </div>
      </Modal>

      {/* Modal Atribuir Trilha */}
      <Modal open={showAtrib} onClose={() => setShowAtrib(false)} title="Atribuir Trilha ao Colaborador">
        <div className="space-y-4">
          <div>
            <label className="label">Trilha *</label>
            <select className="input" value={formAtrib.trilha_id} onChange={e => setFormAtrib(p => ({ ...p, trilha_id: e.target.value }))}>
              <option value="">Selecione...</option>
              {trilhas.filter(t => t.status === 'ativo').map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Colaborador *</label>
            <input className="input" list="colabs-list" placeholder="Pesquise pelo nome..." value={formAtrib.colaborador_nome} onChange={e => setFormAtrib(p => ({ ...p, colaborador_nome: e.target.value }))} />
            <datalist id="colabs-list">
              {colaboradores.map(c => <option key={c.id} value={c.nome} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Progresso inicial (%)</label>
            <input className="input" type="number" min="0" max="100" value={formAtrib.progresso} onChange={e => setFormAtrib(p => ({ ...p, progresso: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowAtrib(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleAtribuir} disabled={saving}>{saving ? 'Salvando...' : 'Atribuir'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
