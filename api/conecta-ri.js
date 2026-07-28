// POST /api/conecta-ri -> envia mensagem direta para um colaborador no Conecta RI.
//
// Fica ATRÁS da trava de senha do middleware de propósito: quem dispara é o RH, de
// dentro do sistema. O token do Conecta RI mora aqui, no servidor — se fosse para o
// navegador, qualquer visitante o extrairia do bundle e poderia mandar mensagem em
// nome da empresa.
//
// Não envia nada sozinho: cada mensagem é um clique do RH.

import { encontrarUsuario } from './_conectaRI.js'

const URL_BASE = process.env.RC_URL
const USER_ID = process.env.RC_USER_ID
const TOKEN = process.env.RC_TOKEN

const configurado = () => Boolean(URL_BASE && USER_ID && TOKEN)

async function chamar(caminho, opcoes = {}) {
  const r = await fetch(`${URL_BASE}/api/v1/${caminho}`, {
    ...opcoes,
    headers: {
      'X-Auth-Token': TOKEN,
      'X-User-Id': USER_ID,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  })
  const corpo = await r.json().catch(() => null)
  if (!r.ok || corpo?.success === false) {
    throw new Error(corpo?.error || corpo?.message || `Conecta RI respondeu ${r.status}`)
  }
  return corpo
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' })

  if (!configurado()) {
    return res.status(503).json({ erro: 'Conecta RI não está configurado neste ambiente.' })
  }

  try {
    const corpo = typeof req.body === 'string' ? JSON.parse(req.body) : req.body
    const nome = String(corpo?.nome || '').trim()
    const texto = String(corpo?.texto || '').trim()

    if (!nome) return res.status(400).json({ erro: 'Informe o colaborador.' })
    if (!texto) return res.status(400).json({ erro: 'Mensagem vazia.' })
    if (texto.length > 4000) return res.status(400).json({ erro: 'Mensagem longa demais.' })

    const lista = await chamar('users.list?count=0&fields={"name":1,"username":1}')
    const achado = encontrarUsuario(nome, lista.users)

    // Ambiguidade não vira chute: devolve 409 e o RH resolve à mão.
    if (achado.erro) {
      return res.status(achado.ambiguos ? 409 : 404).json({ erro: achado.erro })
    }

    await chamar('chat.postMessage', {
      method: 'POST',
      body: JSON.stringify({ channel: `@${achado.usuario.username}`, text: texto }),
    })

    return res.status(200).json({ ok: true, enviadoPara: achado.usuario.username })
  } catch (e) {
    console.error('[api/conecta-ri]', e)
    return res.status(500).json({ erro: 'Não consegui enviar pelo Conecta RI.' })
  }
}
