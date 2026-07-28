import React, { useState, useEffect } from 'react'
import { Modal } from '../ui'
import { supabase } from '../../lib/supabase'
import { maskCPF, maskPhone, maskCEP, parseMoney } from '../../lib/masks'
import toast from 'react-hot-toast'
import type { AnexoColaborador, Colaborador, Dependente } from '../../lib/supabase'

interface Props {
  open: boolean
  onClose: () => void
  onSaved: () => void
  colaborador?: Colaborador | null
  /** Valores iniciais pra um cadastro NOVO (ex.: candidato vindo do Recrutamento). */
  prefill?: Partial<typeof EMPTY> | null
}

const EMPTY_ENDERECO = { cep: '', rua: '', numero: '', bairro: '', cidade: '', uf: '' }
const EMPTY_BANCO = { banco: '', agencia: '', conta: '' }

const EMPTY = {
  nome: '',
  cpf: '',
  email: '',
  email_pessoal: '',
  email_corporativo: '',
  telefone: '',
  cargo: '',
  setor: '',
  celula: '',
  unidade: '',
  cnpj_unidade: '',
  tipo: 'CLT' as Colaborador['tipo'],
  data_admissao: '',
  data_nascimento: '',
  perfil_disc: '' as any,
  status: 'ativo' as Colaborador['status'],
  salario: '' as string | number,
  foto_url: '',
  genero: '',
  raca_etnia: '',
  estado_civil: '',
  escolaridade: '',
  pcd: false,
  tipo_pcd: '',
  nome_mae: '',
  nome_pai: '',
  contato_emergencia_nome: '',
  contato_emergencia_parentesco: '',
  contato_emergencia_telefone: '',
  contato_principal: '',
  endereco: { ...EMPTY_ENDERECO },
  rg: '',
  rg_orgao_uf: '',
  pis_pasep: '',
  ctps: '',
  titulo_eleitor: '',
  dados_bancarios: { ...EMPTY_BANCO }
}

export function ColaboradorModal({ open, onClose, onSaved, colaborador, prefill }: Props) {
  const [form, setForm] = useState({ ...EMPTY })
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'pessoais' | 'contratuais' | 'documentos' | 'dependentes' | 'anexos'>('pessoais')
  const [dependentes, setDependentes] = useState<Partial<Dependente>[]>([])
  const [anexos, setAnexos] = useState<Partial<AnexoColaborador>[]>([])
  const [demissao, setDemissao] = useState({ data: '', valor_rescisao: '' })
  // Cargos ja cadastrados, pra oferecer no campo Cargo. Continua salvando o NOME no
  // mesmo campo texto: nao migra os registros antigos e nao trava cadastro de um cargo
  // que ainda nao existe na tabela.
  const [cargosCadastrados, setCargosCadastrados] = useState<string[]>([])

  useEffect(() => {
    if (!open) return
    supabase
      .from('cargos')
      .select('titulo')
      .eq('status', 'ativo')
      .order('titulo')
      .then(({ data }) => {
        if (data) setCargosCadastrados([...new Set(data.map(c => c.titulo).filter(Boolean))])
      })
  }, [open])

  useEffect(() => {
    if (colaborador) {
      setForm({
        nome: colaborador.nome || '',
        cpf: colaborador.cpf || '',
        email: colaborador.email || '',
        email_pessoal: colaborador.email_pessoal || '',
        email_corporativo: colaborador.email_corporativo || '',
        telefone: colaborador.telefone || '',
        cargo: colaborador.cargo || '',
        setor: colaborador.setor || '',
        celula: colaborador.celula || '',
        unidade: colaborador.unidade || '',
        cnpj_unidade: colaborador.cnpj_unidade || '',
        tipo: colaborador.tipo || 'CLT',
        data_admissao: colaborador.data_admissao || '',
        data_nascimento: colaborador.data_nascimento || '',
        perfil_disc: colaborador.perfil_disc || '',
        status: colaborador.status || 'ativo',
        salario: colaborador.salario?.toString() || '',
        foto_url: colaborador.foto_url || '',
        genero: colaborador.genero || '',
        raca_etnia: colaborador.raca_etnia || '',
        estado_civil: colaborador.estado_civil || '',
        escolaridade: colaborador.escolaridade || '',
        pcd: colaborador.pcd || false,
        tipo_pcd: colaborador.tipo_pcd || '',
        nome_mae: colaborador.nome_mae || '',
        nome_pai: colaborador.nome_pai || '',
        contato_emergencia_nome: colaborador.contato_emergencia_nome || '',
        contato_emergencia_parentesco: colaborador.contato_emergencia_parentesco || '',
        contato_emergencia_telefone: colaborador.contato_emergencia_telefone || '',
        contato_principal: colaborador.contato_principal || '',
        endereco: colaborador.endereco || { ...EMPTY_ENDERECO },
        rg: colaborador.rg || '',
        rg_orgao_uf: colaborador.rg_orgao_uf || '',
        pis_pasep: colaborador.pis_pasep || '',
        ctps: colaborador.ctps || '',
        titulo_eleitor: colaborador.titulo_eleitor || '',
        dados_bancarios: colaborador.dados_bancarios || { ...EMPTY_BANCO }
      })
      fetchDependentes(colaborador.id)
      fetchAnexos(colaborador.id)
    } else {
      setForm({ ...EMPTY, ...(prefill || {}) })
      setDependentes([])
      setAnexos([])
    }
    setDemissao({ data: '', valor_rescisao: '' })
    setActiveTab('pessoais')
  }, [colaborador, open, prefill])

  const fetchDependentes = async (id: string) => {
    const { data } = await supabase.from('dependentes').select('*').eq('colaborador_id', id)
    if (data) setDependentes(data)
  }

  const fetchAnexos = async (id: string) => {
    const { data } = await supabase.from('anexos_colaborador').select('*').eq('colaborador_id', id).order('criado_em', { ascending: false })
    if (data) setAnexos(data)
  }

  const set = (field: string, value: any) =>
    setForm(p => ({ ...p, [field]: value }))

  const setEndereco = (field: string, value: string) => 
    setForm(p => ({ ...p, endereco: { ...p.endereco, [field]: value } }))

  const setBanco = (field: string, value: string) => 
    setForm(p => ({ ...p, dados_bancarios: { ...p.dados_bancarios, [field]: value } }))

  const handleAddDependente = () => {
    setDependentes([...dependentes, { nome: '', parentesco: '', cpf: '', rg: '', data_nascimento: '' }])
  }

  const handleUpdateDependente = (index: number, field: string, value: string) => {
    const newDeps = [...dependentes]
    newDeps[index] = { ...newDeps[index], [field]: value }
    setDependentes(newDeps)
  }

  const handleRemoveDependente = async (index: number) => {
    const dep = dependentes[index]
    if (dep.id) {
      await supabase.from('dependentes').delete().eq('id', dep.id)
    }
    setDependentes(dependentes.filter((_, i) => i !== index))
  }

  const handleAddAnexo = () => {
    setAnexos([...anexos, { nome: '', tipo_documento: 'Documento pessoal', arquivo_url: '', ocr_status: 'pendente', ocr_resultado: null }])
  }

  const handleUpdateAnexo = (index: number, field: string, value: string) => {
    const newAnexos = [...anexos]
    newAnexos[index] = { ...newAnexos[index], [field]: value }
    setAnexos(newAnexos)
  }

  const handleRemoveAnexo = async (index: number) => {
    const anexo = anexos[index]
    if (anexo.id) {
      const { error } = await supabase.from('anexos_colaborador').delete().eq('id', anexo.id)
      if (error) {
        toast.error('Erro ao remover anexo: ' + error.message)
        return
      }
    }
    setAnexos(anexos.filter((_, i) => i !== index))
  }

  const handleSave = async () => {
    if (!form.nome.trim() || !form.cpf.trim()) {
      setActiveTab('pessoais')
      toast.error('Preencha Nome e CPF obrigatoriamente.')
      return
    }
    if (!form.cargo.trim() || !form.setor.trim()) {
      setActiveTab('contratuais')
      toast.error('Preencha Cargo e Setor obrigatoriamente.')
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
      email_pessoal: form.email_pessoal || null,
      email_corporativo: form.email_corporativo || null,
      telefone: form.telefone || null,
      celula: form.celula || null,
      unidade: form.unidade || null,
      cnpj_unidade: form.cnpj_unidade || null,
      data_admissao: form.data_admissao || null,
      data_nascimento: form.data_nascimento || null,
      perfil_disc: form.perfil_disc || null,
      salario: form.salario ? parseFloat(form.salario.toString()) : null,
      foto_url: form.foto_url || null,
      genero: form.genero || null,
      raca_etnia: form.raca_etnia || null,
      estado_civil: form.estado_civil || null,
      escolaridade: form.escolaridade || null,
      pcd: form.pcd,
      tipo_pcd: form.tipo_pcd || null,
      nome_mae: form.nome_mae || null,
      nome_pai: form.nome_pai || null,
      contato_emergencia_nome: form.contato_emergencia_nome || null,
      contato_emergencia_parentesco: form.contato_emergencia_parentesco || null,
      contato_emergencia_telefone: form.contato_emergencia_telefone || null,
      contato_principal: form.contato_principal || null,
      endereco: form.endereco,
      rg: form.rg || null,
      rg_orgao_uf: form.rg_orgao_uf || null,
      pis_pasep: form.pis_pasep || null,
      ctps: form.ctps || null,
      titulo_eleitor: form.titulo_eleitor || null,
      dados_bancarios: form.dados_bancarios
    }

    let error;
    let colabId = colaborador?.id;

    if (colabId) {
      const { error: err } = await supabase
        .from('colaboradores')
        .update(payload)
        .eq('id', colabId)
      error = err
    } else {
      const { data, error: err } = await supabase
        .from('colaboradores')
        .insert(payload)
        .select()
        .single()
      error = err
      if (data) colabId = data.id
    }

    if (!error && colabId && dependentes.length > 0) {
      const depsToInsert = dependentes
        .filter(d => !d.id && d.nome)
        .map(d => ({
          colaborador_id: colabId,
          nome: d.nome,
          parentesco: d.parentesco || null,
          cpf: d.cpf || null,
          rg: d.rg || null,
          data_nascimento: d.data_nascimento || null,
        }))
      
      const depsToUpdate = dependentes.filter(d => d.id && d.nome)

      if (depsToInsert.length > 0) {
        const { error: depInsertError } = await supabase.from('dependentes').insert(depsToInsert)
        if (depInsertError) error = depInsertError
      }
      
      if (!error) {
        for (const d of depsToUpdate) {
          const { error: depUpdateError } = await supabase
            .from('dependentes')
            .update({
              nome: d.nome,
              parentesco: d.parentesco || null,
              cpf: d.cpf || null,
              rg: d.rg || null,
              data_nascimento: d.data_nascimento || null,
            })
            .eq('id', d.id!)
          if (depUpdateError) {
            error = depUpdateError
            break
          }
        }
      }
    }

    if (!error && colabId && anexos.length > 0) {
      const anexosToInsert = anexos
        .filter(a => !a.id && a.nome)
        .map(a => ({
          colaborador_id: colabId,
          nome: a.nome,
          tipo_documento: a.tipo_documento || 'Documento pessoal',
          arquivo_url: a.arquivo_url || null,
          ocr_status: a.ocr_status || 'pendente',
          ocr_resultado: a.ocr_resultado || null,
        }))

      const anexosToUpdate = anexos.filter(a => a.id && a.nome)

      if (anexosToInsert.length > 0) {
        const { error: anexoInsertError } = await supabase.from('anexos_colaborador').insert(anexosToInsert)
        if (anexoInsertError) error = anexoInsertError
      }

      if (!error) {
        for (const a of anexosToUpdate) {
          const { error: anexoUpdateError } = await supabase
            .from('anexos_colaborador')
            .update({
              nome: a.nome,
              tipo_documento: a.tipo_documento || 'Documento pessoal',
              arquivo_url: a.arquivo_url || null,
              ocr_status: a.ocr_status || 'pendente',
            })
            .eq('id', a.id!)
          if (anexoUpdateError) {
            error = anexoUpdateError
            break
          }
        }
      }
    }

    // Registra movimentações de admissão/demissão — alimentam Dashboard e Turnover
    if (!error && colabId) {
      const hoje = new Date().toISOString().split('T')[0]
      const movs: any[] = []
      if (!colaborador) {
        movs.push({
          colaborador_id: colabId,
          tipo: 'admissao',
          data: form.data_admissao || hoje,
          descricao: 'Admissão',
        })
      } else if (form.status === 'demitido' && colaborador.status !== 'demitido') {
        movs.push({
          colaborador_id: colabId,
          tipo: 'demissao',
          data: demissao.data || hoje,
          valor: parseMoney(demissao.valor_rescisao),
          descricao: 'Demissão',
        })
      } else if (form.status === 'ativo' && colaborador.status === 'demitido') {
        movs.push({
          colaborador_id: colabId,
          tipo: 'admissao',
          data: hoje,
          descricao: 'Readmissão',
        })
      }
      if (movs.length > 0) {
        const { error: movError } = await supabase.from('movimentacoes').insert(movs)
        if (movError) toast.error('Colaborador salvo, mas houve erro ao registrar a movimentação: ' + movError.message)
      }
    }

    setLoading(false)
    if (error) {
      toast.error('Erro ao salvar: ' + error.message)
    } else {
      toast.success('Salvo com sucesso!')
      onSaved()
      onClose()
    }
  }

  const TabButton = ({ id, label }: { id: typeof activeTab, label: string }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
        activeTab === id 
          ? 'border-blue-600 text-blue-600' 
          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
      }`}
    >
      {label}
    </button>
  )

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={colaborador ? 'Editar Colaborador' : 'Novo Colaborador'}
      size="xl"
    >
      <div className="flex border-b border-gray-200 mb-6">
        <TabButton id="pessoais" label="Dados Pessoais" />
        <TabButton id="contratuais" label="Contrato & Vínculo" />
        <TabButton id="documentos" label="Documentos & Finanças" />
        <TabButton id="dependentes" label="Dependentes" />
        <TabButton id="anexos" label="Anexos & OCR" />
      </div>

      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 pb-4">
        {activeTab === 'pessoais' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Informações Básicas</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="colab-nome" className="block text-sm font-medium text-gray-700 mb-1">Nome Completo *</label>
                  <input id="colab-nome" type="text" className="input-field" value={form.nome} onChange={e => set('nome', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colab-cpf" className="block text-sm font-medium text-gray-700 mb-1">CPF *</label>
                  <input id="colab-cpf" type="text" className="input-field" value={form.cpf} onChange={e => set('cpf', maskCPF(e.target.value))} maxLength={14} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Data Nascimento</label>
                  <input type="date" className="input-field" value={form.data_nascimento} onChange={e => set('data_nascimento', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gênero</label>
                  <select className="input-field" value={form.genero} onChange={e => set('genero', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                    <option value="Prefiro não informar">Prefiro não informar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Raça/Etnia</label>
                  <select className="input-field" value={form.raca_etnia} onChange={e => set('raca_etnia', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Branca">Branca</option>
                    <option value="Preta">Preta</option>
                    <option value="Parda">Parda</option>
                    <option value="Amarela">Amarela</option>
                    <option value="Indígena">Indígena</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado Civil</label>
                  <select className="input-field" value={form.estado_civil} onChange={e => set('estado_civil', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Solteiro(a)">Solteiro(a)</option>
                    <option value="Casado(a)">Casado(a)</option>
                    <option value="Divorciado(a)">Divorciado(a)</option>
                    <option value="Viúvo(a)">Viúvo(a)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Escolaridade</label>
                  <select className="input-field" value={form.escolaridade} onChange={e => set('escolaridade', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="Ensino Médio Incompleto">Ensino Médio Incompleto</option>
                    <option value="Ensino Médio Completo">Ensino Médio Completo</option>
                    <option value="Superior Incompleto">Superior Incompleto</option>
                    <option value="Superior Completo">Superior Completo</option>
                    <option value="Pós-graduação/MBA">Pós-graduação/MBA</option>
                  </select>
                </div>
                <div className="flex items-center pt-6 space-x-3">
                  <input type="checkbox" id="pcd" checked={form.pcd} onChange={e => set('pcd', e.target.checked)} className="w-4 h-4 text-blue-600 rounded border-gray-300" />
                  <label htmlFor="pcd" className="text-sm font-medium text-gray-700">Pessoa com Deficiência (PCD)</label>
                </div>
                {form.pcd && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Deficiência</label>
                    <input type="text" className="input-field" value={form.tipo_pcd} onChange={e => set('tipo_pcd', e.target.value)} placeholder="Visual, Auditiva, Física..." />
                  </div>
                )}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Contato & Endereço</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail</label>
                  <input type="email" className="input-field" value={form.email} onChange={e => set('email', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Corporativo</label>
                  <input type="email" className="input-field" value={form.email_corporativo} onChange={e => set('email_corporativo', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">E-mail Pessoal</label>
                  <input type="email" className="input-field" value={form.email_pessoal} onChange={e => set('email_pessoal', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Telefone/Celular</label>
                  <input type="text" className="input-field" value={form.telefone} onChange={e => set('telefone', maskPhone(e.target.value))} maxLength={15} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contato Principal</label>
                  <select className="input-field" value={form.contato_principal} onChange={e => set('contato_principal', e.target.value)}>
                    <option value="">Selecione...</option>
                    <option value="telefone">Telefone/Celular</option>
                    <option value="email_corporativo">E-mail corporativo</option>
                    <option value="email_pessoal">E-mail pessoal</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CEP</label>
                  <input type="text" className="input-field" value={form.endereco.cep} onChange={e => setEndereco('cep', maskCEP(e.target.value))} maxLength={9} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rua/Logradouro</label>
                  <input type="text" className="input-field" value={form.endereco.rua} onChange={e => setEndereco('rua', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Número</label>
                  <input type="text" className="input-field" value={form.endereco.numero} onChange={e => setEndereco('numero', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bairro</label>
                  <input type="text" className="input-field" value={form.endereco.bairro} onChange={e => setEndereco('bairro', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cidade</label>
                  <input type="text" className="input-field" value={form.endereco.cidade} onChange={e => setEndereco('cidade', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">UF</label>
                  <input type="text" className="input-field" value={form.endereco.uf} onChange={e => setEndereco('uf', e.target.value)} maxLength={2} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Familiar & Emergência</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Mãe</label>
                  <input type="text" className="input-field" value={form.nome_mae} onChange={e => set('nome_mae', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Pai</label>
                  <input type="text" className="input-field" value={form.nome_pai} onChange={e => set('nome_pai', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contato Emergência (Nome)</label>
                  <input type="text" className="input-field" value={form.contato_emergencia_nome} onChange={e => set('contato_emergencia_nome', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contato Emergência (Parentesco)</label>
                  <input type="text" className="input-field" value={form.contato_emergencia_parentesco} onChange={e => set('contato_emergencia_parentesco', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contato Emergência (Telefone)</label>
                  <input type="text" className="input-field" value={form.contato_emergencia_telefone} onChange={e => set('contato_emergencia_telefone', maskPhone(e.target.value))} maxLength={15} />
                </div>
              </div>
            </div>
            
          </div>
        )}

        {activeTab === 'contratuais' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Vínculo com a Empresa</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="colab-cargo" className="block text-sm font-medium text-gray-700 mb-1">Cargo *</label>
                  <input
                    id="colab-cargo"
                    type="text"
                    className="input-field"
                    list="cargos-cadastrados"
                    placeholder={cargosCadastrados.length ? 'Selecione ou digite...' : 'Ex: Analista de RH'}
                    value={form.cargo}
                    onChange={e => set('cargo', e.target.value)}
                  />
                  <datalist id="cargos-cadastrados">
                    {cargosCadastrados.map(c => <option key={c} value={c} />)}
                  </datalist>
                  {cargosCadastrados.length > 0 && (
                    <p className="text-xs text-gray-400 mt-1">{cargosCadastrados.length} cargos cadastrados disponíveis.</p>
                  )}
                </div>
                <div>
                  <label htmlFor="colab-setor" className="block text-sm font-medium text-gray-700 mb-1">Setor *</label>
                  <input id="colab-setor" type="text" className="input-field" value={form.setor} onChange={e => set('setor', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colab-tipo" className="block text-sm font-medium text-gray-700 mb-1">Tipo de Contrato</label>
                  <select id="colab-tipo" className="input-field" value={form.tipo} onChange={e => set('tipo', e.target.value)}>
                    <option value="CLT">CLT</option>
                    <option value="Estagiário">Estagiário</option>
                    <option value="Terceiro">Terceiro</option>
                    <option value="PJ">PJ</option>
                    <option value="Mensalista">Mensalista</option>
                    <option value="Horista">Horista</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Célula / Equipe</label>
                  <input type="text" className="input-field" value={form.celula} onChange={e => set('celula', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unidade / Empresa</label>
                  <input type="text" className="input-field" value={form.unidade} onChange={e => set('unidade', e.target.value)} placeholder="Rede Ideia, Rede Gaúcha..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ da Unidade</label>
                  <input type="text" className="input-field" value={form.cnpj_unidade} onChange={e => set('cnpj_unidade', e.target.value)} />
                </div>
                <div>
                  <label htmlFor="colab-admissao" className="block text-sm font-medium text-gray-700 mb-1">Data Admissão</label>
                  <input id="colab-admissao" type="date" className="input-field" value={form.data_admissao} onChange={e => set('data_admissao', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salário (R$)</label>
                  <input type="number" className="input-field" value={form.salario} onChange={e => set('salario', e.target.value)} step="0.01" />
                </div>
                <div>
                  <label htmlFor="colab-status" className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select id="colab-status" className="input-field" value={form.status} onChange={e => set('status', e.target.value)}>
                    <option value="ativo">Ativo</option>
                    <option value="inativo">Inativo</option>
                    <option value="demitido">Demitido</option>
                  </select>
                </div>
                {form.status === 'demitido' && colaborador?.status !== 'demitido' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Data da Demissão</label>
                      <input type="date" className="input-field" value={demissao.data} onChange={e => setDemissao(p => ({ ...p, data: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Valor da Rescisão (R$)</label>
                      <input type="text" inputMode="decimal" className="input-field" placeholder="Ex: 5.400,00" value={demissao.valor_rescisao} onChange={e => setDemissao(p => ({ ...p, valor_rescisao: e.target.value }))} />
                      <p className="text-xs text-gray-400 mt-1">Registrado no histórico de custos com desligamentos.</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'documentos' && (
          <div className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Documentação Legal</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RG</label>
                  <input type="text" className="input-field" value={form.rg} onChange={e => set('rg', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Órgão Emissor / UF</label>
                  <input type="text" className="input-field" value={form.rg_orgao_uf} onChange={e => set('rg_orgao_uf', e.target.value)} placeholder="Ex: SSP/SP" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">PIS/PASEP</label>
                  <input type="text" className="input-field" value={form.pis_pasep} onChange={e => set('pis_pasep', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CTPS (Número/Série)</label>
                  <input type="text" className="input-field" value={form.ctps} onChange={e => set('ctps', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Título de Eleitor</label>
                  <input type="text" className="input-field" value={form.titulo_eleitor} onChange={e => set('titulo_eleitor', e.target.value)} />
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-gray-900 border-b pb-2 mb-4">Dados Bancários</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                  <input type="text" className="input-field" value={form.dados_bancarios.banco} onChange={e => setBanco('banco', e.target.value)} placeholder="Ex: Itaú, Nubank..." />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                  <input type="text" className="input-field" value={form.dados_bancarios.agencia} onChange={e => setBanco('agencia', e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Conta Corrente</label>
                  <input type="text" className="input-field" value={form.dados_bancarios.conta} onChange={e => setBanco('conta', e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dependentes' && (
          <div>
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <h4 className="text-sm font-semibold text-gray-900">Dependentes</h4>
              <button onClick={handleAddDependente} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Adicionar</button>
            </div>
            {dependentes.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum dependente cadastrado.</p>
            ) : (
              <div className="space-y-4">
                {dependentes.map((dep, index) => (
                  <div key={dep.id || index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start border p-3 rounded-lg bg-gray-50">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                      <input type="text" className="input-field text-sm" value={dep.nome || ''} onChange={e => handleUpdateDependente(index, 'nome', e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Parentesco</label>
                      <input type="text" className="input-field text-sm" value={dep.parentesco || ''} onChange={e => handleUpdateDependente(index, 'parentesco', e.target.value)} placeholder="Ex: Filho" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">CPF</label>
                      <input type="text" className="input-field text-sm" value={dep.cpf || ''} onChange={e => handleUpdateDependente(index, 'cpf', maskCPF(e.target.value))} maxLength={14} />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nascimento</label>
                      <input type="date" className="input-field text-sm" value={dep.data_nascimento || ''} onChange={e => handleUpdateDependente(index, 'data_nascimento', e.target.value)} />
                    </div>
                    <div className="flex items-end h-full pb-1">
                      <button onClick={() => handleRemoveDependente(index)} className="text-red-500 hover:text-red-700 text-sm">Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'anexos' && (
          <div>
            <div className="flex items-center justify-between border-b pb-2 mb-4">
              <div>
                <h4 className="text-sm font-semibold text-gray-900">Anexos & OCR</h4>
                <p className="text-xs text-gray-500 mt-1">Nesta fase, salvamos metadados e status. O upload/OCR real entra via adapter depois.</p>
              </div>
              <button onClick={handleAddAnexo} className="text-sm text-blue-600 hover:text-blue-800 font-medium">+ Adicionar</button>
            </div>
            {anexos.length === 0 ? (
              <p className="text-sm text-gray-500 italic">Nenhum anexo cadastrado.</p>
            ) : (
              <div className="space-y-4">
                {anexos.map((anexo, index) => (
                  <div key={anexo.id || index} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-start border p-3 rounded-lg bg-gray-50">
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">Nome do arquivo/documento</label>
                      <input type="text" className="input-field text-sm" value={anexo.nome || ''} onChange={e => handleUpdateAnexo(index, 'nome', e.target.value)} placeholder="RG frente, comprovante..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Tipo</label>
                      <select className="input-field text-sm" value={anexo.tipo_documento || 'Documento pessoal'} onChange={e => handleUpdateAnexo(index, 'tipo_documento', e.target.value)}>
                        <option>Documento pessoal</option>
                        <option>Comprovante de endereço</option>
                        <option>Contrato</option>
                        <option>Exame admissional</option>
                        <option>Outro</option>
                      </select>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-xs font-medium text-gray-700 mb-1">URL do arquivo</label>
                      <input type="url" className="input-field text-sm" value={anexo.arquivo_url || ''} onChange={e => handleUpdateAnexo(index, 'arquivo_url', e.target.value)} placeholder="https://..." />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">OCR</label>
                      <select className="input-field text-sm" value={anexo.ocr_status || 'pendente'} onChange={e => handleUpdateAnexo(index, 'ocr_status', e.target.value)}>
                        <option value="pendente">Pendente</option>
                        <option value="processando">Processando</option>
                        <option value="concluido">Concluído</option>
                        <option value="erro">Erro</option>
                      </select>
                      <button onClick={() => handleRemoveAnexo(index)} className="mt-2 text-red-500 hover:text-red-700 text-sm">Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

      <div className="mt-6 flex justify-end gap-3 pt-4 border-t border-gray-100">
        <button className="btn-secondary" onClick={onClose} disabled={loading}>
          Cancelar
        </button>
        <button className="btn-primary" onClick={handleSave} disabled={loading}>
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </Modal>
  )
}
