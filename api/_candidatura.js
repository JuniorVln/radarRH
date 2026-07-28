// Regras de validação da candidatura pública, separadas da função HTTP para poderem
// ser testadas sem subir servidor. É código que recebe dado de estranho na internet,
// então erra para o lado de recusar.

export const LIMITES = {
  nome: 120,
  email: 160,
  telefone: 30,
  mensagem: 2000,
  url: 300,
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function limpar(valor, max) {
  if (typeof valor !== 'string') return ''
  return valor.trim().slice(0, max)
}

/**
 * Valida e normaliza o que veio do formulário.
 * Devolve { ok, erro } ou { ok, dados } — nunca joga exceção, porque quem chama é
 * um endpoint público e um erro não tratado viraria 500 com stack na resposta.
 */
export function validarCandidatura(corpo, vagasAbertas) {
  if (!corpo || typeof corpo !== 'object') {
    return { ok: false, erro: 'Envio inválido.' }
  }

  // Campo-armadilha: fica escondido no formulário, então humano nunca preenche.
  // Robô de spam preenche tudo que encontra. Recusamos em silêncio (200 falso) na
  // função HTTP, para o robô não aprender que foi barrado.
  if (limpar(corpo.site, 50)) {
    return { ok: false, erro: 'spam', silencioso: true }
  }

  const nome = limpar(corpo.nome, LIMITES.nome)
  const email = limpar(corpo.email, LIMITES.email).toLowerCase()
  const telefone = limpar(corpo.telefone, LIMITES.telefone)
  const mensagem = limpar(corpo.mensagem, LIMITES.mensagem)
  const curriculo = limpar(corpo.curriculo, LIMITES.url)
  const vagaId = limpar(corpo.vaga_id, 64)

  if (nome.length < 3) return { ok: false, erro: 'Informe seu nome completo.' }
  if (!EMAIL.test(email)) return { ok: false, erro: 'Informe um e-mail válido.' }
  if (!telefone) return { ok: false, erro: 'Informe um telefone para contato.' }

  // A vaga precisa existir E estar aberta. Sem isso, dava para se candidatar a uma
  // vaga fechada — ou a qualquer id chutado.
  if (!vagaId || !vagasAbertas.includes(vagaId)) {
    return { ok: false, erro: 'Esta vaga não está mais aberta.' }
  }

  if (curriculo && !/^https?:\/\//i.test(curriculo)) {
    return { ok: false, erro: 'O link do currículo precisa começar com http:// ou https://' }
  }

  return {
    ok: true,
    dados: {
      nome,
      email,
      telefone,
      vaga_id: vagaId,
      curriculum_url: curriculo || null,
      observacoes_internas: mensagem || null,
      etapa_kanban: 'triagem',
      origem: 'Portal',
    },
  }
}

/** Campos da vaga que podem aparecer publicamente. Salário fica de fora de propósito. */
export const CAMPOS_PUBLICOS = [
  'id',
  'titulo',
  'setor',
  'area',
  'nivel',
  'tipo_contrato',
  'modelo_trabalho',
  'localidade',
  'descricao',
  'requisitos',
  'beneficios',
  'numero_vagas',
  'criado_em',
]
