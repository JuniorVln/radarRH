// POST /api/candidatura -> grava a candidatura vinda do portal público.
//
// Recebe dado de estranho na internet. Tudo que entra é validado e recortado; nada
// da resposta do banco volta para o visitante.

import { buscar, inserir, configurado } from './_supabase.js'
import { validarCandidatura } from './_candidatura.js'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ erro: 'Método não permitido.' })
  }

  if (!configurado()) {
    return res.status(503).json({ erro: 'Portal indisponível no momento.' })
  }

  try {
    const corpo = typeof req.body === 'string' ? JSON.parse(req.body) : req.body

    // Confere contra as vagas ABERTAS de verdade, não contra o que o formulário diz.
    const abertas = await buscar('vagas?select=id&status=eq.aberta')
    const validacao = validarCandidatura(corpo, abertas.map(v => v.id))

    if (!validacao.ok) {
      // Robô de spam recebe 200 como se tivesse dado certo — se devolvêssemos erro,
      // ele aprenderia a contornar a armadilha.
      if (validacao.silencioso) return res.status(200).json({ ok: true })
      return res.status(400).json({ erro: validacao.erro })
    }

    // Mesma pessoa na mesma vaga não entra duas vezes: o RH veria o candidato
    // duplicado no pipeline e não saberia qual é o bom.
    const jaExiste = await buscar(
      `candidatos?select=id&vaga_id=eq.${validacao.dados.vaga_id}` +
        `&email=eq.${encodeURIComponent(validacao.dados.email)}`,
    )

    if (jaExiste.length) {
      return res.status(200).json({ ok: true, jaInscrito: true })
    }

    await inserir('candidatos', validacao.dados)
    return res.status(201).json({ ok: true })
  } catch (e) {
    console.error('[api/candidatura]', e)
    return res.status(500).json({ erro: 'Não foi possível registrar sua candidatura.' })
  }
}
