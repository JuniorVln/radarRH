import React, { useCallback, useEffect, useState } from 'react'
import { Copy, Link2, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { Modal, Badge } from '../ui'
import {
  abrirAvaliacao,
  linkDoQuestionario,
  listarDoColaborador,
  type AvaliacaoDisc,
} from '../../lib/discService'
import { DiscResultado } from '../DiscResultado'
import { formatDate } from '../../lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  colaboradorId?: string
  candidatoId?: string
  nome: string
}

/**
 * Onde o RH aplica o DISC de alguém: gera o link do questionário e mostra o
 * resultado quando a pessoa responde.
 *
 * O link é copiado à mão por enquanto — o disparo por e-mail entra quando o domínio
 * remetente estiver definido. O fluxo já funciona inteiro sem isso.
 */
export function DiscModal({ open, onClose, colaboradorId, candidatoId, nome }: Props) {
  const [avaliacoes, setAvaliacoes] = useState<AvaliacaoDisc[]>([])
  const [carregando, setCarregando] = useState(false)
  const [gerando, setGerando] = useState(false)

  const carregar = useCallback(async () => {
    if (!colaboradorId) return
    setCarregando(true)
    setAvaliacoes(await listarDoColaborador(colaboradorId))
    setCarregando(false)
  }, [colaboradorId])

  useEffect(() => {
    if (open) carregar()
  }, [open, carregar])

  const gerarLink = async () => {
    setGerando(true)
    try {
      const a = await abrirAvaliacao({ colaboradorId, candidatoId })
      await navigator.clipboard.writeText(linkDoQuestionario(a.token)).catch(() => {})
      toast.success('Link gerado e copiado.')
      await carregar()
    } catch (e: any) {
      toast.error('Erro ao gerar o link: ' + e.message)
    } finally {
      setGerando(false)
    }
  }

  const respondida = avaliacoes.find(a => a.status === 'respondido' && a.resultado)
  const pendente = avaliacoes.find(a => a.status === 'pendente')

  return (
    <Modal open={open} onClose={onClose} title={`DISC — ${nome}`} maxWidth="max-w-3xl">
      {carregando ? (
        <p className="text-center text-gray-400 py-10">Carregando...</p>
      ) : (
        <div className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-gray-100">
            <div>
              {pendente ? (
                <div className="flex items-center gap-2">
                  <Badge variant="yellow">Aguardando resposta</Badge>
                  <span className="text-xs text-gray-400">
                    enviado em {formatDate(pendente.criado_em)}
                  </span>
                </div>
              ) : respondida ? (
                <Badge variant="green">Respondido</Badge>
              ) : (
                <span className="text-sm text-gray-500">Ainda não aplicado.</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {pendente && (
                <button
                  className="btn-secondary"
                  onClick={() => {
                    navigator.clipboard.writeText(linkDoQuestionario(pendente.token))
                    toast.success('Link copiado.')
                  }}
                >
                  <Copy size={15} /> Copiar link
                </button>
              )}
              <button className="btn-primary" onClick={gerarLink} disabled={gerando}>
                {respondida || pendente ? <RefreshCw size={15} /> : <Link2 size={15} />}
                {gerando ? 'Gerando...' : pendente ? 'Gerar novo link' : respondida ? 'Aplicar de novo' : 'Gerar link'}
              </button>
            </div>
          </div>

          {respondida?.resultado ? (
            <DiscResultado resultado={respondida.resultado} />
          ) : (
            <div className="text-center py-10 text-gray-500 text-sm">
              <p>Gere o link e envie para a pessoa responder.</p>
              <p className="text-gray-400 mt-1">São 24 blocos, leva cerca de 5 minutos.</p>
            </div>
          )}

          {avaliacoes.length > 1 && (
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-500 mb-2">Histórico</p>
              {avaliacoes.map(a => (
                <div key={a.id} className="flex items-center justify-between text-sm py-1">
                  <span className="text-gray-600">
                    {a.respondido_em ? formatDate(a.respondido_em) : formatDate(a.criado_em)}
                  </span>
                  <span className="text-gray-400">
                    {a.resultado ? a.resultado.codigo : a.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}
