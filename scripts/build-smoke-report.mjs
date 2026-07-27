// Monta o relatorio visual do smoke test: le os JSONs escritos por e2e/smoke.spec.ts
// e gera smoke-report/index.html — uma galeria com o print de cada tela do sistema,
// o video da navegacao e a lista de problemas encontrados.
//
// Uso: npm run test:smoke  (roda o Playwright e depois este script)

import fs from 'node:fs'
import path from 'node:path'

const RAIZ = 'smoke-report'
const DIR_RESULTADOS = path.join(RAIZ, 'resultados')
const DIR_VIDEOS_PUB = path.join(RAIZ, 'videos-pub')

if (!fs.existsSync(DIR_RESULTADOS)) {
  console.error(`[smoke] Nao encontrei ${DIR_RESULTADOS}. Rode o Playwright antes.`)
  process.exit(1)
}

fs.mkdirSync(DIR_VIDEOS_PUB, { recursive: true })

const resultados = fs
  .readdirSync(DIR_RESULTADOS)
  .filter((f) => f.endsWith('.json'))
  .map((f) => JSON.parse(fs.readFileSync(path.join(DIR_RESULTADOS, f), 'utf8')))

// Copia cada video pra um nome previsivel (<slug>.webm) para o HTML referenciar.
for (const r of resultados) {
  const origem = r.pastaTeste ? path.join(r.pastaTeste, 'video.webm') : null
  if (!origem || !fs.existsSync(origem)) {
    r.video = null
    continue
  }
  fs.copyFileSync(origem, path.join(DIR_VIDEOS_PUB, `${r.slug}.webm`))
  r.video = `videos-pub/${r.slug}.webm`
}

// Mantem a ordem do menu (gravada pelo proprio teste) em vez da ordem alfabetica.
resultados.sort((a, b) => (a.ordem ?? 999) - (b.ordem ?? 999))

const ok = resultados.filter((r) => r.ok)
const falhas = resultados.filter((r) => !r.ok)
const gerado = new Date().toLocaleString('pt-BR')

const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c])

const cartao = (r) => `
  <article class="cartao ${r.ok ? 'ok' : 'falha'}" id="${esc(r.slug)}">
    <header>
      <span class="selo">${r.ok ? 'OK' : 'PROBLEMA'}</span>
      <h2>${esc(r.nome)}</h2>
      <code>${esc(r.path)}</code>
    </header>
    <a href="${esc(r.print)}" target="_blank" class="print">
      <img src="${esc(r.print)}" alt="Print da tela ${esc(r.nome)}" loading="lazy">
    </a>
    ${
      r.problemas.length
        ? `<ul class="problemas">${r.problemas
            .map((p) => `<li><b>${esc(p.tipo)}</b> ${esc(p.detalhe)}</li>`)
            .join('')}</ul>`
        : ''
    }
    ${r.video ? `<details><summary>Ver vídeo da navegação</summary><video src="${esc(r.video)}" controls preload="none"></video></details>` : ''}
  </article>`

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Radar RH — relatório visual das telas</title>
<style>
  :root { color-scheme: light dark; --bg:#0f1115; --card:#171a21; --txt:#e6e8ee; --mut:#9aa3b2; --ok:#2ea043; --err:#e5534b; }
  @media (prefers-color-scheme: light) { :root { --bg:#f6f7f9; --card:#fff; --txt:#14171f; --mut:#5b6472; } }
  * { box-sizing: border-box; }
  body { margin:0; padding:32px; background:var(--bg); color:var(--txt);
         font:15px/1.5 system-ui,-apple-system,Segoe UI,sans-serif; }
  h1 { margin:0 0 4px; font-size:24px; }
  .sub { color:var(--mut); margin-bottom:24px; }
  .resumo { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:28px; }
  .pill { padding:8px 14px; border-radius:999px; background:var(--card); font-weight:600; }
  .pill.ok { color:var(--ok); } .pill.err { color:var(--err); }
  .grade { display:grid; gap:20px; grid-template-columns:repeat(auto-fill,minmax(340px,1fr)); }
  .cartao { background:var(--card); border-radius:12px; overflow:hidden;
            border:2px solid transparent; }
  .cartao.ok { border-color:color-mix(in srgb, var(--ok) 35%, transparent); }
  .cartao.falha { border-color:var(--err); }
  .cartao header { padding:14px 16px; display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .cartao h2 { font-size:16px; margin:0; flex:1; }
  .cartao code { color:var(--mut); font-size:12px; }
  .selo { font-size:11px; font-weight:700; padding:3px 8px; border-radius:5px; color:#fff; }
  .ok .selo { background:var(--ok); } .falha .selo { background:var(--err); }
  .print { display:block; max-height:420px; overflow:hidden; background:#fff; }
  .print img { width:100%; display:block; }
  .problemas { margin:0; padding:12px 16px 12px 32px; font-size:13px; color:var(--err);
               word-break:break-word; }
  details { padding:10px 16px 16px; font-size:13px; color:var(--mut); }
  video { width:100%; margin-top:10px; border-radius:8px; }
</style>
</head>
<body>
  <h1>Radar RH — relatório visual das telas</h1>
  <p class="sub">Gerado automaticamente em ${esc(gerado)} · ${resultados.length} páginas verificadas</p>
  <div class="resumo">
    <span class="pill ok">${ok.length} OK</span>
    <span class="pill err">${falhas.length} com problema</span>
  </div>
  ${
    falhas.length
      ? `<div class="resumo">${falhas
          .map((f) => `<a class="pill err" href="#${esc(f.slug)}">${esc(f.nome)}</a>`)
          .join('')}</div>`
      : ''
  }
  <div class="grade">${resultados.map(cartao).join('')}</div>
</body>
</html>`

fs.writeFileSync(path.join(RAIZ, 'index.html'), html, 'utf8')

console.log(`\n[smoke] Relatório pronto: ${path.resolve(RAIZ, 'index.html')}`)
console.log(`[smoke] ${ok.length} páginas OK, ${falhas.length} com problema.`)
for (const f of falhas) {
  console.log(`  ✗ ${f.nome} (${f.path})`)
  for (const p of f.problemas) console.log(`      [${p.tipo}] ${p.detalhe}`)
}
