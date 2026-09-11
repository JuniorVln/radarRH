// GET /api/auth/eu   ->  { usuario }  |  401
//
// O app chama isto ao abrir, com o token guardado no navegador. Serve para duas coisas:
// confirmar que a sessão ainda vale (o token pode ter expirado com a aba aberta) e
// reconferir no banco se o acesso não foi revogado desde o login — um token válido de
// alguém que foi desligado precisa parar de funcionar antes de expirar sozinho.

import { configurado, buscar, usuarioDaRequisicao } from '../_acesso.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ erro: 'Método não permitido.' })
  if (!configurado()) return res.status(503).json({ erro: 'Indisponível no momento.' })

  const claims = usuarioDaRequisicao(req)
  if (!claims?.sub) return res.status(401).json({ erro: 'Sessão expirada.' })

  try {
    const acessos = await buscar(
      `acessos?select=colaborador_id,email_login,papel,ativo&colaborador_id=eq.${claims.sub}&limit=1`
    )
    const acesso = acessos?.[0]
    if (!acesso?.ativo) return res.status(401).json({ erro: 'Acesso revogado.' })

    const pessoas = await buscar(
      `colaboradores?select=id,nome,cargo,foto_url,status&id=eq.${claims.sub}&limit=1`
    )
    const pessoa = pessoas?.[0]
    if (!pessoa || pessoa.status === 'demitido') return res.status(401).json({ erro: 'Acesso revogado.' })

    return res.status(200).json({
      usuario: {
        id: pessoa.id,
        nome: pessoa.nome,
        cargo: pessoa.cargo,
        foto_url: pessoa.foto_url,
        // o papel vem do banco, não do token: mudança de papel vale na hora
        papel: acesso.papel,
        email: acesso.email_login,
      },
    })
  } catch (e) {
    console.error('[auth/eu]', e)
    return res.status(500).json({ erro: 'Não foi possível validar a sessão.' })
  }
}
