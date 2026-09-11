import React, { useEffect, useMemo, useState } from 'react'
import { Navigate, useSearchParams, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Lock, Check, X, ArrowRight, AlertTriangle } from 'lucide-react'
import { useSessao } from '../lib/sessao'
import { cn } from '../lib/utils'

// Regras conferidas também no servidor (`problemaNaSenha` em api/_acesso.js). Aqui elas
// existem para a pessoa ver o que falta ANTES de enviar, não como validação de verdade.
const REGRAS = [
  { texto: 'Pelo menos 8 caracteres', ok: (s: string) => s.length >= 8 },
  { texto: 'Uma letra', ok: (s: string) => /[a-zA-Z]/.test(s) },
  { texto: 'Um número', ok: (s: string) => /[0-9]/.test(s) },
]

export function DefinirSenhaPage() {
  const [params] = useSearchParams()
  const token = params.get('t') || ''
  const { usuario, entrar } = useSessao()

  const [conferindo, setConferindo] = useState(true)
  const [valido, setValido] = useState(false)
  const [nome, setNome] = useState<string | null>(null)
  const [tipo, setTipo] = useState<'primeiro_acesso' | 'redefinicao'>('primeiro_acesso')

  const [senha, setSenha] = useState('')
  const [repetida, setRepetida] = useState('')
  const [verSenha, setVerSenha] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setConferindo(false)
      return
    }
    let cancelado = false
    ;(async () => {
      try {
        const r = await fetch(`/api/auth/definir-senha?t=${encodeURIComponent(token)}`)
        const dados = await r.json()
        if (cancelado) return
        setValido(Boolean(dados.valido))
        setNome(dados.nome || null)
        if (dados.tipo) setTipo(dados.tipo)
      } catch {
        if (!cancelado) setValido(false)
      } finally {
        if (!cancelado) setConferindo(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [token])

  const regras = useMemo(() => REGRAS.map((r) => ({ ...r, atendida: r.ok(senha) })), [senha])
  const podeEnviar = regras.every((r) => r.atendida) && senha === repetida && !enviando

  if (usuario) return <Navigate to="/" replace />

  async function aoEnviar(e: React.FormEvent) {
    e.preventDefault()
    setErro(null)
    if (senha !== repetida) {
      setErro('As duas senhas precisam ser iguais.')
      return
    }
    setEnviando(true)
    try {
      const r = await fetch('/api/auth/definir-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, senha }),
      })
      const dados = await r.json()
      if (!r.ok) {
        setErro(dados.erro || 'Não foi possível salvar a senha.')
        return
      }
      entrar(dados) // já entra logado — não faz sentido pedir a senha recém-criada
    } catch {
      setErro('Sem conexão com o servidor. Tente de novo.')
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 py-12">
      <div className="w-full max-w-[420px]">
        <div className="mb-8 flex items-center justify-center gap-3">
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

        <div className="rounded-2xl border border-gray-100 bg-white p-8 shadow-sm">
          {conferindo ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="animate-spin text-primary" size={26} />
            </div>
          ) : !valido ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
                <AlertTriangle className="text-amber-500" size={22} />
              </div>
              <h2 className="text-lg font-bold text-gray-900">Link expirado ou já usado</h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Cada link vale uma vez só. Peça um novo na tela de entrada usando
                “Esqueci minha senha”.
              </p>
              <Link
                to="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-dark"
              >
                Ir para a entrada
                <ArrowRight size={16} />
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-[22px] font-bold tracking-tight text-gray-900">
                {tipo === 'primeiro_acesso' ? 'Crie sua senha' : 'Nova senha'}
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                {nome ? `Olá, ${nome.split(' ')[0]}. ` : ''}
                Escolha uma senha para acessar o sistema.
              </p>

              <form onSubmit={aoEnviar} className="mt-7 space-y-5" noValidate>
                <div>
                  <label htmlFor="senha" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Senha
                  </label>
                  <div className="relative">
                    <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="senha"
                      type={verSenha ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-11 text-sm text-gray-900 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
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

                <div>
                  <label htmlFor="repetida" className="mb-1.5 block text-sm font-medium text-gray-700">
                    Repita a senha
                  </label>
                  <div className="relative">
                    <Lock size={17} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      id="repetida"
                      type={verSenha ? 'text' : 'password'}
                      autoComplete="new-password"
                      value={repetida}
                      onChange={(e) => setRepetida(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 bg-gray-50 py-3 pl-11 pr-4 text-sm text-gray-900 transition focus:border-primary focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  {repetida && senha !== repetida && (
                    <p className="mt-1.5 text-xs text-red-600">As duas senhas estão diferentes.</p>
                  )}
                </div>

                <ul className="space-y-2 rounded-xl bg-gray-50 p-4">
                  {regras.map((r) => (
                    <li
                      key={r.texto}
                      className={cn('flex items-center gap-2 text-xs', r.atendida ? 'text-emerald-700' : 'text-gray-500')}
                    >
                      <span
                        className={cn(
                          'flex h-4 w-4 items-center justify-center rounded-full',
                          r.atendida ? 'bg-emerald-100' : 'bg-gray-200'
                        )}
                      >
                        {r.atendida ? <Check size={11} /> : <X size={11} className="text-gray-400" />}
                      </span>
                      {r.texto}
                    </li>
                  ))}
                </ul>

                {erro && (
                  <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
                    {erro}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={!podeEnviar}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25 transition hover:bg-primary-dark focus:outline-none focus:ring-4 focus:ring-primary/20 disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none"
                >
                  {enviando ? <Loader2 size={17} className="animate-spin" /> : 'Salvar e entrar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
