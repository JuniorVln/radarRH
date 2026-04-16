import React from 'react'
import { Sidebar } from './Sidebar'
import { Header } from './Header'

interface LayoutProps {
  children: React.ReactNode
  title: string
  subtitle?: string
}

export function Layout({ children, title, subtitle }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Header title={title} subtitle={subtitle} />
      <main className="page-content">
        <div className="page-inner">
          {children}
        </div>
      </main>
    </div>
  )
}
