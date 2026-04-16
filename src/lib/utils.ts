import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format, parseISO, differenceInDays, isAfter, isBefore } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | null | undefined) {
  if (!date) return '—'
  try {
    return format(parseISO(date), 'dd/MM/yyyy', { locale: ptBR })
  } catch {
    return date
  }
}

export function formatDatetime(date: string | null | undefined) {
  if (!date) return '—'
  try {
    return format(parseISO(date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
  } catch {
    return date
  }
}

export function daysBetween(date: string) {
  const days = differenceInDays(new Date(), parseISO(date))
  return days
}

export function isOverdue(date: string) {
  return isAfter(new Date(), parseISO(date))
}

export function formatCPF(cpf: string) {
  const clean = cpf.replace(/\D/g, '')
  return clean.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')
}

export function formatCurrency(value: number | null | undefined) {
  if (value == null) return '—'
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}

export function getInitials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map(n => n[0])
    .join('')
    .toUpperCase()
}

export const DISC_COLORS: Record<string, string> = {
  D: '#EF4444',
  I: '#F59E0B',
  S: '#10B981',
  C: '#3B82F6',
}

export const DISC_LABELS: Record<string, string> = {
  D: 'Dominância',
  I: 'Influência',
  S: 'Estabilidade',
  C: 'Conformidade',
}

export const TIPO_COLORS: Record<string, string> = {
  CLT: 'badge-blue',
  Estagiário: 'badge-purple',
  Terceiro: 'badge-yellow',
  PJ: 'badge-orange',
}

export const STATUS_COLORS: Record<string, string> = {
  ativo: 'badge-green',
  inativo: 'badge-gray',
  demitido: 'badge-red',
  pendente: 'badge-yellow',
  realizado: 'badge-green',
  atrasado: 'badge-red',
  aberta: 'badge-green',
  fechada: 'badge-gray',
  pausada: 'badge-yellow',
}

export function generateId() {
  return crypto.randomUUID()
}
