import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { larguraDaTela } from '@/testes/tela'
import { Janela } from '.'

function abrir() {
  render(
    <Janela
      open
      title="Recusar o pedido #3"
      width={640}
      styles={{ header: { background: 'red', margin: '-20px -24px 0' } }}
      okText="Recusar"
    >
      <p>Motivo</p>
    </Janela>,
  )
}

describe('Janela', () => {
  it('no celular ocupa a tela toda e o título usa o espaço da tela cheia, com a cor de quem chamou', () => {
    const voltar = larguraDaTela(390)
    abrir()

    expect(screen.getByText('Motivo')).toBeTruthy()
    expect(document.querySelector('.janela--cheia')).toBeTruthy()
    const janela = document.querySelector<HTMLElement>('.ant-modal')
    expect(janela?.style.width).toBe('100%')
    const titulo = document.querySelector<HTMLElement>('.ant-modal-header')
    expect(titulo?.style.background).toBe('red')
    expect(titulo?.style.margin).toBe('0px')
    voltar()
  })

  it('no computador é a janela de sempre, na largura pedida', () => {
    const voltar = larguraDaTela(1280)
    abrir()

    expect(document.querySelector('.janela--cheia')).toBeNull()
    expect(document.querySelector<HTMLElement>('.ant-modal')?.style.width).toBe('640px')
    expect(document.querySelector<HTMLElement>('.ant-modal-header')?.style.margin).toBe(
      '-20px -24px 0px',
    )
    voltar()
  })
})
