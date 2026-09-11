import React, { useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Mail, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import { useSessao } from '../lib/sessao'
import { cn } from '../lib/utils'

type Modo = 'entrar' | 'recuperar'

export function LoginPage() {
  const { usuario, carregando, entrar } = useSessao()
  const localizacao = useLocation()

  const [modo, setModo] = useState<Modo>('entrar')
  const [email, setEmail] = useState('')
  const [senha, setSenha] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  if (carregando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin text-primary" size={28} />
      </div>
    )
  }

  if (usuario) {
    const destino = (localizacao.state as { de?: string } | null)?.de || '/'
    return <Navigate to={destino} replace />
  }

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    setAviso(null)
    setEnviando(true)
    try {
      if (modo === 'recuperar') {
        const r = await fetch('/api/auth/primeiro-acesso', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        })
        const dados = await r.json()
        setAviso(dados.mensagem || 'Se houver uma conta com esse e-mail, o link chega em instantes.')
        return
      }

      const r = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, senha }),
      })
      const dados = await r.json()
      if (!r.ok) {
        setErro(dados.erro || 'Não foi possível entrar.')
        return
      }
      entrar(dados)
    } catch {
      setErro('Sem conexão com o servidor. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="min-h-screen bg-white lg:grid lg:grid-cols-[1.05fr_1fr]">
      {/* ------------------------------------------------------------------ painel da marca */}
      <aside className="relative hidden lg:flex flex-col justify-between overflow-hidden bg-sidebar px-14 py-12 text-white">
        {/* brilhos de fundo — dão profundidade sem precisar de imagem */}
        <div className="pointer-events-none absolute -top-32 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />
        <div className="pointer-events-none absolute bottom-[-10rem] right-[-6rem] h-[28rem] w-[28rem] rounded-full bg-indigo-500/20 blur-3xl" />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/30">
              <svg viewBox="0 0 24 24" className="h-6 w-6 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 21V7l9-4 9 4v14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-[15px] font-bold">Rede Ideia</p>
              <p className="text-xs text-slate-400">Recursos Humanos</p>
            </div>
          </div>
        </div>

        <div className="relative max-w-md">
          <h1 className="text-[2.6rem] font-bold leading-[1.1] tracking-tight">
            O RH da Rede Ideia,
            <br />
            <span className="text-primary-light">em um lugar só.</span>
          </h1>
          <p className="mt-5 text-[15px] leading-relaxed text-slate-400">
            Colaboradores, benefícios, férias, recrutamento e desempenho — sem planilha
            paralela e sem trocar de sistema no meio do caminho.
          </p>

          <ul className="mt-9 space-y-3.5">
            {[
              'Vale-refeição e transporte calculados sozinhos',
              'Recrutamento com página pública de vagas',
              'Perfil comportamental sem limite de créditos',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3 text-[14px] text-slate-300">
                <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-primary-light" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative flex items-center gap-2 text-xs text-slate-400">
          <ShieldCheck size={14} />
          Acesso individual — cada pessoa vê apenas o que o seu perfil permite.
        </div>
      </aside>

      {/* ------------------------------------------------------------------------ formulário */}
      <main className="flex min-h-screen items-center justify-center px-6 py-12 sm:px-10">
        <div className="w-full max-w-[400px]">
          {/* marca compacta, só no mobile — no desktop ela já está no painel ao lado */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 21V7l9-4 9 4v14" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-bold text-gray-900">Rede Ideia</p>
              <p className="text-xs text-gray-500">Recursos Humanos</p>
            </div>
          </div>

          <h2 className="text-[26px] font-bold tracking-tight text-gray-900">
            {modo === 'entrar' ? 'Entrar' : 'Recuperar acesso'}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            {modo === 'entrar'
              ? 'Use o e-mail cadastrado no seu perfil de colaborador.'
              : 'Informe seu e-mail e enviamos um link para você criar uma nova senha.'}
          </p>

          <form onSubmit={aoEnviar} className="mt-8 space-y-5" noValidate>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
                E-mail
              </label>
              <div className="relative">
                <Mail size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="username"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="voce@redeideia.com.br"
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                />
              </div>
            </div>

            {modo === 'entrar' && (
              <div>
                <div className="mb-1.5 flex items-baseline justify-between">
                  <label htmlFor="senha" className="block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setModo('recuperar')
                      setErro(null)
                      setAviso(null)
                    }}
                    className="text-xs font-medium text-primary hover:text-primary-dark"
                  >
                    Esqueci minha senha
                  </button>
                </div>
                <div className="relative">
                  <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    id="senha"
                    name="senha"
                    type={verSenha ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-sm text-gray-900 placeholder:text-gray-400 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => setVerSenha((v) => !v)}
                    aria-label={verSenha ? 'Ocultar senha' : 'Mostrar senha'}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-gray-400 transition hover:text-gray-600"
                  >
                    {verSenha ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>
            )}

            {erro && (
              <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                {erro}
              </p>
            )}
            {aviso && (
              <p role="status" className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                {aviso}
              </p>
            )}

            <button
              type="submit"
              disabled={enviando}
              className={cn(
                'group flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition',
                'hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20',
                'disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none'
              )}
            >
              {enviando ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <>
                  {modo === 'entrar' ? 'Entrar' : 'Enviar link'}
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
                </>
              )}
            </button>

            {modo === 'recuperar' && (
              <button
                type="button"
                onClick={() => {
                  setModo('entrar')
                  setErro(null)
                  setAviso(null)
                }}
                className="w-full text-center text-sm font-medium text-gray-500 transition hover:text-gray-800"
              >
                Voltar para o login
              </button>
            )}
          </form>

          <p className="mt-10 text-center text-xs leading-relaxed text-gray-400">
            Primeiro acesso? Use <span className="font-medium text-gray-500">Esqueci minha senha</span> com o
            e-mail do seu cadastro para criar a sua.
          </p>
        </div>
      </main>
    </div>
  )
}
