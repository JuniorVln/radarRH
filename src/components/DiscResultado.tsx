import React from 'react'
import { DIMENSOES, RESSALVA_DE_USO, type DimensaoDisc, type ResultadoDisc } from '../lib/disc'

const ORDEM: DimensaoDisc[] = ['D', 'I', 'S', 'C']

function Barra({ dim, valor, destaque }: { dim: DimensaoDisc; valor: number; destaque?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
        style={{ backgroundColor: DIMENSOES[dim].cor }}
      >
        {dim}
      </span>
      <div className="flex-1 bg-gray-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-3 rounded-full transition-all duration-700"
          style={{ width: `${valor}%`, backgroundColor: DIMENSOES[dim].cor, opacity: destaque ? 1 : 0.55 }}
        />
      </div>
      <span className="text-sm text-gray-600 w-10 text-right tabular-nums">{valor}%</span>
    </div>
  )
}

/**
 * Tela do resultado. Mostra os DOIS perfis lado a lado de propósito: é a distância
 * entre eles que interessa numa conversa de desenvolvimento, não o número isolado.
 */
export function DiscResultado({ resultado }: { resultado: ResultadoDisc }) {
  const { primario, secundario, adaptado, natural, tensaoDeAdaptacao, completo, respondidas } = resultado

  const tensaoAlta = tensaoDeAdaptacao >= 20

  return (
    <div className="space-y-6">
      {!completo && (
        <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-sm text-yellow-800">
          Questionário incompleto ({respondidas} de 24 blocos). O resultado abaixo é parcial.
        </div>
      )}

      <div className="text-center">
        <p className="text-sm text-gray-500">Perfil comportamental</p>
        <p className="text-5xl font-bold text-gray-900 mt-1 tracking-tight">{resultado.codigo}</p>
        <p className="text-gray-600 mt-2">
          {DIMENSOES[primario].nome}
          {secundario && <> com {DIMENSOES[secundario].nome}</>}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 text-sm">Perfil natural</h4>
          <p className="text-xs text-gray-400 mb-4">Como tende a agir sob pressão — o jeito de origem.</p>
          <div className="space-y-3">
            {ORDEM.map(d => (
              <Barra key={d} dim={d} valor={natural[d]} destaque={d === primario || d === secundario} />
            ))}
          </div>
        </div>

        <div className="border border-gray-200 rounded-xl p-4">
          <h4 className="font-semibold text-gray-900 text-sm">Perfil adaptado</h4>
          <p className="text-xs text-gray-400 mb-4">Como acredita que precisa agir no trabalho hoje.</p>
          <div className="space-y-3">
            {ORDEM.map(d => (
              <Barra key={d} dim={d} valor={adaptado[d]} />
            ))}
          </div>
        </div>
      </div>

      <div className={`rounded-xl p-4 border ${tensaoAlta ? 'bg-orange-50 border-orange-200' : 'bg-gray-50 border-gray-200'}`}>
        <div className="flex items-baseline justify-between">
          <h4 className="font-semibold text-gray-900 text-sm">Tensão de adaptação</h4>
          <span className="text-2xl font-bold text-gray-900 tabular-nums">{tensaoDeAdaptacao}</span>
        </div>
        <p className="text-sm text-gray-600 mt-1">
          {tensaoAlta
            ? 'Distância alta entre como a pessoa é e como ela acha que precisa ser no trabalho. Vale conversar: costuma indicar desgaste.'
            : 'Os dois perfis estão próximos — a pessoa trabalha de um jeito parecido com o que ela é.'}
        </p>
      </div>

      <div className="space-y-2">
        {ORDEM.map(d => (
          <div key={d} className="flex gap-3 text-sm">
            <span className="font-semibold shrink-0 w-24" style={{ color: DIMENSOES[d].cor }}>
              {DIMENSOES[d].nome}
            </span>
            <span className="text-gray-500">{DIMENSOES[d].resumo}</span>
          </div>
        ))}
      </div>

      <p className="text-xs text-gray-400 border-t border-gray-100 pt-4 leading-relaxed">{RESSALVA_DE_USO}</p>
    </div>
  )
}
