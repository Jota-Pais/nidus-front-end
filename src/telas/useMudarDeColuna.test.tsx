import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeApi } from '@/lib/api'
import { renderizar } from '@/testes/renderizar'
import { useMudarDeColuna } from './useMudarDeColuna'

const mover = vi.hoisted(() => vi.fn())

vi.mock('@/dominio/consultas', () => ({
  useMoverCaixa: () => ({ mutateAsync: mover }),
}))

function MoverParaEnviado() {
  const mudar = useMudarDeColuna()
  return <button onClick={() => mudar(7, 'enviado')}>Mover</button>
}

const recusa = (codigo: string, mensagem: string) =>
  new ErroDeApi(409, { erro: { codigo, mensagem } })

beforeEach(() => {
  mover.mockReset()
})

describe('mudar a caixa de coluna', { timeout: 20_000 }, () => {
  it('movimento fora do fluxo do kanban mostra o motivo, sem oferecer mover mesmo assim', async () => {
    mover.mockRejectedValue(recusa('TRANSICAO_INVALIDA', 'Esta caixa ja foi enviada.'))
    renderizar(<MoverParaEnviado />)

    fireEvent.click(screen.getByRole('button', { name: 'Mover' }))

    expect(await screen.findAllByText('Esta caixa ja foi enviada.')).not.toHaveLength(0)
    expect(screen.queryByRole('button', { name: 'Mover mesmo assim' })).toBeNull()
    expect(mover).toHaveBeenCalledTimes(1)
  })

  it('animal comprometido pede confirmação e manda de novo confirmando', async () => {
    mover
      .mockRejectedValueOnce(
        recusa('TRANSICAO_CONTRARIA_COMPROMISSO', 'Esta caixa tem animais comprometidos.'),
      )
      .mockResolvedValueOnce({})
    renderizar(<MoverParaEnviado />)

    fireEvent.click(screen.getByRole('button', { name: 'Mover' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Mover mesmo assim' }))

    await waitFor(() =>
      expect(mover).toHaveBeenLastCalledWith({ idCaixa: 7, estado: 'enviado', confirmar: true }),
    )
  })
})
