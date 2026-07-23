import React, { useEffect, useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { TrendingDown, TrendingUp, Users, AlertCircle } from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { supabase } from '../lib/supabase'
import type { Colaborador, Movimentacao } from '../lib/supabase'
import toast from 'react-hot-toast'

const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']

function parseLocalDate(date: string | null | undefined) {
  if (!date) return null
  const [year, month, day] = date.split('T')[0].split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

export function TurnoverPage() {
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([])
  const [movimentacoes, setMovimentacoes] = useState<Movimentacao[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [colsRes, movsRes] = await Promise.all([
        supabase.from('colaboradores').select('*'),
        supabase.from('movimentacoes').select('*').order('data', { ascending: true }),
      ])
      if (colsRes.error) toast.error('Erro ao carregar colaboradores.')
      setColaboradores((colsRes.data || []) as Colaborador[])
      setMovimentacoes((movsRes.data || []) as Movimentacao[])
      setLoading(false)
    }
    fetchData()
  }, [])

  const computed = useMemo(() => {
    const hoje = new Date()
    const umAnoAtras = new Date(hoje.getFullYear() - 1, hoje.getMonth(), hoje.getDate())

    const headcount = colaboradores.filter(c => c.status === 'ativo').length
    const demissoesMovs = movimentacoes.filter(m => m.tipo === 'demissao')

    // Admissões: data_admissao + movimentacoes tipo "admissao" (readmissões),
    // deduplicadas por colaborador+data — o cadastro novo gera os dois registros.
    const admissaoKeys = new Set<string>()
    const admissaoDates: Date[] = []
    colaboradores.forEach(c => {
      if (!c.data_admissao) return
      admissaoKeys.add(`${c.id}|${String(c.data_admissao).slice(0, 10)}`)
      const d = parseLocalDate(c.data_admissao)
      if (d) admissaoDates.push(d)
    })
    movimentacoes.filter(m => m.tipo === 'admissao').forEach(m => {
      const key = `${m.colaborador_id}|${String(m.data).slice(0, 10)}`
      if (admissaoKeys.has(key)) return
      admissaoKeys.add(key)
      const d = parseLocalDate(m.data)
      if (d) admissaoDates.push(d)
    })

    const admissoes12m = admissaoDates.filter(d => d >= umAnoAtras).length

    const demissaoDates = demissoesMovs.map(m => parseLocalDate(m.data)).filter(Boolean) as Date[]
    const demissoes12mList = demissoesMovs.filter(m => {
      const d = parseLocalDate(m.data)
      return d && d >= umAnoAtras
    })
    const demissoes12m = demissoes12mList.length

    // Evolução mensal (últimos 12 meses). O headcount de cada mês é reconstruído
    // de trás pra frente a partir do atual, usando os eventos de admissão/demissão.
    const monthly: { mes: string; taxa: number; demissoes: number; headcount: number }[] = []
    for (let i = 11; i >= 0; i--) {
      const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
      const fimMes = new Date(ref.getFullYear(), ref.getMonth() + 1, 1)
      const headcountFimMes = Math.max(0,
        headcount
        - admissaoDates.filter(d => d >= fimMes).length
        + demissaoDates.filter(d => d >= fimMes).length,
      )
      const dems = demissaoDates.filter(d => d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()).length
      monthly.push({
        mes: `${MESES[ref.getMonth()]}${ref.getMonth() === 0 ? '/' + String(ref.getFullYear()).slice(2) : ''}`,
        taxa: headcountFimMes > 0 ? Number(((dems / headcountFimMes) * 100).toFixed(2)) : 0,
        demissoes: dems,
        headcount: headcountFimMes,
      })
    }

    const headcountMedio12m = monthly.reduce((acc, m) => acc + m.headcount, 0) / 12
    const turnover12m = headcountMedio12m > 0 ? (demissoes12m / headcountMedio12m) * 100 : 0

    // Por setor e por tipo de contrato (via colaborador da movimentação)
    const porSetor: Record<string, number> = {}
    const porTipo: Record<string, number> = {}
    demissoes12mList.forEach(m => {
      const c = colaboradores.find(c => c.id === m.colaborador_id)
      const setor = c?.setor || 'Sem setor'
      const tipo = c?.tipo || 'Outro'
      porSetor[setor] = (porSetor[setor] || 0) + 1
      porTipo[tipo] = (porTipo[tipo] || 0) + 1
    })

    return { headcount, headcountMedio12m, admissoes12m, demissoes12m, turnover12m, monthly, porSetor, porTipo }
  }, [colaboradores, movimentacoes])

  const tiposContrato = ['CLT', 'Mensalista', 'Horista', 'Estagiário', 'PJ', 'Terceiro']

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
          <p className="text-xs text-indigo-500 mt-1">
            As demissões são contabilizadas quando um colaborador é marcado como "Demitido" no cadastro.
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Turnover Acumulado (12m)"
          value={loading ? '—' : `${computed.turnover12m.toFixed(2).replace('.', ',')}%`}
          icon={<TrendingDown size={20} className="text-red-600" />}
          iconBg="bg-red-100"
          subtitle="Últimos 12 meses"
        />
        <StatCard title="Admissões (12m)" value={loading ? '—' : String(computed.admissoes12m)} iconBg="bg-green-100" icon={<TrendingUp size={20} className="text-green-600" />} />
        <StatCard title="Demissões (12m)" value={loading ? '—' : String(computed.demissoes12m)} iconBg="bg-red-100" icon={<TrendingDown size={20} className="text-red-600" />} />
        <StatCard title="Headcount Atual" value={loading ? '—' : String(computed.headcount)} iconBg="bg-indigo-100" icon={<Users size={20} className="text-indigo-600" />} subtitle={loading ? undefined : `Médio 12m: ${computed.headcountMedio12m.toFixed(1).replace('.', ',')}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Line chart */}
        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Evolução do Turnover (% mensal)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={computed.monthly}>
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
          <h3 className="font-semibold text-gray-900 mb-4">Demissões por Setor (12m)</h3>
          {loading || Object.keys(computed.porSetor).length === 0 ? (
            <div className="flex items-center justify-center h-48 text-gray-400">
              <div className="text-center">
                <TrendingDown size={40} className="mx-auto mb-2 opacity-30" />
                <p className="text-sm">{loading ? 'Carregando...' : 'Nenhuma demissão registrada nos últimos 12 meses'}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.entries(computed.porSetor).sort((a, b) => b[1] - a[1]).map(([setor, qtd]) => (
                <div key={setor} className="flex items-center gap-3">
                  <span className="text-sm text-gray-700 flex-1 truncate">{setor}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2">
                    <div className="bg-red-400 h-2 rounded-full" style={{ width: `${Math.min(100, (qtd / Math.max(1, computed.demissoes12m)) * 100)}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-gray-900 w-8 text-right">{qtd}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* By contract type */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h3 className="font-semibold text-gray-900 mb-4">Turnover por Tipo de Contrato (12m)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tiposContrato.map(tipo => {
            const dems = computed.porTipo[tipo] || 0
            const base = colaboradores.filter(c => c.status === 'ativo' && c.tipo === tipo).length
            const taxa = base > 0 ? (dems / base) * 100 : 0
            return (
              <div key={tipo} className="bg-gray-50 rounded-xl p-4 text-center">
                <p className="text-sm text-gray-500">{tipo}</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{loading ? '—' : `${taxa.toFixed(2).replace('.', ',')}%`}</p>
                <p className="text-xs text-gray-400 mt-0.5">{dems} demissõe(s)</p>
              </div>
            )
          })}
        </div>
      </div>
    </Layout>
  )
}
