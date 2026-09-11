// Deixa os testes já logados.
//
// Desde 11/09/2026 nenhuma tela abre sem sessão: o navegador não carrega mais chave do
// banco, quem autoriza é o token da pessoa. Sem isto, todo teste cairia na tela de login.
//
// O token é assinado aqui mesmo, com o mesmo segredo que o PostgREST valida — de
// propósito, para o teste NÃO depender de saber a senha de ninguém. O `sub` é uma conta
// real com papel admin, então o que os testes enxergam é exatamente o que o RH enxerga.

import crypto from 'node:crypto'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
export const ARQUIVO_SESSAO = join(__dirname, '.sessao.json')

function lerEnv() {
  const cru = readFileSync(join(__dirname, '..', '.env'), 'utf-8')
  return Object.fromEntries(
    cru
      .split('\n')
      .filter((l) => l.includes('=') && !l.trim().startsWith('#'))
      .map((l) => {
        const i = l.indexOf('=')
        return [l.slice(0, i).trim(), l.slice(i + 1).trim()]
      })
  )
}

const b64 = (v: string | Buffer) => Buffer.from(v).toString('base64url')

export default async function globalSetup() {
  const env = lerEnv()
  const faltando = ['SUPABASE_URL', 'SUPABASE_SERVICE_KEY', 'RH_JWT_SECRET'].filter((k) => !env[k])
  if (faltando.length) {
    throw new Error(`.env sem ${faltando.join(', ')} — os testes precisam disso para montar a sessão.`)
  }

  // Pega uma conta admin de verdade em vez de inventar um id: token com `sub` inexistente
  // passa na assinatura mas não casa com policy nenhuma, e o teste falharia por "sem dados"
  // sem dizer o motivo.
  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/acessos?select=colaborador_id,papel&papel=eq.admin&limit=1`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  })
  const contas = await r.json()
  const conta = contas?.[0]
  if (!conta) throw new Error('Nenhuma conta com papel admin em `acessos` — crie uma antes de rodar os testes.')

  const agora = Math.floor(Date.now() / 1000)
  const corpo = {
    role: 'authenticated',
    sub: conta.colaborador_id,
    papel: 'admin',
    nome: 'Testes automatizados',
    iss: 'rh-vps',
    iat: agora,
    exp: agora + 12 * 3600,
  }
  const assinavel = `${b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64(JSON.stringify(corpo))}`
  const token = `${assinavel}.${crypto.createHmac('sha256', env.RH_JWT_SECRET).update(assinavel).digest('base64url')}`

  // Mesmo formato que o app grava (ver src/lib/sessao.tsx) — se um mudar, o outro quebra
  // na hora, que é melhor do que os testes rodarem com uma sessão que a aplicação ignora.
  const sessao = {
    token,
    expira_em: corpo.exp,
    usuario: {
      id: conta.colaborador_id,
      nome: 'Testes automatizados',
      papel: 'admin',
      email: 'testes@local',
    },
  }

  mkdirSync(dirname(ARQUIVO_SESSAO), { recursive: true })
  writeFileSync(
    ARQUIVO_SESSAO,
    JSON.stringify({
      cookies: [],
      origins: [
        {
          origin: 'http://localhost:5173',
          localStorage: [{ name: 'rh.sessao', value: JSON.stringify(sessao) }],
        },
      ],
    })
  )
}
