import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Award, Plus, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Avatar, EmptyState, Modal } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'

export function ContCoinsPage() {
  const [showTransacao, setShowTransacao] = useState(false)
  const [showProcessar, setShowProcessar] = useState(false)

  return (
    <Layout title="ContCoins" subtitle="Sistema de reconhecimento e pontuação gamificada">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Total de ContCoins em Circulação" value="0 CC" icon={<Award size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Distribuídos (mês)" value="0 CC" icon={<TrendingUp size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Descontados (mês)" value="0 CC" icon={<TrendingDown size={20} className="text-red-600" />} iconBg="bg-red-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Ranking de ContCoins</h3>
          <div className="flex gap-2">
            <button className="btn-secondary" onClick={() => setShowProcessar(true)}>
              ⚙️ Processar ContCoins agora
            </button>
            <button className="btn-primary" onClick={() => setShowTransacao(true)}>
              <Plus size={16} />
              Nova Transação
            </button>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="overflow-x-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th>Colaborador</th>
                <th>Setor</th>
                <th>
                  <div className="flex items-center gap-1">
                    <span className="text-yellow-500">⬤</span> Saldo
                  </div>
                </th>
                <th>
                  <div className="flex items-center gap-1">
                    <TrendingUp size={14} className="text-green-500" /> Ganhos
                  </div>
                </th>
                <th>
                  <div className="flex items-center gap-1">
                    <TrendingDown size={14} className="text-red-500" /> Perdas
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={6}>
                  <EmptyState
                    icon={<Award size={32} />}
                    title="Leaderboard vazio"
                    description="As pontuações dos colaboradores aparecerão aqui após o processamento."
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nova Transação */}
      <Modal open={showTransacao} onClose={() => setShowTransacao(false)} title="Nova Transação ContCoins">
        <div className="space-y-4">
          <div>
            <label className="label">Colaborador</label>
            <input className="input" placeholder="Selecione o colaborador" />
          </div>
          <div>
            <label className="label">Tipo</label>
            <div className="grid grid-cols-2 gap-2">
              <button className="py-2 rounded-lg border border-green-300 bg-green-50 text-green-700 text-sm font-medium flex items-center justify-center gap-1">
                <TrendingUp size={14} /> Ganho
              </button>
              <button className="py-2 rounded-lg border border-gray-300 bg-white text-gray-600 text-sm font-medium flex items-center justify-center gap-1">
                <TrendingDown size={14} /> Desconto
              </button>
            </div>
          </div>
          <div>
            <label className="label">Valor (CC)</label>
            <input className="input" type="number" placeholder="Ex: 50" />
          </div>
          <div>
            <label className="label">Motivo</label>
            <textarea className="input h-20 resize-none" placeholder="Descreva o motivo da transação..." />
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowTransacao(false)}>Cancelar</button>
          <button className="btn-primary">Registrar</button>
        </div>
      </Modal>

      {/* Modal Processar */}
      <Modal open={showProcessar} onClose={() => setShowProcessar(false)} title="Processar ContCoins">
        <div className="text-center py-4">
          <Award size={48} className="mx-auto text-yellow-500 mb-3" />
          <p className="text-gray-700 mb-2 font-medium">Processar ContCoins mensal</p>
          <p className="text-sm text-gray-500">
            Este processo calculará e distribuirá os ContCoins automaticamente com base nos critérios configurados.
          </p>
        </div>
        <div className="flex justify-end gap-3 mt-5 pt-4 border-t border-gray-100">
          <button className="btn-secondary" onClick={() => setShowProcessar(false)}>Cancelar</button>
          <button className="btn-primary">Processar Agora</button>
        </div>
      </Modal>
    </Layout>
  )
}
