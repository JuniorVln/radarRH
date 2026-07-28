// Trava de acesso do site inteiro, por senha única (HTTP Basic).
//
// POR QUE ISTO EXISTE
// O sistema ainda não tem login. Enquanto não tiver, o endereço público expõe CPF,
// salário e dados bancários dos colaboradores para quem tiver o link. Esta trava
// deixa o sistema fora do ar para qualquer um que não saiba a senha — é a medida
// provisória enquanto só a Deise está testando.
//
// A proteção por senha nativa do Vercel é recurso do plano Pro; este projeto está no
// Hobby. Edge Middleware funciona no Hobby e resolve o mesmo problema.
//
// O QUE ELA NÃO RESOLVE
// Não substitui autenticação de verdade. Quem passa da senha continua vendo tudo,
// porque quem manda nos dados é o RLS do Supabase — hoje liberado. A solução real é
// Supabase Auth + RLS por papel; isto aqui só tira o sistema da rua enquanto isso
// não existe.
//
// COMO REMOVER quando a autenticação de verdade entrar: apagar este arquivo e a
// variável SITE_SENHA nas configurações do projeto no Vercel.

export const config = {
  // Deixa passar só o que não é página: assets e favicon. Todo o resto pede senha,
  // inclusive /disc/<token> — hoje ninguém de fora foi convidado ainda, então é
  // mais seguro travar tudo do que abrir exceção e esquecer dela aberta depois.
  matcher: '/((?!favicon.ico|robots.txt).*)',
}

export default function middleware(request) {
  const senha = process.env.SITE_SENHA

  // Sem senha configurada, não trava nada: melhor o site funcionar do que ficar
  // inacessível por variável faltando num deploy.
  if (!senha) return

  const cabecalho = request.headers.get('authorization') || ''

  if (cabecalho.startsWith('Basic ')) {
    try {
      const [usuario, informada] = atob(cabecalho.slice(6)).split(':')
      // Usuário é livre; o que vale é a senha.
      if (informada === senha && usuario !== undefined) return
    } catch {
      // credencial malformada cai no 401 abaixo
    }
  }

  return new Response('Acesso restrito.', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Rede Ideia RH", charset="UTF-8"',
      'Content-Type': 'text/plain; charset=utf-8',
    },
  })
}
