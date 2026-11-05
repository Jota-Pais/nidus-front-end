import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Usuario } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { Usuarios } from './Usuarios'

const salvar = vi.hoisted(() => vi.fn())

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
}))

beforeEach(() => {
  salvar.mockClear()
})

describe('desativar conta', () => {
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
