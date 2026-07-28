// Exportacao de CSV no proprio navegador — o sistema nao tem backend, entao o arquivo
// e montado e baixado aqui mesmo.
//
// Cuidados que o Excel em portugues exige e que dao dor de cabeca se faltarem:
//  - BOM no inicio, senao acento vira caractere quebrado;
//  - separador ";" (o Excel pt-BR usa virgula como separador DECIMAL);
//  - campo que contem ";", aspas ou quebra de linha vai entre aspas, com aspas dobradas.

export type ColunaCSV<T> = {
  cabecalho: string
  valor: (item: T) => string | number | null | undefined
}

function escapar(valor: string | number | null | undefined): string {
  const texto = valor == null ? '' : String(valor)
  if (/[";\r\n]/.test(texto)) return `"${texto.replace(/"/g, '""')}"`
  return texto
}

export function montarCSV<T>(itens: T[], colunas: ColunaCSV<T>[]): string {
  const linhas = [
    colunas.map(c => escapar(c.cabecalho)).join(';'),
    ...itens.map(item => colunas.map(c => escapar(c.valor(item))).join(';')),
  ]
  return linhas.join('\r\n')
}

export function baixarCSV(nomeArquivo: string, conteudo: string) {
  const BOM = '﻿'
  const blob = new Blob([BOM + conteudo], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}
