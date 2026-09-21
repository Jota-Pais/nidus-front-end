import type { DataISO } from '@/dominio/tipos'
import { rotularData } from '@/lib/data'
import { Data } from '../Data'
import './estilos.css'

/** A data e o que ela é - RF-REP-02. */
export function DataPrevistaOuReal({
  real,
  previsto,
  rotulo,
}: {
  real: DataISO | null | undefined
  previsto: DataISO | null | undefined
  /** Nome do evento, para a leitura em voz alta. ex: "Parto" */
  rotulo?: string
}) {
  const { texto, natureza } = rotularData(real, previsto)

  if (natureza === null) {
    return <span className="dataPrevistaOuReal__vazia">{texto}</span>
  }

  const prefixo = rotulo ? `${rotulo}: ` : ''
  const porExtenso =
    natureza === 'real' ? `${prefixo}${texto}, confirmado` : `${prefixo}${texto}, apenas previsto`

  return (
    <span className={`dataPrevistaOuReal dataPrevistaOuReal--${natureza}`} title={porExtenso}>
      <Data valor={natureza === 'real' ? real : previsto} />
      <span className="dataPrevistaOuReal__marca" aria-hidden="true">
        {natureza === 'real' ? 'OK' : 'PREV'}
      </span>
      <span className="dataPrevistaOuReal__leitura">{porExtenso}</span>
    </span>
  )
}
