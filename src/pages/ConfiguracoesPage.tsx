import React from 'react'
import { Layout } from '../components/layout/Layout'
import { Settings, Shield, Bell, Building, Users } from 'lucide-react'

export function ConfiguracoesPage() {
  return (
    <Layout title="Configurações" subtitle="Gerencie as preferências do sistema">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Menu Lateral de Configurações */}
        <div className="md:col-span-1 space-y-2">
          <button className="w-full flex items-center gap-3 px-4 py-3 bg-white border border-indigo-100 text-indigo-700 rounded-xl font-medium shadow-sm">
            <Building size={18} />
            Dados da Empresa
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white rounded-xl transition-all">
            <Users size={18} />
            Usuários e Permissões
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white rounded-xl transition-all">
            <Shield size={18} />
            Segurança
          </button>
          <button className="w-full flex items-center gap-3 px-4 py-3 text-gray-600 hover:bg-white rounded-xl transition-all">
            <Bell size={18} />
            Notificações
          </button>
        </div>

        {/* Conteúdo Principal */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Dados da Empresa</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nome Fantasia</label>
                  <input type="text" className="input" defaultValue="Rede Ideia" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ</label>
                  <input type="text" className="input" defaultValue="00.000.000/0001-00" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">E-mail de Contato</label>
                <input type="email" className="input" defaultValue="rh@redeideia.com.br" />
              </div>
              <div className="pt-4 border-t border-gray-50 flex justify-end">
                <button className="btn-primary">Salvar Alterações</button>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Personalização</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center">
                  <Settings size={20} />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Modo Escuro</p>
                  <p className="text-xs text-gray-500">Ativar tema escuro em toda a interface</p>
                </div>
              </div>
              <div className="w-12 h-6 bg-gray-300 rounded-full relative cursor-pointer">
                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}
