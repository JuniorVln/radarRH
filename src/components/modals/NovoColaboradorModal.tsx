import React, { useState } from 'react'
import { Modal } from '../ui'
import { supabase } from '../../lib/supabase'
import toast from 'react-hot-toast'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
}

const EMPTY = {
  nome: '', cpf: '', email: '', telefone: '', cargo: '',
  setor: '', celula: '', tipo: 'CLT' as const,
  data_admissao: '', data_nascimento: '', perfil_disc: '' as any,
  status: 'ativo' as const,
}

export function NovoColaboradorModal({ open, onClose, onSaved }: Props) {
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)

  const set = (field: string, value: string) =>
    setForm(p => ({ ...p, [field]: value }))

  const handleSave = async () => {
    if (!form.nome.trim() || !form.cargo.trim() || !form.setor.trim()) {
      toast.error('Preencha Nome, Cargo e Setor obrigatoriamente.')
      return
    }
    setLoading(true)
    const payload: any = {
      nome: form.nome,
      cargo: form.cargo,
      setor: form.setor,
      tipo: form.tipo,
      status: form.status,
    }
    if (form.cpf) payload.cpf = form.cpf
    if (form.email) payload.email = form.email
    if (form.telefone) payload.telefone = form.telefone
    if (form.celula) payload.celula = form.celula
    if (form.data_admissao) payload.data_admissao = form.data_admissao
    if (form.data_nascimento) payload.data_nascimento = form.data_nascimento
    if (form.perfil_disc) payload.perfil_disc = form.perfil_disc

    const { error } = await supabase.from('colaboradores').insert(payload)
    setLoading(false)
    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
      return
    }
    toast.success('Colaborador cadastrado com sucesso!')
    setForm({ ...EMPTY })
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title="Novo Colaborador" maxWidth="max-w-2xl">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <label className="label">Nome Completo *</label>
          <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do colaborador" />
        </div>
        <div>
          <label className="label">CPF</label>
          <input className="input" value={form.cpf} onChange={e => set('cpf', e.target.value)} placeholder="000.000.000-00" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={form.telefone} onChange={e => set('telefone', e.target.value)} placeholder="(00) 00000-0000" />
        </div>
        <div>
          <label className="label">Cargo *</label>
          <input className="input" value={form.cargo} onChange={e => set('cargo', e.target.value)} placeholder="Ex: Analista de RH" />
        </div>
        <div>
          <label className="label">Setor *</label>
          <input className="input" value={form.setor} onChange={e => set('setor', e.target.value)} placeholder="Ex: Recursos Humanos" />
        </div>
        <div>
          <label className="label">Célula</label>
          <input className="input" value={form.celula} onChange={e => set('celula', e.target.value)} placeholder="Ex: Célula Norte" />
        </div>
        <div>
          <label className="label">Tipo de Contrato</label>
          <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
            <option value="CLT">CLT</option>
            <option value="Estagiário">Estagiário</option>
            <option value="Terceiro">Terceiro</option>
            <option value="PJ">PJ</option>
          </select>
        </div>
        <div>
          <label className="label">Data de Admissão</label>
          <input className="input" type="date" value={form.data_admissao} onChange={e => set('data_admissao', e.target.value)} />
        </div>
        <div>
          <label className="label">Data de Nascimento</label>
          <input className="input" type="date" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
        </div>
        <div>
          <label className="label">Perfil DISC</label>
          <select className="input" value={form.perfil_disc} onChange={e => set('perfil_disc', e.target.value)}>
            <option value="">Não definido</option>
            <option value="D">D — Dominância</option>
            <option value="I">I — Influência</option>
            <option value="S">S — Estabilidade</option>
            <option value="C">C — Conformidade</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar Colaborador'}
        </button>
      </div>
    </Modal>
  )
}
