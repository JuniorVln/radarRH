import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { UserPlus, Plus, Briefcase, Users, Mail, Star, Trash2 } from 'lucide-react'
import { Badge, EmptyState, SearchInput, Tabs, Modal, Avatar } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import type { Candidato, Vaga } from '../lib/supabase'
import { maskPhone } from '../lib/masks'
import toast from 'react-hot-toast'

type RecrutamentoTab = 'candidatos' | 'vagas' | 'templates' | 'banco_talentos'

const ETAPAS_KANBAN = [
  { key: 'triagem', label: 'Triagem', color: 'bg-gray-100' },
  { key: 'entrevista_rh', label: 'Entrevista RH', color: 'bg-blue-50' },
  { key: 'entrevista_tecnica', label: 'Entrevista Técnica', color: 'bg-purple-50' },
  { key: 'proposta', label: 'Proposta', color: 'bg-yellow-50' },
  { key: 'contratado', label: 'Contratado', color: 'bg-green-50' },
]

const EMPTY_VAGA = { titulo: '', setor: '', nivel: 'Pleno', tipo_contrato: 'CLT', modelo_trabalho: 'Presencial' as const, descricao: '', requisitos: '' }
const EMPTY_CANDIDATO = { nome: '', email: '', telefone: '', etapa_kanban: 'triagem' as const, vaga_id: '' as any, aderencia_vaga: '' as any }
const EMPTY_TEMPLATE = { nome: '', assunto: '', corpo: '' }

export function RecrutamentoPage() {
  const [tab, setTab] = useState<RecrutamentoTab>('candidatos')
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [templates, setTemplates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  const [showNovaVaga, setShowNovaVaga] = useState(false)
  const [showNovoCandidato, setShowNovoCandidato] = useState(false)
  const [showNovoTemplate, setShowNovoTemplate] = useState(false)
  const [savingVaga, setSavingVaga] = useState(false)
  const [savingCand, setSavingCand] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)

  const [formVaga, setFormVaga] = useState({ ...EMPTY_VAGA })
  const [formCand, setFormCand] = useState({ ...EMPTY_CANDIDATO })
  const [formTemplate, setFormTemplate] = useState({ ...EMPTY_TEMPLATE })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [vagasRes, candidatosRes, templatesRes] = await Promise.all([
      supabase.from('vagas').select('*').order('criado_em', { ascending: false }),
      supabase.from('candidatos').select('*').order('criado_em', { ascending: false }),
      supabase.from('email_templates').select('*').order('criado_em', { ascending: false }),
    ])
    if (vagasRes.data) setVagas(vagasRes.data)
    if (candidatosRes.data) setCandidatos(candidatosRes.data)
    if (templatesRes.data) setTemplates(templatesRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSaveVaga = async () => {
    if (!formVaga.titulo.trim()) { toast.error('Título é obrigatório.'); return }
    setSavingVaga(true)
    const { error } = await supabase.from('vagas').insert({
      titulo: formVaga.titulo,
      setor: formVaga.setor || null,
      nivel: formVaga.nivel,
      tipo_contrato: formVaga.tipo_contrato,
      modelo_trabalho: formVaga.modelo_trabalho,
      descricao: formVaga.descricao || null,
      requisitos: formVaga.requisitos || null,
      status: 'aberta',
    })
    setSavingVaga(false)
    if (error) { toast.error('Erro ao salvar vaga: ' + error.message); return }
    toast.success('Vaga publicada!')
    setFormVaga({ ...EMPTY_VAGA })
    setShowNovaVaga(false)
    fetchAll()
  }

  const handleSaveCandidato = async () => {
    if (!formCand.nome.trim()) { toast.error('Nome é obrigatório.'); return }
    
    if (formCand.email && !formCand.email.includes('@')) {
      toast.error('E-mail inválido.');
      return
    }

    setSavingCand(true)
    const payload: any = {
      nome: formCand.nome,
      etapa_kanban: formCand.etapa_kanban,
    }
    if (formCand.email) payload.email = formCand.email
    if (formCand.telefone) payload.telefone = formCand.telefone
    if (formCand.vaga_id) payload.vaga_id = formCand.vaga_id
    if (formCand.aderencia_vaga) payload.aderencia_vaga = Number(formCand.aderencia_vaga)

    const { error } = await supabase.from('candidatos').insert(payload)
    setSavingCand(false)
    if (error) { toast.error('Erro ao salvar candidato: ' + error.message); return }
    toast.success('Candidato adicionado!')
    setFormCand({ ...EMPTY_CANDIDATO })
    setShowNovoCandidato(false)
    fetchAll()
  }

  const handleSaveTemplate = async () => {
    if (!formTemplate.nome.trim() || !formTemplate.assunto.trim()) { toast.error('Nome e assunto são obrigatórios.'); return }
    setSavingTemplate(true)
    const { error } = await supabase.from('email_templates').insert({
      nome: formTemplate.nome,
      assunto: formTemplate.assunto,
      corpo: formTemplate.corpo,
    })
    setSavingTemplate(false)
    if (error) { toast.error('Erro ao salvar template: ' + error.message); return }
    toast.success('Template salvo!')
    setFormTemplate({ ...EMPTY_TEMPLATE })
    setShowNovoTemplate(false)
    fetchAll()
  }

  const handleMoveCandidato = async (id: string, etapa: string) => {
    const { error } = await supabase.from('candidatos').update({ etapa_kanban: etapa }).eq('id', id)
    if (error) toast.error('Erro ao mover candidato.')
    else fetchAll()
  }

  const handleDeleteVaga = async (id: string) => {
    if (!confirm('Excluir esta vaga permanentemente?')) return
    await supabase.from('vagas').delete().eq('id', id)
    toast.success('Vaga excluída.')
    fetchAll()
  }

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Excluir este template?')) return
    await supabase.from('email_templates').delete().eq('id', id)
    toast.success('Template excluído.')
    fetchAll()
  }

  const candidatosFiltrados = candidatos.filter(c =>
    !search || c.nome.toLowerCase().includes(search.toLowerCase())
  )

  const stats = {
    vagasAbertas: vagas.filter(v => v.status === 'aberta').length,
    candidatosAtivos: candidatos.filter(c => c.etapa_kanban !== 'reprovado' && c.etapa_kanban !== 'contratado').length,
    emProcesso: candidatos.filter(c => ['entrevista_rh', 'entrevista_tecnica', 'proposta'].includes(c.etapa_kanban)).length,
    contratados: candidatos.filter(c => c.etapa_kanban === 'contratado').length,
  }

  return (
    <Layout title="Recrutamento" subtitle="Gestão de candidatos, vagas e processos seletivos">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Vagas Abertas" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.vagasAbertas)} icon={<Briefcase size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Candidatos Ativos" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.candidatosAtivos)} icon={<Users size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title="Em Processo" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.emProcesso)} icon={<UserPlus size={20} className="text-purple-600" />} iconBg="bg-purple-100" />
        <StatCard title="Contratados (total)" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.contratados)} icon={<Star size={20} className="text-green-600" />} iconBg="bg-green-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
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
            {tab === 'vagas' && <button className="btn-primary" onClick={() => setShowNovaVaga(true)}><Plus size={16} />Nova Vaga</button>}
            {tab === 'templates' && <button className="btn-primary" onClick={() => setShowNovoTemplate(true)}><Plus size={16} />Novo Template</button>}
            {tab === 'candidatos' && <button className="btn-primary" onClick={() => setShowNovoCandidato(true)}><Plus size={16} />Novo Candidato</button>}
          </div>
        </div>

        {tab === 'candidatos' && (
          <div className="p-4 animate-fade-in">
            <div className="mb-4 max-w-xs">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar candidato..." />
            </div>
            
            {loading ? (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {ETAPAS_KANBAN.map(etapa => (
                  <div key={etapa.key} className="kanban-col flex-shrink-0 bg-gray-50 border border-gray-100">
                    <div className="h-6 w-24 skeleton mb-4" />
                    <div className="space-y-3">
                      <div className="h-24 w-full skeleton" />
                      <div className="h-24 w-full skeleton" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex gap-4 overflow-x-auto pb-4">
                {ETAPAS_KANBAN.map(etapa => {
                  const cards = candidatosFiltrados.filter(c => c.etapa_kanban === etapa.key)
                  return (
                    <div key={etapa.key} className={`kanban-col flex-shrink-0 ${etapa.color}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-semibold text-gray-700">{etapa.label}</h4>
                        <span className="badge badge-gray text-xs">{cards.length}</span>
                      </div>
                      <div className="space-y-2">
                        {cards.length === 0 ? (
                          <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-200/50 rounded-lg">
                            Nenhum candidato
                          </div>
                        ) : cards.map(c => (
                          <div key={c.id} className="kanban-card group">
                            <div className="flex items-center gap-2 mb-2">
                              <Avatar name={c.nome} size="sm" />
                              <div className="flex-1">
                                <p className="text-sm font-medium text-gray-800 line-clamp-1">{c.nome}</p>
                                <p className="text-[10px] text-gray-400 line-clamp-1">{c.email}</p>
                              </div>
                            </div>
                            {c.aderencia_vaga != null && (
                              <div className="flex items-center gap-1 mb-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-1">
                                  <div className="bg-indigo-500 h-1 rounded-full transition-all duration-1000" style={{ width: `${c.aderencia_vaga}%` }} />
                                </div>
                                <span className="text-[10px] text-gray-500">{c.aderencia_vaga}%</span>
                              </div>
                            )}
                            <div className="flex items-center justify-between mt-1">
                              <select
                                className="input text-[10px] py-0.5 px-1 h-6 w-24 bg-transparent border-gray-200"
                                value={c.etapa_kanban}
                                onChange={e => handleMoveCandidato(c.id, e.target.value)}
                              >
                                {ETAPAS_KANBAN.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                                <option value="reprovado">Reprovado</option>
                              </select>
                              <button onClick={() => {
                                if(confirm('Excluir este candidato?')) {
                                  supabase.from('candidatos').delete().eq('id', c.id).then(() => fetchAll())
                                }
                              }} className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition">
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'vagas' && (
          <div className="p-4 animate-fade-in">
            {vagas.length === 0 ? (
              <EmptyState icon={<Briefcase size={32} />} title="Nenhuma vaga cadastrada" description="Cadastre vagas para iniciar o processo seletivo."
                action={<button className="btn-primary" onClick={() => setShowNovaVaga(true)}><Plus size={16} />Nova Vaga</button>} />
            ) : (
              <div className="space-y-3">
                {vagas.map(v => (
                  <div key={v.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:shadow-sm transition">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900">{v.titulo}</h4>
                        <Badge variant={v.status === 'aberta' ? 'green' : 'gray'}>{v.status}</Badge>
                      </div>
                      <div className="flex gap-3 text-sm text-gray-500">
                        {v.setor && <span>{v.setor}</span>}
                        {v.nivel && <span>· {v.nivel}</span>}
                        {v.tipo_contrato && <span>· {v.tipo_contrato}</span>}
                        {v.modelo_trabalho && <span>· {v.modelo_trabalho}</span>}
                      </div>
                      {v.descricao && <p className="text-xs text-gray-400 mt-1 line-clamp-2">{v.descricao}</p>}
                    </div>
                    <button onClick={() => handleDeleteVaga(v.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 ml-4">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'templates' && (
          <div className="p-4 animate-fade-in">
            {templates.length === 0 ? (
              <EmptyState icon={<Mail size={32} />} title="Nenhum template criado" description="Crie templates de e-mail para comunicar candidatos. Use variáveis como {{nome_candidato}}."
                action={<button className="btn-primary" onClick={() => setShowNovoTemplate(true)}><Plus size={16} />Novo Template</button>} />
            ) : (
              <div className="space-y-3">
                {templates.map(t => (
                  <div key={t.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:shadow-sm transition">
                    <div>
                      <h4 className="font-semibold text-gray-900">{t.nome}</h4>
                      <p className="text-sm text-gray-500 mt-0.5">Assunto: {t.assunto}</p>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2">{t.corpo}</p>
                    </div>
                    <button onClick={() => handleDeleteTemplate(t.id)} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50 ml-4">
                      <Trash2 size={15} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'banco_talentos' && (
          <div className="p-4 animate-fade-in">
            <div className="mb-4">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar candidato no banco..." />
            </div>
            {candidatos.filter(c => c.etapa_kanban === 'reprovado').length === 0 ? (
              <EmptyState icon={<Users size={32} />} title="Banco de talentos vazio" description="Candidatos reprovados ou indicados ficam aqui para futuras oportunidades." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {candidatos.filter(c => c.etapa_kanban === 'reprovado' && (!search || c.nome.toLowerCase().includes(search.toLowerCase()))).map(c => (
                  <div key={c.id} className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                    <Avatar name={c.nome} size="md" />
                    <div>
                      <p className="font-medium text-gray-900">{c.nome}</p>
                      <p className="text-xs text-gray-400">{c.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showNovaVaga} onClose={() => setShowNovaVaga(false)} title="Nova Vaga" maxWidth="max-w-2xl">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="label">Título da Vaga *</label>
            <input className="input" placeholder="Ex: Analista de Recursos Humanos" value={formVaga.titulo} onChange={e => setFormVaga(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Setor</label>
            <input className="input" placeholder="Ex: RH" value={formVaga.setor} onChange={e => setFormVaga(p => ({ ...p, setor: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nível</label>
            <select className="input" value={formVaga.nivel} onChange={e => setFormVaga(p => ({ ...p, nivel: e.target.value }))}>
              <option>Júnior</option><option>Pleno</option><option>Sênior</option><option>Especialista</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo de Contrato</label>
            <select className="input" value={formVaga.tipo_contrato} onChange={e => setFormVaga(p => ({ ...p, tipo_contrato: e.target.value }))}>
              <option>CLT</option><option>Estagiário</option><option>PJ</option>
            </select>
          </div>
          <div>
            <label className="label">Modelo de Trabalho</label>
            <select className="input" value={formVaga.modelo_trabalho} onChange={e => setFormVaga(p => ({ ...p, modelo_trabalho: e.target.value as any }))}>
              <option>Presencial</option><option>Híbrido</option><option>Remoto</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="label">Descrição</label>
            <textarea className="input h-24 resize-none" placeholder="Descrição da vaga..." value={formVaga.descricao} onChange={e => setFormVaga(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="col-span-2">
            <label className="label">Requisitos</label>
            <textarea className="input h-20 resize-none" placeholder="Ex: Graduação em Administração, 2 anos de experiência..." value={formVaga.requisitos} onChange={e => setFormVaga(p => ({ ...p, requisitos: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovaVaga(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveVaga} disabled={savingVaga}>{savingVaga ? 'Salvando...' : 'Publicar Vaga'}</button>
        </div>
      </Modal>

      <Modal open={showNovoCandidato} onClose={() => setShowNovoCandidato(false)} title="Novo Candidato">
        <div className="space-y-4">
          <div>
            <label className="label">Nome *</label>
            <input className="input" placeholder="Nome do candidato" value={formCand.nome} onChange={e => setFormCand(p => ({ ...p, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Email</label>
              <input className="input" type="email" placeholder="email@exemplo.com" value={formCand.email} onChange={e => setFormCand(p => ({ ...p, email: e.target.value }))} />
            </div>
            <div>
              <label className="label">Telefone</label>
              <input className="input" placeholder="(00) 00000-0000" value={formCand.telefone} onChange={e => setFormCand(p => ({ ...p, telefone: maskPhone(e.target.value) }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Vaga</label>
              <select className="input" value={formCand.vaga_id} onChange={e => setFormCand(p => ({ ...p, vaga_id: e.target.value }))}>
                <option value="">Sem vaga específica</option>
                {vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Aderência (%)</label>
              <input className="input" type="number" min="0" max="100" placeholder="0–100" value={formCand.aderencia_vaga} onChange={e => setFormCand(p => ({ ...p, aderencia_vaga: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Etapa Inicial</label>
            <select className="input" value={formCand.etapa_kanban} onChange={e => setFormCand(p => ({ ...p, etapa_kanban: e.target.value as any }))}>
              {ETAPAS_KANBAN.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovoCandidato(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveCandidato} disabled={savingCand}>{savingCand ? 'Salvando...' : 'Adicionar Candidato'}</button>
        </div>
      </Modal>

      <Modal open={showNovoTemplate} onClose={() => setShowNovoTemplate(false)} title="Novo Template de Email">
        <div className="space-y-4">
          <div>
            <label className="label">Nome do Template *</label>
            <input className="input" placeholder="Ex: Aprovação — Entrevista RH" value={formTemplate.nome} onChange={e => setFormTemplate(p => ({ ...p, nome: e.target.value }))} />
          </div>
          <div>
            <label className="label">Assunto *</label>
            <input className="input" placeholder="Ex: Parabéns, {{nome_candidato}}!" value={formTemplate.assunto} onChange={e => setFormTemplate(p => ({ ...p, assunto: e.target.value }))} />
          </div>
          <div>
            <label className="label">Corpo do Email</label>
            <textarea className="input h-32 resize-none" placeholder="Olá {{nome_candidato}}, ..." value={formTemplate.corpo} onChange={e => setFormTemplate(p => ({ ...p, corpo: e.target.value }))} />
          </div>
          <p className="text-xs text-gray-400">Variáveis: {'{{nome_candidato}}'}, {'{{vaga}}'}, {'{{empresa}}'}, {'{{data}}'}</p>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovoTemplate(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveTemplate} disabled={savingTemplate}>{savingTemplate ? 'Salvando...' : 'Salvar Template'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
