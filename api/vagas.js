// GET /api/vagas        -> lista as vagas ABERTAS (campos públicos)
// GET /api/vagas?id=xxx -> uma vaga aberta
//
// Público, sem autenticação. Roda no servidor com a chave de serviço; o navegador
// nunca vê chave nenhuma.

import { buscar, configurado } from './_supabase.js'
import { CAMPOS_PUBLICOS } from './_candidatura.js'

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300')

  if (req.method !== 'GET') {
    return res.status(405).json({ erro: 'Método não permitido.' })
  }

  if (!configurado()) {
    return res.status(503).json({ erro: 'Portal indisponível no momento.' })
  }

  try {
    const campos = CAMPOS_PUBLICOS.join(',')
    const id = typeof req.query.id === 'string' ? req.query.id : null

    // O filtro status=aberta é o que impede vaga fechada ou rascunho de vazar.
    const caminho = id
      ? `vagas?select=${campos}&status=eq.aberta&id=eq.${encodeURIComponent(id)}`
      : `vagas?select=${campos}&status=eq.aberta&order=criado_em.desc`

    const vagas = await buscar(caminho)

    if (id) {
      if (!vagas.length) return res.status(404).json({ erro: 'Vaga não encontrada.' })
      return res.status(200).json({ vaga: vagas[0] })
    }

    return res.status(200).json({ vagas })
  } catch (e) {
    // Nunca devolver a mensagem crua do banco para fora — ela descreve o schema.
    console.error('[api/vagas]', e)
    return res.status(500).json({ erro: 'Não foi possível carregar as vagas.' })
  }
}
