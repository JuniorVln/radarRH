import React from 'react'
import { cn } from '../../lib/utils'

interface StatCardProps {
  title: string
  value: string | number
  icon?: React.ReactNode
  iconBg?: string
  change?: string
  changeType?: 'up' | 'down' | 'neutral'
  subtitle?: string
}

export function StatCard({ title, value, icon, iconBg = 'bg-indigo-100', change, changeType, subtitle }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
          {change && (
            <p className={cn(
              'text-xs mt-1 font-medium',
              changeType === 'up' && 'text-green-600',
              changeType === 'down' && 'text-red-600',
              changeType === 'neutral' && 'text-gray-500',
            )}>
              {change}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center', iconBg)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
