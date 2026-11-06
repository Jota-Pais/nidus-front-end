import { fireEvent, render, screen } from '@testing-library/react'
import { App } from 'antd'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PerfilContext } from '@/auth/contexto'
import { DefinirSenha } from './DefinirSenha'

const pedir = vi.hoisted(() => vi.fn())

vi.mock('@/auth/acesso', () => ({
  usePedirCodigo: () => ({ mutate: pedir, isPending: false }),
  useVerificarCodigo: () => ({ mutate: () => {}, isPending: false }),
  useDefinirSenha: () => ({ mutate: () => {}, isPending: false }),
}))

/** A tela sem ninguém logado, aberta no endereço dado */
function abrir(endereco: string) {
  return render(
    <MemoryRouter initialEntries={[endereco]}>
      <PerfilContext.Provider
        value={{ perfil: null, usuario: null, sair: () => {}, saindo: false }}
      >
        <App>
          <DefinirSenha />
        </App>
      </PerfilContext.Provider>
    </MemoryRouter>,
  )
}

const DIGITE_O_CODIGO = 'Digite o código de 6 números que enviamos para ana@exemplo.com.'

beforeEach(() => {
  pedir.mockClear()
})

// A tela inteira do antd no jsdom leva segundos para montar: os 5 s padrão falham à toa
describe('quem já tem o código', { timeout: 20_000 }, () => {
  it('o link do e-mail abre direto no campo do código, sem pedir outro', () => {
    abrir('/definir-senha?email=Ana@Exemplo.com')

    expect(screen.getByText(DIGITE_O_CODIGO)).toBeTruthy()
    expect(screen.getByLabelText('Código')).toBeTruthy()
    expect(pedir).not.toHaveBeenCalled()
  })

  it('"Já tenho um código" leva ao campo do código sem mandar outro e-mail', async () => {
    abrir('/definir-senha')

    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'ana@exemplo.com' } })
    fireEvent.click(screen.getByRole('button', { name: 'Já tenho um código' }))

    expect(await screen.findByText(DIGITE_O_CODIGO)).toBeTruthy()
    expect(pedir).not.toHaveBeenCalled()
  })

  it('"Já tenho um código" sem e-mail válido fica no e-mail', async () => {
    abrir('/definir-senha')

    fireEvent.click(screen.getByRole('button', { name: 'Já tenho um código' }))

    expect(await screen.findByText('Informe o seu e-mail')).toBeTruthy()
    expect(screen.queryByLabelText('Código')).toBeNull()
  })

  it('link com e-mail que não serve começa pedindo o e-mail', () => {
    abrir('/definir-senha?email=sem-arroba')

    expect(screen.getByRole('button', { name: 'Enviar código' })).toBeTruthy()
  })
})
