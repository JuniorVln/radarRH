// Roda depois de todos os testes do smoke (mesmo com falhas) e monta o relatorio HTML.
export default async function () {
  await import('../scripts/build-smoke-report.mjs')
}
