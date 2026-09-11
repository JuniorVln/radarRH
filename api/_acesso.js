// Peças compartilhadas do login por pessoa.
//
// DESENHO, EM UMA FRASE: quem confere senha é este servidor; quem confere o crachá depois
// é o próprio banco. O token que sai daqui é um JWT assinado com o MESMO segredo que o
// PostgREST usa para validar — então o banco sabe quem está falando sem perguntar nada a
// ninguém, e as policies conseguem decidir por pessoa e por papel.
//
// Nada aqui pode ir para o navegador: tanto a chave de serviço quanto o segredo do JWT
// ficam só nas variáveis de ambiente das funções.

import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'

const URL_BASE = process.env.SUPABASE_URL
const CHAVE_SERVICO = process.env.SUPABASE_SERVICE_KEY
const SEGREDO_JWT = process.env.RH_JWT_SECRET

// 12 horas: cobre um dia de trabalho inteiro sem obrigar a pessoa a logar de novo no meio
// do expediente, e ainda assim expira sozinho se alguém esquecer a sessão aberta.
const HORAS_DE_SESSAO = 12

export function configurado() {
  return Boolean(URL_BASE && CHAVE_SERVICO && SEGREDO_JWT)
}

// ------------------------------------------------------------------ banco (chave de serviço)

export async function servico(caminho, opcoes = {}) {
  const resposta = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: {
      apikey: CHAVE_SERVICO,
      Authorization: `Bearer ${CHAVE_SERVICO}`,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  })
  const texto = await resposta.text()
  const corpo = texto ? JSON.parse(texto) : null
  if (!resposta.ok) {
    const erro = new Error(corpo?.message || `Banco respondeu ${resposta.status}`)
    erro.status = resposta.status
    throw erro
  }
  return corpo
}

export const buscar = (caminho) => servico(caminho)

export const inserir = (tabela, dados) =>
  servico(tabela, { method: 'POST', headers: { Prefer: 'return=representation' }, body: JSON.stringify(dados) })

export const atualizar = (caminho, dados) =>
  servico(caminho, { method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(dados) })

// ------------------------------------------------------------------------------- senha

export const gerarHash = (senha) => bcrypt.hash(senha, 12)
export const conferirSenha = (senha, hash) => bcrypt.compare(senha, hash)

// Hash falso, usado quando o e-mail não existe. Sem isto, "e-mail inexistente" responderia
// muito mais rápido que "senha errada" e daria para descobrir quem tem conta só pelo relógio.
const HASH_ISCA = '$2a$12$C6UzMDM.H6dfI/f/IKcEe.HqM8Xn8eFqLqU5Wg5xOQnJZ0d6eN0Zq'
export const perderTempo = (senha) => bcrypt.compare(senha, HASH_ISCA).catch(() => false)

export function problemaNaSenha(senha) {
  if (typeof senha !== 'string' || senha.length < 8) return 'A senha precisa ter pelo menos 8 caracteres.'
  if (senha.length > 200) return 'Senha longa demais.'
  if (!/[a-zA-Z]/.test(senha) || !/[0-9]/.test(senha)) return 'Use pelo menos uma letra e um número.'
  return null
}

// --------------------------------------------------------------------------------- JWT

const base64url = (buf) => Buffer.from(buf).toString('base64url')

export function assinarToken({ id, papel, nome }) {
  const agora = Math.floor(Date.now() / 1000)
  const cabecalho = { alg: 'HS256', typ: 'JWT' }
  const corpo = {
    // `role` é o que faz o PostgREST trocar de papel no banco; `sub` e `papel` são o que
    // as policies leem para decidir o que esta pessoa pode ver.
    role: 'authenticated',
    sub: id,
    papel,
    nome,
    iss: 'rh-vps',
    iat: agora,
    exp: agora + HORAS_DE_SESSAO * 3600,
  }
  const corpoAssinavel = `${base64url(JSON.stringify(cabecalho))}.${base64url(JSON.stringify(corpo))}`
  const assinatura = crypto.createHmac('sha256', SEGREDO_JWT).update(corpoAssinavel).digest('base64url')
  return { token: `${corpoAssinavel}.${assinatura}`, expira_em: corpo.exp }
}

export function lerToken(token) {
  if (typeof token !== 'string') return null
  const partes = token.split('.')
  if (partes.length !== 3) return null

  const esperada = crypto.createHmac('sha256', SEGREDO_JWT).update(`${partes[0]}.${partes[1]}`).digest('base64url')
  const a = Buffer.from(partes[2])
  const b = Buffer.from(esperada)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null

  try {
    const corpo = JSON.parse(Buffer.from(partes[1], 'base64url').toString('utf8'))
    if (!corpo.exp || corpo.exp < Math.floor(Date.now() / 1000)) return null
    return corpo
  } catch {
    return null
  }
}

export function usuarioDaRequisicao(req) {
  const cabecalho = req.headers.authorization || ''
  if (!cabecalho.startsWith('Bearer ')) return null
  return lerToken(cabecalho.slice(7))
}

// -------------------------------------------------------------------- convites por e-mail

// O que vai no e-mail é o token cru; o que fica no banco é o hash dele. Se o banco vazar,
// os links já enviados continuam inúteis.
export const gerarTokenConvite = () => crypto.randomBytes(32).toString('base64url')
export const hashDoToken = (token) => crypto.createHash('sha256').update(token).digest('hex')

export async function enviarEmail({ para, assunto, html, texto }) {
  const chave = process.env.RESEND_API_KEY
  const remetente = process.env.RESEND_FROM
  if (!chave || !remetente) {
    const erro = new Error('Envio de e-mail não configurado.')
    erro.status = 503
    throw erro
  }
  const resposta = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${chave}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: remetente, to: [para], subject: assunto, html, text: texto }),
  })
  if (!resposta.ok) {
    const erro = new Error(`Resend respondeu ${resposta.status}`)
    erro.status = 502
    throw erro
  }
  return resposta.json()
}

export function enderecoDoSistema(req) {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/$/, '')
  const host = req.headers['x-forwarded-host'] || req.headers.host
  return `https://${host}`
}
