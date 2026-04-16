import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { TrendingDown, AlertCircle } from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'

const monthlyTurnover = [
  { mes: 'Mai', taxa: 0.0 },
  { mes: 'Jun', taxa: 0.0 },
  { mes: 'Jul', taxa: 0.0 },
  { mes: 'Ago', taxa: 0.0 },
  { mes: 'Set', taxa: 0.0 },
  { mes: 'Out', taxa: 0.0 },
  { mes: 'Nov', taxa: 0.0 },
  { mes: 'Dez', taxa: 0.0 },
  { mes: 'Jan', taxa: 0.0 },
  { mes: 'Fev', taxa: 0.0 },
  { mes: 'Mar', taxa: 0.0 },
  { mes: 'Abr', taxa: 0.0 },
]

export function TurnoverPage() {
  const [period, setPeriod] = useState('12m')

  return (
    <Layout title="Turnover" subtitle="Análise de rotatividade de colaboradores">
      {/* Formula */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 mb-6 flex items-center gap-4">
        <AlertCircle size={20} className="text-indigo-600 flex-shrink-0" />
        <div>
          <p className="text-sm font-semibold text-indigo-900">Fórmula de cálculo</p>
          <p className="text-sm text-indigo-700 mt-0.5 font-mono">
            Turnover (%) = (Nº Demissões ÷ Headcount Médio) × 100
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Turnover Acumulado (12m)"
          value="0,00%"
          icon={<TrendingDown size={20} className="text-red-600" />}
          iconBg="bg-red-100"
          subtitle="Últimos 12 meses"
        />
        <StatCard title="Admissões (12m)" value="0" iconBg="bg-green-100" icon={<TrendingDown size={20} className="text-green-600" />} />
        <StatCard title="Demissões (12m)" value="0" iconBg="bg-red-100" icon={<TrendingDown size={20} className="text-red-600" />} />
        <StatCard title="Headcount Atual" value="0" iconBg="bg-indigo-100" icon={<TrendingDown size={20} className="text-indigo-600" />} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Line chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Evolução do Turnover (% mensal)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={monthlyTurnover}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" />
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} unit="%" />
              <Tooltip formatter={(v: number) => [`${v.toFixed(2)}%`, 'Turnover']} />
              <Line type="monotone" dataKey="taxa" stroke="#4F46E5" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* By sector */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Turnover por Setor</h3>
          <div className="flex items-center justify-center h-48 text-gray-400">
            <div className="text-center">
              <TrendingDown size={40} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">Sem dados de colaboradores cadastrados</p>
            </div>
          </div>
        </div>
      </div>

      {/* By contract type */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Turnover por Tipo de Contrato</h3>
        <div className="grid grid-cols-3 gap-4">
          {['CLT', 'Estagiário', 'Terceiro / PJ'].map(tipo => (
            <div key={tipo} className="bg-gray-50 rounded-xl p-4 text-center">
              <p className="text-sm text-gray-500">{tipo}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">0,00%</p>
              <p className="text-xs text-gray-400 mt-0.5">0 demissões</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  )
}
