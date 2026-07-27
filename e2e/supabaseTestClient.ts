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

export const supabaseTest = createClient(env.VITE_SUPABASE_URL, env.VITE_SUPABASE_ANON_KEY)
