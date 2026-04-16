import React, { useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Users, MessageSquare, UserPlus, TrendingDown, Award, Clock, Target, BookOpen, Calendar } from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

const monthlyData = [
  { mes: 'Nov', admissoes: 3, demissoes: 1 },
  { mes: 'Dez', admissoes: 2, demissoes: 2 },
  { mes: 'Jan', admissoes: 5, demissoes: 1 },
  { mes: 'Fev', admissoes: 4, demissoes: 3 },
  { mes: 'Mar', admissoes: 6, demissoes: 2 },
  { mes: 'Abr', admissoes: 3, demissoes: 1 },
]

const discData = [
  { name: 'D', value: 15, color: '#EF4444' },
  { name: 'I', value: 28, color: '#F59E0B' },
  { name: 'S', value: 35, color: '#10B981' },
  { name: 'C', value: 22, color: '#3B82F6' },
]

const quickActions = [
  { label: 'Colaboradores', icon: <Users size={20} />, path: '/colaboradores', color: 'bg-indigo-50 text-indigo-600' },
  { label: 'Feedback', icon: <MessageSquare size={20} />, path: '/feedback', color: 'bg-blue-50 text-blue-600' },
  { label: 'Recrutamento', icon: <UserPlus size={20} />, path: '/recrutamento', color: 'bg-purple-50 text-purple-600' },
  { label: 'Avaliações', icon: <Target size={20} />, path: '/avaliacao-desempenho', color: 'bg-green-50 text-green-600' },
  { label: 'Treinamentos', icon: <BookOpen size={20} />, path: '/treinamentos', color: 'bg-yellow-50 text-yellow-600' },
  { label: 'Turnover', icon: <TrendingDown size={20} />, path: '/turnover', color: 'bg-red-50 text-red-600' },
  { label: 'Férias', icon: <Calendar size={20} />, path: '/provisao-ferias', color: 'bg-orange-50 text-orange-600' },
  { label: 'ContCoins', icon: <Award size={20} />, path: '/contcoins', color: 'bg-amber-50 text-amber-600' },
]

export function DashboardPage() {
  return (
    <Layout title="Dashboard" subtitle="Visão geral da gestão de pessoas">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Colaboradores Ativos"
          value="0"
          icon={<Users size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-100"
          subtitle="Total na empresa"
        />
        <StatCard
          title="CLT"
          value="0"
          icon={<Users size={20} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="Estagiários"
          value="0"
          icon={<Users size={20} className="text-purple-600" />}
          iconBg="bg-purple-100"
        />
        <StatCard
          title="Turnover"
          value="0%"
          icon={<TrendingDown size={20} className="text-red-600" />}
          iconBg="bg-red-100"
          subtitle="Últimos 12 meses"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Admissões x Demissões */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Admissões x Demissões</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={monthlyData}>
              <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="admissoes" name="Admissões" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              <Bar dataKey="demissoes" name="Demissões" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Perfil DISC */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Distribuição DISC</h3>
          <div className="space-y-3 mt-2">
            {discData.map(d => (
              <div key={d.name} className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                  style={{ backgroundColor: d.color }}
                >
                  {d.name}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{d.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${d.value}%`, backgroundColor: d.color }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-4 text-center">Dados pendentes de cadastro</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {quickActions.map(action => (
            <a
              key={action.path}
              href={action.path}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                {action.icon}
              </div>
              <span className="text-xs font-medium text-gray-700">{action.label}</span>
            </a>
          ))}
        </div>
      </div>
    </Layout>
  )
}
