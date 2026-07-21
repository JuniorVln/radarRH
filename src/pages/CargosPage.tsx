import React, { useEffect, useMemo, useState } from 'react'
import { Briefcase, Plus, Search, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Layout } from '../components/layout/Layout'
import { Badge, EmptyState, Modal, SearchInput } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import type { Cargo } from '../lib/supabase'
import { formatMoney, parseMoney } from '../lib/masks'

const EMPTY_CARGO = {
  titulo: '',
  area: '',
  nivel: 'Pleno',
  descricao: '',
  atribuicoes: '',
  requisitos: '',
  salario_min: '',
  salario_max: '',
  status: 'ativo' as const,
}

function currency(value: number | null) {
  if (value == null) return '-'
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function CargosPage() {
  const [cargos, setCargos] = useState<Cargo[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_CARGO })
  const [editing, setEditing] = useState<Cargo | null>(null)

  const openNew = () => {
    setEditing(null)
    setForm({ ...EMPTY_CARGO })
    setShowModal(true)
  }

  const openEdit = (c: Cargo) => {
    setEditing(c)
    setForm({
      titulo: c.titulo,
      area: c.area || '',
      nivel: c.nivel,
      descricao: c.descricao || '',
      atribuicoes: c.atribuicoes || '',
      requisitos: c.requisitos || '',
      salario_min: formatMoney(c.salario_min),
      salario_max: formatMoney(c.salario_max),
      status: c.status as typeof EMPTY_CARGO.status,
    })
    setShowModal(true)
  }

  const fetchCargos = async () => {
    setLoading(true)
    const { data, error } = await supabase.from('cargos').select('*').order('titulo')
    if (error) toast.error('Erro ao carregar cargos.')
    else setCargos((data || []) as Cargo[])
    setLoading(false)
  }

  useEffect(() => {
    fetchCargos()
  }, [])

  const filtered = cargos.filter(c => {
    const term = search.toLowerCase()
    return !term ||
      c.titulo.toLowerCase().includes(term) ||
      c.area?.toLowerCase().includes(term) ||
      c.nivel.toLowerCase().includes(term)
  })

  const stats = useMemo(() => ({
    total: cargos.length,
    ativos: cargos.filter(c => c.status === 'ativo').length,
    areas: new Set(cargos.map(c => c.area).filter(Boolean)).size,
    mediaSalarial: cargos.length
      ? cargos.reduce((sum, c) => sum + ((c.salario_min || 0) + (c.salario_max || 0)) / 2, 0) / cargos.length
      : 0,
  }), [cargos])

  const handleSave = async () => {
    if (!form.titulo.trim()) {
      toast.error('Título do cargo é obrigatório.')
      return
    }

    setSaving(true)
    const payload = {
      titulo: form.titulo.trim(),
      area: form.area || null,
      nivel: form.nivel,
      descricao: form.descricao || null,
      atribuicoes: form.atribuicoes || null,
      requisitos: form.requisitos || null,
      salario_min: parseMoney(form.salario_min),
      salario_max: parseMoney(form.salario_max),
      status: form.status,
    }
    const { error } = editing
      ? await supabase.from('cargos').update(payload).eq('id', editing.id)
      : await supabase.from('cargos').insert(payload)
    setSaving(false)

    if (error) {
      toast.error('Erro ao salvar cargo: ' + error.message)
      return
    }

    toast.success(editing ? 'Cargo atualizado.' : 'Cargo cadastrado.')
    setEditing(null)
    setForm({ ...EMPTY_CARGO })
    setShowModal(false)
    fetchCargos()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir este cargo?')) return
    const { error } = await supabase.from('cargos').delete().eq('id', id)
    if (error) toast.error('Erro ao excluir cargo.')
    else {
      toast.success('Cargo excluído.')
      fetchCargos()
    }
  }

  return (
    <Layout title="Cargos e Salários" subtitle="Cargos, níveis, atribuições, requisitos e faixas salariais">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Cargos" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.total)} icon={<Briefcase size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Ativos" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.ativos)} icon={<Briefcase size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Áreas" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.areas)} icon={<Search size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title="Média Faixa" value={loading ? <div className="h-8 w-12 skeleton" /> : currency(stats.mediaSalarial || null)} icon={<Briefcase size={20} className="text-purple-600" />} iconBg="bg-purple-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <SearchInput value={search} onChange={setSearch} placeholder="Buscar por cargo, área ou nível..." className="flex-1 min-w-[220px] max-w-md" />
          <button className="btn-primary" onClick={openNew}>
            <Plus size={16} />
            Novo Cargo
          </button>
        </div>

        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3].map(i => <div key={i} className="h-16 skeleton" />)}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState icon={<Briefcase size={32} />} title="Nenhum cargo encontrado" description="Cadastre cargos para padronizar estrutura e faixas salariais." />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Cargo</th>
                  <th>Área</th>
                  <th>Nível</th>
                  <th>Faixa salarial</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.id} className="cursor-pointer hover:bg-gray-50/80 transition-colors" onClick={() => openEdit(c)}>
                    <td>
                      <p className="font-medium text-gray-900">{c.titulo}</p>
                      {c.atribuicoes && <p className="text-xs text-gray-400 line-clamp-1">{c.atribuicoes}</p>}
                    </td>
                    <td>{c.area || '-'}</td>
                    <td><Badge variant="indigo">{c.nivel}</Badge></td>
                    <td>{currency(c.salario_min)} - {currency(c.salario_max)}</td>
                    <td><Badge variant={c.status === 'ativo' ? 'green' : 'gray'}>{c.status}</Badge></td>
                    <td onClick={e => e.stopPropagation()}>
                      <button className="text-red-400 hover:text-red-600 p-1 rounded hover:bg-red-50" onClick={() => handleDelete(c.id)}>
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

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Cargo' : 'Novo Cargo'} maxWidth="max-w-3xl">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="label">Título *</label>
            <input className="input" value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value }))} placeholder="Ex: Analista de RH" />
          </div>
          <div>
            <label className="label">Área</label>
            <input className="input" value={form.area} onChange={e => setForm(p => ({ ...p, area: e.target.value }))} placeholder="Ex: Recursos Humanos" />
          </div>
          <div>
            <label className="label">Nível</label>
            <select className="input" value={form.nivel} onChange={e => setForm(p => ({ ...p, nivel: e.target.value }))}>
              <option>Júnior</option>
              <option>Pleno</option>
              <option>Sênior</option>
              <option>Especialista</option>
              <option>Coordenação</option>
              <option>Gerência</option>
            </select>
          </div>
          <div>
            <label className="label">Status</label>
            <select className="input" value={form.status} onChange={e => setForm(p => ({ ...p, status: e.target.value as typeof form.status }))}>
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </div>
          <div>
            <label className="label">Salário mínimo</label>
            <input className="input" inputMode="decimal" placeholder="Ex: 2.500,00" value={form.salario_min} onChange={e => setForm(p => ({ ...p, salario_min: e.target.value }))} />
          </div>
          <div>
            <label className="label">Salário máximo</label>
            <input className="input" inputMode="decimal" placeholder="Ex: 3.200,00" value={form.salario_max} onChange={e => setForm(p => ({ ...p, salario_max: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Descrição</label>
            <textarea className="input h-16 resize-none" value={form.descricao} onChange={e => setForm(p => ({ ...p, descricao: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Atribuições</label>
            <textarea className="input h-20 resize-none" value={form.atribuicoes} onChange={e => setForm(p => ({ ...p, atribuicoes: e.target.value }))} />
          </div>
          <div className="md:col-span-2">
            <label className="label">Requisitos</label>
            <textarea className="input h-20 resize-none" value={form.requisitos} onChange={e => setForm(p => ({ ...p, requisitos: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-4 pt-3 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : editing ? 'Salvar Alterações' : 'Salvar Cargo'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
