import { render } from '@testing-library/react'
import { App } from 'antd'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { PerfilContext } from '@/auth/contexto'
import type { Perfil } from '@/dominio/tipos'

/**
 * A tela com uma sessão do perfil pedido; 'nome' é o nome da conta, que o pedido já preenche.
 * 'caminho' é o endereço aberto, com a busca (?linhagem=2). 'redesenhar' desenha a mesma tela de
 * novo, sem desmontar: como depois de a consulta recarregar
 */
export function renderizar(
  tela: ReactNode,
  perfil: Perfil = 'tecnico',
  nome = 'Teste',
  caminho = '/',
) {
  const comSessao = () => (
    <MemoryRouter initialEntries={[caminho]}>
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
    </MemoryRouter>
  )
  const resultado = render(comSessao())
  return { ...resultado, redesenhar: () => resultado.rerender(comSessao()) }
}

export const consulta = <T,>(data: T) => ({ data, isPending: false, error: null })

export const mutacao = () => ({ mutate: () => {}, isPending: false })
