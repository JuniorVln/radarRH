// POST /api/auth/login  { email, senha }  ->  { token, expira_em, usuario }
//
// O token devolvido aqui é o mesmo crachá que o front passa para o banco em toda consulta.
// Por isso ele carrega o papel da pessoa: é o que as policies usam para decidir se ela vê
// a empresa inteira ou só a própria ficha.

import {
  configurado,
  buscar,
  atualizar,
  conferirSenha,
  perderTempo,
  assinarToken,
} from '../_acesso.js'

// Mensagem única de propósito: não dizemos se o que errou foi o e-mail ou a senha, senão
// o formulário vira uma forma de descobrir quem tem conta.
const CREDENCIAL_INVALIDA = 'E-mail ou senha incorretos.'

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ erro: 'Método não permitido.' })
  if (!configurado()) return res.status(503).json({ erro: 'Login indisponível no momento.' })

  const { email, senha } = req.body || {}
  if (typeof email !== 'string' || typeof senha !== 'string' || !email.trim() || !senha) {
    return res.status(400).json({ erro: 'Informe e-mail e senha.' })
  }

  try {
    const registros = await buscar(
      `acessos?select=colaborador_id,email_login,senha_hash,papel,ativo&email_login=eq.${encodeURIComponent(
        email.trim().toLowerCase()
      )}&limit=1`
    )
    const acesso = registros?.[0]

    // Sem conta, sem senha definida ainda, ou acesso revogado: todos caem na mesma resposta,
    // mas ainda pagamos o custo do bcrypt para o tempo de resposta não entregar a diferença.
    if (!acesso || !acesso.senha_hash || !acesso.ativo) {
      await perderTempo(senha)
      return res.status(401).json({ erro: CREDENCIAL_INVALIDA })
    }

    if (!(await conferirSenha(senha, acesso.senha_hash))) {
      return res.status(401).json({ erro: CREDENCIAL_INVALIDA })
    }

    const pessoas = await buscar(
      `colaboradores?select=id,nome,cargo,foto_url,status&id=eq.${acesso.colaborador_id}&limit=1`
    )
    const pessoa = pessoas?.[0]
    if (!pessoa || pessoa.status === 'demitido') {
      return res.status(403).json({ erro: 'Este acesso não está mais ativo.' })
    }

    const { token, expira_em } = assinarToken({
      id: acesso.colaborador_id,
      papel: acesso.papel,
      nome: pessoa.nome,
    })

    // Carimbo do último acesso é informativo; se falhar, o login não pode cair por causa disso.
    atualizar(`acessos?colaborador_id=eq.${acesso.colaborador_id}`, {
      ultimo_acesso: new Date().toISOString(),
    }).catch(() => {})

    return res.status(200).json({
      token,
      expira_em,
      usuario: {
        id: acesso.colaborador_id,
        nome: pessoa.nome,
        cargo: pessoa.cargo,
        foto_url: pessoa.foto_url,
        papel: acesso.papel,
        email: acesso.email_login,
      },
    })
  } catch (e) {
    console.error('[auth/login]', e)
    return res.status(500).json({ erro: 'Não foi possível entrar agora. Tente de novo.' })
  }
}
