import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { CampoDeData } from '.'

describe('CampoDeData', () => {
  it('mostra a data em dd/mm/aaaa, qualquer que seja o idioma do navegador', () => {
    render(<CampoDeData value="2026-12-15" />)

    expect(screen.getByPlaceholderText('dd/mm/aaaa')).toHaveProperty('value', '15/12/2026')
  })

  it('o que se digita em dd/mm/aaaa volta para o formulário em aaaa-mm-dd', () => {
    const mudou = vi.fn()
    render(<CampoDeData onChange={mudou} />)
    const campo = screen.getByPlaceholderText('dd/mm/aaaa')

    fireEvent.mouseDown(campo)
    fireEvent.change(campo, { target: { value: '01/02/2027' } })
    fireEvent.keyDown(campo, { key: 'Enter', code: 'Enter' })

    expect(mudou).toHaveBeenLastCalledWith('2027-02-01')
  })
})
