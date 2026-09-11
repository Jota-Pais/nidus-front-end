import type { ReactNode } from 'react'
import { Tooltip } from 'antd'
import { SecaoInvertida } from '../SecaoInvertida'
import './estilos.css'

export interface Indicador {
  rotulo: string
  valor: number | string
  /** Explica de onde sai o número. `RNF-01`: quem calcula é o servidor. */
  ajuda?: string
  sufixo?: ReactNode
  /** Destaque discreto: o número que a tela quer que seja lido primeiro. */
  emDestaque?: boolean
}

function Numero({ indicador }: { indicador: Indicador }) {
  const conteudo = (
    <div className={`indicador${indicador.emDestaque ? ' indicador--destaque' : ''}`}>
      <span className="indicador__rotulo">{indicador.rotulo}</span>
      <span className="indicador__valor">
        {indicador.valor}
        {indicador.sufixo && <span className="indicador__sufixo">{indicador.sufixo}</span>}
      </span>
    </div>
  )

  return indicador.ajuda ? <Tooltip title={indicador.ajuda}>{conteudo}</Tooltip> : conteudo
}

/**
 * Fila de números de cabeçalho — capacidade/ocupada/livre (`RF-INF-06`),
 * total por coluna do quadro, saldo de cota.
 *
 * `invertido` põe a fila na faixa escura do design system. É o recurso de
 * holofote: usar no número que o técnico olha primeiro ao abrir o sistema — o
 * painel de alertas do dia (`RF-REP-07`) — e em mais nada na mesma tela.
 *
 * O número sai em `JetBrains Mono` com `tabular-nums`: quatro indicadores
 * lado a lado com fonte proporcional não alinham, e a fila fica torta
 * conforme os valores mudam.
 *
 * ⚠️ **Nenhum número daqui é calculado no front** (`RNF-01`). O componente
 * recebe pronto e desenha. Se aparecer uma soma no `valor` de uma chamada, o
 * erro está na chamada, não aqui.
 */
export function PainelDeIndicadores({
  indicadores,
  invertido = false,
}: {
  indicadores: Indicador[]
  invertido?: boolean
}) {
  const fila = (
    <div className="painelDeIndicadores">
      {indicadores.map((indicador) => (
        <Numero key={indicador.rotulo} indicador={indicador} />
      ))}
    </div>
  )

  return invertido ? <SecaoInvertida>{fila}</SecaoInvertida> : fila
}
