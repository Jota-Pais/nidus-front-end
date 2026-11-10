import { Texto } from '@/componentes'
import { FASE, FASES } from '@/dominio/caixa'
import type { FaseDaCaixa } from '@/dominio/tipos'
import './FaseDaCaixa.css'

/** A cor de fundo de cada caixa na grade é a fase dela; a borda vermelha, o atraso */
export function LegendaDasFases() {
  return (
    <div className="legendaDasFases">
      <Texto tom="rotulo">Fases</Texto>
      {FASES.map(({ fase, rotulo }) => (
        <span key={fase} className="legendaDasFases__item">
          <span className={`amostraDaFase amostraDaFase--${fase}`} />
          {rotulo}
        </span>
      ))}
      <span className="legendaDasFases__item">
        <span className="amostraDaFase amostraDaFase--atrasado" />
        Atrasado
      </span>
    </div>
  )
}

/** A fase da caixa na ficha, na cor dela */
export function EtiquetaDaFase({ fase }: { fase: FaseDaCaixa }) {
  return <span className={`etiquetaDaFase etiquetaDaFase--${fase}`}>{FASE[fase].rotulo}</span>
}
