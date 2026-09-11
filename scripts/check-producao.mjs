// Verificação do site PUBLICADO. Roda contra a URL de produção de verdade.
//
// POR QUE EXISTE
// Em 28/07 o sistema ficou ~1h30 com /colaboradores e /disc/<token> devolvendo 404
// em produção, com TODA a suíte verde: 65 testes de unidade, 26 E2E, CI verde nos
// três jobs. Nenhum deles toca o site publicado — o erro estava na configuração de
// deploy (rewrites), que só existe depois do build. O servidor de desenvolvimento do
// Vite faz o fallback de rota sozinho, então localmente nada quebrava.
//
// Esta verificação fecha exatamente esse buraco: ela olha o que o usuário veria.
//
// Uso:  node scripts/check-producao.mjs
// Desde 11/09/2026 nao existe mais senha unica de site: o acesso e por pessoa. Estas
// checagens passaram a conferir o oposto do que conferiam antes - que o sistema NAO
// entrega dado nenhum sem sessao, e que o bundle publico nao carrega credencial.

import { readFileSync, existsSync } from 'node:fs'

const ARQ_SEGREDO = 'C:\\Users\\junio\\.secrets\\radar-rh.env'

function lerSegredos() {
  const env = { ...process.env }
  if (existsSync(ARQ_SEGREDO)) {
    for (const linha of readFileSync(ARQ_SEGREDO, 'utf8').split('\n')) {
      const l = linha.trim()
      if (!l || l.startsWith('#') || !l.includes('=')) continue
      const i = l.indexOf('=')
      const chave = l.slice(0, i).trim()
      if (!env[chave]) env[chave] = l.slice(i + 1).trim()
    }
  }
  return env
}

const env = lerSegredos()
const BASE = env.RADAR_RH_URL || 'https://radar-rh.vercel.app'

// Sem cabecalho de autenticacao: o site publico agora responde para qualquer um - o que
// ele NAO pode e devolver dado sem login.
const autenticado = {}

const falhas = []

async function checar(descricao, fn) {
  try {
    const problema = await fn()
    if (problema) {
      falhas.push(`${descricao} — ${problema}`)
      console.log(`  FALHA  ${descricao}: ${problema}`)
    } else {
      console.log(`  OK     ${descricao}`)
    }
  } catch (e) {
    falhas.push(`${descricao} — ${e.message}`)
    console.log(`  FALHA  ${descricao}: ${e.message}`)
  }
}

const buscar = (caminho, opcoes = {}) => fetch(BASE + caminho, { redirect: 'manual', ...opcoes })

console.log(`[producao] Verificando ${BASE}\n`)

// --- 1. As rotas do sistema entregam o app ---
// Este é o teste que teria pego o incidente: rota funda precisa devolver o HTML da
// SPA, não 404. Conferir só o status não basta — a Vercel pode responder 200 com uma
// página de erro; por isso procuramos a raiz do React no corpo.
for (const rota of ['/', '/colaboradores', '/beneficios', '/disc/token-de-verificacao']) {
  await checar(`rota do sistema ${rota}`, async () => {
    const r = await buscar(rota, { headers: autenticado })
    if (r.status !== 200) return `HTTP ${r.status}`
    const html = await r.text()
    if (!html.includes('id="root"')) return 'respondeu 200 mas sem o app (fallback da SPA quebrado)'
    return null
  })
}

// --- 2. O portal de vagas está público e funcionando ---
await checar('portal /vagas aberto ao público', async () => {
  const r = await buscar('/vagas')
  if (r.status !== 200) return `HTTP ${r.status}`
  const html = await r.text()
  if (!html.includes('Trabalhe na Rede Ideia')) return 'respondeu 200 mas não é a página do portal'
  return null
})

await checar('API pública /api/vagas devolve JSON', async () => {
  const r = await buscar('/api/vagas')
  if (r.status !== 200) return `HTTP ${r.status}`
  const corpo = await r.json()
  if (!Array.isArray(corpo.vagas)) return 'resposta sem a lista de vagas'
  // A API pública não pode vazar faixa salarial
  if (corpo.vagas.some(v => 'salario_min' in v || 'salario_max' in v)) {
    return 'a API pública está devolvendo salário'
  }
  return null
})

// --- 3. O acesso e por pessoa: sem sessao, nenhum dado sai ---
await checar('tela de login abre para qualquer um', async () => {
  const r = await buscar('/login')
  if (r.status !== 200) return `HTTP ${r.status}`
  const html = await r.text()
  if (!html.includes('id="root"')) return 'a rota /login nao entrega o app'
  return null
})

await checar('bundle publicado NAO carrega chave do banco', async () => {
  // Era por aqui que a chave vazaria. Hoje o navegador nao recebe chave nenhuma: quem
  // autoriza e o token de quem fez login, emitido no /api/auth/login.
  const r = await buscar('/')
  const html = await r.text()
  const bundle = html.match(/\/assets\/[A-Za-z0-9._-]+\.js/)?.[0]
  if (!bundle) return 'nao achei o bundle no HTML'
  const js = await (await buscar(bundle)).text()
  if (/eyJhbGciOiJI/.test(js)) return 'o bundle esta carregando um JWT - credencial embutida'
  if (/supabase\.co/.test(js)) return 'o bundle ainda aponta para o Supabase'
  return null
})

await checar('banco recusa quem nao tem sessao', async () => {
  const r = await fetch('https://rh-api.178-18-248-126.sslip.io/rest/v1/colaboradores?select=nome&limit=1')
  if (r.status !== 401) return `a API respondeu ${r.status} sem token (deveria ser 401)`
  return null
})

await checar('login recusa credencial errada', async () => {
  const r = await fetch(BASE + '/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'ninguem@exemplo.com', senha: 'senhaerrada123' }),
  })
  if (r.status !== 401) return `deveria ser 401, veio ${r.status}`
  const corpo = await r.json()
  // A mensagem nao pode dizer se o e-mail existe: isso transformaria o formulario numa
  // forma de descobrir quem tem conta.
  if (!/incorretos/i.test(corpo.erro || '')) return 'a mensagem de erro esta entregando detalhe demais'
  return null
})

await checar('página pública não carrega chave do Supabase', async () => {
  const html = await (await buscar('/vagas')).text()
  if (/eyJhbGciOiJI/.test(html) || /supabase\.co/.test(html)) {
    return 'a página pública está expondo credencial/URL do Supabase'
  }
  return null
})

console.log('')
if (falhas.length === 0) {
  console.log('[producao] Tudo certo no site publicado.')
  process.exit(0)
}
console.log(`[producao] ${falhas.length} problema(s) no site publicado:`)
for (const f of falhas) console.log('  - ' + f)
process.exit(1)
