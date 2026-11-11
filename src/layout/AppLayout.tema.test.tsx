import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { esquemaSalvo } from '@/app/esquema'
import { PerfilContext } from '@/auth/contexto'
import { AppLayout } from './AppLayout'

function abrir() {
  render(
    <MemoryRouter>
      <PerfilContext.Provider
        value={{
          perfil: 'gestor',
          usuario: { id: 1, nome: 'Gilda', email: 'g@ufsc.br', perfil: 'gestor' },
          sair: () => {},
          saindo: false,
        }}
      >
        <AppLayout />
      </PerfilContext.Provider>
    </MemoryRouter>,
  )
}

const tema = () => document.documentElement.dataset.tema
const guardado = () => localStorage.getItem('nidus.tema')

describe('Tema escuro no menu da conta', () => {
  beforeEach(() => localStorage.clear())
  afterEach(() => {
    localStorage.clear()
    delete document.documentElement.dataset.tema
  })

  it('começa claro, liga e desliga, e grava e aplica a escolha', async () => {
    abrir()
    fireEvent.click(screen.getByRole('button', { name: /Menu da conta/ }))

    const interruptor = await screen.findByRole('switch', { name: 'Tema escuro' })
    expect(interruptor.getAttribute('aria-checked')).toBe('false')
    expect(esquemaSalvo()).toBe('claro')

    // Clicar na linha troca o tema
    fireEvent.click(screen.getByRole('menuitem', { name: /Tema escuro/ }))
    expect(guardado()).toBe('escuro')
    expect(tema()).toBe('escuro')
    expect(screen.getByRole('switch', { name: 'Tema escuro' }).getAttribute('aria-checked')).toBe(
      'true',
    )

    // Clicar no interruptor troca uma vez só, e de volta
    fireEvent.click(screen.getByRole('switch', { name: 'Tema escuro' }))
    expect(guardado()).toBe('claro')
    expect(tema()).toBe('claro')
    expect(screen.getByRole('switch', { name: 'Tema escuro' }).getAttribute('aria-checked')).toBe(
      'false',
    )
  }, 20_000)

  it('abre escuro quando o navegador já guardou a escolha', async () => {
    localStorage.setItem('nidus.tema', 'escuro')
    abrir()
    fireEvent.click(screen.getByRole('button', { name: /Menu da conta/ }))

    const interruptor = await screen.findByRole('switch', { name: 'Tema escuro' })
    expect(interruptor.getAttribute('aria-checked')).toBe('true')
  })
})
