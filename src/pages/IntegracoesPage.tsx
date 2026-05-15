import React from 'react'
import { CheckCircle, KeyRound, PlugZap, ShieldAlert } from 'lucide-react'
import { Layout } from '../components/layout/Layout'
import { Badge } from '../components/ui'
import { StatCard } from '../components/ui/StatCard'
import { integrationCatalog } from '../lib/integrations'

export function IntegracoesPage() {
  const totalRequired = integrationCatalog.reduce(
    (sum, item) => sum + item.requirements.filter(req => req.required).length,
    0
  )
  const optional = integrationCatalog.reduce(
    (sum, item) => sum + item.requirements.filter(req => !req.required).length,
    0
  )

  return (
    <Layout title="Integrações" subtitle="Adapters e configurações necessárias para provedores reais">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <StatCard title="Adapters" value={String(integrationCatalog.length)} icon={<PlugZap size={20} className="text-indigo-600" />} iconBg="bg-indigo-100" />
        <StatCard title="Modo Stub" value={String(integrationCatalog.filter(i => i.status === 'stub').length)} icon={<ShieldAlert size={20} className="text-yellow-600" />} iconBg="bg-yellow-100" />
        <StatCard title="Obrigatórias" value={String(totalRequired)} icon={<KeyRound size={20} className="text-red-600" />} iconBg="bg-red-100" />
        <StatCard title="Opcionais" value={String(optional)} icon={<CheckCircle size={20} className="text-green-600" />} iconBg="bg-green-100" />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Catálogo de provedores</h3>
          <p className="text-sm text-gray-500 mt-1">
            Estes adapters ainda não enviam dados externos. Eles documentam o contrato mínimo para ativar OCR, WhatsApp, portal de vagas, e-mail e Ideia Signer.
          </p>
        </div>

        <div className="divide-y divide-gray-100">
          {integrationCatalog.map(item => (
            <section key={item.provider} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3 mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-gray-900">{item.name}</h4>
                    <Badge variant={item.status === 'stub' ? 'yellow' : item.status === 'configured' ? 'green' : 'red'}>
                      {item.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {item.requirements.map(req => (
                  <div key={req.key} className="border border-gray-200 rounded-lg p-3 bg-gray-50">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900">{req.label}</p>
                      <Badge variant={req.required ? 'red' : 'gray'} size="sm">{req.required ? 'obrigatório' : 'opcional'}</Badge>
                    </div>
                    <code className="block text-xs text-indigo-700 mt-1">{req.key}</code>
                    <p className="text-xs text-gray-500 mt-2">{req.description}</p>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      </div>
    </Layout>
  )
}
