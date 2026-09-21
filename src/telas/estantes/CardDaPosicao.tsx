import { WarningFilled } from '@ant-design/icons'
import { Dica } from '@/componentes'
import { ESTADO_CAIXA } from '@/dominio/estados'
import { ROTULO_EVENTO } from '@/dominio/estante'
import type { Posicao } from '@/dominio/estante'
import { formatarData } from '@/lib/data'
import './grade.css'

/** Um card por posição da estante - RF-INF-03 */
export function CardDaPosicao({
  posicao,
  aoAbrir,
}: {
  posicao: Posicao
  aoAbrir: (idCaixa: number) => void
}) {
  const { caixa, codigo } = posicao

  if (!caixa) {
    return (
      <div className="posicao posicao--vazia" aria-label={`${codigo}: posição vazia`}>
        <span className="posicao__codigo">{codigo}</span>
      </div>
    )
  }

  const visual = ESTADO_CAIXA[caixa.estado]
  const atrasado = caixa.proximoEvento?.atrasado === true

  const descricao = [
    `${codigo}: ${caixa.linhagem}`,
    `${visual.rotulo}`,
    caixa.casal ? `casal ${caixa.casal.identificacao}, ciclo ${caixa.casal.cicloAtual} de ${caixa.casal.maxCiclos}` : null,
    caixa.proximoEvento
      ? `${ROTULO_EVENTO[caixa.proximoEvento.tipo]} ${formatarData(caixa.proximoEvento.data)}${atrasado ? ', vencido sem confirmação' : ''}`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <Dica texto={descricao}>
      <button
        type="button"
        className={`posicao posicao--${caixa.estado}${atrasado ? ' posicao--atrasada' : ''}`}
        onClick={() => aoAbrir(caixa.id)}
        aria-label={descricao}
      >
        <span className="posicao__topo">
          <span className="posicao__codigo">{codigo}</span>
          {/* Segundo canal: forma, não cor. */}
          <span className="posicao__marcador" aria-hidden="true">
            {visual.marcador}
          </span>
        </span>

        <span className="posicao__linhagem">{caixa.linhagem}</span>

        {/* O card do backlog pede a identificação do casal no card, não só no
            tooltip: é a dupla de grupos genéticos, e o primeiro caractere é o
            grupo do macho (RN-02). */}
        {caixa.casal && <span className="posicao__casal">{caixa.casal.identificacao}</span>}

        <span className="posicao__rodape">
          {/* Terceiro canal: texto. RF-CIC-04 pede o ciclo visível no card. */}
          <span className="posicao__sigla">{visual.sigla}</span>
          {caixa.casal && (
            <span className="posicao__ciclo">
              {caixa.casal.cicloAtual}/{caixa.casal.maxCiclos}
            </span>
          )}
        </span>

        {atrasado && (
          <WarningFilled className="posicao__alerta" aria-hidden="true" />
        )}
      </button>
    </Dica>
  )
}
