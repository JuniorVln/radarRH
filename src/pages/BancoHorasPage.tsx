import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Clock, TrendingUp, TrendingDown, Users } from 'lucide-react'
import { EmptyState } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'

export function BancoHorasPage() {
  const [expandedSetor, setExpandedSetor] = useState<string | null>(null)

  return (
    <Layout title="Banco de Horas" subtitle="Controle de saldo de horas por colaborador e setor">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <StatCard title="Saldo Total (empresa)" value="0h" icon={<Clock size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Maior Saldo Individual" value="0h" icon={<TrendingUp size={20} className="text-green-600" />} iconBg="bg-green-100" />
        <StatCard title="Menor Saldo Individual" value="0h" icon={<TrendingDown size={20} className="text-red-600" />} iconBg="bg-red-100" />
      </div>

      {/* Groups by sector */}
      <div className="space-y-3">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-900">Saldo por Setor / Célula</h3>
          </div>

          <EmptyState
            icon={<Clock size={32} />}
            title="Nenhum dado de banco de horas"
            description="Os saldos serão exibidos aqui conforme os colaboradores forem cadastrados e as horas registradas."
          />
        </div>
      </div>
    </Layout>
  )
}
