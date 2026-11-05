import { Texto } from '@/componentes'
import { COR_DO_PARTO } from '@/app/tokens'

/** A bolinha colorida do card e da grade é o parto atual do casal */
export function LegendaDosPartos() {
  return (
    <div className="legendaDosPartos">
      <Texto tom="rotulo">Partos</Texto>
      {COR_DO_PARTO.map(({ cor }, indice) => (
        <span key={cor} className="legendaDosPartos__item">
          <span className="bolinhaDeParto" style={{ backgroundColor: cor }} />
          {indice + 1}º
        </span>
      ))}
    </div>
  )
}
