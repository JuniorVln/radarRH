import React from 'react'
import { Modal } from '../ui'
import type { Colaborador } from '../../lib/supabase'
import { DISC_COLORS, DISC_LABELS } from '../../lib/utils'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts'

interface Props {
  open: boolean
  onClose: () => void
  colaboradores: Colaborador[]
}

export function AnaliseComportamentalModal({ open, onClose, colaboradores }: Props) {
  const discCount = { D: 0, I: 0, S: 0, C: 0 }
  colaboradores.forEach(c => {
    if (c.perfil_disc) discCount[c.perfil_disc]++
  })

  const chartData = Object.entries(discCount).map(([key, val]) => ({
    name: key,
    label: DISC_LABELS[key],
    value: val,
    color: DISC_COLORS[key],
  }))

  const total = colaboradores.length

  return (
    <Modal open={open} onClose={onClose} title="Análise Comportamental — DISC" maxWidth="max-w-2xl">
      <div className="grid grid-cols-2 gap-6">
        {/* Bar chart */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Distribuição por Perfil</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip formatter={(v: number) => [v, 'Colaboradores']} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Summary cards */}
        <div>
          <h4 className="text-sm font-semibold text-gray-700 mb-3">Resumo</h4>
          <div className="space-y-2">
            {chartData.map(d => (
              <div key={d.name} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: d.color }}
                >
                  {d.name}
                </div>
                <div className="flex-1">
                  <p className="text-xs font-medium text-gray-700">{d.label}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${total > 0 ? (d.value / total) * 100 : 0}%`, backgroundColor: d.color }}
                      />
                    </div>
                    <span className="text-xs text-gray-500">{d.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {total > 0 ? `${total} colaboradores analisados` : 'Nenhum colaborador com perfil DISC definido'}
          </p>
        </div>
      </div>

      <div className="mt-4 p-3 bg-indigo-50 rounded-xl">
        <p className="text-xs text-indigo-700 font-medium">Sobre a metodologia DISC</p>
        <p className="text-xs text-indigo-600 mt-1">
          D = Dominância (foco em resultados) · I = Influência (foco em pessoas) · S = Estabilidade (foco em segurança) · C = Conformidade (foco em qualidade)
        </p>
      </div>
    </Modal>
  )
}
