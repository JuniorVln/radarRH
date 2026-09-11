// POST /api/auth/definir-senha  { token, senha }  ->  { token, usuario }
// GET  /api/auth/definir-senha?t=<token>          ->  { valido, nome }
//
// Consome o link de uso único enviado por e-mail. O GET existe só para a tela conseguir
// dizer "olá, Fulano" e avisar de link vencido antes da pessoa digitar a senha à toa.

import {
  configurado,
  buscar,
  atualizar,
  gerarHash,
  problemaNaSenha,
  hashDoToken,
  assinarToken,
} from '../_acesso.js'

const LINK_INVALIDO = 'Este link não vale mais. Peça um novo na tela de entrada.'

async function convitePeloToken(token) {
  if (typeof token !== 'string' || token.length < 20) return null
  const agora = new Date().toISOString()
  const registros = await buscar(
    `acessos_convites?select=id,colaborador_id,tipo,expira_em,usado_em` +
      `&token_hash=eq.${encodeURIComponent(hashDoToken(token))}` +
      `&usado_em=is.null&expira_em=gt.${encodeURIComponent(agora)}&limit=1`
  )
  return registros?.[0] || null
}

export default async function handler(req, res) {
  if (!configurado()) return res.status(503).json({ erro: 'Indisponível no momento.' })

  if (req.method === 'GET') {
    try {
      const convite = await convitePeloToken(req.query?.t)
      if (!convite) return res.status(200).json({ valido: false })
      const pessoas = await buscar(`colaboradores?select=nome&id=eq.${convite.colaborador_id}&limit=1`)
      return res.status(200).json({ valido: true, nome: pessoas?.[0]?.nome || null, tipo: convite.tipo })
    } catch (e) {
      console.error('[auth/definir-senha GET]', e)
      return res.status(200).json({ valido: false })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' })

  const { token, senha } = req.body || {}
  const problema = problemaNaSenha(senha)
  if (problema) return res.status(400).json({ erro: problema })

  try {
    const convite = await convitePeloToken(token)
    if (!convite) return res.status(400).json({ erro: LINK_INVALIDO })

    const acessos = await buscar(
      `acessos?select=colaborador_id,email_login,papel,ativo&colaborador_id=eq.${convite.colaborador_id}&limit=1`
    )
    const acesso = acessos?.[0]
    if (!acesso || !acesso.ativo) return res.status(400).json({ erro: LINK_INVALIDO })

    await atualizar(`acessos?colaborador_id=eq.${convite.colaborador_id}`, {
      senha_hash: await gerarHash(senha),
      ultimo_acesso: new Date().toISOString(),
    })

    // Queima o convite usado E qualquer outro pendente da mesma pessoa: se alguém pediu o
    // link duas vezes, o antigo não pode continuar valendo por aí.
    await atualizar(
      `acessos_convites?colaborador_id=eq.${convite.colaborador_id}&usado_em=is.null`,
      { usado_em: new Date().toISOString() }
    )

    const pessoas = await buscar(
      `colaboradores?select=id,nome,cargo,foto_url&id=eq.${convite.colaborador_id}&limit=1`
    )
    const pessoa = pessoas?.[0]

    // Já devolve a pessoa logada: quem acabou de criar a senha não precisa digitá-la de novo.
    const { token: jwt, expira_em } = assinarToken({
      id: acesso.colaborador_id,
      papel: acesso.papel,
      nome: pessoa?.nome || '',
    })

    return res.status(200).json({
      token: jwt,
      expira_em,
      usuario: {
        id: acesso.colaborador_id,
        nome: pessoa?.nome,
        cargo: pessoa?.cargo,
        foto_url: pessoa?.foto_url,
        papel: acesso.papel,
        email: acesso.email_login,
      },
    })
  } catch (e) {
    console.error('[auth/definir-senha]', e)
    return res.status(500).json({ erro: 'Não foi possível salvar a senha. Tente de novo.' })
  }
}
