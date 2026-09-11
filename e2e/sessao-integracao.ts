// Dá uma sessão aos testes de integração (que rodam em Node, sem navegador e sem tela
// de login). Assina um token com o mesmo segredo que o PostgREST valida, usando uma conta
// admin real — assim o teste enxerga o que o RH enxerga, sem depender da senha de ninguém.
//
// Usado como `globalSetup` do vitest de integração. Mora FORA de `src/` de propósito:
// arquivo dentro de src que importa `node:*` quebra o `tsc` do build — já aconteceu antes
// neste projeto e voltou a acontecer aqui.

import crypto from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))

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

const b64 = (v: string) => Buffer.from(v).toString('base64url')

export async function setup() {
  const env = lerEnv()
  for (const [k, v] of Object.entries(env)) if (!process.env[k]) process.env[k] = v

  const r = await fetch(`${env.SUPABASE_URL}/rest/v1/acessos?select=colaborador_id&papel=eq.admin&limit=1`, {
    headers: { apikey: env.SUPABASE_SERVICE_KEY, Authorization: `Bearer ${env.SUPABASE_SERVICE_KEY}` },
  })
  const conta = (await r.json())?.[0]
  if (!conta) throw new Error('Nenhuma conta admin em `acessos` — os testes de integração precisam de uma.')

  const agora = Math.floor(Date.now() / 1000)
  const corpo = {
    role: 'authenticated',
    sub: conta.colaborador_id,
    papel: 'admin',
    nome: 'Testes de integração',
    iss: 'rh-vps',
    iat: agora,
    exp: agora + 3600,
  }
  const assinavel = `${b64(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))}.${b64(JSON.stringify(corpo))}`
  process.env.RH_TOKEN_TESTE = `${assinavel}.${crypto
    .createHmac('sha256', env.RH_JWT_SECRET)
    .update(assinavel)
    .digest('base64url')}`
}
