import React, { useEffect, useMemo, useState } from 'react'
import { FileText, Plus, ReceiptText, Send, Trash2 } from 'lucide-react'
import toast from 'react-hot-toast'
import { Layout } from '../components/layout/Layout'
import { Avatar, Badge, EmptyState, Modal, Tabs } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import type { Colaborador, Holerite, InformeRendimento } from '../lib/supabase'

type HoleriteTab = 'holerites' | 'informes'
type HoleriteComColaborador = Holerite & { colaborador?: Pick<Colaborador, 'nome' | 'cargo' | 'foto_url'> | null }
type InformeComColaborador = InformeRendimento & { colaborador?: Pick<Colaborador, 'nome' | 'cargo' | 'foto_url'> | null }

const EMPTY_HOLERITE = {
  colaborador_id: '',
  competencia: '',
  salario_base: '',
  proventos: '',
  descontos: '',
  arquivo_url: '',
  status: 'rascunho' as const,
}

const EMPTY_INFORME = {
  colaborador_id: '',
  ano_base: String(new Date().getFullYear() - 1),
  rendimentos_tributaveis: '',
  imposto_retido: '',
  arquivo_url: '',
  status: 'rascunho' as const,
}

function currency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function statusVariant(status: Holerite['status'] | InformeRendimento['status']) {
  if (status === 'enviado') return 'green'
  if (status === 'disponivel') return 'blue'
  if (status === 'cancelado') return 'red'
  return 'gray'
}

export function HoleritesPage() {
  const [tab, setTab] = useState<HoleriteTab>('holerites')
  const [holerites, setHolerites] = useState<HoleriteComColaborador[]>([])
  const [informes, setInformes] = useState<InformeComColaborador[]>([])
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [loading, setLoading] = useState(true)
  const [showHolerite, setShowHolerite] = useState(false)
  const [showInforme, setShowInforme] = useState(false)
  const [saving, setSaving] = useState(false)
  const [formHolerite, setFormHolerite] = useState({ ...EMPTY_HOLERITE })
  const [formInforme, setFormInforme] = useState({ ...EMPTY_INFORME })

  const fetchData = async () => {
    setLoading(true)
    const [holeritesRes, informesRes, colaboradoresRes] = await Promise.all([
      supabase.from('holerites').select('*, colaborador:colaboradores(nome,cargo,foto_url)').order('competencia', { ascending: false }),
      supabase.from('informes_rendimentos').select('*, colaborador:colaboradores(nome,cargo,foto_url)').order('ano_base', { ascending: false }),
      supabase.from('colaboradores').select('*').eq('status', 'ativo').order('nome'),
    ])
    if (holeritesRes.data) setHolerites(holeritesRes.data as HoleriteComColaborador[])
    if (informesRes.data) setInformes(informesRes.data as InformeComColaborador[])
    if (colaboradoresRes.data) setColaboradores(colaboradoresRes.data as Colaborador[])
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const stats = useMemo(() => ({
    holerites: holerites.length,
    disponiveis: holerites.filter(h => h.status === 'disponivel' || h.status === 'enviado').length,
    liquido: holerites.reduce((sum, h) => sum + h.valor_liquido, 0),
    informes: informes.length,
  }), [holerites, informes])

  const handleSaveHolerite = async () => {
    if (!formHolerite.colaborador_id || !formHolerite.competencia) {
      toast.error('Preencha colaborador e competência.')
      return
    }

    const salarioBase = Number(formHolerite.salario_base) || 0
    const proventos = Number(formHolerite.proventos) || 0
    const descontos = Number(formHolerite.descontos) || 0

    setSaving(true)
    const { error } = await supabase.from('holerites').insert({
      colaborador_id: formHolerite.colaborador_id,
      competencia: formHolerite.competencia,
      salario_base: salarioBase,
      proventos,
      descontos,
      valor_liquido: salarioBase + proventos - descontos,
      arquivo_url: formHolerite.arquivo_url || null,
      status: formHolerite.status,
    })
    setSaving(false)

    if (error) {
      toast.error('Erro ao salvar holerite: ' + error.message)
      return
    }

    toast.success('Holerite preparado.')
    setFormHolerite({ ...EMPTY_HOLERITE })
    setShowHolerite(false)
    fetchData()
  }

  const handleSaveInforme = async () => {
    if (!formInforme.colaborador_id || !formInforme.ano_base) {
      toast.error('Preencha colaborador e ano-base.')
      return
    }

    setSaving(true)
    const { error } = await supabase.from('informes_rendimentos').insert({
      colaborador_id: formInforme.colaborador_id,
      ano_base: Number(formInforme.ano_base),
      rendimentos_tributaveis: Number(formInforme.rendimentos_tributaveis) || 0,
      imposto_retido: Number(formInforme.imposto_retido) || 0,
      arquivo_url: formInforme.arquivo_url || null,
      status: formInforme.status,
    })
    setSaving(false)

    if (error) {
      toast.error('Erro ao salvar informe: ' + error.message)
      return
    }

    toast.success('Informe preparado.')
    setFormInforme({ ...EMPTY_INFORME })
    setShowInforme(false)
    fetchData()
  }

  const deleteRow = async (table: 'holerites' | 'informes_rendimentos', id: string) => {
    if (!confirm('Excluir este documento?')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) toast.error('Erro ao excluir documento.')
    else {
      toast.success('Documento excluído.')
      fetchData()
    }
  }

  return (
    <Layout title="Holerites e Informes" subtitle="Preparação de holerites e informes de rendimentos">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Holerites" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.holerites)} icon={<ReceiptText size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Disponíveis" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.disponiveis)} icon={<Send size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Líquido Total" value={loading ? <div className="h-8 w-12 skeleton" /> : currency(stats.liquido)} icon={<ReceiptText size={20} className="text-blue-600" />} iconBg="bg-blue-100" />
        <StatCard title="Informes" value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.informes)} icon={<FileText size={20} className="text-purple-600" />} iconBg="bg-purple-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <Tabs
            tabs={[
              { label: 'Holerites', value: 'holerites' },
              { label: 'Informes', value: 'informes' },
            ]}
            value={tab}
            onChange={v => setTab(v as HoleriteTab)}
          />
          <div className="flex gap-2">
            {tab === 'holerites' && <button className="btn-primary" onClick={() => setShowHolerite(true)}><Plus size={16} />Novo Holerite</button>}
            {tab === 'informes' && <button className="btn-primary" onClick={() => setShowInforme(true)}><Plus size={16} />Novo Informe</button>}
          </div>
        </div>

        {tab === 'holerites' && (
          loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 skeleton" />)}</div>
          ) : holerites.length === 0 ? (
            <EmptyState icon={<ReceiptText size={32} />} title="Nenhum holerite preparado" description="Registre holerites para controle e posterior envio aos colaboradores." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Competência</th>
                    <th>Base</th>
                    <th>Proventos</th>
                    <th>Descontos</th>
                    <th>Líquido</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {holerites.map(h => (
                    <tr key={h.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={h.colaborador?.nome || 'Colaborador'} photo={h.colaborador?.foto_url} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">{h.colaborador?.nome || 'Colaborador removido'}</p>
                            <p className="text-xs text-gray-400">{h.colaborador?.cargo || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td>{h.competencia}</td>
                      <td>{currency(h.salario_base)}</td>
                      <td>{currency(h.proventos)}</td>
                      <td>{currency(h.descontos)}</td>
                      <td className="font-semibold text-gray-900">{currency(h.valor_liquido)}</td>
                      <td><Badge variant={statusVariant(h.status)}>{h.status}</Badge></td>
                      <td><button className="text-red-400 hover:text-red-600 p-1" onClick={() => deleteRow('holerites', h.id)}><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}

        {tab === 'informes' && (
          loading ? (
            <div className="p-6 space-y-3">{[1, 2, 3].map(i => <div key={i} className="h-16 skeleton" />)}</div>
          ) : informes.length === 0 ? (
            <EmptyState icon={<FileText size={32} />} title="Nenhum informe preparado" description="Prepare informes de rendimentos por colaborador e ano-base." />
          ) : (
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Ano-base</th>
                    <th>Rendimentos</th>
                    <th>IR retido</th>
                    <th>Status</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {informes.map(i => (
                    <tr key={i.id}>
                      <td>
                        <div className="flex items-center gap-3">
                          <Avatar name={i.colaborador?.nome || 'Colaborador'} photo={i.colaborador?.foto_url} size="sm" />
                          <div>
                            <p className="font-medium text-gray-900">{i.colaborador?.nome || 'Colaborador removido'}</p>
                            <p className="text-xs text-gray-400">{i.colaborador?.cargo || '-'}</p>
                          </div>
                        </div>
                      </td>
                      <td>{i.ano_base}</td>
                      <td>{currency(i.rendimentos_tributaveis)}</td>
                      <td>{currency(i.imposto_retido)}</td>
                      <td><Badge variant={statusVariant(i.status)}>{i.status}</Badge></td>
                      <td><button className="text-red-400 hover:text-red-600 p-1" onClick={() => deleteRow('informes_rendimentos', i.id)}><Trash2 size={15} /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      <Modal open={showHolerite} onClose={() => setShowHolerite(false)} title="Novo Holerite">
        <div className="space-y-4">
          <div>
            <label className="label">Colaborador *</label>
            <select className="input" value={formHolerite.colaborador_id} onChange={e => setFormHolerite(p => ({ ...p, colaborador_id: e.target.value }))}>
              <option value="">Selecione</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Competência *</label>
            <input className="input" type="month" value={formHolerite.competencia} onChange={e => setFormHolerite(p => ({ ...p, competencia: e.target.value }))} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Salário base</label>
              <input className="input" type="number" value={formHolerite.salario_base} onChange={e => setFormHolerite(p => ({ ...p, salario_base: e.target.value }))} />
            </div>
            <div>
              <label className="label">Proventos</label>
              <input className="input" type="number" value={formHolerite.proventos} onChange={e => setFormHolerite(p => ({ ...p, proventos: e.target.value }))} />
            </div>
            <div>
              <label className="label">Descontos</label>
              <input className="input" type="number" value={formHolerite.descontos} onChange={e => setFormHolerite(p => ({ ...p, descontos: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Arquivo URL</label>
            <input className="input" value={formHolerite.arquivo_url} onChange={e => setFormHolerite(p => ({ ...p, arquivo_url: e.target.value }))} placeholder="https://..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowHolerite(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveHolerite} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Holerite'}</button>
        </div>
      </Modal>

      <Modal open={showInforme} onClose={() => setShowInforme(false)} title="Novo Informe de Rendimentos">
        <div className="space-y-4">
          <div>
            <label className="label">Colaborador *</label>
            <select className="input" value={formInforme.colaborador_id} onChange={e => setFormInforme(p => ({ ...p, colaborador_id: e.target.value }))}>
              <option value="">Selecione</option>
              {colaboradores.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="label">Ano-base *</label>
              <input className="input" type="number" value={formInforme.ano_base} onChange={e => setFormInforme(p => ({ ...p, ano_base: e.target.value }))} />
            </div>
            <div>
              <label className="label">Rendimentos</label>
              <input className="input" type="number" value={formInforme.rendimentos_tributaveis} onChange={e => setFormInforme(p => ({ ...p, rendimentos_tributaveis: e.target.value }))} />
            </div>
            <div>
              <label className="label">IR retido</label>
              <input className="input" type="number" value={formInforme.imposto_retido} onChange={e => setFormInforme(p => ({ ...p, imposto_retido: e.target.value }))} />
            </div>
          </div>
          <div>
            <label className="label">Arquivo URL</label>
            <input className="input" value={formInforme.arquivo_url} onChange={e => setFormInforme(p => ({ ...p, arquivo_url: e.target.value }))} placeholder="https://..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowInforme(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveInforme} disabled={saving}>{saving ? 'Salvando...' : 'Salvar Informe'}</button>
        </div>
      </Modal>
    </Layout>
  )
}
