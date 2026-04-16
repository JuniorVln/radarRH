import React, { useState, useEffect, useCallback } from 'react'
import { Layout } from '../components/layout/Layout'
import { Award, Plus, TrendingUp, TrendingDown } from 'lucide-react'
import { Avatar, EmptyState, Modal } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { supabase } from '../lib/supabase'
import toast from 'react-hot-toast'

const EMPTY_TX = { colaborador_nome: '', tipo: 'ganho' as 'ganho' | 'desconto', valor: '', motivo: '' }

export function ContCoinsPage() {
  const [ranking, setRanking] = useState<any[]>([])
  const [colaboradores, setColaboradores] = useState<any[]>([])
  const [transacoes, setTransacoes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showTransacao, setShowTransacao] = useState(false)
  const [showProcessar, setShowProcessar] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({ ...EMPTY_TX })

  const fetchAll = useCallback(async () => {
    setLoading(true)
    const [rankRes, txRes, colabsRes] = await Promise.all([
      supabase.from('contcoins').select('*').order('saldo', { ascending: false }),
      supabase.from('contcoins_transacoes').select('*').order('criado_em', { ascending: false }).limit(50),
      supabase.from('colaboradores').select('id, nome, setor, foto_url').order('nome'),
    ])
    if (rankRes.data) setRanking(rankRes.data)
    if (txRes.data) setTransacoes(txRes.data)
    if (colabsRes.data) setColaboradores(colabsRes.data)
    setLoading(false)
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  const handleSaveTransacao = async () => {
    if (!form.colaborador_nome.trim() || !form.valor) {
      toast.error('Colaborador e valor são obrigatórios.')
      return
    }
    const valor = Number(form.valor)
    if (isNaN(valor) || valor <= 0) { toast.error('Valor inválido.'); return }

    // Busca colaborador
    const { data: colabs } = await supabase.from('colaboradores').select('id').ilike('nome', `%${form.colaborador_nome}%`).limit(1)
    if (!colabs || colabs.length === 0) { toast.error('Colaborador não encontrado.'); return }
    const colaboradorId = colabs[0].id

    setSaving(true)
    // Registra transação
    const { error: txError } = await supabase.from('contcoins_transacoes').insert({
      colaborador_id: colaboradorId,
      tipo: form.tipo,
      valor: valor,
      motivo: form.motivo || null,
    })
    if (txError) { toast.error('Erro: ' + txError.message); setSaving(false); return }

    // Atualiza ou cria saldo
    const { data: saldoAtual } = await supabase.from('contcoins').select('*').eq('colaborador_id', colaboradorId).maybeSingle()
    if (saldoAtual) {
      const novoSaldo = form.tipo === 'ganho' ? saldoAtual.saldo + valor : saldoAtual.saldo - valor
      const ganhos = form.tipo === 'ganho' ? saldoAtual.ganhos_total + valor : saldoAtual.ganhos_total
      const perdas = form.tipo === 'desconto' ? saldoAtual.perdas_total + valor : saldoAtual.perdas_total
      await supabase.from('contcoins').update({ saldo: novoSaldo, ganhos_total: ganhos, perdas_total: perdas }).eq('id', saldoAtual.id)
    } else {
      await supabase.from('contcoins').insert({
        colaborador_id: colaboradorId,
        saldo: form.tipo === 'ganho' ? valor : -valor,
        ganhos_total: form.tipo === 'ganho' ? valor : 0,
        perdas_total: form.tipo === 'desconto' ? valor : 0,
      })
    }

    setSaving(false)
    toast.success('Transação registrada!')
    setForm({ ...EMPTY_TX })
    setShowTransacao(false)
    fetchAll()
  }

  // Enriquece ranking com nomes
  const rankingComNomes = ranking.map((r, i) => ({
    ...r,
    posicao: i + 1,
    colaborador: colaboradores.find(c => c.id === r.colaborador_id),
  }))

  const stats = {
    total: ranking.reduce((sum, r) => sum + (r.saldo || 0), 0),
    distribuidos: transacoes.filter(t => t.tipo === 'ganho').reduce((sum, t) => sum + (t.valor || 0), 0),
    descontados: transacoes.filter(t => t.tipo === 'desconto').reduce((sum, t) => sum + (t.valor || 0), 0),
  }

  return (
    <Layout title="ContCoins" subtitle="Sistema de reconhecimento e pontuação gamificada">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Total em Circulação" value={`${stats.total} CC`} icon={<Award size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Distribuídos (total)" value={`${stats.distribuidos} CC`} icon={<TrendingUp size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Descontados (total)" value={`${stats.descontados} CC`} icon={<TrendingDown size={20} className="text-red-600" />} iconBg="bg-red-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Ranking de ContCoins</h3>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowProcessar(true)}>⚙️ Sobre ContCoins</button>
            <button className="btn-primary" onClick={() => setShowTransacao(true)}>
              <Plus size={16} /> Nova Transação
            </button>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-gray-400">Carregando...</div>
        ) : rankingComNomes.length === 0 ? (
          <EmptyState icon={<Award size={32} />} title="Leaderboard vazio" description="As pontuações aparecerão aqui após a primeira transação."
            action={<button className="btn-primary" onClick={() => setShowTransacao(true)}><Plus size={16} />Nova Transação</button>} />
        ) : (
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th>Colaborador</th>
                  <th>Setor</th>
                  <th><div className="flex items-center gap-1"><span className="text-yellow-500">⬤</span> Saldo</div></th>
                  <th><div className="flex items-center gap-1"><TrendingUp size={14} className="text-green-500" /> Ganhos</div></th>
                  <th><div className="flex items-center gap-1"><TrendingDown size={14} className="text-red-500" /> Perdas</div></th>
                </tr>
              </thead>
              <tbody>
                {rankingComNomes.map(r => (
                  <tr key={r.id}>
                    <td>
                      <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                        r.posicao === 1 ? 'bg-yellow-100 text-yellow-700' :
                        r.posicao === 2 ? 'bg-gray-100 text-gray-600' :
                        r.posicao === 3 ? 'bg-orange-100 text-orange-700' :
                        'bg-gray-50 text-gray-500'
                      }`}>{r.posicao === 1 ? '🥇' : r.posicao === 2 ? '🥈' : r.posicao === 3 ? '🥉' : r.posicao}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-3">
                        <Avatar name={r.colaborador?.nome || '?'} photo={r.colaborador?.foto_url} size="sm" />
                        <span className="font-medium text-gray-900">{r.colaborador?.nome || `ID: ${r.colaborador_id.slice(0, 8)}`}</span>
                      </div>
                    </td>
                    <td className="text-gray-500 text-sm">{r.colaborador?.setor || '—'}</td>
                    <td className="font-bold text-yellow-700">{r.saldo} CC</td>
                    <td className="text-green-600">+{r.ganhos_total} CC</td>
                    <td className="text-red-500">-{r.perdas_total} CC</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Nova Transação */}
      <Modal open={showTransacao} onClose={() => setShowTransacao(false)} title="Nova Transação ContCoins">
        <div className="space-y-4">
          <div>
            <label className="label">Colaborador *</label>
            <input className="input" list="colabs-coins-list" placeholder="Pesquise pelo nome..." value={form.colaborador_nome} onChange={e => setForm(p => ({ ...p, colaborador_nome: e.target.value }))} />
            <datalist id="colabs-coins-list">
              {colaboradores.map(c => <option key={c.id} value={c.nome} />)}
            </datalist>
          </div>
          <div>
            <label className="label">Tipo *</label>
            <div className="grid grid-cols-2 gap-2">
              {([['ganho', '+ Ganho', 'green'], ['desconto', '− Desconto', 'red']] as const).map(([tipo, label, color]) => (
                <button key={tipo} onClick={() => setForm(p => ({ ...p, tipo }))}
                  className={`py-2.5 rounded-lg border text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                    form.tipo === tipo
                      ? color === 'green' ? 'bg-green-600 text-white border-green-600' : 'bg-red-600 text-white border-red-600'
                      : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                  }`}>
                  {tipo === 'ganho' ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="label">Valor (CC) *</label>
            <input className="input" type="number" min="1" placeholder="Ex: 50" value={form.valor} onChange={e => setForm(p => ({ ...p, valor: e.target.value }))} />
          </div>
          <div>
            <label className="label">Motivo</label>
            <textarea className="input h-20 resize-none" placeholder="Descreva o motivo da transação..." value={form.motivo} onChange={e => setForm(p => ({ ...p, motivo: e.target.value }))} />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowTransacao(false)}>Cancelar</button>
          <button className="btn-primary" onClick={handleSaveTransacao} disabled={saving}>{saving ? 'Registrando...' : 'Registrar'}</button>
        </div>
      </Modal>

      {/* Modal Sobre */}
      <Modal open={showProcessar} onClose={() => setShowProcessar(false)} title="Sobre ContCoins">
        <div className="text-center py-4">
          <Award size={48} className="mx-auto text-yellow-500 mb-3" />
          <p className="text-gray-700 mb-2 font-medium">Sistema de Reconhecimento ContCoins</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            Os ContCoins são um sistema gamificado de reconhecimento. Colaboradores acumulam moedas por boas práticas,
            metas alcançadas e comportamentos positivos. Use "Nova Transação" para creditar ou descontar ContCoins manualmente.
          </p>
        </div>
        <div className="flex justify-end mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowProcessar(false)}>Fechar</button>
        </div>
      </Modal>
    </Layout>
  )
}
