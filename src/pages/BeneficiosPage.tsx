import React, { useMemo, useState } from 'react'
import { Layout } from '../components/layout/Layout'
import { Badge, SearchInput, Tabs } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import {
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Download,
  Grape,
  Home,
  Train,
} from 'lucide-react'
import {
  BENEFICIOS_MAIO_2026_AMOSTRA,
  CONFERENCIA_PLANILHA_MAIO_2026,
  PERIODO_BENEFICIOS_MAIO_2026,
  calcularBeneficioColaborador,
  gerarTotaisBeneficios,
} from '../lib/beneficios'

type BeneficiosTab = 'resumo' | 'calculo' | 'conferencia'

const currency = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
})

function formatCurrency(value: number) {
  return currency.format(value)
}

export function BeneficiosPage() {
  const [tab, setTab] = useState<BeneficiosTab>('resumo')
  const [search, setSearch] = useState('')
  const resultados = useMemo(
    () => BENEFICIOS_MAIO_2026_AMOSTRA.map(item => calcularBeneficioColaborador(item)),
    []
  )
  const totaisAmostra = useMemo(() => gerarTotaisBeneficios(resultados), [resultados])
  const totaisPlanilha = useMemo(
    () =>
      CONFERENCIA_PLANILHA_MAIO_2026.reduce(
        (acc, empresa) => ({
          colaboradores: acc.colaboradores + empresa.colaboradores,
          totalVr: acc.totalVr + empresa.totalVr,
          totalVt: acc.totalVt + empresa.totalVt,
        }),
        { colaboradores: 0, totalVr: 0, totalVt: 0 }
      ),
    []
  )
  const filtered = resultados.filter(item =>
    `${item.nome} ${item.empresa} ${item.transporte}`.toLowerCase().includes(search.toLowerCase())
  )
  const handleExportPreview = () => {
    const header = ['Colaborador', 'Empresa', 'Total VR', 'Transporte', 'Total VT']
    const rows = resultados.map(item => [
      item.nome,
      item.empresa,
      item.totalVr.toFixed(2).replace('.', ','),
      item.transporte,
      item.totalVt.toFixed(2).replace('.', ','),
    ])
    const csv = [header, ...rows]
      .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(';'))
      .join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'beneficios-previa-2026-05.csv'
    link.click()
    URL.revokeObjectURL(url)
  }

  return (
    <Layout title="Benefícios" subtitle="Motor de cálculo de VR, VT, frutas e descontos por competência">
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard
          title="Competência"
          value="05/2026"
          subtitle={`${PERIODO_BENEFICIOS_MAIO_2026.periodoInicio} a ${PERIODO_BENEFICIOS_MAIO_2026.periodoFim}`}
          icon={<CalendarDays size={20} className="text-indigo-600" />}
          iconBg="bg-indigo-100"
        />
        <StatCard
          title="Dias Úteis"
          value={PERIODO_BENEFICIOS_MAIO_2026.diasUteis}
          subtitle={`${PERIODO_BENEFICIOS_MAIO_2026.diasHomeOffice} segundas/sextas para HO`}
          icon={<Home size={20} className="text-blue-600" />}
          iconBg="bg-blue-100"
        />
        <StatCard
          title="VR Planilha"
          value={formatCurrency(totaisPlanilha.totalVr)}
          subtitle={`${totaisPlanilha.colaboradores} colaboradores conferidos`}
          icon={<Grape size={20} className="text-green-600" />}
          iconBg="bg-green-100"
        />
        <StatCard
          title="VT Planilha"
          value={formatCurrency(totaisPlanilha.totalVt)}
          subtitle="Total por empresa e transporte"
          icon={<Train size={20} className="text-orange-600" />}
          iconBg="bg-orange-100"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <Tabs
            tabs={[
              { label: 'Resumo', value: 'resumo' },
              { label: 'Cálculo por colaborador', value: 'calculo' },
              { label: 'Conferência maio/2026', value: 'conferencia' },
            ]}
            value={tab}
            onChange={value => setTab(value as BeneficiosTab)}
          />
          <button className="btn-secondary" onClick={handleExportPreview}>
            <Download size={16} />
            Exportar prévia
          </button>
        </div>

        {tab === 'resumo' && (
          <div className="p-5 space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-sm text-gray-500">Amostra calculada pelo motor</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totaisAmostra.totalVr)}</p>
                <p className="text-xs text-gray-500 mt-1">VR com faltas, atestados, férias, feriado regional e frutas.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-sm text-gray-500">VT da amostra</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(totaisAmostra.totalVt)}</p>
                <p className="text-xs text-gray-500 mt-1">Desconta home office e aceita valor fixo mensal.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <p className="text-sm text-gray-500">Regras ativas</p>
                <div className="flex flex-wrap gap-2 mt-3">
                  {['VR', 'VT', 'Frutas', 'Home office', 'Férias', 'Faltas', 'Atestados', 'Feriados'].map(rule => (
                    <Badge key={rule} variant="indigo">{rule}</Badge>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Totais por empresa na planilha de maio/2026</h3>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Empresa</th>
                      <th>Colaboradores</th>
                      <th>Total VR</th>
                      <th>Total VT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {CONFERENCIA_PLANILHA_MAIO_2026.map(empresa => (
                      <tr key={empresa.empresa}>
                        <td className="font-medium text-gray-900">{empresa.empresa}</td>
                        <td>{empresa.colaboradores}</td>
                        <td>{formatCurrency(empresa.totalVr)}</td>
                        <td>{formatCurrency(empresa.totalVt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {tab === 'calculo' && (
          <div className="p-5">
            <div className="mb-4 max-w-md">
              <SearchInput value={search} onChange={setSearch} placeholder="Buscar colaborador, empresa ou transporte..." />
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Colaborador</th>
                    <th>Empresa</th>
                    <th>VR</th>
                    <th>Desc. VR</th>
                    <th>Total VR</th>
                    <th>Transporte</th>
                    <th>Desc. VT</th>
                    <th>Total VT</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(item => (
                    <tr key={`${item.empresa}-${item.nome}`}>
                      <td className="font-medium text-gray-900">{item.nome}</td>
                      <td>{item.empresa}</td>
                      <td>{formatCurrency(item.vrBruto)}</td>
                      <td>{item.diasDescontoVr} dia(s)</td>
                      <td>{formatCurrency(item.totalVr)}</td>
                      <td><Badge variant={item.transporte === 'HOME OFFICE' ? 'blue' : 'gray'}>{item.transporte}</Badge></td>
                      <td>{item.diasDescontoVt} dia(s)</td>
                      <td>{formatCurrency(item.totalVt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'conferencia' && (
          <div className="p-5 space-y-5">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 size={20} className="text-green-600 mt-0.5" />
              <div>
                <p className="font-semibold text-green-900">Resultados conferidos contra `Benefícios - 05-26.xlsx`</p>
                <p className="text-sm text-green-700 mt-1">
                  Os totais abaixo reproduzem os totais por empresa e por tipo de transporte extraídos da planilha de maio/2026.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
              {CONFERENCIA_PLANILHA_MAIO_2026.map(empresa => (
                <div key={empresa.empresa} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{empresa.empresa}</h3>
                      <p className="text-sm text-gray-500">{empresa.colaboradores} colaboradores</p>
                    </div>
                    <ClipboardList size={20} className="text-indigo-600" />
                  </div>
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div>
                      <p className="text-xs text-gray-500">VR</p>
                      <p className="font-bold text-gray-900">{formatCurrency(empresa.totalVr)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">VT</p>
                      <p className="font-bold text-gray-900">{formatCurrency(empresa.totalVt)}</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {Object.entries(empresa.vtPorTransporte).map(([tipo, valor]) => (
                      <div key={tipo} className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">{tipo}</span>
                        <span className="font-medium text-gray-900">{formatCurrency(valor)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  )
}
