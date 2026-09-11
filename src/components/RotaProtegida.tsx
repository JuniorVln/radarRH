import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Loader2, Lock } from 'lucide-react'
import { useSessao } from '../lib/sessao'

interface Props {
  children: React.ReactNode
  /**
   * Telas da operação do RH. Um colaborador comum autenticado não deve nem chegar nelas —
   * mesmo que chegasse, o banco devolveria só a própria ficha (as policies mandam), mas
   * mostrar uma tela de gestão vazia é pior do que dizer com todas as letras que não é dele.
   */
  somenteRH?: boolean
}

export function RotaProtegida({ children, somenteRH = true }: Props) {
  const { usuario, carregando, ehRH } = useSessao()
  const localizacao = useLocation()

  if (carregando) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  // Guarda o destino para devolver a pessoa ao lugar certo depois do login.
  if (!usuario) {
    return <Navigate to="/login" replace state={{ de: localizacao.pathname + localizacao.search }} />
  }

  if (somenteRH && !ehRH) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6">
        <div className="w-full max-w-sm rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
            <Lock className="text-gray-400" size={22} />
          </div>
          <h2 className="text-lg font-bold text-gray-900">Área restrita ao RH</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Seu acesso não inclui esta tela. Se você precisa dela para trabalhar, fale com o RH.
          </p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
