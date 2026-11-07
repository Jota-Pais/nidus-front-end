import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { PerfilContext } from '@/auth/contexto'
import type { Perfil } from '@/dominio/tipos'
import { AppLayout } from './AppLayout'

const NOME_DO_MENU = 'Menu da conta de Gilda Gestora'

/** A casca com uma sessão de teste. O `renderizar` fixa a sessão, e aqui o teste escolhe o Sair */
function abrirCasca(perfil: Perfil, { sair = () => {}, saindo = false } = {}) {
  render(
    <MemoryRouter>
      <PerfilContext.Provider
        value={{
          perfil,
          usuario: { id: 1, nome: 'Gilda Gestora', email: 'gilda@ufsc.br', perfil },
          sair,
          saindo,
        }}
      >
        <AppLayout />
      </PerfilContext.Provider>
    </MemoryRouter>,
  )
}

const gatilho = () => screen.getByRole('button', { name: NOME_DO_MENU })

describe('menu da conta', () => {
  it('no cabeçalho fica só o nome; Configurações e Sair abrem num menu', async () => {
    abrirCasca('gestor')

    expect(gatilho().getAttribute('aria-haspopup')).toBe('menu')
    expect(gatilho().getAttribute('aria-expanded')).toBe('false')
    expect(screen.queryByText('Sair')).toBeNull()

    fireEvent.click(gatilho())

    expect(await screen.findByText('Configurações')).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Cadastros' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: 'Usuários' })).toBeTruthy()
    expect(screen.getByRole('menuitem', { name: /Sair/ })).toBeTruthy()
    expect(gatilho().getAttribute('aria-expanded')).toBe('true')
  })

  it('quem não tem nada a configurar abre o menu só com o Sair', async () => {
    abrirCasca('pesquisador')

    fireEvent.click(gatilho())

    expect(await screen.findByRole('menuitem', { name: /Sair/ })).toBeTruthy()
    expect(screen.getAllByRole('menuitem')).toHaveLength(1)
    expect(screen.queryByText('Configurações')).toBeNull()
  })

  it('Sair encerra a sessão e deixa o menu aberto até ela cair', async () => {
    const sair = vi.fn()
    abrirCasca('pesquisador', { sair })

    fireEvent.click(gatilho())
    fireEvent.click(await screen.findByRole('menuitem', { name: /Sair/ }))

    expect(sair).toHaveBeenCalledTimes(1)
    expect(gatilho().getAttribute('aria-expanded')).toBe('true')
  })

  it('enquanto sai, o item diz Saindo… e não aceita outro clique', async () => {
    const sair = vi.fn()
    abrirCasca('pesquisador', { sair, saindo: true })

    fireEvent.click(gatilho())
    const saindo = await screen.findByRole('menuitem', { name: /Saindo…/ })
    fireEvent.click(saindo)

    expect(saindo.getAttribute('aria-disabled')).toBe('true')
    expect(sair).not.toHaveBeenCalled()
  })
})
