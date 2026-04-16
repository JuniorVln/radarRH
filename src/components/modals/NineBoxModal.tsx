import React from 'react'
import { Modal } from '../ui'
import type { Colaborador } from '../../lib/supabase'
import { Avatar } from '../ui'

interface Props {
  open: boolean
  onClose: () => void
  colaboradores: Colaborador[]
}

const QUADRANTES = [
  { x: 'Alto', y: 'Alto', label: 'Estrela', color: '#4F46E5', bg: '#EEF2FF' },
  { x: 'Médio', y: 'Alto', label: 'Alta Performance', color: '#059669', bg: '#D1FAE5' },
  { x: 'Baixo', y: 'Alto', label: 'Potencial Latente', color: '#0891B2', bg: '#CFFAFE' },
  { x: 'Alto', y: 'Médio', label: 'Bem Posicionado', color: '#7C3AED', bg: '#EDE9FE' },
  { x: 'Médio', y: 'Médio', label: 'Mediano', color: '#D97706', bg: '#FEF3C7' },
  { x: 'Baixo', y: 'Médio', label: 'Em Desenvolvimento', color: '#B45309', bg: '#FDE68A' },
  { x: 'Alto', y: 'Baixo', label: 'Incongruente', color: '#DC2626', bg: '#FEE2E2' },
  { x: 'Médio', y: 'Baixo', label: 'Questionável', color: '#EA580C', bg: '#FFEDD5' },
  { x: 'Baixo', y: 'Baixo', label: 'Crítico', color: '#991B1B', bg: '#FEE2E2' },
]

export function NineBoxModal({ open, onClose, colaboradores }: Props) {
  return (
    <Modal open={open} onClose={onClose} title="Nine Box — Potencial × Desempenho" maxWidth="max-w-3xl">
      <div className="mb-4 flex items-center gap-4 text-xs text-gray-500">
        <span>↑ Desempenho (Y)</span>
        <span>→ Potencial (X)</span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {/* Row 1: Alto desempenho */}
        {[
          { label: 'Potencial Latente', sub: 'Alto desempenho, baixo potencial', color: '#0891B2', bg: '#CFFAFE' },
          { label: 'Alta Performance', sub: 'Alto desempenho, médio potencial', color: '#059669', bg: '#D1FAE5' },
          { label: 'Estrela', sub: 'Alto desempenho, alto potencial', color: '#4F46E5', bg: '#EEF2FF' },
        ].map((q, i) => (
          <div key={i} className="rounded-xl p-3 min-h-[100px] border" style={{ backgroundColor: q.bg, borderColor: q.color + '30' }}>
            <p className="text-xs font-bold" style={{ color: q.color }}>{q.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{q.sub}</p>
            {colaboradores.length === 0 && (
              <p className="text-xs text-gray-400 mt-2 italic">Sem colaboradores</p>
            )}
          </div>
        ))}

        {/* Row 2: Médio desempenho */}
        {[
          { label: 'Em Desenvolvimento', sub: 'Médio desempenho, baixo potencial', color: '#B45309', bg: '#FDE68A' },
          { label: 'Mediano', sub: 'Médio desempenho, médio potencial', color: '#D97706', bg: '#FEF3C7' },
          { label: 'Bem Posicionado', sub: 'Médio desempenho, alto potencial', color: '#7C3AED', bg: '#EDE9FE' },
        ].map((q, i) => (
          <div key={i} className="rounded-xl p-3 min-h-[100px] border" style={{ backgroundColor: q.bg, borderColor: q.color + '30' }}>
            <p className="text-xs font-bold" style={{ color: q.color }}>{q.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{q.sub}</p>
          </div>
        ))}

        {/* Row 3: Baixo desempenho */}
        {[
          { label: 'Crítico', sub: 'Baixo desempenho, baixo potencial', color: '#991B1B', bg: '#FEE2E2' },
          { label: 'Questionável', sub: 'Baixo desempenho, médio potencial', color: '#EA580C', bg: '#FFEDD5' },
          { label: 'Incongruente', sub: 'Baixo desempenho, alto potencial', color: '#DC2626', bg: '#FEE2E2' },
        ].map((q, i) => (
          <div key={i} className="rounded-xl p-3 min-h-[100px] border" style={{ backgroundColor: q.bg, borderColor: q.color + '30' }}>
            <p className="text-xs font-bold" style={{ color: q.color }}>{q.label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{q.sub}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-between text-xs text-gray-400 mt-2">
        <span>← Baixo Potencial</span>
        <span>Alto Potencial →</span>
      </div>

      <p className="text-xs text-gray-400 text-center mt-4">
        As avaliações de desempenho e potencial são preenchidas nas avaliações de desempenho.
      </p>
    </Modal>
  )
}
