import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layout/AppLayout'
import { Carregando } from '@/layout/Carregando'
import { Erro } from '@/layout/Erro'
import { RaizPorPerfil } from '@/layout/RaizPorPerfil'
import { RotaProtegida } from '@/layout/RotaProtegida'
import { Login } from '@/telas/Login'

const BuscaDeAtendimento = lazy(() =>
  import('@/telas/BuscaDeAtendimento').then((m) => ({ default: m.BuscaDeAtendimento })),
)
const DefinirSenha = lazy(() =>
  import('@/telas/DefinirSenha').then((m) => ({ default: m.DefinirSenha })),
)
const Estantes = lazy(() => import('@/telas/Estantes').then((m) => ({ default: m.Estantes })))
const Kanban = lazy(() => import('@/telas/Kanban').then((m) => ({ default: m.Kanban })))
const SolicitarAnimais = lazy(() =>
  import('@/telas/SolicitarAnimais').then((m) => ({ default: m.SolicitarAnimais })),
)

const COLONIA = ['tecnico', 'gestor'] as const

export const rotas = createBrowserRouter([
  { path: '/login', element: <Login />, errorElement: <Erro /> },
  {
    path: '/definir-senha',
    element: (
      <Suspense fallback={<Carregando />}>
        <DefinirSenha />
      </Suspense>
    ),
    errorElement: <Erro />,
  },
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
