import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import {
  Briefcase,
  ClipboardCheck,
  FileCheck,
  Filter,
  Mail,
  MessageCircle,
  Plus,
  Send,
  Star,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react'
import { Avatar, Badge, EmptyState, Modal, SearchInput, Tabs } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import type { Candidato, CandidatoTeste, EmailTemplate, TesteTecnico, Vaga } from '../lib/supabase'
import { formatMoney, maskPhone, parseMoney } from '../lib/masks'
import { Communication } from '../lib/communication'
import toast from 'react-hot-toast'

type RecrutamentoTab = 'candidatos' | 'vagas' | 'templates' | 'banco_talentos' | 'testes'

const ETAPAS_KANBAN = [
  { key: 'triagem', label: 'Triagem', color: 'bg-gray-100' },
  { key: 'entrevista_rh', label: 'Entrevista RH', color: 'bg-blue-50' },
  { key: 'entrevista_tecnica', label: 'Entrevista Técnica', color: 'bg-purple-50' },
  { key: 'proposta', label: 'Proposta', color: 'bg-yellow-50' },
  { key: 'contratado', label: 'Contratado', color: 'bg-green-50' },
] as const

const EMPTY_VAGA = {
  titulo: '',
  setor: '',
  nivel: 'Pleno',
  tipo_contrato: 'CLT',
  modelo_trabalho: 'Presencial' as const,
  descricao: '',
  requisitos: '',
  numero_vagas: 1,
  salario_min: '',
  salario_max: '',
  data_limite: '',
  empresa: '',
  area: '',
  localidade: '',
  prioridade: 'media' as const,
  responsavel: '',
  motivo_abertura: '',
  beneficios: '',
}

const EMPTY_CANDIDATO = {
  nome: '',
  email: '',
  telefone: '',
  etapa_kanban: 'triagem' as const,
  vaga_id: '',
  aderencia_vaga: '',
  area: '',
  observacoes_internas: '',
}

const EMPTY_TEMPLATE = {
  nome: '',
  tipo: 'email' as const,
  assunto: '',
  corpo: '',
}

const EMPTY_TESTE = {
  nome: '',
  area: '',
  tempo_estimado_minutos: '',
  pontuacao_maxima: '100',
  link_externo: '',
  descricao: '',
}

// O banco não tem coluna própria para o link do teste; ele fica anexado à descrição.
const LINK_PREFIX = 'Link: '

function splitDescricaoLink(descricao: string | null): { texto: string; link: string } {
  if (!descricao) return { texto: '', link: '' }
  const match = descricao.match(/\n?Link:\s*(https?:\/\/\S+)\s*$/)
  if (!match) return { texto: descricao, link: '' }
  return { texto: descricao.replace(match[0], '').trim(), link: match[1] }
}

function joinDescricaoLink(texto: string, link: string): string | null {
  const parts = [texto.trim(), link.trim() ? LINK_PREFIX + link.trim() : '']
  const joined = parts.filter(Boolean).join('\n\n')
  return joined || null
}

const EMPTY_CANDIDATO_TESTE = {
  teste_id: '',
  status: 'enviado' as const,
  resultado_score: '',
  observacoes: '',
}

function formatCurrency(value: number | null) {
  if (value == null) return null
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusVagaVariant(status: Vaga['status']) {
  if (status === 'aberta') return 'green'
  if (status === 'pausada') return 'yellow'
  return 'gray'
}

function templateLabel(tipo: EmailTemplate['tipo']) {
  if (tipo === 'whatsapp') return 'WhatsApp'
  if (tipo === 'ambos') return 'Email + WhatsApp'
  return 'Email'
}

export function RecrutamentoPage() {
  const [tab, setTab] = useState<RecrutamentoTab>('candidatos')
  const [vagas, setVagas] = useState<Vaga[]>([])
  const [candidatos, setCandidatos] = useState<Candidato[]>([])
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [testes, setTestes] = useState<TesteTecnico[]>([])
  const [candidatosTestes, setCandidatosTestes] = useState<CandidatoTeste[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [areaFilter, setAreaFilter] = useState('')

  const [showNovaVaga, setShowNovaVaga] = useState(false)
  const [showNovoCandidato, setShowNovoCandidato] = useState(false)
  const [showNovoTemplate, setShowNovoTemplate] = useState(false)
  const [showNovoTeste, setShowNovoTeste] = useState(false)
  const [testeCandidato, setTesteCandidato] = useState<Candidato | null>(null)

  const [savingVaga, setSavingVaga] = useState(false)
  const [savingCand, setSavingCand] = useState(false)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [savingTeste, setSavingTeste] = useState(false)
  const [savingCandidatoTeste, setSavingCandidatoTeste] = useState(false)

  const [formVaga, setFormVaga] = useState({ ...EMPTY_VAGA })
  const [formCand, setFormCand] = useState({ ...EMPTY_CANDIDATO })
  const [formTemplate, setFormTemplate] = useState({ ...EMPTY_TEMPLATE })
  const [formTeste, setFormTeste] = useState({ ...EMPTY_TESTE })
  const [formCandidatoTeste, setFormCandidatoTeste] = useState({ ...EMPTY_CANDIDATO_TESTE })
  const [editingVaga, setEditingVaga] = useState<Vaga | null>(null)
  const [editingTeste, setEditingTeste] = useState<TesteTecnico | null>(null)
  const [editingCand, setEditingCand] = useState<Candidato | null>(null)
  const [statusVaga, setStatusVaga] = useState<Vaga['status']>('aberta')

  const openNovaVaga = () => {
    setEditingVaga(null)
    setFormVaga({ ...EMPTY_VAGA })
    setStatusVaga('aberta')
    setShowNovaVaga(true)
  }

  const openEditVaga = (v: Vaga) => {
    setEditingVaga(v)
    setFormVaga({
      titulo: v.titulo,
      setor: v.setor || '',
      nivel: v.nivel || 'Pleno',
      tipo_contrato: v.tipo_contrato || 'CLT',
      modelo_trabalho: (v.modelo_trabalho || 'Presencial') as typeof EMPTY_VAGA.modelo_trabalho,
      descricao: v.descricao || '',
      requisitos: v.requisitos || '',
      numero_vagas: v.numero_vagas || 1,
      salario_min: formatMoney(v.salario_min),
      salario_max: formatMoney(v.salario_max),
      data_limite: v.data_limite || '',
      empresa: v.empresa || '',
      area: v.area || '',
      localidade: v.localidade || '',
      prioridade: (v.prioridade || 'media') as typeof EMPTY_VAGA.prioridade,
      responsavel: v.responsavel || '',
      motivo_abertura: v.motivo_abertura || '',
      beneficios: v.beneficios || '',
    })
    setStatusVaga(v.status)
    setShowNovaVaga(true)
  }

  const openNovoTeste = () => {
    setEditingTeste(null)
    setFormTeste({ ...EMPTY_TESTE })
    setShowNovoTeste(true)
  }

  const openEditTeste = (t: TesteTecnico) => {
    setEditingTeste(t)
    const { texto, link } = splitDescricaoLink(t.descricao)
    setFormTeste({
      nome: t.nome,
      area: t.area || '',
      tempo_estimado_minutos: t.tempo_estimado_minutos != null ? String(t.tempo_estimado_minutos) : '',
      pontuacao_maxima: t.pontuacao_maxima != null ? String(t.pontuacao_maxima) : '',
      link_externo: link,
      descricao: texto,
    })
    setShowNovoTeste(true)
  }

  const openNovoCandidato = () => {
    setEditingCand(null)
    setFormCand({ ...EMPTY_CANDIDATO })
    setShowNovoCandidato(true)
  }

  const openEditCandidato = (c: Candidato) => {
    setEditingCand(c)
    setFormCand({
      nome: c.nome,
      email: c.email || '',
      telefone: c.telefone || '',
      etapa_kanban: c.etapa_kanban as typeof EMPTY_CANDIDATO.etapa_kanban,
      vaga_id: c.vaga_id || '',
      aderencia_vaga: c.aderencia_vaga != null ? String(c.aderencia_vaga) : '',
      area: c.area || '',
      observacoes_internas: c.observacoes_internas || '',
    })
    setShowNovoCandidato(true)
  }

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [vagasRes, candidatosRes, templatesRes, testesRes, candidatosTestesRes] = await Promise.all([
      supabase.from('vagas').select('*').order('criado_em', { ascending: false }),
      supabase.from('candidatos').select('*').order('criado_em', { ascending: false }),
      supabase.from('email_templates').select('*').order('criado_em', { ascending: false }),
      supabase.from('testes_tecnicos').select('*').order('criado_em', { ascending: false }),
      supabase.from('candidatos_testes').select('*').order('criado_em', { ascending: false }),
    ])

    if (vagasRes.data) setVagas(vagasRes.data as Vaga[])
    if (candidatosRes.data) setCandidatos(candidatosRes.data as Candidato[])
    if (templatesRes.data) setTemplates(templatesRes.data as EmailTemplate[])
    if (testesRes.data) setTestes(testesRes.data as TesteTecnico[])
    if (candidatosTestesRes.data) setCandidatosTestes(candidatosTestesRes.data as CandidatoTeste[])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  const areas = useMemo(() => {
    return Array.from(new Set([
      ...vagas.map(v => v.area),
      ...candidatos.map(c => c.area),
      ...testes.map(t => t.area),
    ].filter(Boolean))).sort() as string[]
  }, [candidatos, testes, vagas])

  const candidatosFiltrados = candidatos.filter(c => {
    const term = search.toLowerCase()
    const vaga = vagas.find(v => v.id === c.vaga_id)
    const matchesSearch = !term ||
      c.nome.toLowerCase().includes(term) ||
      c.email?.toLowerCase().includes(term) ||
      vaga?.titulo.toLowerCase().includes(term)
    const matchesArea = !areaFilter || c.area === areaFilter || vaga?.area === areaFilter
    return matchesSearch && matchesArea
  })

  const candidatosBanco = candidatos
    .filter(c => c.etapa_kanban === 'reprovado' || !c.vaga_id)
    .filter(c => !search || c.nome.toLowerCase().includes(search.toLowerCase()))
    .filter(c => !areaFilter || c.area === areaFilter)

  const bancoPorArea = useMemo(() => {
    return candidatosBanco.reduce<Record<string, Candidato[]>>((acc, candidato) => {
      const key = candidato.area || 'Sem área definida'
      acc[key] = acc[key] || []
      acc[key].push(candidato)
      return acc
    }, {})
  }, [candidatosBanco])

  const stats = {
    vagasAbertas: vagas.filter(v => v.status === 'aberta').length,
    candidatosAtivos: candidatos.filter(c => c.etapa_kanban !== 'reprovado' && c.etapa_kanban !== 'contratado').length,
    emProcesso: candidatos.filter(c => ['entrevista_rh', 'entrevista_tecnica', 'proposta'].includes(c.etapa_kanban)).length,
    testesRegistrados: testes.length,
  }

  const handleSaveVaga = async () => {
    if (!formVaga.titulo.trim()) {
      toast.error('Título é obrigatório.')
      return
    }

    setSavingVaga(true)
    const vagaPayload = {
      titulo: formVaga.titulo.trim(),
      setor: formVaga.setor || null,
      nivel: formVaga.nivel,
      tipo_contrato: formVaga.tipo_contrato,
      modelo_trabalho: formVaga.modelo_trabalho,
      descricao: formVaga.descricao || null,
      requisitos: formVaga.requisitos || null,
      numero_vagas: Number(formVaga.numero_vagas) || 1,
      salario_min: parseMoney(formVaga.salario_min),
      salario_max: parseMoney(formVaga.salario_max),
      data_limite: formVaga.data_limite || null,
      empresa: formVaga.empresa || null,
      area: formVaga.area || null,
      localidade: formVaga.localidade || null,
      prioridade: formVaga.prioridade || null,
      responsavel: formVaga.responsavel || null,
      motivo_abertura: formVaga.motivo_abertura || null,
      beneficios: formVaga.beneficios || null,
      status: statusVaga,
    }
    const { error } = editingVaga
      ? await supabase.from('vagas').update(vagaPayload).eq('id', editingVaga.id)
      : await supabase.from('vagas').insert(vagaPayload)
    setSavingVaga(false)

    if (error) {
      toast.error('Erro ao salvar vaga: ' + error.message)
      return
    }

    toast.success(editingVaga ? 'Vaga atualizada.' : 'Vaga publicada.')
    setEditingVaga(null)
    setFormVaga({ ...EMPTY_VAGA })
    setShowNovaVaga(false)
    fetchAll()
  }

  const handleSaveCandidato = async () => {
    if (!formCand.nome.trim()) {
      toast.error('Nome é obrigatório.')
      return
    }

    if (formCand.email && !formCand.email.includes('@')) {
      toast.error('E-mail inválido.')
      return
    }

    setSavingCand(true)
    const payload = {
      nome: formCand.nome.trim(),
      email: formCand.email || null,
      telefone: formCand.telefone || null,
      vaga_id: formCand.vaga_id || null,
      etapa_kanban: formCand.etapa_kanban,
      aderencia_vaga: formCand.aderencia_vaga ? Number(formCand.aderencia_vaga) : null,
      area: formCand.area || null,
      observacoes_internas: formCand.observacoes_internas || null,
    }
    const { error } = editingCand
      ? await supabase.from('candidatos').update(payload).eq('id', editingCand.id)
      : await supabase.from('candidatos').insert(payload)
    setSavingCand(false)

    if (error) {
      toast.error('Erro ao salvar candidato: ' + error.message)
      return
    }

    toast.success(editingCand ? 'Candidato atualizado.' : 'Candidato adicionado.')
    setEditingCand(null)
    setFormCand({ ...EMPTY_CANDIDATO })
    setShowNovoCandidato(false)
    fetchAll()
  }

  const handleSaveTemplate = async () => {
    if (!formTemplate.nome.trim() || !formTemplate.assunto.trim()) {
      toast.error('Nome e assunto são obrigatórios.')
      return
    }

    setSavingTemplate(true)
    const { error } = await supabase.from('email_templates').insert({
      nome: formTemplate.nome.trim(),
      tipo: formTemplate.tipo,
      assunto: formTemplate.assunto.trim(),
      corpo: formTemplate.corpo,
    })
    setSavingTemplate(false)

    if (error) {
      toast.error('Erro ao salvar template: ' + error.message)
      return
    }

    toast.success('Template salvo.')
    setFormTemplate({ ...EMPTY_TEMPLATE })
    setShowNovoTemplate(false)
    fetchAll()
  }

  const handleSaveTeste = async () => {
    if (!formTeste.nome.trim()) {
      toast.error('Título do teste é obrigatório.')
      return
    }

    setSavingTeste(true)
    const payload = {
      nome: formTeste.nome.trim(),
      area: formTeste.area || null,
      tempo_estimado_minutos: formTeste.tempo_estimado_minutos ? Number(formTeste.tempo_estimado_minutos) : null,
      pontuacao_maxima: formTeste.pontuacao_maxima ? Number(formTeste.pontuacao_maxima) : null,
      descricao: joinDescricaoLink(formTeste.descricao, formTeste.link_externo),
    }
    const { error } = editingTeste
      ? await supabase.from('testes_tecnicos').update(payload).eq('id', editingTeste.id)
      : await supabase.from('testes_tecnicos').insert(payload)
    setSavingTeste(false)

    if (error) {
      toast.error('Erro ao salvar teste: ' + error.message)
      return
    }

    toast.success(editingTeste ? 'Teste atualizado.' : 'Teste técnico registrado.')
    setEditingTeste(null)
    setFormTeste({ ...EMPTY_TESTE })
    setShowNovoTeste(false)
    fetchAll()
  }

  const handleSaveCandidatoTeste = async () => {
    if (!testeCandidato || !formCandidatoTeste.teste_id) {
      toast.error('Selecione um teste.')
      return
    }

    setSavingCandidatoTeste(true)
    const { error } = await supabase.from('candidatos_testes').insert({
      candidato_id: testeCandidato.id,
      teste_id: formCandidatoTeste.teste_id,
      status: formCandidatoTeste.status,
      resultado_score: formCandidatoTeste.resultado_score ? Number(formCandidatoTeste.resultado_score) : null,
      observacoes: formCandidatoTeste.observacoes || null,
    })
    setSavingCandidatoTeste(false)

    if (error) {
      toast.error('Erro ao vincular teste: ' + error.message)
      return
    }

    toast.success('Teste vinculado ao candidato.')
    setTesteCandidato(null)
    setFormCandidatoTeste({ ...EMPTY_CANDIDATO_TESTE })
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

  const handleDeleteTeste = async (id: string) => {
    if (!confirm('Excluir este teste técnico?')) return
    await supabase.from('testes_tecnicos').delete().eq('id', id)
    toast.success('Teste excluído.')
    fetchAll()
  }

  const openWhatsApp = (candidato: Candidato) => {
    if (!candidato.telefone) {
      toast.error('Candidato sem telefone.')
      return
    }

    const template = templates.find(t => t.tipo === 'whatsapp' || t.tipo === 'ambos')
    const vaga = vagas.find(v => v.id === candidato.vaga_id)
    const msg = template
      ? Communication.replaceVariables(template.corpo, {
        name: candidato.nome,
        vaga: vaga?.titulo || 'nossa oportunidade',
        empresa: vaga?.empresa || 'Rede Ideia',
      })
      : `Olá ${candidato.nome}, aqui é da Rede Ideia. Gostaria de falar sobre sua candidatura para a vaga de ${vaga?.titulo || 'nossa oportunidade'}.`
    window.open(Communication.generateWhatsAppLink(candidato.telefone, msg), '_blank')
  }

  const sendEmail = (candidato: Candidato) => {
    if (!candidato.email) {
      toast.error('Candidato sem e-mail.')
      return
    }

    const template = templates.find(t => t.tipo === 'email' || t.tipo === 'ambos')
    const vaga = vagas.find(v => v.id === candidato.vaga_id)
    const subject = template
      ? Communication.replaceVariables(template.assunto, {
        name: candidato.nome,
        vaga: vaga?.titulo || 'nossa oportunidade',
        empresa: vaga?.empresa || 'Rede Ideia',
      })
      : 'Contato - Recrutamento Rede Ideia'
    const body = template
      ? Communication.replaceVariables(template.corpo, {
        name: candidato.nome,
        vaga: vaga?.titulo || 'nossa oportunidade',
        empresa: vaga?.empresa || 'Rede Ideia',
      })
      : `Olá ${candidato.nome}, queremos falar com você sobre ${vaga?.titulo || 'uma oportunidade'} na Rede Ideia.`

    Communication.sendEmail({
      to: candidato.email,
      name: candidato.nome,
      subject,
      body,
      vaga: vaga?.titulo,
      empresa: vaga?.empresa || 'Rede Ideia',
    })
  }

  return (
    <Layout title="Recrutamento" subtitle="Gestão de candidatos, vagas e processos seletivos">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Vagas Abertas" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.vagasAbertas)} icon={<Briefcase size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Candidatos Ativos" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.candidatosAtivos)} icon={<Users size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title="Em Processo" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.emProcesso)} icon={<UserPlus size={20} className="text-purple-600" />} iconBg="bg-purple-100" />
        <StatCard title="Testes Técnicos" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.testesRegistrados)} icon={<ClipboardCheck size={20} className="text-green-600" />} iconBg="bg-green-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { label: 'Pipeline', value: 'candidatos' },
              { label: 'Vagas', value: 'vagas' },
              { label: 'Testes', value: 'testes' },
              { label: 'Templates', value: 'templates' },
              { label: 'Banco de Talentos', value: 'banco_talentos' },
            ]}
            value={tab}
            onChange={v => setTab(v as RecrutamentoTab)}
          />
          <div className="flex gap-2">
            {tab === 'vagas' && <button className="btn-primary" onClick={openNovaVaga}><Plus size={16} />Nova Vaga</button>}
            {tab === 'testes' && <button className="btn-primary" onClick={openNovoTeste}><Plus size={16} />Novo Teste</button>}
            {tab === 'templates' && <button className="btn-primary" onClick={() => setShowNovoTemplate(true)}><Plus size={16} />Novo Template</button>}
            {tab === 'candidatos' && <button className="btn-primary" onClick={openNovoCandidato}><Plus size={16} />Novo Candidato</button>}
          </div>
        </div>

        {(tab === 'candidatos' || tab === 'banco_talentos') && (
          <div className="p-4 border-b border-gray-100 flex flex-wrap gap-3">
            <SearchInput value={search} onChange={setSearch} placeholder="Buscar candidato ou vaga..." className="min-w-[220px] flex-1 max-w-md" />
            <div className="relative w-56">
              <Filter size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <select className="input pl-9" value={areaFilter} onChange={e => setAreaFilter(e.target.value)}>
                <option value="">Todas as áreas</option>
                {areas.map(area => <option key={area} value={area}>{area}</option>)}
              </select>
            </div>
          </div>
        )}

        {tab === 'candidatos' && (
          <div className="p-4 animate-fade-in">
            <div className="flex gap-4 overflow-x-auto pb-4">
              {ETAPAS_KANBAN.map(etapa => {
                const cards = candidatosFiltrados.filter(c => c.etapa_kanban === etapa.key)
                return (
                  <div key={etapa.key} className={`kanban-col flex-shrink-0 ${etapa.color}`}>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-gray-700">{etapa.label}</h4>
                      <Badge variant="gray" size="sm">{cards.length}</Badge>
                    </div>
                    <div className="space-y-2">
                      {loading ? (
                        <>
                          <div className="h-24 w-full skeleton" />
                          <div className="h-24 w-full skeleton" />
                        </>
                      ) : cards.length === 0 ? (
                        <div className="text-center py-8 text-gray-400 text-xs border-2 border-dashed border-gray-200/70 rounded-lg">
                          Nenhum candidato
                        </div>
                      ) : cards.map(c => {
                        const vaga = vagas.find(v => v.id === c.vaga_id)
                        const testesDoCandidato = candidatosTestes.filter(ct => ct.candidato_id === c.id)

                        return (
                          <div key={c.id} className="kanban-card group">
                            <div className="flex items-center gap-2 mb-2 cursor-pointer" onClick={() => openEditCandidato(c)}>
                              <Avatar name={c.nome} size="sm" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{c.nome}</p>
                                <p className="text-[10px] text-gray-400 truncate">{vaga?.titulo || c.email || 'Banco de talentos'}</p>
                              </div>
                            </div>
                            {c.aderencia_vaga != null && (
                              <div className="flex items-center gap-1 mb-2">
                                <div className="flex-1 bg-gray-100 rounded-full h-1">
                                  <div className="bg-indigo-500 h-1 rounded-full transition-all duration-700" style={{ width: `${c.aderencia_vaga}%` }} />
                                </div>
                                <span className="text-[10px] text-gray-500">{c.aderencia_vaga}%</span>
                              </div>
                            )}
                            <div className="flex flex-wrap gap-1 mb-2">
                              {c.area && <Badge variant="indigo" size="sm">{c.area}</Badge>}
                              {testesDoCandidato.length > 0 && <Badge variant="green" size="sm">{testesDoCandidato.length} teste(s)</Badge>}
                            </div>
                            <div className="flex items-center justify-between mt-1">
                              <select
                                className="input text-[10px] py-0.5 px-1 h-6 w-28 bg-transparent border-gray-200"
                                value={c.etapa_kanban}
                                onChange={e => handleMoveCandidato(c.id, e.target.value)}
                              >
                                {ETAPAS_KANBAN.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
                                <option value="reprovado">Banco/Reprovado</option>
                              </select>
                              <div className="flex gap-1">
                                <button onClick={() => openWhatsApp(c)} className="p-1 text-green-500 hover:bg-green-50 rounded transition" title="WhatsApp">
                                  <MessageCircle size={14} />
                                </button>
                                <button onClick={() => sendEmail(c)} className="p-1 text-blue-500 hover:bg-blue-50 rounded transition" title="Email">
                                  <Mail size={14} />
                                </button>
                                <button onClick={() => setTesteCandidato(c)} className="p-1 text-indigo-500 hover:bg-indigo-50 rounded transition" title="Vincular teste">
                                  <FileCheck size={14} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm('Excluir este candidato?')) {
                                      supabase.from('candidatos').delete().eq('id', c.id).then(() => fetchAll())
                                    }
                                  }}
                                  className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 transition"
                                  title="Excluir"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'vagas' && (
          <div className="p-4 animate-fade-in">
            {vagas.length === 0 ? (
              <EmptyState icon={<Briefcase size={32} />} title="Nenhuma vaga cadastrada" description="Cadastre vagas para iniciar o processo seletivo." action={<button className="btn-primary" onClick={openNovaVaga}><Plus size={16} />Nova Vaga</button>} />
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                {vagas.map(v => (
                  <div key={v.id} onClick={() => openEditVaga(v)} className="cursor-pointer border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-indigo-200 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-semibold text-gray-900">{v.titulo}</h4>
                          <Badge variant={statusVagaVariant(v.status)}>{v.status}</Badge>
                          {v.prioridade && <Badge variant={v.prioridade === 'alta' ? 'red' : v.prioridade === 'baixa' ? 'gray' : 'yellow'}>{v.prioridade}</Badge>}
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm text-gray-500">
                          {v.empresa && <span>{v.empresa}</span>}
                          {v.area && <span>{v.area}</span>}
                          {v.nivel && <span>{v.nivel}</span>}
                          {v.tipo_contrato && <span>{v.tipo_contrato}</span>}
                          {v.modelo_trabalho && <span>{v.modelo_trabalho}</span>}
                          {v.localidade && <span>{v.localidade}</span>}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeleteVaga(v.id) }} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {(v.salario_min || v.salario_max || v.numero_vagas) && (
                      <div className="flex flex-wrap gap-2 mt-3 text-xs text-gray-500">
                        <Badge variant="blue" size="sm">{v.numero_vagas || 1} vaga(s)</Badge>
                        {(v.salario_min || v.salario_max) && <Badge variant="gray" size="sm">{formatCurrency(v.salario_min)} - {formatCurrency(v.salario_max)}</Badge>}
                        {v.responsavel && <Badge variant="purple" size="sm">Resp. {v.responsavel}</Badge>}
                      </div>
                    )}
                    {v.descricao && <p className="text-xs text-gray-500 mt-3 line-clamp-2">{v.descricao}</p>}
                    {v.requisitos && <p className="text-xs text-gray-400 mt-1 line-clamp-2"><strong>Requisitos:</strong> {v.requisitos}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'testes' && (
          <div className="p-4 animate-fade-in">
            {testes.length === 0 ? (
              <EmptyState icon={<ClipboardCheck size={32} />} title="Nenhum teste técnico registrado" description="Registre provas, cases ou links externos para vincular aos candidatos." action={<button className="btn-primary" onClick={openNovoTeste}><Plus size={16} />Novo Teste</button>} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {testes.map(t => {
                  const { texto, link } = splitDescricaoLink(t.descricao)
                  return (
                  <div key={t.id} onClick={() => openEditTeste(t)} className="cursor-pointer border border-gray-200 rounded-xl p-4 hover:shadow-sm hover:border-indigo-200 transition">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h4 className="font-semibold text-gray-900">{t.nome}</h4>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {t.area && <Badge variant="indigo" size="sm">{t.area}</Badge>}
                          {t.tempo_estimado_minutos != null && <Badge variant="gray" size="sm">{t.tempo_estimado_minutos} min</Badge>}
                          {t.pontuacao_maxima != null && <Badge variant="green" size="sm">{t.pontuacao_maxima} pts</Badge>}
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); handleDeleteTeste(t.id) }} className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50">
                        <Trash2 size={15} />
                      </button>
                    </div>
                    {texto && <p className="text-xs text-gray-500 mt-3 line-clamp-3">{texto}</p>}
                    {link && (
                      <a href={link} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="text-xs text-indigo-600 hover:text-indigo-700 mt-2 inline-block">
                        Abrir link do teste
                      </a>
                    )}
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {tab === 'templates' && (
          <div className="p-4 animate-fade-in">
            {templates.length === 0 ? (
              <EmptyState icon={<Mail size={32} />} title="Nenhum template criado" description="Crie templates de e-mail e WhatsApp com variáveis como {{nome_candidato}}." action={<button className="btn-primary" onClick={() => setShowNovoTemplate(true)}><Plus size={16} />Novo Template</button>} />
            ) : (
              <div className="space-y-3">
                {templates.map(t => (
                  <div key={t.id} className="border border-gray-200 rounded-xl p-4 flex items-start justify-between hover:shadow-sm transition">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-gray-900">{t.nome}</h4>
                        <Badge variant={t.tipo === 'whatsapp' ? 'green' : t.tipo === 'ambos' ? 'indigo' : 'blue'}>{templateLabel(t.tipo)}</Badge>
                      </div>
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
            {candidatosBanco.length === 0 ? (
              <EmptyState icon={<Users size={32} />} title="Banco de talentos vazio" description="Candidatos sem vaga ou movidos para banco ficam organizados por área." />
            ) : (
              <div className="space-y-5">
                {Object.entries(bancoPorArea).map(([area, items]) => (
                  <section key={area}>
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-semibold text-gray-700">{area}</h4>
                      <Badge variant="gray" size="sm">{items.length}</Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {items.map(c => (
                        <div key={c.id} className="border border-gray-200 rounded-xl p-3 flex items-center justify-between group hover:border-indigo-200 transition bg-white shadow-sm">
                          <div className="flex items-center gap-3 min-w-0">
                            <Avatar name={c.nome} size="md" />
                            <div className="min-w-0">
                              <p className="font-semibold text-gray-900 truncate">{c.nome}</p>
                              <p className="text-xs text-gray-400 truncate">{c.email || c.telefone || 'Sem contato cadastrado'}</p>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={() => openWhatsApp(c)} className="p-2 text-green-500 hover:bg-green-50 rounded-lg transition" title="WhatsApp">
                              <MessageCircle size={16} />
                            </button>
                            <button className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition" title="Reativar candidato" onClick={() => handleMoveCandidato(c.id, 'triagem')}>
                              <Plus size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <Modal open={showNovaVaga} onClose={() => setShowNovaVaga(false)} title={editingVaga ? 'Editar Vaga' : 'Nova Vaga'} maxWidth="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className="label">Título da vaga *</label>
            <input className="input" placeholder="Ex: Analista de Recursos Humanos" value={formVaga.titulo} onChange={e => setFormVaga(p => ({ ...p, titulo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Empresa / Cliente</label>
            <input className="input" placeholder="Ex: Rede Ideia" value={formVaga.empresa} onChange={e => setFormVaga(p => ({ ...p, empresa: e.target.value }))} />
          </div>
          <div>
            <label className="label">Responsável</label>
            <input className="input" placeholder="Ex: RH Interno" value={formVaga.responsavel} onChange={e => setFormVaga(p => ({ ...p, responsavel: e.target.value }))} />
          </div>
          <div>
            <label className="label">Área</label>
            <input className="input" placeholder="Ex: Administrativo" value={formVaga.area} onChange={e => setFormVaga(p => ({ ...p, area: e.target.value }))} />
          </div>
          <div>
            <label className="label">Setor</label>
            <input className="input" placeholder="Ex: RH" value={formVaga.setor} onChange={e => setFormVaga(p => ({ ...p, setor: e.target.value }))} />
          </div>
          <div>
            <label className="label">Nível</label>
            <select className="input" value={formVaga.nivel} onChange={e => setFormVaga(p => ({ ...p, nivel: e.target.value }))}>
              <option>Júnior</option>
              <option>Pleno</option>
              <option>Sênior</option>
              <option>Especialista</option>
              <option>Coordenação</option>
              <option>Gerência</option>
            </select>
          </div>
          <div>
            <label className="label">Prioridade</label>
            <select className="input" value={formVaga.prioridade} onChange={e => setFormVaga(p => ({ ...p, prioridade: e.target.value as typeof formVaga.prioridade }))}>
              <option value="baixa">Baixa</option>
              <option value="media">Média</option>
              <option value="alta">Alta</option>
            </select>
          </div>
          <div>
            <label className="label">Tipo de contrato</label>
            <select className="input" value={formVaga.tipo_contrato} onChange={e => setFormVaga(p => ({ ...p, tipo_contrato: e.target.value }))}>
              <option>CLT</option>
              <option>Estagiário</option>
              <option>PJ</option>
              <option>Temporário</option>
              <option>Terceiro</option>
            </select>
          </div>
          <div>
            <label className="label">Modelo de trabalho</label>
            <select className="input" value={formVaga.modelo_trabalho} onChange={e => setFormVaga(p => ({ ...p, modelo_trabalho: e.target.value as typeof formVaga.modelo_trabalho }))}>
              <option>Presencial</option>
              <option>Híbrido</option>
              <option>Remoto</option>
            </select>
          </div>
          <div>
            <label className="label">Localidade</label>
            <input className="input" placeholder="Ex: Estância Velha/RS" value={formVaga.localidade} onChange={e => setFormVaga(p => ({ ...p, localidade: e.target.value }))} />
          </div>
          <div>
            <label className="label">Quantidade de vagas</label>
            <input type="number" className="input" min={1} value={formVaga.numero_vagas} onChange={e => setFormVaga(p => ({ ...p, numero_vagas: Number(e.target.value) || 1 }))} />
          </div>
          <div>
            <label className="label">Data limite</label>
            <input type="date" className="input" value={formVaga.data_limite} onChange={e => setFormVaga(p => ({ ...p, data_limite: e.target.value }))} />
          </div>
          <div>
            <label className="label">Salário mínimo</label>
            <input className="input" inputMode="decimal" placeholder="Ex: 2.500,00" value={formVaga.salario_min} onChange={e => setFormVaga(p => ({ ...p, salario_min: e.target.value }))} />
          </div>
          <div>
            <label className="label">Salário máximo</label>
            <input className="input" inputMode="decimal" placeholder="Ex: 3.200,00" value={formVaga.salario_max} onChange={e => setFormVaga(p => ({ ...p, salario_max: e.target.value }))} />
          </div>
          {editingVaga && (
            <div>
              <label className="label">Status da vaga</label>
              <select className="input" value={statusVaga} onChange={e => setStatusVaga(e.target.value as Vaga['status'])}>
                <option value="aberta">Aberta</option>
                <option value="pausada">Pausada</option>
                <option value="fechada">Fechada</option>
              </select>
            </div>
          )}
          <div className="md:col-span-2">
            <label className="label">Motivo da abertura</label>
            <input className="input" placeholder="Ex: Substituição, aumento de quadro, projeto novo" value={formVaga.motivo_abertura} onChange={e => setFormVaga(p => ({ ...p, motivo_abertura: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descrição</label>
            <textarea className="input h-24 resize-none" placeholder="Descrição da vaga..." value={formVaga.descricao} onChange={e => setFormVaga(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Requisitos</label>
            <textarea className="input h-20 resize-none" placeholder="Ex: Graduação, experiência, ferramentas..." value={formVaga.requisitos} onChange={e => setFormVaga(p => ({ ...p, requisitos: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Benefícios / diferenciais</label>
            <textarea className="input h-20 resize-none" placeholder="Informe benefícios e diferenciais da vaga" value={formVaga.beneficios} onChange={e => setFormVaga(p => ({ ...p, beneficios: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovaVaga(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveVaga} disabled={savingVaga}>{savingVaga ? 'Salvando...' : editingVaga ? 'Salvar Alterações' : 'Publicar Vaga'}</button>
        </div>
      </Modal>

      <Modal open={showNovoCandidato} onClose={() => setShowNovoCandidato(false)} title={editingCand ? 'Editar Candidato' : 'Novo Candidato'}>
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
                <option value="">Banco de talentos</option>
                {vagas.map(v => <option key={v.id} value={v.id}>{v.titulo}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Aderência (%)</label>
              <input className="input" type="number" min="0" max="100" placeholder="0-100" value={formCand.aderencia_vaga} onChange={e => setFormCand(p => ({ ...p, aderencia_vaga: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Etapa inicial</label>
              <select className="input" value={formCand.etapa_kanban} onChange={e => setFormCand(p => ({ ...p, etapa_kanban: e.target.value as typeof formCand.etapa_kanban }))}>
                {ETAPAS_KANBAN.map(e => <option key={e.key} value={e.key}>{e.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label">Área de atuação</label>
              <input className="input" placeholder="Ex: Vendas" value={formCand.area} onChange={e => setFormCand(p => ({ ...p, area: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Observações internas</label>
            <textarea className="input h-20 resize-none" placeholder="Notas sobre o candidato..." value={formCand.observacoes_internas} onChange={e => setFormCand(p => ({ ...p, observacoes_internas: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovoCandidato(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveCandidato} disabled={savingCand}>{savingCand ? 'Salvando...' : editingCand ? 'Salvar Alterações' : 'Adicionar Candidato'}</button>
        </div>
      </Modal>

      <Modal open={showNovoTemplate} onClose={() => setShowNovoTemplate(false)} title="Novo Template de Comunicação">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nome *</label>
              <input className="input" placeholder="Ex: Convite entrevista" value={formTemplate.nome} onChange={e => setFormTemplate(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <label className="label">Canal</label>
              <select className="input" value={formTemplate.tipo} onChange={e => setFormTemplate(p => ({ ...p, tipo: e.target.value as typeof formTemplate.tipo }))}>
                <option value="email">Email</option>
                <option value="whatsapp">WhatsApp</option>
                <option value="ambos">Email + WhatsApp</option>
              </select>
            </div>
          </div>
          <div>
            <label className="label">Assunto *</label>
            <input className="input" placeholder="Ex: Próxima etapa - {{vaga}}" value={formTemplate.assunto} onChange={e => setFormTemplate(p => ({ ...p, assunto: e.target.value }))} />
          </div>
          <div>
            <label className="label">Mensagem</label>
            <textarea className="input h-32 resize-none" placeholder="Olá {{nome_candidato}}, ..." value={formTemplate.corpo} onChange={e => setFormTemplate(p => ({ ...p, corpo: e.target.value }))} />
          </div>
          <p className="text-xs text-gray-400">Variáveis: {'{{nome_candidato}}'}, {'{{vaga}}'}, {'{{empresa}}'}, {'{{data}}'}</p>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovoTemplate(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveTemplate} disabled={savingTemplate}>{savingTemplate ? 'Salvando...' : 'Salvar Template'}</button>
        </div>
      </Modal>

      <Modal open={showNovoTeste} onClose={() => setShowNovoTeste(false)} title={editingTeste ? 'Editar Teste Técnico' : 'Novo Teste Técnico'}>
        <div className="space-y-4">
          <div>
            <label className="label">Título *</label>
            <input className="input" placeholder="Ex: Case de Atendimento" value={formTeste.nome} onChange={e => setFormTeste(p => ({ ...p, nome: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Área</label>
              <input className="input" placeholder="Ex: Vendas" value={formTeste.area} onChange={e => setFormTeste(p => ({ ...p, area: e.target.value }))} />
            </div>
            <div>
              <label className="label">Tempo (min)</label>
              <input className="input" type="number" min="0" value={formTeste.tempo_estimado_minutos} onChange={e => setFormTeste(p => ({ ...p, tempo_estimado_minutos: e.target.value }))} />
            </div>
            <div>
              <label className="label">Pontuação</label>
              <input className="input" type="number" min="0" value={formTeste.pontuacao_maxima} onChange={e => setFormTeste(p => ({ ...p, pontuacao_maxima: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Link externo</label>
            <input className="input" placeholder="https://..." value={formTeste.link_externo} onChange={e => setFormTeste(p => ({ ...p, link_externo: e.target.value }))} />
          </div>
          <div>
            <label className="label">Descrição / critérios</label>
            <textarea className="input h-28 resize-none" placeholder="Descreva a prova, critérios e orientações de correção." value={formTeste.descricao} onChange={e => setFormTeste(p => ({ ...p, descricao: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowNovoTeste(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveTeste} disabled={savingTeste}>{savingTeste ? 'Salvando...' : editingTeste ? 'Salvar Alterações' : 'Salvar Teste'}</button>
        </div>
      </Modal>

      <Modal open={!!testeCandidato} onClose={() => setTesteCandidato(null)} title="Vincular Teste ao Candidato">
        <div className="space-y-4">
          <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
            <p className="text-sm font-medium text-gray-900">{testeCandidato?.nome}</p>
            <p className="text-xs text-gray-500">Registre o teste enviado ou o resultado recebido.</p>
          </div>
          <div>
            <label className="label">Teste *</label>
            <select className="input" value={formCandidatoTeste.teste_id} onChange={e => setFormCandidatoTeste(p => ({ ...p, teste_id: e.target.value }))}>
              <option value="">Selecione um teste</option>
              {testes.map(t => <option key={t.id} value={t.id}>{t.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Status</label>
              <select className="input" value={formCandidatoTeste.status} onChange={e => setFormCandidatoTeste(p => ({ ...p, status: e.target.value as typeof formCandidatoTeste.status }))}>
                <option value="pendente">Pendente</option>
                <option value="enviado">Enviado</option>
                <option value="concluido">Concluído</option>
                <option value="avaliado">Avaliado</option>
              </select>
            </div>
            <div>
              <label className="label">Resultado</label>
              <input className="input" type="number" min="0" placeholder="Pontuação" value={formCandidatoTeste.resultado_score} onChange={e => setFormCandidatoTeste(p => ({ ...p, resultado_score: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Observações</label>
            <textarea className="input h-20 resize-none" value={formCandidatoTeste.observacoes} onChange={e => setFormCandidatoTeste(p => ({ ...p, observacoes: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setTesteCandidato(null)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveCandidatoTeste} disabled={savingCandidatoTeste}>
            <Send size={16} />
            {savingCandidatoTeste ? 'Salvando...' : 'Vincular Teste'}
          </button>
        </div>
      </Modal>
    </Layout>
  )
}
