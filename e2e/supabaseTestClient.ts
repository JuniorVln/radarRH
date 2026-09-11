// Cliente Supabase próprio para os testes E2E — não reaproveita src/lib/supabase.ts
// porque aquele lê import.meta.env (transformado pelo Vite), e o Playwright Test
// roda fora do Vite (node puro), então lemos o .env manualmente aqui.
import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = join(__dirname, '..', '.env')
const env = Object.fromEntries(
  readFileSync(envPath, 'utf-8')
    .split('\n')
    .filter(l => l.includes('='))
    .map(l => {
      const idx = l.indexOf('=')
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]
    })
)

// Chave de SERVICO: desde 11/09 nao existe mais chave geral de navegador, e o papel
// anonimo perdeu acesso a tudo. Teste automatizado nao tem sessao de pessoa, entao ele
// fala como servico — o mesmo que as funcoes do servidor fazem.
export const supabaseTest = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_KEY)
