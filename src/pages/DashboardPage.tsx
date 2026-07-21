import React, { useState, useEffect } from 'react'
import { Layout } from '../components/layout/Layout'
import { Link } from 'react-router-dom'
import {
  Users,
  MessageSquare,
  UserPlus,
  TrendingDown,
  Award,
  Target,
  BookOpen,
  Calendar,
  Cake,
  BriefcaseBusiness,
  AlertTriangle,
  Plane,
} from 'lucide-react'
import { StatCard } from '../components/ui/StatCard'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import { supabase } from '../lib/supabase'
import { Badge } from '../components/ui'
import { formatDate } from '../lib/utils'

type TipoVinculo = 'CLT' | 'Estagiário' | 'Terceiro' | 'PJ' | 'Mensalista' | 'Horista'

type ColaboradorDashboard = {
  id: string
  nome: string
  tipo: TipoVinculo
  status: string
  perfil_disc: 'D' | 'I' | 'S' | 'C' | null
  data_admissao: string | null
  data_nascimento: string | null
}

type FeriasDashboard = {
  id: string
  colaborador_id: string
  gozo_programado: string | null
  dias: number | null
  status: string | null
}

const TIPOS_VINCULO: { tipo: TipoVinculo; label: string; color: string }[] = [
  { tipo: 'CLT', label: 'CLT', color: 'bg-blue-500' },
  { tipo: 'Estagiário', label: 'Estagiário', color: 'bg-purple-500' },
  { tipo: 'Terceiro', label: 'Terceiro', color: 'bg-yellow-500' },
  { tipo: 'PJ', label: 'PJ', color: 'bg-orange-500' },
  { tipo: 'Mensalista', label: 'Mensalista', color: 'bg-emerald-500' },
  { tipo: 'Horista', label: 'Horista', color: 'bg-cyan-500' },
]

function parseLocalDate(date: string | null | undefined) {
  if (!date) return null
  const [year, month, day] = date.split('T')[0].split('-').map(Number)
  if (!year || !month || !day) return null
  return new Date(year, month - 1, day)
}

function daysBetweenDates(start: Date, end: Date) {
  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate()).getTime()
  const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime()
  return Math.round((endDay - startDay) / 86400000)
}

function addDays(date: Date, days: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + days)
  return next
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameMonth(date: Date | null, reference: Date) {
  return Boolean(date && date.getMonth() === reference.getMonth())
}

function getFeriasColaboradorNome(item: FeriasDashboard, nomeMap: Record<string, string>) {
  return nomeMap[item.colaborador_id] || 'Colaborador'
}

export function DashboardPage() {
  const [stats, setStats] = useState({
    total: 0,
    turnover: 0,
    aniversariantes: 0,
    tempoMedioCasa: '0m',
    experiencia: 0,
  })
  const [vinculos, setVinculos] = useState<Record<TipoVinculo, number>>({
    CLT: 0,
    Estagiário: 0,
    Terceiro: 0,
    PJ: 0,
    Mensalista: 0,
    Horista: 0,
  })
  const [birthdays, setBirthdays] = useState<ColaboradorDashboard[]>([])
  const [tenureHighlights, setTenureHighlights] = useState<{ nome: string; anos: number; meses: number }[]>([])
  const [feriasResumo, setFeriasResumo] = useState({
    saindo: [] as FeriasDashboard[],
    emFerias: [] as FeriasDashboard[],
    retornando: [] as FeriasDashboard[],
  })
  const [experienciaAlerts, setExperienciaAlerts] = useState<
    { colaborador: ColaboradorDashboard; marco: number; data: string; dias: number }[]
  >([])
  const [colaboradorNomeMap, setColaboradorNomeMap] = useState<Record<string, string>>({})
  const [discDistribution, setDiscDistribution] = useState([
    { name: 'D', value: 0, color: '#EF4444' },
    { name: 'I', value: 0, color: '#F59E0B' },
    { name: 'S', value: 0, color: '#10B981' },
    { name: 'C', value: 0, color: '#3B82F6' },
  ])
  const [chartData, setChartData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      setLoading(true)

      const { data: cols } = await supabase
        .from('colaboradores')
        .select('id, nome, tipo, status, perfil_disc, data_admissao, data_nascimento')

      if (cols) {
        const ativos = (cols as ColaboradorDashboard[]).filter(c => c.status === 'ativo')
        const today = new Date()

        const vinculoCounts = TIPOS_VINCULO.reduce((acc, item) => {
          acc[item.tipo] = ativos.filter(c => c.tipo === item.tipo).length
          return acc
        }, {} as Record<TipoVinculo, number>)

        const aniversariantesMes = ativos
          .filter(c => sameMonth(parseLocalDate(c.data_nascimento), today))
          .sort((a, b) => (parseLocalDate(a.data_nascimento)?.getDate() || 0) - (parseLocalDate(b.data_nascimento)?.getDate() || 0))

        const admissionDates = ativos.map(c => parseLocalDate(c.data_admissao)).filter(Boolean) as Date[]
        const totalMonths = admissionDates.reduce((sum, date) => {
          const days = Math.max(0, daysBetweenDates(date, today))
          return sum + Math.floor(days / 30.4375)
        }, 0)
        const avgMonths = admissionDates.length ? Math.round(totalMonths / admissionDates.length) : 0

        const highlights = ativos
          .map(c => {
            const admission = parseLocalDate(c.data_admissao)
            const months = admission ? Math.floor(Math.max(0, daysBetweenDates(admission, today)) / 30.4375) : 0
            return { nome: c.nome, anos: Math.floor(months / 12), meses: months % 12 }
          })
          .filter(item => item.anos > 0 || item.meses > 0)
          .sort((a, b) => (b.anos * 12 + b.meses) - (a.anos * 12 + a.meses))
          .slice(0, 5)

        const experiencia = ativos.flatMap(colaborador => {
          const admissao = parseLocalDate(colaborador.data_admissao)
          if (!admissao) return []
          return [30, 60, 90]
            .map(marco => {
              const milestone = addDays(admissao, marco)
              const dias = daysBetweenDates(today, milestone)
              return {
                colaborador,
                marco,
                data: milestone.toISOString().split('T')[0],
                dias,
              }
            })
            .filter(alerta => alerta.dias >= -7 && alerta.dias <= 15)
        }).sort((a, b) => a.dias - b.dias)

        setVinculos(vinculoCounts)
        setBirthdays(aniversariantesMes.slice(0, 6))
        setTenureHighlights(highlights)
        setExperienciaAlerts(experiencia.slice(0, 6))
        setStats(prev => ({
          ...prev,
          total: ativos.length,
          aniversariantes: aniversariantesMes.length,
          tempoMedioCasa: avgMonths >= 12 ? `${Math.floor(avgMonths / 12)}a ${avgMonths % 12}m` : `${avgMonths}m`,
          experiencia: experiencia.length,
        }))

        const discCounts: any = { D: 0, I: 0, S: 0, C: 0 }
        ativos.forEach(c => {
          if (c.perfil_disc) discCounts[c.perfil_disc]++
        })
        const totalWithDisc = Object.values(discCounts).reduce((a: any, b: any) => a + b, 0) as number

        setDiscDistribution(prev => prev.map(item => ({
          ...item,
          value: totalWithDisc > 0 ? Math.round((discCounts[item.name] / totalWithDisc) * 100) : 0,
        })))

        const nomeMap: Record<string, string> = {}
        ;(cols as ColaboradorDashboard[]).forEach(c => { nomeMap[c.id] = c.nome })
        setColaboradorNomeMap(nomeMap)
      }

      // Admissões vêm da data_admissao dos colaboradores; demissões da tabela
      // movimentacoes (gravada quando o status vira "demitido" no cadastro).
      const { data: movs } = await supabase.from('movimentacoes').select('tipo, data').order('data', { ascending: true })
      {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez']
        const hoje = new Date()
        const admissaoDates = ((cols || []) as ColaboradorDashboard[])
          .map(c => parseLocalDate(c.data_admissao))
          .filter(Boolean) as Date[]
        const demissaoDates = (movs || [])
          .filter(mov => mov.tipo === 'demissao')
          .map(mov => parseLocalDate(mov.data))
          .filter(Boolean) as Date[]

        // Janela rolante: últimos 6 meses terminando no mês atual
        const grouped = []
        for (let i = 5; i >= 0; i--) {
          const ref = new Date(hoje.getFullYear(), hoje.getMonth() - i, 1)
          const inMonth = (d: Date) => d.getFullYear() === ref.getFullYear() && d.getMonth() === ref.getMonth()
          grouped.push({
            mes: months[ref.getMonth()],
            admissoes: admissaoDates.filter(inMonth).length,
            demissoes: demissaoDates.filter(inMonth).length,
          })
        }
        setChartData(grouped)

        const twelveMonthsAgo = addDays(new Date(), -365)
        const demissoes12m = demissaoDates.filter(d => d >= twelveMonthsAgo).length
        setStats(prev => ({
          ...prev,
          turnover: prev.total > 0 ? Number(((demissoes12m / prev.total) * 100).toFixed(1)) : 0,
        }))
      }

      const { data: ferias } = await supabase
        .from('ferias')
        .select('id, colaborador_id, gozo_programado, dias, status')

      if (ferias) {
        const today = startOfLocalDay(new Date())
        const next15 = addDays(today, 15)
        const resumo = {
          saindo: [] as FeriasDashboard[],
          emFerias: [] as FeriasDashboard[],
          retornando: [] as FeriasDashboard[],
        }

        ;(ferias as FeriasDashboard[]).forEach(item => {
          const start = parseLocalDate(item.gozo_programado)
          if (!start || item.status === 'gozada') return
          const end = addDays(start, Math.max(1, item.dias || 30) - 1)
          const returnDate = addDays(end, 1)

          if (start >= today && start <= next15) resumo.saindo.push(item)
          if (start <= today && end >= today) resumo.emFerias.push(item)
          if (returnDate >= today && returnDate <= next15) resumo.retornando.push(item)
        })

        setFeriasResumo({
          saindo: resumo.saindo.slice(0, 5),
          emFerias: resumo.emFerias.slice(0, 5),
          retornando: resumo.retornando.slice(0, 5),
        })
      }

      setLoading(false)
    }

    fetchData()
  }, [])

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

  return (
    <Layout title="Dashboard" subtitle="Visão geral da gestão de pessoas">
      <div className="animate-fade-in">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard
            title="Colaboradores Ativos"
            value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.total)}
            icon={<Users size={20} className="text-indigo-600" />}
            iconBg="bg-indigo-100"
            subtitle="Total na empresa"
          />
          <StatCard
            title="Aniversariantes"
            value={loading ? <div className="h-8 w-12 skeleton" /> : String(stats.aniversariantes)}
            icon={<Cake size={20} className="text-pink-600" />}
            iconBg="bg-pink-100"
            subtitle="Mês atual"
          />
          <StatCard
            title="Tempo Médio"
            value={loading ? <div className="h-8 w-12 skeleton" /> : stats.tempoMedioCasa}
            icon={<BriefcaseBusiness size={20} className="text-emerald-600" />}
            iconBg="bg-emerald-100"
            subtitle="Casa"
          />
          <StatCard
            title="Turnover"
            value={loading ? <div className="h-8 w-12 skeleton" /> : `${stats.turnover}%`}
            icon={<TrendingDown size={20} className="text-red-600" />}
            iconBg="bg-red-100"
            subtitle="Últimos 12 meses"
          />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
          {TIPOS_VINCULO.map(item => (
            <div key={item.tipo} className="bg-white rounded-xl border border-gray-200 p-4">
              <div className={`w-8 h-1.5 rounded-full ${item.color} mb-3`} />
              <p className="text-xs font-medium text-gray-500">{item.label}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {loading ? <span className="inline-block h-7 w-8 skeleton" /> : vinculos[item.tipo]}
              </p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Admissões x Demissões</h3>
            {loading ? (
              <div className="h-[220px] w-full skeleton" />
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={chartData}>
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="admissoes" name="Admissões" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="demissoes" name="Demissões" fill="#EF4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <h3 className="font-semibold text-gray-900 mb-4">Distribuição DISC</h3>
            <div className="space-y-3 mt-2">
              {discDistribution.map(d => (
                <div key={d.name} className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                    style={{ backgroundColor: d.color }}
                  >
                    {d.name}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between text-xs text-gray-500 mb-1">
                      <span>{loading ? '...' : `${d.value}%`}</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{ width: loading ? '0%' : `${d.value}%`, backgroundColor: d.color }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {!loading && stats.total === 0 && <p className="text-xs text-gray-400 mt-4 text-center">Dados pendentes de cadastro</p>}
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <Cake size={18} className="text-pink-600" />
              <h3 className="font-semibold text-gray-900">Aniversários do Mês</h3>
            </div>
            {loading ? <div className="h-32 skeleton" /> : birthdays.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum aniversariante no mês atual.</p>
            ) : (
              <div className="space-y-3">
                {birthdays.map(c => (
                  <div key={c.id} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-700 truncate">{c.nome}</span>
                    <Badge variant="indigo" size="sm">{formatDate(c.data_nascimento)}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <BriefcaseBusiness size={18} className="text-emerald-600" />
              <h3 className="font-semibold text-gray-900">Tempo de Casa</h3>
            </div>
            {loading ? <div className="h-32 skeleton" /> : tenureHighlights.length === 0 ? (
              <p className="text-sm text-gray-400">Sem admissões cadastradas para calcular tempo de casa.</p>
            ) : (
              <div className="space-y-3">
                {tenureHighlights.map(item => (
                  <div key={item.nome} className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-700 truncate">{item.nome}</span>
                    <span className="text-xs text-gray-500">{item.anos}a {item.meses}m</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl border border-gray-200 p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle size={18} className="text-amber-600" />
              <h3 className="font-semibold text-gray-900">Experiência 30/60/90</h3>
            </div>
            {loading ? <div className="h-32 skeleton" /> : experienciaAlerts.length === 0 ? (
              <p className="text-sm text-gray-400">Nenhum alerta contratual nos próximos 15 dias.</p>
            ) : (
              <div className="space-y-3">
                {experienciaAlerts.map(alerta => (
                  <div key={`${alerta.colaborador.id}-${alerta.marco}`} className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-700 truncate">{alerta.colaborador.nome}</p>
                      <p className="text-xs text-gray-400">{formatDate(alerta.data)}</p>
                    </div>
                    <Badge variant={alerta.dias < 0 ? 'red' : 'yellow'} size="sm">{alerta.marco} dias</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Plane size={18} className="text-orange-600" />
            <h3 className="font-semibold text-gray-900">Resumo de Férias</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Saindo', items: feriasResumo.saindo, variant: 'blue' as const },
              { title: 'Em férias', items: feriasResumo.emFerias, variant: 'green' as const },
              { title: 'Retornando', items: feriasResumo.retornando, variant: 'orange' as const },
            ].map(group => (
              <div key={group.title} className="rounded-lg border border-gray-100 p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-semibold text-gray-800">{group.title}</p>
                  <Badge variant={group.variant} size="sm">{group.items.length}</Badge>
                </div>
                {loading ? <div className="h-20 skeleton" /> : group.items.length === 0 ? (
                  <p className="text-xs text-gray-400">Nenhum registro na janela de 15 dias.</p>
                ) : (
                  <div className="space-y-2">
                    {group.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium text-gray-700 truncate">{getFeriasColaboradorNome(item, colaboradorNomeMap)}</span>
                        <span className="text-xs text-gray-400">{formatDate(item.gozo_programado)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-5">
          <h3 className="font-semibold text-gray-900 mb-4">Acesso Rápido</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {quickActions.map(action => (
              <Link
                key={action.path}
                to={action.path}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all cursor-pointer"
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.color}`}>
                  {action.icon}
                </div>
                <span className="text-xs font-medium text-gray-700">{action.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  )
}
