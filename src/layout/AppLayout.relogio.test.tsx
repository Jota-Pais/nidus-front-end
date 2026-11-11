import { act, render, screen } from '@testing-library/react'
import dayjs from 'dayjs'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it } from 'vitest'
import { PerfilContext } from '@/auth/contexto'
import { atualizarRelogio, zerarRelogio } from '@/lib/relogio'
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

describe('faixa do relógio de teste', () => {
  afterEach(zerarRelogio)

  it('aparece com a data do servidor e o deslocamento', () => {
    const daqui5 = dayjs().add(5, 'day')
    atualizarRelogio({
      hoje: daqui5.format('YYYY-MM-DD'),
      relogioDeTeste: { deslocamentoDias: 5 },
    })
    abrir()
    const faixa = screen.getByRole('status')
    expect(faixa.textContent).toContain(`hoje é ${daqui5.format('DD/MM/YYYY')}`)
    expect(faixa.textContent).toContain('+5 dias')
  })

  it('some sem relógio de teste, e aparece quando ele chega', () => {
    abrir()
    expect(screen.queryByText(/Relógio de teste/)).toBeNull()
    act(() =>
      atualizarRelogio({
        hoje: dayjs().format('YYYY-MM-DD'),
        relogioDeTeste: { deslocamentoDias: 0 },
      }),
    )
    expect(screen.getByText(/Relógio de teste/)).toBeTruthy()
  })
})
