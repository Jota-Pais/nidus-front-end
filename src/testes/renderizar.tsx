import { render } from '@testing-library/react'
import { App } from 'antd'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { PerfilContext } from '@/auth/contexto'
import type { Perfil } from '@/dominio/tipos'

/** A tela com uma sessão do perfil pedido; 'nome' é o nome da conta, que o pedido já preenche */
export function renderizar(tela: ReactNode, perfil: Perfil = 'tecnico', nome = 'Teste') {
  return render(
    <MemoryRouter>
      <PerfilContext.Provider
        value={{
          perfil,
          usuario: { id: 1, nome, email: 'teste@ufsc.br', perfil },
          sair: () => {},
          saindo: false,
        }}
      >
        <App>{tela}</App>
      </PerfilContext.Provider>
    </MemoryRouter>,
  )
}

export const consulta = <T,>(data: T) => ({ data, isPending: false, error: null })

export const mutacao = () => ({ mutate: () => {}, isPending: false })
