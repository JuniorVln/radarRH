import React from 'react'
import { cn } from '../../lib/utils'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'blue' | 'purple' | 'green' | 'yellow' | 'red' | 'gray' | 'orange' | 'indigo'
  size?: 'sm' | 'md'
}

export function Badge({ children, variant = 'gray', size = 'md' }: BadgeProps) {
  return (
    <span className={cn(
      'badge',
      `badge-${variant}`,
      size === 'sm' && 'text-xs px-1.5 py-0'
    )}>
      {children}
    </span>
  )
}

interface TabsProps {
  tabs: { label: string; value: string }[]
  value: string
  onChange: (v: string) => void
}

export function Tabs({ tabs, value, onChange }: TabsProps) {
  return (
    <div className="tab-list">
      {tabs.map(tab => (
        <button
          key={tab.value}
          className={cn('tab', value === tab.value && 'active')}
          onClick={() => onChange(tab.value)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  maxWidth?: string
}

export function Modal({ open, onClose, title, children, maxWidth = 'max-w-lg' }: ModalProps) {
  if (!open) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={cn('modal-box', maxWidth)}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-lg font-bold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center mb-4 text-gray-400">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-gray-900 mb-1">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface AvatarProps {
  name: string
  photo?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

const AVATAR_SIZES = {
  sm: 'w-7 h-7 text-xs',
  md: 'w-9 h-9 text-sm',
  lg: 'w-12 h-12 text-base',
  xl: 'w-16 h-16 text-lg',
}

const AVATAR_COLORS = [
  'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-blue-500',
  'bg-green-500', 'bg-yellow-500', 'bg-orange-500', 'bg-red-500',
]

function getAvatarColor(name: string) {
  let sum = 0
  for (let i = 0; i < name.length; i++) sum += name.charCodeAt(i)
  return AVATAR_COLORS[sum % AVATAR_COLORS.length]
}

export function Avatar({ name, photo, size = 'md' }: AvatarProps) {
  const initials = name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  const color = getAvatarColor(name)

  if (photo) {
    return (
      <img
        src={photo}
        alt={name}
        className={cn('rounded-full object-cover', AVATAR_SIZES[size])}
      />
    )
  }

  return (
    <div className={cn(
      'rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0',
      AVATAR_SIZES[size],
      color
    )}>
      {initials}
    </div>
  )
}

interface ProgressBarProps {
  value: number
  max?: number
  color?: string
  showLabel?: boolean
}

export function ProgressBar({ value, max = 100, color = 'bg-indigo-500', showLabel = true }: ProgressBarProps) {
  const pct = Math.min(100, Math.round((value / max) * 100))
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all', color)}
          style={{ width: `${pct}%` }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-gray-500 w-8 text-right">{pct}%</span>
      )}
    </div>
  )
}

interface SearchInputProps {
  value: string
  onChange: (v: string) => void
  placeholder?: string
}

export function SearchInput({ value, onChange, placeholder = 'Buscar...' }: SearchInputProps) {
  return (
    <div className="relative">
      <svg
        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
        width="16" height="16" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="2"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 w-full"
      />
    </div>
  )
}
