// Cliente do Conecta RI usado pelas telas. Nao fala com o Rocket.Chat direto: o
// token mora na funcao de servidor (/api/conecta-ri). Se o token viesse pro
// navegador, qualquer um o extrairia do bundle e mandaria mensagem em nome da empresa.

export type EnvioConectaRI = { ok: true; enviadoPara: string }

export async function enviarPeloConectaRI(nome: string, texto: string): Promise<EnvioConectaRI> {
  const r = await fetch('/api/conecta-ri', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, texto }),
  })

  const corpo = await r.json().catch(() => null)
  if (!r.ok) throw new Error(corpo?.erro || 'Não consegui enviar pelo Conecta RI.')
  return corpo as EnvioConectaRI
}

export function mensagemDoDisc(nome: string, link: string): string {
  const primeiro = nome.trim().split(/\s+/)[0]
  return (
    `Oi, ${primeiro}! Tudo bem?\n\n` +
    `O RH está mapeando o perfil comportamental do time e sua participação é importante.\n\n` +
    `É rápido: 24 blocos de palavras, cerca de 5 minutos. Não existe resposta certa — ` +
    `responda pensando em como você é de verdade.\n\n` +
    `${link}\n\n` +
    `Qualquer dúvida, é só chamar. Obrigado!`
  )
}
