import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { Erro } from './Erro'

/** A tela que falha ao montar, como a tela cujo arquivo não carregou */
function TelaQueFalha({ erro }: { erro: Error }): never {
  throw erro
}

function abrirComErro(erro: Error) {
  const rotas = createMemoryRouter([
    { path: '/', errorElement: <Erro />, element: <TelaQueFalha erro={erro} /> },
  ])
  render(<RouterProvider router={rotas} />)
}

// o React e o roteador registram no console o erro que a tela lançou de propósito
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
})
afterEach(() => vi.restoreAllMocks())

describe('página de erro', () => {
  it('a tela que não carrega por ser de antes da publicação pede para recarregar', async () => {
    abrirComErro(new TypeError('Failed to fetch dynamically imported module: /assets/Cadastros-x.js'))

    expect(await screen.findByText('O Nidus foi atualizado')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Recarregar' })).toBeTruthy()
  })

  it('outro erro continua com a mensagem dele e o caminho de volta', async () => {
    abrirComErro(new Error('Falhou de outro jeito'))

    expect(await screen.findByText('Algo deu errado')).toBeTruthy()
    expect(screen.getByText('Falhou de outro jeito')).toBeTruthy()
    expect(screen.getByRole('button', { name: 'Voltar ao início' })).toBeTruthy()
  })
})
