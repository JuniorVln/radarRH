// Sessão do usuário logado.
//
// O token guardado aqui é o MESMO que vai para o banco em toda consulta (ver `supabase.ts`).
// Ou seja: não é um crachá decorativo de front — quem decide o que a pessoa enxerga é o
// Postgres, lendo os claims deste token. Perder a sessão significa perder o acesso ao dado,
// não só sumir com o menu.

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type Papel = 'admin' | 'rh' | 'gestor' | 'colaborador'

export interface Usuario {
  id: string
  nome: string
  cargo?: string | null
  foto_url?: string | null
  papel: Papel
  email: string
}

const CHAVE = 'rh.sessao'

interface SessaoGuardada {
  token: string
  expira_em: number
  usuario: Usuario
}

// Módulo-nível de propósito: o cliente do banco precisa ler o token fora do React,
// dentro do `fetch`, sem depender de hook nenhum.
let tokenEmMemoria: string | null = null

/**
 * Token para os testes de integração, que rodam em Node e não têm como "fazer login"
 * numa tela. Lido de `process.env`, que NÃO existe no navegador e não é substituído pelo
 * Vite no empacotamento — então isto não tem como virar credencial embutida em produção.
 */
function tokenDeTesteEmNode(): string | null {
  const env = (globalThis as unknown as { process?: { env?: Record<string, string> } }).process?.env
  return env?.RH_TOKEN_TESTE || null
}

export function tokenAtual(): string | null {
  return tokenEmMemoria || tokenDeTesteEmNode()
}

function lerDoNavegador(): SessaoGuardada | null {
  try {
    const cru = localStorage.getItem(CHAVE)
    if (!cru) return null
    const dados = JSON.parse(cru) as SessaoGuardada
    if (!dados?.token || !dados?.expira_em) return null
    // margem de 30s para não usar um token que expira no meio da requisição
    if (dados.expira_em * 1000 < Date.now() + 30_000) return null
    return dados
  } catch {
    return null
  }
}

function gravarNoNavegador(dados: SessaoGuardada | null) {
  try {
    if (dados) localStorage.setItem(CHAVE, JSON.stringify(dados))
    else localStorage.removeItem(CHAVE)
  } catch {
    // navegador com armazenamento bloqueado: a sessão vale só enquanto a aba estiver aberta
  }
}

interface ContextoSessao {
  usuario: Usuario | null
  carregando: boolean
  entrar: (dados: { token: string; expira_em: number; usuario: Usuario }) => void
  sair: () => void
  ehRH: boolean
}

const Contexto = createContext<ContextoSessao | null>(null)

export function ProvedorSessao({ children }: { children: React.ReactNode }) {
  const inicial = useRef(lerDoNavegador())
  if (inicial.current && !tokenEmMemoria) tokenEmMemoria = inicial.current.token

  const [usuario, setUsuario] = useState<Usuario | null>(inicial.current?.usuario ?? null)
  const [carregando, setCarregando] = useState(Boolean(inicial.current))

  const entrar = useCallback((dados: { token: string; expira_em: number; usuario: Usuario }) => {
    tokenEmMemoria = dados.token
    gravarNoNavegador(dados)
    setUsuario(dados.usuario)
    setCarregando(false)
  }, [])

  const sair = useCallback(() => {
    tokenEmMemoria = null
    gravarNoNavegador(null)
    setUsuario(null)
    setCarregando(false)
  }, [])

  // Ao abrir o app com sessão guardada, confirmamos no servidor antes de mostrar qualquer
  // tela: o acesso pode ter sido revogado depois que o token foi emitido.
  useEffect(() => {
    const guardada = inicial.current
    if (!guardada) return
    let cancelado = false
    ;(async () => {
      try {
        const r = await fetch('/api/auth/eu', { headers: { Authorization: `Bearer ${guardada.token}` } })
        if (cancelado) return
        // SÓ 401/403 derrubam a sessão — é o servidor dizendo "esse acesso não vale mais".
        // Um 500, um deploy no meio do caminho ou o servidor de desenvolvimento (que não
        // roda as funções) não podem expulsar quem já estava dentro.
        if (r.status === 401 || r.status === 403) {
          sair()
          return
        }
        if (!r.ok) {
          setUsuario(guardada.usuario)
          return
        }
        const dados = await r.json().catch(() => null)
        const atualizado = dados?.usuario || guardada.usuario
        tokenEmMemoria = guardada.token
        gravarNoNavegador({ ...guardada, usuario: atualizado })
        setUsuario(atualizado)
      } catch {
        // servidor fora do ar não deve deslogar quem já estava dentro
        if (!cancelado) setUsuario(guardada.usuario)
      } finally {
        if (!cancelado) setCarregando(false)
      }
    })()
    return () => {
      cancelado = true
    }
  }, [sair])

  // Sessão encerrada numa aba encerra nas outras também.
  useEffect(() => {
    const aoMudar = (e: StorageEvent) => {
      if (e.key !== CHAVE) return
      const atual = lerDoNavegador()
      tokenEmMemoria = atual?.token ?? null
      setUsuario(atual?.usuario ?? null)
    }
    window.addEventListener('storage', aoMudar)
    return () => window.removeEventListener('storage', aoMudar)
  }, [])

  const valor = useMemo<ContextoSessao>(
    () => ({
      usuario,
      carregando,
      entrar,
      sair,
      ehRH: usuario?.papel === 'admin' || usuario?.papel === 'rh',
    }),
    [usuario, carregando, entrar, sair]
  )

  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>
}

export function useSessao() {
  const ctx = useContext(Contexto)
  if (!ctx) throw new Error('useSessao precisa estar dentro de <ProvedorSessao>')
  return ctx
}
