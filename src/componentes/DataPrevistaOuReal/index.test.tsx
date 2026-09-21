import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DataPrevistaOuReal } from './index'

/**
 * RF-REP-02 - "datas previstas visualmente distintas das reais: a diferença
 * entre 'vai nascer' e 'nasceu' é a informação mais importante da tela"
 */
describe('DataPrevistaOuReal — RF-REP-02', () => {
  it('quando a data real existe, é ela que aparece, mesmo havendo previsão', () => {
    render(<DataPrevistaOuReal real="2026-05-26" previsto="2026-05-25" />)
    expect(screen.getByText('26/05/2026')).toBeInTheDocument()
    expect(screen.queryByText('25/05/2026')).not.toBeInTheDocument()
  })

  it('sem data real, mostra a prevista', () => {
    render(<DataPrevistaOuReal real={null} previsto="2026-05-25" />)
    expect(screen.getByText('25/05/2026')).toBeInTheDocument()
  })

  it('as duas ausentes viram travessão, nunca "Invalid Date"', () => {
    render(<DataPrevistaOuReal real={null} previsto={null} />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })

  /** O canal de texto: a etiqueta muda de palavra, não só de cor */
  it('a etiqueta distingue confirmado de previsto por texto', () => {
    const { unmount } = render(<DataPrevistaOuReal real="2026-05-26" previsto={null} />)
    expect(screen.getByText('OK')).toBeInTheDocument()
    unmount()

    render(<DataPrevistaOuReal real={null} previsto="2026-05-25" />)
    expect(screen.getByText('PREV')).toBeInTheDocument()
  })

  /** O canal do leitor de tela: 'OK' e 'PREV' soltos não são frase */
  it('diz por extenso o que a data é, para quem não vê a etiqueta', () => {
    const { unmount } = render(
      <DataPrevistaOuReal real="2026-05-26" previsto={null} rotulo="Parto" />,
    )
    expect(screen.getByText('Parto: 26/05/2026, confirmado')).toBeInTheDocument()
    unmount()

    render(<DataPrevistaOuReal real={null} previsto="2026-05-25" rotulo="Parto" />)
    expect(screen.getByText('Parto: 25/05/2026, apenas previsto')).toBeInTheDocument()
  })

  /** RNF-04 - exibição sempre em dd/mm/aaaa, e o ISO fica na máquina */
  it('exibe em dd/mm/aaaa e guarda o ISO no elemento de tempo', () => {
    const { container } = render(<DataPrevistaOuReal real="2026-05-26" previsto={null} />)
    const tempo = container.querySelector('time')
    expect(tempo).toHaveAttribute('dateTime', '2026-05-26')
    expect(tempo).toHaveTextContent('26/05/2026')
  })
})
