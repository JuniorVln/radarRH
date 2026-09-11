// POST /api/auth/primeiro-acesso  { email }  ->  sempre 200
//
// Serve para o primeiro acesso e para "esqueci minha senha" — é o mesmo fluxo: mandamos um
// link de uso único para o e-mail cadastrado.
//
// A resposta é SEMPRE a mesma, exista a conta ou não. Um formulário que responde
// "e-mail não encontrado" é uma lista de funcionários aberta para qualquer visitante.

import {
  configurado,
  buscar,
  inserir,
  gerarTokenConvite,
  hashDoToken,
  enviarEmail,
  enderecoDoSistema,
} from '../_acesso.js'

const RESPOSTA_PADRAO = {
  ok: true,
  mensagem: 'Se houver uma conta com esse e-mail, o link de acesso chega em instantes.',
}

const VALIDADE_HORAS = { primeiro_acesso: 168, redefinicao: 2 } // 7 dias / 2 horas

function corpoDoEmail({ nome, link, tipo }) {
  const titulo = tipo === 'primeiro_acesso' ? 'Seu acesso ao sistema de RH' : 'Redefinir sua senha'
  const chamada = tipo === 'primeiro_acesso' ? 'Criar minha senha' : 'Redefinir senha'
  const validade = tipo === 'primeiro_acesso' ? '7 dias' : '2 horas'
  const html = `
  <div style="font-family:-apple-system,Segoe UI,Roboto,Arial,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1e293b">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6366f1;font-weight:700">Rede Ideia</div>
    <h1 style="font-size:22px;margin:12px 0 16px">${titulo}</h1>
    <p style="font-size:15px;line-height:1.6;margin:0 0 12px">Olá, ${nome.split(' ')[0]}.</p>
    <p style="font-size:15px;line-height:1.6;margin:0 0 24px">
      ${
        tipo === 'primeiro_acesso'
          ? 'Use o botão abaixo para criar sua senha e entrar no sistema de Recursos Humanos.'
          : 'Recebemos um pedido para redefinir sua senha. Use o botão abaixo para escolher uma nova.'
      }
    </p>
    <a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:13px 26px;border-radius:10px;font-weight:600;font-size:15px">${chamada}</a>
    <p style="font-size:13px;line-height:1.6;color:#64748b;margin:24px 0 0">
      O link vale por ${validade} e só pode ser usado uma vez.<br>
      Se não foi você que pediu, é só ignorar este e-mail — nada muda.
    </p>
  </div>`
  const texto = `${titulo}\n\nOlá, ${nome.split(' ')[0]}.\n\nAbra o link para continuar:\n${link}\n\nO link vale por ${validade} e só pode ser usado uma vez. Se não foi você que pediu, ignore este e-mail.`
  return { html, texto, assunto: titulo }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' })
  if (!configurado()) return res.status(503).json({ erro: 'Indisponível no momento.' })

  const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : ''
  if (!email) return res.status(400).json({ erro: 'Informe o e-mail.' })

  try {
    const registros = await buscar(
      `acessos?select=colaborador_id,senha_hash,ativo&email_login=eq.${encodeURIComponent(email)}&limit=1`
    )
    const acesso = registros?.[0]
    if (!acesso || !acesso.ativo) return res.status(200).json(RESPOSTA_PADRAO)

    const pessoas = await buscar(`colaboradores?select=nome,status&id=eq.${acesso.colaborador_id}&limit=1`)
    const pessoa = pessoas?.[0]
    if (!pessoa || pessoa.status === 'demitido') return res.status(200).json(RESPOSTA_PADRAO)

    const tipo = acesso.senha_hash ? 'redefinicao' : 'primeiro_acesso'
    const token = gerarTokenConvite()

    await inserir('acessos_convites', {
      colaborador_id: acesso.colaborador_id,
      token_hash: hashDoToken(token),
      tipo,
      expira_em: new Date(Date.now() + VALIDADE_HORAS[tipo] * 3600 * 1000).toISOString(),
    })

    const link = `${enderecoDoSistema(req)}/definir-senha?t=${token}`
    const { html, texto, assunto } = corpoDoEmail({ nome: pessoa.nome, link, tipo })
    await enviarEmail({ para: email, assunto, html, texto })

    return res.status(200).json(RESPOSTA_PADRAO)
  } catch (e) {
    console.error('[auth/primeiro-acesso]', e)
    // Mesmo em erro devolvemos a resposta neutra: o que não pode é o formulário virar
    // um detector de contas existentes.
    return res.status(200).json(RESPOSTA_PADRAO)
  }
}
