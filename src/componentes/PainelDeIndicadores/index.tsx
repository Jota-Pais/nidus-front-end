import type { ReactNode } from 'react'
import { Tooltip } from 'antd'
import { SecaoInvertida } from '../SecaoInvertida'
import './estilos.css'

export interface Indicador {
  rotulo: string
  valor: number | string
  /** Explica de onde sai o número. RNF-01: quem calcula é o servidor */
  ajuda?: string
  sufixo?: ReactNode
  /** Destaque discreto: o número que a tela quer que seja lido primeiro */
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
 * fila de números de cabeçalho - capacidade/ocupada/livre (RF-INF-06), total por coluna do
 * quadro, saldo de cota
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
