import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderizar } from '@/testes/renderizar'
import { ConfirmarPedido } from './ConfirmarPedido'
import { confirmacaoDoPedido } from './confirmacaoDoPedido'

const DATA_PROXIMA =
  'Essa data é muito próxima: a equipe provavelmente não consegue entregar esses animais a tempo.'

describe('confirmacaoDoPedido', () => {
  it('quando dá, diz que é possível, sem números nem promessa, e envia normalmente', () => {
    const confirmacao = confirmacaoDoPedido({ viavel: true, motivo: null })

    expect(confirmacao).toEqual({
      tom: 'sucesso',
      titulo: 'Esse pedido é possível.',
      detalhe: 'A equipe vai analisar e, estando tudo certo, segue com o seu pedido.',
      enviar: 'Enviar pedido',
      voltar: 'Voltar',
    })
    expect(confirmacao.titulo).not.toMatch(/\d/)
  })

  it('quando não dá, o motivo da API vai em vermelho, e o envio continua possível', () => {
    const confirmacao = confirmacaoDoPedido({ viavel: false, motivo: DATA_PROXIMA })

    expect(confirmacao.tom).toBe('erro')
    expect(confirmacao.titulo).toBe(DATA_PROXIMA)
    expect(confirmacao.enviar).toBe('Enviar mesmo assim')
    expect(confirmacao.voltar).toBe('Voltar e ajustar')
  })

  it('não dá sem motivo ainda diz alguma coisa', () => {
    expect(confirmacaoDoPedido({ viavel: false, motivo: null }).titulo).toBe(
      'A equipe provavelmente não consegue atender esse pedido.',
    )
  })

  it('sem a conferência, avisa e deixa enviar', () => {
    const confirmacao = confirmacaoDoPedido(null)

    expect(confirmacao.tom).toBe('atencao')
    expect(confirmacao.titulo).toMatch(/Não deu para conferir/)
    expect(confirmacao.enviar).toBe('Enviar pedido')
  })
})

describe('ConfirmarPedido', { timeout: 20_000 }, () => {
  it('quando dá, "Enviar pedido" envia e "Voltar" fecha', () => {
    const aoEnviar = vi.fn()
    const aoVoltar = vi.fn()
    renderizar(
      <ConfirmarPedido
        viabilidade={{ viavel: true, motivo: null }}
        enviando={false}
        aoEnviar={aoEnviar}
        aoVoltar={aoVoltar}
      />,
    )

    expect(screen.getByText('Esse pedido é possível.')).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar pedido' }))
    fireEvent.click(screen.getByRole('button', { name: 'Voltar' }))

    expect(aoEnviar).toHaveBeenCalledOnce()
    expect(aoVoltar).toHaveBeenCalledOnce()
  })

  it('quando não dá, mostra o motivo como erro e ainda deixa enviar', () => {
    const aoEnviar = vi.fn()
    renderizar(
      <ConfirmarPedido
        viabilidade={{ viavel: false, motivo: DATA_PROXIMA }}
        enviando={false}
        aoEnviar={aoEnviar}
        aoVoltar={() => {}}
      />,
    )

    expect(screen.getByRole('alert').textContent).toContain(DATA_PROXIMA)
    expect(screen.getByRole('button', { name: 'Voltar e ajustar' })).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: 'Enviar mesmo assim' }))

    expect(aoEnviar).toHaveBeenCalledOnce()
  })
})
