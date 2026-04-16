import React from 'react'
import { Layout } from '../components/layout/Layout'
import { BarChart2 } from 'lucide-react'
import { DISC_COLORS, DISC_LABELS } from '../lib/utils'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts'

const discDescriptions: Record<string, { strengths: string[]; development: string[]; description: string }> = {
  D: {
    description: 'Pessoas com perfil Dominância são diretas, decisivas e orientadas a resultados. Gostam de desafios e assumem controle das situações.',
    strengths: ['Tomada de decisão rápida', 'Foco em resultados', 'Capacidade de liderança', 'Resolução de problemas'],
    development: ['Paciência e escuta ativa', 'Colaboração em equipe', 'Atenção aos detalhes', 'Comunicação empática'],
  },
  I: {
    description: 'Pessoas com perfil Influência são entusiastas, comunicativas e otimistas. Motivam e inspiram as pessoas ao redor.',
    strengths: ['Comunicação eficaz', 'Influência positiva', 'Criatividade', 'Trabalho em equipe'],
    development: ['Organização e planejamento', 'Cumprimento de prazos', 'Análise crítica', 'Foco em detalhes'],
  },
  S: {
    description: 'Pessoas com perfil Estabilidade são calmas, confiáveis e leais. Valorizam harmonia e consistência no ambiente de trabalho.',
    strengths: ['Confiabilidade', 'Trabalho em equipe', 'Paciência', 'Habilidade de escuta'],
    development: ['Adaptação a mudanças', 'Assertividade', 'Proatividade', 'Tomada de decisão'],
  },
  C: {
    description: 'Pessoas com perfil Conformidade são analíticas, precisas e sistemáticas. Priorizam qualidade e exatidão nas entregas.',
    strengths: ['Análise detalhada', 'Alta qualidade', 'Precisão', 'Pensamento sistemático'],
    development: ['Velocidade de execução', 'Relacionamento interpessoal', 'Flexibilidade', 'Comunicação direta'],
  },
}

const radarData = [
  { subject: 'Dominância', value: 0 },
  { subject: 'Influência', value: 0 },
  { subject: 'Estabilidade', value: 0 },
  { subject: 'Conformidade', value: 0 },
]

export function PerfilComportamentalPage() {
  const userDisc = 'S' // placeholder

  const desc = discDescriptions[userDisc]

  return (
    <Layout title="Meu Perfil Comportamental" subtitle="Análise DISC individual e pontos de desenvolvimento">
      <div className="max-w-3xl mx-auto">
        {/* Profile Header */}
        <div
          className="rounded-2xl p-6 mb-6 text-white"
          style={{ backgroundColor: DISC_COLORS[userDisc] }}
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center text-3xl font-bold">
              {userDisc}
            </div>
            <div>
              <p className="text-white/70 text-sm font-medium">Seu perfil predominante</p>
              <h2 className="text-2xl font-bold">{DISC_LABELS[userDisc]}</h2>
            </div>
          </div>
          <p className="mt-4 text-white/90 text-sm leading-relaxed">{desc.description}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Strengths */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-green-500">✓</span> Pontos Fortes
            </h3>
            <ul className="space-y-2">
              {desc.strengths.map(s => (
                <li key={s} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  {s}
                </li>
              ))}
            </ul>
          </div>

          {/* Development */}
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <span className="text-blue-500">↑</span> Pontos de Desenvolvimento
            </h3>
            <ul className="space-y-2">
              {desc.development.map(d => (
                <li key={d} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                  {d}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* DISC overview */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Todos os Perfis DISC</h3>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(DISC_LABELS).map(([key, label]) => (
              <div
                key={key}
                className={`p-3 rounded-xl border ${userDisc === key ? 'border-2' : 'border border-gray-100'}`}
                style={{ borderColor: userDisc === key ? DISC_COLORS[key] : undefined }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-6 h-6 rounded flex items-center justify-center text-white text-xs font-bold"
                    style={{ backgroundColor: DISC_COLORS[key] }}
                  >
                    {key}
                  </span>
                  <p className="text-sm font-medium text-gray-800">{label}</p>
                  {userDisc === key && <span className="badge badge-green text-xs ml-auto">Seu perfil</span>}
                </div>
                <p className="text-xs text-gray-500">{discDescriptions[key].description.slice(0, 80)}...</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
