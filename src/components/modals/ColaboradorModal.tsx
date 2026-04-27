import React, { useState, useEffect } from 'react'
import { Modal } from '../ui'
import { supabase } from '../../lib/supabase'
import { maskCPF, maskPhone } from '../../lib/masks'
import toast from 'react-hot-toast'
import type { Colaborador } from '../../lib/supabase'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  colaborador?: Colaborador | null
}

const EMPTY = {
  nome: '', cpf: '', email: '', telefone: '', cargo: '',
  setor: '', celula: '', tipo: 'CLT' as const,
  data_admissao: '', data_nascimento: '', perfil_disc: '' as any,
  status: 'ativo' as const, salario: '' as string | number,
  foto_url: ''
}

export function ColaboradorModal({ open, onClose, onSaved, colaborador }: Props) {
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (colaborador) {
      setForm({
        nome: colaborador.nome || '',
        cpf: colaborador.cpf || '',
        email: colaborador.email || '',
        telefone: colaborador.telefone || '',
        cargo: colaborador.cargo || '',
        setor: colaborador.setor || '',
        celula: colaborador.celula || '',
        tipo: colaborador.tipo || 'CLT',
        data_admissao: colaborador.data_admissao || '',
        data_nascimento: colaborador.data_nascimento || '',
        perfil_disc: colaborador.perfil_disc || '',
        status: colaborador.status || 'ativo',
        salario: colaborador.salario?.toString() || '',
        foto_url: colaborador.foto_url || ''
      })
    } else {
      setForm({ ...EMPTY })
    }
  }, [colaborador, open])

  const set = (field: string, value: string) =>
    setForm(p => ({ ...p, [field]: value }))

  const handleSave = async () => {
    if (!form.nome.trim() || !form.cargo.trim() || !form.setor.trim() || !form.cpf.trim()) {
      toast.error('Preencha Nome, CPF, Cargo e Setor obrigatoriamente.')
      return
    }

    if (form.cpf.length < 14) {
      toast.error('CPF inválido.')
      return
    }

    setLoading(true)
    const payload: any = {
      nome: form.nome,
      cpf: form.cpf,
      cargo: form.cargo,
      setor: form.setor,
      tipo: form.tipo,
      status: form.status,
      email: form.email || null,
      telefone: form.telefone || null,
      celula: form.celula || null,
      data_admissao: form.data_admissao || null,
      data_nascimento: form.data_nascimento || null,
      perfil_disc: form.perfil_disc || null,
      salario: form.salario ? parseFloat(form.salario.toString()) : null,
      foto_url: form.foto_url || null
    }

    let error;
    if (colaborador?.id) {
      const { error: err } = await supabase
        .from('colaboradores')
        .update(payload)
        .eq('id', colaborador.id)
      error = err
    } else {
      const { error: err } = await supabase
        .from('colaboradores')
        .insert(payload)
      error = err
    }

    setLoading(false)
    if (error) {
      if (error.code === '23505') toast.error('Este CPF já está cadastrado.')
      else toast.error('Erro ao salvar: ' + error.message)
      return
    }

    toast.success(colaborador?.id ? 'Colaborador atualizado!' : 'Colaborador cadastrado!')
    onSaved()
    onClose()
  }

  return (
    <Modal open={open} onClose={onClose} title={colaborador ? 'Editar Colaborador' : 'Novo Colaborador'} maxWidth="max-w-2xl">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <label className="label">Nome Completo *</label>
          <input className="input" value={form.nome} onChange={e => set('nome', e.target.value)} placeholder="Nome do colaborador" />
        </div>
        <div>
          <label className="label">CPF *</label>
          <input className="input" value={form.cpf} onChange={e => set('cpf', maskCPF(e.target.value))} placeholder="000.000.000-00" />
        </div>
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={form.email} onChange={e => set('email', e.target.value)} placeholder="email@empresa.com" />
        </div>
        <div>
          <label className="label">Telefone</label>
          <input className="input" value={form.telefone} onChange={e => set('telefone', maskPhone(e.target.value))} placeholder="(00) 00000-0000" />
        </div>
        <div className="md:col-span-2">
          <label className="label">URL da Foto</label>
          <input className="input" value={form.foto_url} onChange={e => set('foto_url', e.target.value)} placeholder="https://exemplo.com/foto.jpg" />
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
          <select className="input" value={form.tipo} onChange={e => set('tipo', e.target.value as any)}>
            <option value="CLT">CLT</option>
            <option value="Estagiário">Estagiário</option>
            <option value="Terceiro">Terceiro</option>
            <option value="PJ">PJ</option>
          </select>
        </div>
        <div>
          <label className="label">Salário (R$)</label>
          <input className="input" type="number" step="0.01" value={form.salario} onChange={e => set('salario', e.target.value)} placeholder="0.00" />
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
        <div>
          <label className="label">Status</label>
          <select className="input" value={form.status} onChange={e => set('status', e.target.value as any)}>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
            <option value="demitido">Demitido</option>
          </select>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>Cancelar</button>
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : colaborador ? 'Salvar Alterações' : 'Cadastrar Colaborador'}
        </button>
      </div>
    </Modal>
  )
}
