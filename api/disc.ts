// Questionário DISC público — GET /api/disc?t=<token> e POST /api/disc
//
// POR QUE ISTO SAIU DO NAVEGADOR (11/09/2026)
// A página /disc/<token> é aberta: quem responde é colaborador ou candidato, sem login.
// Enquanto existia uma chave geral no bundle, ela falava direto com o banco. Ao tirar essa
// chave (o navegador agora só usa o crachá de quem fez login), a página pública ficaria sem
// como ler ou gravar nada — então ela passa a falar com o servidor, que é quem tem a chave
// de serviço. É o mesmo desenho já usado pelo portal de vagas.
//
// O TOKEN É A AUTORIZAÇÃO. Cada resposta aqui é restrita à avaliação daquele token: não
// existe caminho para listar avaliações nem para tocar em outra pessoa.

import { calcularDisc, respostaValida, TETRADES } from './_disc-motor.js'

const URL_BASE = process.env.SUPABASE_URL
const CHAVE = process.env.SUPABASE_SERVICE_KEY

async function banco(caminho: string, opcoes: RequestInit = {}) {
  const r = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: {
      apikey: CHAVE as string,
      Authorization: `Bearer ${CHAVE}`,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  })
  const texto = await r.text()
  const corpo = texto ? JSON.parse(texto) : null
  if (!r.ok) throw new Error(corpo?.message || `Banco respondeu ${r.status}`)
  return corpo
}

// O que a tela pública precisa — inclusive `resultado`, porque depois de responder a
// própria pessoa vê o perfil dela ali mesmo, e `respostas`, que a tela usa para não
// reabrir um questionário já preenchido. Tudo isso é dela: o alcance é limitado por quem
// tem o token, e não existe caminho aqui para listar ou alcançar outra avaliação.
const CAMPOS = 'id,colaborador_id,candidato_id,token,status,respostas,resultado,criado_em,respondido_em'

export default async function handler(req: any, res: any) {
  if (!URL_BASE || !CHAVE) return res.status(503).json({ erro: 'Indisponível no momento.' })

  // ------------------------------------------------------------------ abrir o questionário
  if (req.method === 'GET') {
    const token = typeof req.query?.t === 'string' ? req.query.t : ''
    // Só exige que exista: o tamanho do token é assunto de quem o gera, e um piso
    // arbitrário aqui já recusou link legítimo uma vez.
    if (!token) return res.status(200).json({ avaliacao: null })
    try {
      const linhas = await banco(
        `disc_avaliacoes?select=${CAMPOS}&token=eq.${encodeURIComponent(token)}&limit=1`
      )
      const avaliacao = linhas?.[0]
      // Cancelada é tratada como inexistente: a página cai na tela de link inválido.
      if (!avaliacao || avaliacao.status === 'cancelado') return res.status(200).json({ avaliacao: null })
      return res.status(200).json({ avaliacao })
    } catch (e) {
      console.error('[disc GET]', e)
      return res.status(500).json({ erro: 'Não foi possível abrir o questionário.' })
    }
  }

  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' })

  // ------------------------------------------------------------------------ gravar respostas
  const { token, respostas } = req.body || {}
  if (typeof token !== 'string' || !token) return res.status(400).json({ erro: 'Link inválido.' })

  if (!Array.isArray(respostas) || respostas.length !== TETRADES.length) {
    return res.status(400).json({ erro: 'Responda todas as questões antes de enviar.' })
  }
  if (!respostas.every((r) => r && respostaValida(r) && r.mais !== r.menos)) {
    return res.status(400).json({ erro: 'Há respostas incompletas ou repetidas.' })
  }

  try {
    const linhas = await banco(
      `disc_avaliacoes?select=id,colaborador_id,candidato_id,status&token=eq.${encodeURIComponent(token)}&limit=1`
    )
    const avaliacao = linhas?.[0]
    if (!avaliacao || avaliacao.status !== 'pendente') {
      return res.status(409).json({ erro: 'Este questionário já foi respondido ou o link foi cancelado.' })
    }

    // A apuração acontece AQUI, não na tela: o que o navegador manda são as escolhas,
    // nunca o resultado pronto.
    const resultado = calcularDisc(respostas, TETRADES.length)

    // A ordem importa e é o que impede resultado "meio salvo": primeiro o perfil na ficha
    // (repetir a mesma letra é inofensivo), depois o fechamento com trava de status.
    const tabela = avaliacao.colaborador_id ? 'colaboradores' : 'candidatos'
    const idAlvo = avaliacao.colaborador_id || avaliacao.candidato_id
    if (idAlvo) {
      await banco(`${tabela}?id=eq.${idAlvo}`, {
        method: 'PATCH',
        body: JSON.stringify({ perfil_disc: resultado.primario }),
      })
    }

    const fechadas = await banco(`disc_avaliacoes?id=eq.${avaliacao.id}&status=eq.pendente`, {
      method: 'PATCH',
      headers: { Prefer: 'return=representation' },
      body: JSON.stringify({
        respostas,
        resultado,
        status: 'respondido',
        respondido_em: new Date().toISOString(),
      }),
    })

    // Se dois envios chegarem juntos, só o primeiro fecha — o segundo não sobrescreve.
    if (!Array.isArray(fechadas) || fechadas.length !== 1) {
      return res.status(409).json({ erro: 'Este questionário já foi respondido ou o link foi cancelado.' })
    }

    return res.status(200).json({ resultado })
  } catch (e) {
    console.error('[disc POST]', e)
    return res.status(500).json({ erro: 'Não foi possível registrar suas respostas. Tente de novo.' })
  }
}
