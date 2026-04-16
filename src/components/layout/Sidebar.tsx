import React, { useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  Users, MessageSquare, UserPlus, TrendingDown, Calendar,
  Clock, BarChart2, Award, BookOpen, Bell, Rss,
  ChevronRight, ChevronDown, LayoutDashboard, Settings, LogOut,
  Target, Briefcase
} from 'lucide-react'
import { cn } from '../../lib/utils'

interface NavItem {
  label: string
  icon: React.ReactNode
  path: string
  badge?: number
  children?: { label: string; path: string }[]
}

const navItems: NavItem[] = [
  {
    label: 'Painel',
    icon: <LayoutDashboard size={18} />,
    path: '/',
  },
  {
    label: 'Colaboradores',
    icon: <Users size={18} />,
    path: '/colaboradores',
  },
  {
    label: 'Feedback',
    icon: <MessageSquare size={18} />,
    path: '/feedback',
  },
  {
    label: 'Recrutamento',
    icon: <UserPlus size={18} />,
    path: '/recrutamento',
  },
  {
    label: 'Avaliação de Desempenho',
    icon: <Target size={18} />,
    path: '/avaliacao-desempenho',
  },
  {
    label: 'Turnover',
    icon: <TrendingDown size={18} />,
    path: '/turnover',
  },
  {
    label: 'Provisão de Férias',
    icon: <Calendar size={18} />,
    path: '/provisao-ferias',
  },
  {
    label: 'Banco de Horas',
    icon: <Clock size={18} />,
    path: '/banco-de-horas',
  },
  {
    label: 'Treinamentos',
    icon: <BookOpen size={18} />,
    path: '/treinamentos',
  },
  {
    label: 'ContCoins',
    icon: <Award size={18} />,
    path: '/contcoins',
  },
  {
    label: 'Mural de Recados',
    icon: <Bell size={18} />,
    path: '/mural-recados',
  },
  {
    label: 'Feed RH',
    icon: <Rss size={18} />,
    path: '/feed-rh',
  },
  {
    label: 'Meu Perfil Comportamental',
    icon: <BarChart2 size={18} />,
    path: '/perfil-comportamental',
  },
]

export function Sidebar() {
  const location = useLocation()

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-800">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
          <Briefcase size={16} className="text-white" />
        </div>
        <div>
          <h1 className="text-white font-bold text-sm leading-none">Radar</h1>
          <p className="text-slate-400 text-xs mt-0.5">Gestão de Pessoas</p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5">
        <p className="px-5 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">Menu</p>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path ||
            (item.path !== '/' && location.pathname.startsWith(item.path))

          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'sidebar-link',
                isActive && 'active'
              )}
            >
              <span className={cn(isActive ? 'text-white' : 'text-slate-400')}>
                {item.icon}
              </span>
              <span className="flex-1 text-sm">{item.label}</span>
              {item.badge && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </NavLink>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-800 p-3 space-y-1">
        <NavLink to="/configuracoes" className="sidebar-link">
          <Settings size={18} className="text-slate-400" />
          <span className="text-sm">Configurações</span>
        </NavLink>
        <button
          className="sidebar-link w-full text-left"
          onClick={() => {}}
        >
          <LogOut size={18} className="text-slate-400" />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </aside>
  )
}
