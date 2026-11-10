import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { Usuarios } from './Usuarios'

const salvar = vi.hoisted(() => vi.fn())
const redefinir = vi.hoisted(() => vi.fn())
const criar = vi.hoisted(() => vi.fn())

const ana: Usuario = {
  id: 2,
  nome: 'Ana',
  email: 'ana@ufsc.br',
  perfil: 'tecnico',
  ativo: true,
  temSenha: true,
}

vi.mock('@/dominio/consultas', () => ({
  useUsuarios: () => consulta([ana]),
  useSalvarUsuario: () => ({ mutate: salvar, isPending: false }),
  useCriarConta: () => ({ mutate: criar, isPending: false }),
  useEnviarRedefinicaoDeSenha: () => ({ mutateAsync: redefinir, isPending: false }),
}))

beforeEach(() => {
  salvar.mockClear()
  criar.mockClear()
  redefinir.mockReset()
  redefinir.mockResolvedValue({ email: 'ana@ufsc.br' })
})

// A tela inteira do antd no jsdom leva segundos para montar: os 5 s padrão falham à toa
describe('desativar conta', { timeout: 20_000 }, () => {
  it('pede confirmação e só salva depois do Confirmar', async () => {
    renderizar(<Usuarios />, 'gestor')

    fireEvent.click(screen.getByRole('switch'))

    expect(await screen.findAllByText('Desativar a conta de Ana?')).not.toHaveLength(0)
    expect(salvar).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Confirmar' }))

    await waitFor(() =>
      expect(salvar).toHaveBeenCalledWith(
        { tipo: 'alterar', id: 2, dados: { ativo: false } },
        expect.anything(),
      ),
    )
  })

  it('Cancelar não salva nada', async () => {
    renderizar(<Usuarios />, 'gestor')

    fireEvent.click(screen.getByRole('switch'))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))

    await waitFor(() => expect(screen.queryAllByText('Desativar a conta de Ana?')).toHaveLength(0))
    expect(salvar).not.toHaveBeenCalled()
  })
})

describe('redefinição de senha', { timeout: 20_000 }, () => {
  it('não oferece definir a senha de ninguém', () => {
    renderizar(<Usuarios />, 'gestor')

    expect(screen.queryByText('Definir senha')).toBeNull()
  })

  it('pede confirmação e só envia depois do Enviar', async () => {
    renderizar(<Usuarios />, 'gestor')

    fireEvent.click(screen.getByRole('button', { name: 'Enviar redefinição de senha' }))

    expect(await screen.findAllByText('Enviar redefinição de senha para Ana?')).not.toHaveLength(0)
    expect(redefinir).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(redefinir).toHaveBeenCalledWith(2))
    expect(
      await screen.findByText('Enviamos para ana@ufsc.br um código para definir a senha.'),
    ).toBeTruthy()
  })

  it('Cancelar não envia nada', async () => {
    renderizar(<Usuarios />, 'gestor')

    fireEvent.click(screen.getByRole('button', { name: 'Enviar redefinição de senha' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Cancelar' }))

    await waitFor(() =>
      expect(screen.queryAllByText('Enviar redefinição de senha para Ana?')).toHaveLength(0),
    )
    expect(redefinir).not.toHaveBeenCalled()
  })
})

describe('nova conta', { timeout: 20_000 }, () => {
  it('não pede senha', async () => {
    renderizar(<Usuarios />, 'gestor')

    fireEvent.click(screen.getByRole('button', { name: 'Nova conta' }))

    expect(await screen.findByLabelText('E-mail')).toBeTruthy()
    expect(screen.queryByLabelText(/senha/i)).toBeNull()
  })
})

describe('contas no celular', { timeout: 20_000 }, () => {
  it('cada conta é um cartão: o perfil largo, a conta ativa ao lado e a redefinição num botão', async () => {
    const voltar = larguraDaTela(390)
    try {
      const { container } = renderizar(<Usuarios />, 'gestor')

      expect(container.querySelector('table')).toBeNull()
      const cartao = within(screen.getByRole('list', { name: 'Contas' })).getByRole('listitem')
      expect(within(cartao).getByText('Ana')).toBeTruthy()
      expect(within(cartao).getByText('ana@ufsc.br')).toBeTruthy()
      expect(within(cartao).getByText('Definida')).toBeTruthy()
      expect(within(cartao).getByRole('combobox', { name: 'Perfil de Ana' })).toBeTruthy()
      expect(
        within(cartao).getByRole('button', { name: 'Enviar redefinição de senha' }),
      ).toBeTruthy()

      // desativar continua pedindo confirmação
      fireEvent.click(within(cartao).getByRole('switch', { name: 'Conta de Ana ativa' }))
      expect(await screen.findAllByText('Desativar a conta de Ana?')).not.toHaveLength(0)
      expect(salvar).not.toHaveBeenCalled()
    } finally {
      voltar()
    }
  })
})
