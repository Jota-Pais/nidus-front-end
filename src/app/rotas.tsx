import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layout/AppLayout'
import { Erro } from '@/layout/Erro'
import { RaizPorPerfil } from '@/layout/RaizPorPerfil'
import { RotaProtegida } from '@/layout/RotaProtegida'
import { BuscaDeAtendimento } from '@/telas/BuscaDeAtendimento'
import { Estantes } from '@/telas/Estantes'
import { Kanban } from '@/telas/Kanban'
import { Login } from '@/telas/Login'
import { SolicitarAnimais } from '@/telas/SolicitarAnimais'

const COLONIA = ['tecnico', 'gestor'] as const

export const rotas = createBrowserRouter([
  { path: '/login', element: <Login />, errorElement: <Erro /> },
  {
    path: '/',
    element: (
      <RotaProtegida>
        <AppLayout />
      </RotaProtegida>
    ),
    errorElement: <Erro />,
    children: [
      { index: true, element: <RaizPorPerfil /> },
      {
        path: 'kanban',
        element: (
          <RotaProtegida perfis={[...COLONIA]}>
            <Kanban />
          </RotaProtegida>
        ),
      },
      {
        path: 'estantes',
        element: (
          <RotaProtegida perfis={[...COLONIA]}>
            <Estantes />
          </RotaProtegida>
        ),
      },
      { path: 'solicitar', element: <SolicitarAnimais /> },
      {
        path: 'busca',
        element: (
          <RotaProtegida perfis={[...COLONIA]}>
            <BuscaDeAtendimento />
          </RotaProtegida>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
