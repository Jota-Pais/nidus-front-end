import { ClearOutlined } from '@ant-design/icons'
import type { ReactNode } from 'react'
import { Botao } from '../Botao'
import './estilos.css'

/**
 * A faixa de filtros da tela.
 *
 * Quebra em várias linhas em vez de espremer os controles: no tablet da sala
 * (`RNF-03`) cabem dois por linha, e um `Select` de 90px é inutilizável de
 * luva.
 *
 * O botão de limpar só aparece **quando há filtro aplicado**, e é a
 * `quantidadeAplicada` que decide — a tela sabe contar os próprios filtros,
 * este componente não tem como adivinhar. Um "Limpar" permanentemente inerte
 * é pior que nenhum: ensina o usuário a ignorar botão.
 */
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
