import type { DataISO } from '@/dominio/tipos'
import { rotularData } from '@/lib/data'
import { Data } from '../Data'
import './estilos.css'

/**
 * A data, e o que ela é — `RF-REP-02`.
 *
 * O requisito não pede isto como enfeite. Está escrito assim: "datas
 * previstas visualmente distintas das reais: **a diferença entre 'vai
 * nascer' e 'nasceu' é a informação mais importante da tela**".
 *
 * O contrato entrega o par (`dtPartoPrevisto` / `dtPartoReal`) justamente
 * para isso, e `real === null` quer dizer que ainda não aconteceu. Quem
 * receber os dois e mostrar só um número perde exatamente a informação que o
 * requisito manda destacar.
 *
 * ⚠️ **A distinção não é por cor** (`RNF-10`). São três canais somados:
 *
 * - **texto** — a etiqueta `PREV` ao lado da data prevista;
 * - **forma** — a borda tracejada da etiqueta, contra a sólida da real;
 * - **leitor de tela** — o `title` diz "previsto" ou "confirmado" por extenso.
 *
 * Em preto e branco, ou para quem não distingue as cores, continua legível.
 */
export function DataPrevistaOuReal({
  real,
  previsto,
  rotulo,
}: {
  real: DataISO | null | undefined
  previsto: DataISO | null | undefined
  /** Nome do evento, para a leitura em voz alta. Ex.: "Parto". */
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
