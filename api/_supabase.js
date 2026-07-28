// Acesso ao Supabase pelo LADO DO SERVIDOR, para as rotas públicas do portal de vagas.
//
// POR QUE NÃO USAR O CLIENTE DO NAVEGADOR AQUI
// A página do portal é pública. Se ela falasse direto com o Supabase, a chave iria
// junto no JavaScript e qualquer visitante a copiaria — e como o RLS ainda está
// liberado, isso daria acesso a tudo. Então o portal não recebe chave nenhuma: ele
// chama estas funções, que rodam no servidor da Vercel com a chave de serviço.
//
// Consequência importante: cada função aqui é responsável por devolver SOMENTE o que
// pode ser público. Não existe RLS protegendo isto — a filtragem é feita aqui.

const URL_BASE = process.env.SUPABASE_URL
const CHAVE = process.env.SUPABASE_SERVICE_KEY

export function configurado() {
  return Boolean(URL_BASE && CHAVE)
}

async function chamar(caminho, opcoes = {}) {
  const resposta = await fetch(`${URL_BASE}/rest/v1/${caminho}`, {
    ...opcoes,
    headers: {
      apikey: CHAVE,
      Authorization: `Bearer ${CHAVE}`,
      'Content-Type': 'application/json',
      ...(opcoes.headers || {}),
    },
  })

  const texto = await resposta.text()
  const corpo = texto ? JSON.parse(texto) : null

  if (!resposta.ok) {
    const erro = new Error(corpo?.message || `Supabase respondeu ${resposta.status}`)
    erro.status = resposta.status
    throw erro
  }
  return corpo
}

export const buscar = (caminho) => chamar(caminho)

export const inserir = (tabela, dados) =>
  chamar(tabela, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(dados),
  })
