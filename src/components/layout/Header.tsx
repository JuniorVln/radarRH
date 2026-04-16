import React from 'react'
import { Search, Bell, Settings, ChevronDown } from 'lucide-react'
import { getInitials } from '../../lib/utils'

interface HeaderProps {
  title: string
  subtitle?: string
}

export function Header({ title, subtitle }: HeaderProps) {
  const userName = 'Admin'

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
        <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 rounded-lg px-2 py-1.5 transition-colors">
          <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
            {getInitials(userName)}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-medium text-gray-900 leading-none">{userName}</p>
            <p className="text-xs text-gray-500 mt-0.5">Administrador</p>
          </div>
          <ChevronDown size={16} className="text-gray-400" />
        </div>
      </div>
    </header>
  )
}
