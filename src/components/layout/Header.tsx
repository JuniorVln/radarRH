import React, { useEffect, useRef, useState } from 'react'
import { Search, Bell, ChevronDown, LogOut } from 'lucide-react'
import { getInitials } from '../../lib/utils'
import { useSessao } from '../../lib/sessao'

interface HeaderProps {
  title: string
  subtitle?: string
}

const NOME_DO_PAPEL: Record<string, string> = {
  admin: 'Administrador',
  rh: 'Recursos Humanos',
  gestor: 'Gestor',
  colaborador: 'Colaborador',
}

export function Header({ title, subtitle }: HeaderProps) {
  const { usuario, sair } = useSessao()
  const userName = usuario?.nome || 'Usuário'
  const [menuAberto, setMenuAberto] = useState(false)
  const caixa = useRef<HTMLDivElement>(null)

  // Fecha ao clicar fora — sem isto o menu fica preso aberto depois de navegar.
  useEffect(() => {
    if (!menuAberto) return
    const aoClicar = (e: MouseEvent) => {
      if (caixa.current && !caixa.current.contains(e.target as Node)) setMenuAberto(false)
    }
    document.addEventListener('mousedown', aoClicar)
    return () => document.removeEventListener('mousedown', aoClicar)
  }, [menuAberto])

  return (
    <header
      className="fixed top-0 right-0 z-40 h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6"
      style={{ left: 'var(--sidebar-width)' }}
    >
      <div>
        <h2 className="text-lg font-bold text-gray-900 leading-none">{title}</h2>
        {subtitle && (
          <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden md:flex items-center">
          <Search size={16} className="absolute left-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar..."
            className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 w-56"
          />
        </div>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors">
          <Bell size={20} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>

        {/* User */}
        <div className="relative" ref={caixa}>
          <button
            type="button"
            onClick={() => setMenuAberto((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={menuAberto}
            className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold overflow-hidden">
              {usuario?.foto_url ? (
                <img src={usuario.foto_url} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(userName)
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-sm font-medium text-gray-900 leading-none">{userName}</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {NOME_DO_PAPEL[usuario?.papel || 'colaborador'] || 'Colaborador'}
              </p>
            </div>
            <ChevronDown size={16} className="text-gray-400" />
          </button>

          {menuAberto && (
            <div
              role="menu"
              className="absolute right-0 mt-2 w-60 rounded-xl border border-gray-100 bg-white py-2 shadow-lg animate-fade-in"
            >
              <div className="px-4 pb-2 pt-1">
                <p className="truncate text-sm font-medium text-gray-900">{userName}</p>
                <p className="truncate text-xs text-gray-500">{usuario?.email}</p>
              </div>
              <div className="my-1 h-px bg-gray-100" />
              <button
                type="button"
                role="menuitem"
                onClick={sair}
                className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50"
              >
                <LogOut size={16} className="text-gray-400" />
                Sair
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
