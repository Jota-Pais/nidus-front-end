import { ClearOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Botao } from '../Botao'
import './estilos.css'

/** A faixa de filtros da tela */
export function BarraDeFiltros({
  children,
  aoLimpar,
  quantidadeAplicada = 0,
  acoes,
}: {
  children: ReactNode
  aoLimpar?: () => void
  quantidadeAplicada?: number
  acoes?: ReactNode
}) {
  const podeLimpar = aoLimpar !== undefined && quantidadeAplicada > 0

  return (
    <div className="barraDeFiltros">
      <div className="barraDeFiltros__campos">{children}</div>
      <div className="barraDeFiltros__acoes">
        {acoes}
        {podeLimpar && (
          <Botao variante="fantasma" icon={<ClearOutlined aria-hidden="true" />} onClick={aoLimpar}>
            Limpar filtros ({quantidadeAplicada})
          </Botao>
        )}
      </div>
    </div>
  )
}
