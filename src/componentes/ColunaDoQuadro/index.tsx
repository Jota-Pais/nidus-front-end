import type { ReactNode } from 'react'
import { ESTADO_CAIXA } from '@/dominio/estados'
import type { EstadoCaixa } from '@/dominio/tipos'
import './estilos.css'

/**
 * Uma das cinco colunas do quadro — `RF-CIC-01`.
 *
 * ⚠️ **A coluna aparece mesmo vazia.** O contrato manda as cinco sempre, na
 * ordem de `COLUNAS_DO_QUADRO`, e o front não inventa coluna nem reordena.
 * Uma coluna que some quando esvazia faz o quadro mudar de forma conforme o
 * dia, e o técnico perde a referência espacial de onde cada estado fica.
 *
 * ⚠️ **`total` não é `cards.length`.** O servidor pagina; o cabeçalho mostra
 * o total dele. Contar os cards renderizados diria "12" numa coluna de 340.
 *
 * O cabeçalho carrega marcador, sigla e rótulo — os mesmos de
 * `@/dominio/estados`, os mesmos do card e da legenda (`RNF-10`).
 */
export function ColunaDoQuadro({
  estado,
  total,
  children,
  vazia,
}: {
  estado: EstadoCaixa
  /** O total do servidor, não a quantidade renderizada. */
  total: number
  children: ReactNode
  /** O que mostrar quando não há card. Sem isto, a coluna fica só com o zero. */
  vazia?: ReactNode
}) {
  const visual = ESTADO_CAIXA[estado]

  return (
    <section
      className={`colunaDoQuadro colunaDoQuadro--${estado}`}
      aria-label={`${visual.rotulo}: ${total} ${total === 1 ? 'caixa' : 'caixas'}`}
    >
      <header className="colunaDoQuadro__cabecalho">
        <span className="colunaDoQuadro__marcador" aria-hidden="true">
          {visual.marcador}
        </span>
        <span className="colunaDoQuadro__rotulo">{visual.rotulo}</span>
        <span className="colunaDoQuadro__total">{total}</span>
      </header>

      <div className="colunaDoQuadro__corpo">
        {total === 0 && vazia ? <div className="colunaDoQuadro__vazia">{vazia}</div> : children}
      </div>
    </section>
  )
}
