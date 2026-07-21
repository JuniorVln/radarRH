import React, { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Calendar, CheckCircle, Clock, Plus, Save, Target, Trash2 } from 'lucide-react'
import { Avatar, Badge, EmptyState, Modal, Tabs } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import type { Avaliacao, Colaborador, PDI } from '../lib/supabase'
import toast from 'react-hot-toast'

type AvaliacaoTab = 'colaboradores' | 'nine_box' | 'pdi' | 'calendario' | 'relatorios'
type NivelAvaliacao = 1 | 2 | 3
type ColaboradorComAvaliacao = Colaborador & { avaliacao?: Avaliacao | null }
type PDIComColaborador = PDI & { colaborador?: Pick<Colaborador, 'nome' | 'cargo' | 'setor'> }

const EMPTY_CICLO = {
  ciclo: '',
  data_inicio: '',
  data_fim: '',
}

const EMPTY_PDI = {
  colaborador_id: '',
  titulo: '',
  objetivo: '',
  descricao: '',
  data_inicio: '',
  data_fim: '',
  // A constraint do banco só aceita em_andamento/concluido/suspenso
  status: 'em_andamento' as 'em_andamento' | 'concluido' | 'suspenso',
}

const NIVEIS = [
  { value: 1, label: 'Baixo' },
  { value: 2, label: 'Médio' },
  { value: 3, label: 'Alto' },
] as const

const STATUS_AVALIACAO = [
  { value: 'pendente', label: 'Pendente' },
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'atrasado', label: 'Atrasado' },
] as const

const STATUS_PDI = [
  { value: 'em_andamento', label: 'Em andamento' },
  { value: 'concluido', label: 'Concluído' },
  { value: 'suspenso', label: 'Suspenso' },
] as const

function formatDate(value: string | null) {
  if (!value) return 'Sem prazo'
  return new Date(value + 'T00:00:00').toLocaleDateString('pt-BR')
}

function statusVariant(status: Avaliacao['status'] | PDI['status']) {
  if (status === 'concluido') return 'green'
  if (status === 'atrasado' || status === 'suspenso') return 'red'
  if (status === 'em_andamento') return 'blue'
  return 'gray'
}

function getNineBoxCell(potencial: number, desempenho: number) {
  if (potencial === 3 && desempenho === 3) return { title: 'Talento / Estrela', color: 'bg-green-100 border-green-300 text-green-800' }
  if (potencial === 3 && desempenho === 2) return { title: 'Potencial Forte', color: 'bg-green-50 border-green-200 text-green-700' }
  if (potencial === 3 && desempenho === 1) return { title: 'Diamante Bruto', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' }
  if (potencial === 2 && desempenho === 3) return { title: 'Profissional Forte', color: 'bg-green-50 border-green-200 text-green-700' }
  if (potencial === 2 && desempenho === 2) return { title: 'Mantenedor / Key Player', color: 'bg-blue-50 border-blue-200 text-blue-700' }
  if (potencial === 2 && desempenho === 1) return { title: 'Dilema', color: 'bg-yellow-50 border-yellow-200 text-yellow-700' }
  if (potencial === 1 && desempenho === 3) return { title: 'Especialista', color: 'bg-blue-50 border-blue-100 text-blue-600' }
  if (potencial === 1 && desempenho === 2) return { title: 'Eficaz', color: 'bg-gray-50 border-gray-200 text-gray-600' }
  return { title: 'Risco / Insatisfatório', color: 'bg-red-50 border-red-200 text-red-700' }
}

export function AvaliacaoDesempenhoPage() {
  const [tab, setTab] = useState<AvaliacaoTab>('colaboradores')
  const [showNovo, setShowNovo] = useState(false)
  const [showNovoPDI, setShowNovoPDI] = useState(false)
  const [loading, setLoading] = useState(true)
  const [savingCiclo, setSavingCiclo] = useState(false)
  const [savingPDI, setSavingPDI] = useState(false)
  const [colaboradores, setColaboradores] = useState<ColaboradorComAvaliacao[]>([])
  const [pdis, setPdis] = useState<PDIComColaborador[]>([])
  const [formCiclo, setFormCiclo] = useState({ ...EMPTY_CICLO })
  const [formPDI, setFormPDI] = useState({ ...EMPTY_PDI })

  const fetchData = async () => {
    setLoading(true)
    // O banco em produção não tem as FKs necessárias para o join embutido do
    // PostgREST (colaboradores→avaliacoes/pdis); o vínculo é feito aqui no cliente.
    const [colsRes, avalRes, pdiRes] = await Promise.all([
      supabase.from('colaboradores').select('*').eq('status', 'ativo').order('nome'),
      supabase.from('avaliacoes').select('*'),
      supabase.from('pdis').select('*').order('criado_em', { ascending: false }),
    ])

    if (colsRes.error) toast.error('Erro ao carregar colaboradores: ' + colsRes.error.message)

    const cols = (colsRes.data || []) as Colaborador[]
    const avaliacoesAll = (avalRes.data || []) as Avaliacao[]

    const processed: ColaboradorComAvaliacao[] = cols.map(c => {
      const doColaborador = avaliacoesAll
        .filter(a => a.colaborador_id === c.id)
        .sort((a, b) => String(b.criado_em).localeCompare(String(a.criado_em)))
      return { ...c, avaliacao: doColaborador[0] || null }
    })
    setColaboradores(processed)

    const pdisComColaborador: PDIComColaborador[] = ((pdiRes.data || []) as PDI[]).map(p => {
      const c = cols.find(c => c.id === p.colaborador_id)
      return { ...p, colaborador: c ? { nome: c.nome, cargo: c.cargo, setor: c.setor } : undefined }
    })
    setPdis(pdisComColaborador)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const avaliacoes = useMemo(() => colaboradores.map(c => c.avaliacao).filter(Boolean) as Avaliacao[], [colaboradores])
  const ciclosAtivos = useMemo(() => new Set(avaliacoes.filter(a => a.status !== 'concluido').map(a => a.ciclo)).size, [avaliacoes])
  const conclusao = colaboradores.length === 0
    ? 0
    : Math.round((avaliacoes.filter(a => a.status === 'concluido').length / colaboradores.length) * 100)

  const stats = {
    conclusao,
    pendentes: avaliacoes.filter(a => a.status === 'pendente').length,
    atrasadas: avaliacoes.filter(a => a.status === 'atrasado').length,
    ciclosAtivos,
  }

  const handleSaveCiclo = async () => {
    if (!formCiclo.ciclo.trim() || !formCiclo.data_inicio || !formCiclo.data_fim) {
      toast.error('Preencha nome, início e encerramento do ciclo.')
      return
    }
    if (colaboradores.length === 0) {
      toast.error('Não há colaboradores ativos para avaliar.')
      return
    }

    setSavingCiclo(true)
    const payload = colaboradores.map(c => ({
      colaborador_id: c.id,
      ciclo: formCiclo.ciclo.trim(),
      data_inicio: formCiclo.data_inicio,
      data_fim: formCiclo.data_fim,
      status: 'pendente',
      nota: null,
      desempenho: null,
      potencial: null,
    }))
    const { error } = await supabase.from('avaliacoes').insert(payload)
    setSavingCiclo(false)

    if (error) {
      toast.error('Erro ao criar ciclo: ' + error.message)
      return
    }

    toast.success('Ciclo criado para colaboradores ativos.')
    setFormCiclo({ ...EMPTY_CICLO })
    setShowNovo(false)
    fetchData()
  }

  const updateAvaliacao = async (colaborador: ColaboradorComAvaliacao, patch: Partial<Avaliacao>) => {
    if (colaborador.avaliacao?.id) {
      const { error } = await supabase.from('avaliacoes').update(patch).eq('id', colaborador.avaliacao.id)
      if (error) toast.error('Erro ao atualizar avaliação.')
      else fetchData()
      return
    }

    const today = new Date().toISOString().slice(0, 10)
    const { error } = await supabase.from('avaliacoes').insert({
      colaborador_id: colaborador.id,
      ciclo: 'Avaliação manual',
      data_inicio: today,
      data_fim: today,
      status: 'em_andamento',
      nota: null,
      desempenho: null,
      potencial: null,
      ...patch,
    })
    if (error) toast.error('Erro ao criar avaliação.')
    else fetchData()
  }

  const handleSavePDI = async () => {
    if (!formPDI.colaborador_id || !formPDI.titulo.trim() || !formPDI.objetivo.trim() || !formPDI.data_inicio) {
      toast.error('Preencha colaborador, título, objetivo e início.')
      return
    }

    setSavingPDI(true)
    // A tabela pdis não tem coluna "objetivo"; ele é guardado em metas (jsonb).
    const { error } = await supabase.from('pdis').insert({
      colaborador_id: formPDI.colaborador_id,
      titulo: formPDI.titulo.trim(),
      metas: { objetivo: formPDI.objetivo.trim() },
      descricao: formPDI.descricao || null,
      data_inicio: formPDI.data_inicio,
      data_fim: formPDI.data_fim || null,
      status: formPDI.status,
    })
    setSavingPDI(false)

    if (error) {
      toast.error('Erro ao salvar PDI: ' + error.message)
      return
    }

    toast.success('PDI criado.')
    setFormPDI({ ...EMPTY_PDI })
    setShowNovoPDI(false)
    fetchData()
  }

  return (
    <Layout title="Avaliação de Desempenho" subtitle="Ciclos de avaliação, Nine Box e planos de desenvolvimento">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Taxa de Conclusão" value={loading ? <div className="h-8 w-12 skeleton" /> : `${stats.conclusao}%`} icon={<CheckCircle size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Avaliações Pendentes" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.pendentes)} icon={<Clock size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Avaliações Atrasadas" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.atrasadas)} icon={<Target size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Ciclos Ativos" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.ciclosAtivos)} icon={<Target size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { label: 'Colaboradores', value: 'colaboradores' },
              { label: 'Nine Box', value: 'nine_box' },
              { label: 'PDI', value: 'pdi' },
              { label: 'Calendário', value: 'calendario' },
              { label: 'Relatórios', value: 'relatorios' },
            ]}
            value={tab}
            onChange={v => setTab(v as AvaliacaoTab)}
          />
          <div className="flex gap-2">
            {tab === 'pdi' && (
              <button className="btn-primary" onClick={() => setShowNovoPDI(true)}>
                <Plus size={16} />
                Novo PDI
              </button>
            )}
            <button className="btn-primary" onClick={() => setShowNovo(true)}>
              <Plus size={16} />
              Novo Ciclo
            </button>
          </div>
        </div>

        <div className="p-4">
          {tab === 'colaboradores' && (
            <div className="animate-fade-in">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3, 4].map(i => <div key={i} className="h-14 w-full skeleton" />)}
                </div>
              ) : colaboradores.length === 0 ? (
                <EmptyState icon={<Target size={32} />} title="Nenhum colaborador ativo" description="Cadastre colaboradores ativos para iniciar avaliações." />
              ) : (
                <div className="overflow-x-auto">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Colaborador</th>
                        <th>Ciclo</th>
                        <th>Status</th>
                        <th>Nota</th>
                        <th>Desempenho</th>
                        <th>Potencial</th>
                      </tr>
                    </thead>
                    <tbody>
                      {colaboradores.map(c => (
                        <tr key={c.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <Avatar name={c.nome} photo={c.foto_url} size="sm" />
                              <div>
                                <p className="font-medium text-gray-900">{c.nome}</p>
                                <p className="text-xs text-gray-400">{c.cargo} · {c.setor}</p>
                              </div>
                            </div>
                          </td>
                          <td className="text-gray-600">{c.avaliacao?.ciclo || 'Sem ciclo'}</td>
                          <td>
                            <select
                              className="input min-w-[130px]"
                              value={c.avaliacao?.status || 'em_andamento'}
                              onChange={e => updateAvaliacao(c, { status: e.target.value as Avaliacao['status'] })}
                            >
                              {STATUS_AVALIACAO.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                            </select>
                          </td>
                          <td>
                            <input
                              key={c.avaliacao?.id || c.id}
                              className="input w-24"
                              type="number"
                              min="0"
                              max="10"
                              step="0.1"
                              defaultValue={c.avaliacao?.nota ?? ''}
                              onBlur={e => updateAvaliacao(c, { nota: e.target.value ? Number(e.target.value) : null })}
                            />
                          </td>
                          <td>
                            <select
                              className="input min-w-[110px]"
                              value={c.avaliacao?.desempenho || ''}
                              onChange={e => updateAvaliacao(c, { desempenho: e.target.value ? Number(e.target.value) as NivelAvaliacao : null })}
                            >
                              <option value="">Selecionar</option>
                              {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                            </select>
                          </td>
                          <td>
                            <select
                              className="input min-w-[110px]"
                              value={c.avaliacao?.potencial || ''}
                              onChange={e => updateAvaliacao(c, { potencial: e.target.value ? Number(e.target.value) as NivelAvaliacao : null })}
                            >
                              <option value="">Selecionar</option>
                              {NIVEIS.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {tab === 'nine_box' && (
            <div className="animate-fade-in">
              <div className="grid grid-cols-3 grid-rows-3 gap-2 min-h-[560px] border-2 border-gray-100 p-2 bg-gray-50 rounded-lg">
                {[3, 2, 1].map(pot => (
                  [1, 2, 3].map(des => {
                    const items = colaboradores.filter(c => c.avaliacao?.potencial === pot && c.avaliacao?.desempenho === des)
                    const cell = getNineBoxCell(pot, des)
                    return (
                      <div key={`${pot}-${des}`} className={`border rounded-lg p-2 overflow-y-auto transition-all hover:shadow-inner ${cell.color}`}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <p className="text-[10px] font-bold uppercase opacity-80">{cell.title}</p>
                          <Badge variant="gray" size="sm">{items.length}</Badge>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {items.map(c => (
                            <div key={c.id} title={`${c.nome} · nota ${c.avaliacao?.nota ?? '-'}`} className="w-8 h-8 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px] font-bold border-2 border-white shadow-sm cursor-help">
                              {c.nome.split(' ').map(n => n[0]).join('').slice(0, 2)}
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })
                ))}
              </div>
              <div className="flex justify-between mt-4 px-2">
                <span className="text-xs font-bold text-gray-400">DESEMPENHO →</span>
                <span className="text-xs font-bold text-gray-400">POTENCIAL ↑</span>
              </div>
              {avaliacoes.filter(a => a.potencial && a.desempenho).length === 0 && (
                <p className="text-xs text-gray-400 text-center mt-3">
                  Preencha desempenho e potencial na aba Colaboradores para alimentar o Nine Box.
                </p>
              )}
            </div>
          )}

          {tab === 'pdi' && (
            <div className="animate-fade-in">
              {pdis.length === 0 ? (
                <EmptyState icon={<Target size={32} />} title="Nenhum PDI cadastrado" description="Crie Planos de Desenvolvimento Individual para acompanhar ações por colaborador." />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {pdis.map(p => (
                    <div key={p.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition bg-white">
                      <div className="flex justify-between items-start mb-3 gap-3">
                        <div>
                          <h4 className="font-bold text-gray-900">{p.titulo}</h4>
                          <p className="text-sm text-indigo-600 font-medium">{p.colaborador?.nome || 'Colaborador'}</p>
                        </div>
                        <Badge variant={statusVariant(p.status)}>{STATUS_PDI.find(s => s.value === p.status)?.label || p.status}</Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{p.metas?.objetivo || ''}</p>
                      {p.descricao && (
                        <div className="bg-gray-50 p-2 rounded text-xs text-gray-600 mb-3">
                          {p.descricao}
                        </div>
                      )}
                      <div className="flex items-center justify-between text-xs text-gray-500 border-t border-gray-100 pt-3">
                        <span>{formatDate(p.data_inicio)} - {formatDate(p.data_fim)}</span>
                        <div className="flex items-center gap-2">
                          <select
                            className="text-[11px] bg-transparent border-none focus:ring-0 text-gray-500 cursor-pointer"
                            value={p.status}
                            onChange={async (e) => {
                              const { error } = await supabase.from('pdis').update({ status: e.target.value }).eq('id', p.id)
                              if (error) toast.error('Erro ao atualizar status.')
                              else fetchData()
                            }}
                          >
                            {STATUS_PDI.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                          <button
                            onClick={async () => {
                              if (confirm('Excluir este PDI?')) {
                                await supabase.from('pdis').delete().eq('id', p.id)
                                fetchData()
                              }
                            }}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Excluir PDI"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500">Com Nine Box</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{avaliacoes.filter(a => a.potencial && a.desempenho).length}</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500">PDIs ativos</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{pdis.filter(p => p.status === 'planejado' || p.status === 'em_andamento').length}</p>
              </div>
              <div className="border border-gray-200 rounded-xl p-4">
                <p className="text-sm text-gray-500">Nota média</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {avaliacoes.some(a => a.nota != null)
                    ? (avaliacoes.reduce((sum, a) => sum + (a.nota || 0), 0) / avaliacoes.filter(a => a.nota != null).length).toFixed(1)
                    : '-'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <Modal open={showNovoPDI} onClose={() => setShowNovoPDI(false)} title="Novo PDI">
        <div className="space-y-4">
          <div>
            <label className="label">Colaborador *</label>
            <select className="input" value={formPDI.colaborador_id} onChange={e => setFormPDI(p => ({ ...p, colaborador_id: e.target.value }))}>
              <option value="">Selecione um colaborador</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Título *</label>
            <input className="input" placeholder="Ex: Desenvolvimento de liderança" value={formPDI.titulo} onChange={e => setFormPDI(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Objetivo *</label>
            <input className="input" placeholder="Ex: Preparar para coordenação de equipe" value={formPDI.objetivo} onChange={e => setFormPDI(p => ({ ...p, objetivo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Ações previstas</label>
            <textarea className="input h-24 resize-none" placeholder="Ex: Curso, mentoria, acompanhamento mensal..." value={formPDI.descricao} onChange={e => setFormPDI(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Início *</label>
              <input className="input" type="date" value={formPDI.data_inicio} onChange={e => setFormPDI(p => ({ ...p, data_inicio: e.target.value }))} />
            </div>
            <div>
              <label className="label">Fim previsto</label>
              <input className="input" type="date" value={formPDI.data_fim} onChange={e => setFormPDI(p => ({ ...p, data_fim: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={formPDI.status} onChange={e => setFormPDI(p => ({ ...p, status: e.target.value as typeof formPDI.status }))}>
              {STATUS_PDI.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovoPDI(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSavePDI} disabled={savingPDI}>
            <Save size={16} />
            {savingPDI ? 'Salvando...' : 'Salvar PDI'}
          </button>
        </div>
      </Modal>

      <Modal open={showNovo} onClose={() => setShowNovo(false)} title="Novo Ciclo de Avaliação">
        <div className="space-y-4">
          <div>
            <label className="label">Nome do ciclo *</label>
            <input className="input" placeholder="Ex: Avaliação 1º Semestre 2026" value={formCiclo.ciclo} onChange={e => setFormCiclo(p => ({ ...p, ciclo: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Data de início *</label>
              <input className="input" type="date" value={formCiclo.data_inicio} onChange={e => setFormCiclo(p => ({ ...p, data_inicio: e.target.value }))} />
            </div>
            <div>
              <label className="label">Data de encerramento *</label>
              <input className="input" type="date" value={formCiclo.data_fim} onChange={e => setFormCiclo(p => ({ ...p, data_fim: e.target.value }))} />
            </div>
          </div>
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3 text-sm text-gray-600">
            O ciclo será criado para {colaboradores.length} colaborador(es) ativo(s). Depois, nota, desempenho e potencial podem ser preenchidos na aba Colaboradores.
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovo(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveCiclo} disabled={savingCiclo}>
            <Save size={16} />
            {savingCiclo ? 'Criando...' : 'Criar Ciclo'}
          </button>
        </div>
      </Modal>
    </Layout>
  )
}
