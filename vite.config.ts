import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { readFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

/**
 * Roda as funções de `api/` dentro do servidor de desenvolvimento.
 *
 * POR QUE ISTO EXISTE
 * Em produção quem atende `/api/*` é a Vercel. No `npm run dev` não havia ninguém: qualquer
 * tela que dependesse de função de servidor só podia ser testada depois de publicar. Isso
 * ficou grave em 11/09/2026, quando login, DISC público e portal de vagas passaram a ser
 * funções — sem isto, três testes E2E falhavam localmente e passariam a ser verificados
 * apenas em produção, que é exatamente o buraco que a suíte existe para fechar.
 *
 * É só para desenvolvimento e teste; em produção este código não roda.
 */
function apiLocal(): Plugin {
  return {
    name: 'api-local',
    apply: 'serve',
    configureServer(servidor) {
      // As funções leem process.env; o dev server não carrega .env sozinho para o Node.
      if (existsSync('.env')) {
        for (const linha of readFileSync('.env', 'utf-8').split('\n')) {
          const l = linha.trim()
          if (!l || l.startsWith('#') || !l.includes('=')) continue
          const i = l.indexOf('=')
          const chave = l.slice(0, i).trim()
          if (!process.env[chave]) process.env[chave] = l.slice(i + 1).trim()
        }
      }

      servidor.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://local')
        if (!url.pathname.startsWith('/api/')) return next()

        const nome = url.pathname.slice(5) // tira "/api/"
        const candidatos = ['.ts', '.js', '/index.ts', '/index.js'].map((ext) =>
          resolve(process.cwd(), 'api', nome + ext)
        )
        const arquivo = candidatos.find((c) => existsSync(c))
        if (!arquivo) return next()

        try {
          const corpoCru = await new Promise<string>((ok) => {
            const partes: Buffer[] = []
            req.on('data', (p) => partes.push(p as Buffer))
            req.on('end', () => ok(Buffer.concat(partes).toString('utf-8')))
          })

          const modulo = await servidor.ssrLoadModule(arquivo)
          const handler = modulo.default

          // Shims mínimos com a forma que as funções da Vercel esperam.
          const requisicao = Object.assign(req, {
            query: Object.fromEntries(url.searchParams),
            body: corpoCru ? JSON.parse(corpoCru) : {},
          })
          const resposta = {
            statusCode: 200,
            status(codigo: number) {
              this.statusCode = codigo
              return this
            },
            json(dados: unknown) {
              res.statusCode = this.statusCode
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify(dados))
            },
            setHeader: (k: string, v: string) => res.setHeader(k, v),
            end: (c?: string) => res.end(c),
          }

          await handler(requisicao, resposta)
        } catch (e) {
          console.error(`[api-local] ${url.pathname}`, e)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ erro: 'Falha na função local.' }))
        }
      })
    },
  }
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), apiLocal()],
  css: {
    postcss: './postcss.config.js',
  },
})
