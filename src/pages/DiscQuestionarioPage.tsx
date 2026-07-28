import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { CheckCircle2, ChevronLeft, ChevronRight } from 'lucide-react'
import { TETRADES, respostaValida, type DimensaoDisc, type RespostaTetrade, type ResultadoDisc } from '../lib/disc'
import { buscarPorToken, finalizarAvaliacao, type AvaliacaoDisc } from '../lib/discService'
import { DiscResultado } from '../components/DiscResultado'

type Parcial = { mais?: DimensaoDisc; menos?: DimensaoDisc }

const ORDEM: DimensaoDisc[] = ['D', 'I', 'S', 'C']

/**
 * Página PÚBLICA do questionário — acessada por /disc/:token, sem login.
 * Fica fora do Layout de propósito: quem responde é o colaborador ou o candidato, e
 * não deve ver o menu do sistema de RH nem os dados de mais ninguém.
 */
export function DiscQuestionarioPage() {
  const { token } = useParams<{ token: string }>()

  const [avaliacao, setAvaliacao] = useState<AvaliacaoDisc | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [respostas, setRespostas] = useState<Parcial[]>(() => TETRADES.map(() => ({})))
  const [indice, setIndice] = useState(0)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<ResultadoDisc | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    if (!token) return
    buscarPorToken(token)
      .then(a => {
        setAvaliacao(a)
        if (a?.status === 'respondido' && a.resultado) setResultado(a.resultado)
      })
      .finally(() => setCarregando(false))
  }, [token])

  // A ordem das palavras dentro do bloco é embaralhada por bloco, mas de forma
  // ESTÁVEL (derivada do índice): sem isso, o D apareceria sempre em primeiro e a
  // posição na tela viraria um viés. Sendo estável, não muda a cada re-render.
  const ordemDoBloco = useCallback((i: number): DimensaoDisc[] => {
    const giro = i % 4
    return [...ORDEM.slice(giro), ...ORDEM.slice(0, giro)]
  }, [])

  const marcar = (campo: 'mais' | 'menos', dim: DimensaoDisc) => {
    setRespostas(atual => {
      const novo = [...atual]
      const bloco = { ...novo[indice] }
      const oposto = campo === 'mais' ? 'menos' : 'mais'
      // Marcar a mesma palavra nos dois lados não faz sentido — limpa o outro lado.
      if (bloco[oposto] === dim) bloco[oposto] = undefined
      bloco[campo] = bloco[campo] === dim ? undefined : dim
      novo[indice] = bloco
      return novo
    })
  }

  const completos = respostas.filter(r => respostaValida(r)).length
  const blocoAtualOk = respostaValida(respostas[indice] || {})
  const tudoRespondido = completos === TETRADES.length

  const enviar = async () => {
    if (!avaliacao || !tudoRespondido) return
    setEnviando(true)
    setErro(null)
    try {
      const r = await finalizarAvaliacao(avaliacao, respostas as RespostaTetrade[])
      setResultado(r)
    } catch (e: any) {
      setErro(e.message || 'Não consegui registrar suas respostas. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  if (carregando) {
    return <Moldura><p className="text-center text-gray-400 py-16">Carregando...</p></Moldura>
  }

  if (!avaliacao) {
    return (
      <Moldura>
        <div className="text-center py-16">
          <h1 className="text-xl font-semibold text-gray-900">Link inválido ou cancelado</h1>
          <p className="text-gray-500 mt-2">
            Este questionário não existe ou o link foi cancelado. Peça um link novo ao RH.
          </p>
        </div>
      </Moldura>
    )
  }

  if (resultado) {
    return (
      <Moldura>
        <div className="flex items-center gap-2 text-green-600 mb-6">
          <CheckCircle2 size={20} />
          <p className="font-medium">Respostas registradas. Obrigado!</p>
        </div>
        <DiscResultado resultado={resultado} />
      </Moldura>
    )
  }

  const tetrade = TETRADES[indice]

  return (
    <Moldura>
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Perfil comportamental</h1>
        <p className="text-gray-500 text-sm mt-1">
          Em cada bloco, marque a palavra que <strong>mais</strong> combina com você e a que{' '}
          <strong>menos</strong> combina. Não existe resposta certa — responda pensando em como
          você é de verdade, não em como acha que deveria ser.
        </p>
      </div>

      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1 bg-gray-100 rounded-full h-2">
          <div
            className="bg-indigo-600 h-2 rounded-full transition-all"
            style={{ width: `${(completos / TETRADES.length) * 100}%` }}
          />
        </div>
        <span className="text-sm text-gray-500 tabular-nums whitespace-nowrap">
          {completos} de {TETRADES.length}
        </span>
      </div>

      <div className="border border-gray-200 rounded-xl overflow-hidden">
        <div className="grid grid-cols-[1fr_auto_auto] gap-2 px-4 py-2 bg-gray-50 text-xs font-semibold text-gray-500">
          <span>Bloco {indice + 1}</span>
          <span className="w-16 text-center">Mais</span>
          <span className="w-16 text-center">Menos</span>
        </div>
        {ordemDoBloco(indice).map(dim => (
          <div key={dim} className="grid grid-cols-[1fr_auto_auto] gap-2 items-center px-4 py-3 border-t border-gray-100">
            <span className="text-gray-800">{tetrade[dim]}</span>
            <button
              type="button"
              aria-label={`Mais: ${tetrade[dim]}`}
              onClick={() => marcar('mais', dim)}
              className={`w-16 h-9 rounded-lg border text-sm transition ${
                respostas[indice]?.mais === dim
                  ? 'bg-indigo-600 border-indigo-600 text-white font-medium'
                  : 'bg-white border-gray-300 text-gray-400 hover:border-indigo-300'
              }`}
            >
              +
            </button>
            <button
              type="button"
              aria-label={`Menos: ${tetrade[dim]}`}
              onClick={() => marcar('menos', dim)}
              className={`w-16 h-9 rounded-lg border text-sm transition ${
                respostas[indice]?.menos === dim
                  ? 'bg-gray-700 border-gray-700 text-white font-medium'
                  : 'bg-white border-gray-300 text-gray-400 hover:border-gray-400'
              }`}
            >
              −
            </button>
          </div>
        ))}
      </div>

      {erro && <p className="text-sm text-red-600 mt-4">{erro}</p>}

      <div className="flex items-center justify-between mt-6">
        <button
          className="btn-secondary"
          onClick={() => setIndice(i => Math.max(0, i - 1))}
          disabled={indice === 0}
        >
          <ChevronLeft size={16} /> Voltar
        </button>

        {indice < TETRADES.length - 1 ? (
          <button
            className="btn-primary"
            onClick={() => setIndice(i => i + 1)}
            disabled={!blocoAtualOk}
          >
            Próximo <ChevronRight size={16} />
          </button>
        ) : (
          <button className="btn-primary" onClick={enviar} disabled={!tudoRespondido || enviando}>
            {enviando ? 'Enviando...' : 'Finalizar'}
          </button>
        )}
      </div>

      {!blocoAtualOk && (
        <p className="text-xs text-gray-400 mt-3 text-center">
          Marque uma palavra em "Mais" e outra, diferente, em "Menos" para seguir.
        </p>
      )}
    </Moldura>
  )
}

function Moldura({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 p-6 md:p-8 shadow-sm">
        {children}
      </div>
    </div>
  )
}
