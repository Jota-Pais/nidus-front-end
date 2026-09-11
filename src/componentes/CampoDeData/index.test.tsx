import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CampoDeData } from './index'

/**
 * `RNF-04` — exibição sempre em `dd/mm/aaaa`, armazenamento normalizado.
 *
 * O `DatePicker` do Ant Design fala `Dayjs`; o contrato e o estado da tela
 * falam `aaaa-mm-dd`. Este componente é a única tradução entre os dois, e
 * estes testes existem porque errar a tradução desloca a cadeia temporal
 * inteira do `RN-05`.
 */
describe('CampoDeData — RNF-04', () => {
  it('recebe ISO e exibe dd/mm/aaaa', () => {
    render(<CampoDeData value="2026-05-26" />)
    expect(screen.getByRole('textbox')).toHaveValue('26/05/2026')
  })

  it('devolve ISO, não Dayjs, quando a data é escolhida', async () => {
    const mudou = vi.fn()
    render(<CampoDeData onChange={mudou} />)

    await userEvent.type(screen.getByRole('textbox'), '26/05/2026{Enter}')

    expect(mudou).toHaveBeenCalledWith('2026-05-26')
  })

  it('campo limpo devolve null, e não string vazia', async () => {
    const mudou = vi.fn()
    // O "x" do Ant Design não é `<button>` nem tem rótulo acessível, então
    // não há como alcançá-lo por papel — daí a busca pela classe. É o único
    // lugar destes testes que conhece o DOM interno do Ant Design.
    const { container } = render(<CampoDeData value="2026-05-26" onChange={mudou} allowClear />)

    const limpar = container.querySelector('.ant-picker-clear')
    expect(limpar, 'o "x" de limpar não foi renderizado').not.toBeNull()
    await userEvent.click(limpar as Element)

    expect(mudou).toHaveBeenCalledWith(null)
  })

  /** Valor corrompido no estado não pode virar "Invalid Date" na tela. */
  it('valor inválido aparece como campo vazio', () => {
    render(<CampoDeData value="26/05/2026" />)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })

  it('valor ausente aparece como campo vazio', () => {
    render(<CampoDeData value={null} />)
    expect(screen.getByRole('textbox')).toHaveValue('')
  })
})
