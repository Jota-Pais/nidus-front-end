import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layout/AppLayout'
import { Carregando } from '@/layout/Carregando'
import { Erro } from '@/layout/Erro'
import { RaizPorPerfil } from '@/layout/RaizPorPerfil'
import { RotaProtegida } from '@/layout/RotaProtegida'
import { Login } from '@/telas/Login'

const Cadastros = lazy(() => import('@/telas/Cadastros').then((m) => ({ default: m.Cadastros })))
const DefinirSenha = lazy(() =>
  import('@/telas/DefinirSenha').then((m) => ({ default: m.DefinirSenha })),
)
const Estantes = lazy(() => import('@/telas/Estantes').then((m) => ({ default: m.Estantes })))
const Estoque = lazy(() => import('@/telas/Estoque').then((m) => ({ default: m.Estoque })))
const Historico = lazy(() => import('@/telas/Historico').then((m) => ({ default: m.Historico })))
const Kanban = lazy(() => import('@/telas/Kanban').then((m) => ({ default: m.Kanban })))
const SolicitarAnimais = lazy(() =>
  import('@/telas/SolicitarAnimais').then((m) => ({ default: m.SolicitarAnimais })),
)
const Usuarios = lazy(() => import('@/telas/Usuarios').then((m) => ({ default: m.Usuarios })))

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
        path: 'estoque',
        element: (
          <RotaProtegida perfis={[...COLONIA]}>
            <Estoque />
          </RotaProtegida>
        ),
      },
      {
        path: 'historico',
        element: (
          <RotaProtegida perfis={['gestor']}>
            <Historico />
          </RotaProtegida>
        ),
      },
      {
        path: 'cadastros',
        element: (
          <RotaProtegida perfis={['gestor']}>
            <Cadastros />
          </RotaProtegida>
        ),
      },
      {
        path: 'usuarios',
        element: (
          <RotaProtegida perfis={['gestor']}>
            <Usuarios />
          </RotaProtegida>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
