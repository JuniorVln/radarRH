// Regras de casamento de nome entre o cadastro do RH e os usuários do Conecta RI.
// Separado da função HTTP para ser testável sem rede.
//
// O problema: no sistema o colaborador é "ANA CAROLINE BATISTA DA SILVA LODI"; no
// Conecta RI ele pode estar como "Ana Caroline Batista", usuário "Ana.Caroline".
// Mandar mensagem para a pessoa errada é pior do que não mandar, então aqui a regra
// erra para o lado de NÃO escolher: na dúvida devolve as opções e o RH decide.

const SEM_ACENTO = (t) =>
  String(t || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()

/** "DA", "DE", "DOS"... não ajudam a identificar ninguém. */
const LIGACOES = new Set(['da', 'de', 'do', 'das', 'dos', 'e'])

export function partesDoNome(nome) {
  return SEM_ACENTO(nome)
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((p) => p && !LIGACOES.has(p))
}

/**
 * Procura o usuário do Conecta RI correspondente ao colaborador.
 *
 * Regra: casa quem tem o MESMO primeiro nome e pelo menos um sobrenome em comum.
 * Só devolve escolhido quando existe exatamente UM candidato — dois "Ana Paula"
 * viram ambiguidade, não chute.
 */
export function encontrarUsuario(nomeColaborador, usuarios) {
  const alvo = partesDoNome(nomeColaborador)
  if (alvo.length === 0) return { erro: 'Nome do colaborador vazio.' }

  const [primeiroAlvo, ...sobrenomesAlvo] = alvo

  const candidatos = []
  for (const u of usuarios || []) {
    const partes = partesDoNome(u.name || u.username)
    if (partes.length === 0) continue

    if (partes[0] !== primeiroAlvo) continue

    // Nome só com o primeiro (ex.: "Ana") casa; com sobrenome, precisa bater um.
    const sobrenomes = partes.slice(1)
    const temSobrenomeComum =
      sobrenomes.length === 0 ||
      sobrenomesAlvo.length === 0 ||
      sobrenomes.some((s) => sobrenomesAlvo.includes(s))

    if (temSobrenomeComum) candidatos.push(u)
  }

  if (candidatos.length === 1) return { usuario: candidatos[0] }

  if (candidatos.length === 0) {
    return { erro: `Não encontrei "${nomeColaborador}" no Conecta RI.` }
  }

  return {
    erro:
      `Mais de uma pessoa no Conecta RI parece ser "${nomeColaborador}": ` +
      candidatos.map((c) => `@${c.username}`).join(', ') +
      '. Envie manualmente para não errar o destinatário.',
    ambiguos: candidatos.map((c) => ({ username: c.username, name: c.name })),
  }
}
