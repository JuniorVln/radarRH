import React from 'react'
import { Link } from 'react-router-dom'
import { Layout } from '../components/layout/Layout'
import { Home, AlertCircle } from 'lucide-react'

export function NotFoundPage() {
  return (
    <Layout title="404" subtitle="Página não encontrada">
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mb-6">
          <AlertCircle size={40} />
        </div>
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Ops! Página não encontrada</h2>
        <p className="text-gray-500 max-w-md mb-8">
          Parece que o caminho que você tentou acessar não existe ou foi movido.
        </p>
        <Link to="/" className="btn-primary inline-flex items-center gap-2">
          <Home size={18} />
          Voltar ao Início
        </Link>
      </div>
    </Layout>
  )
}
