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
const Historico = lazy(() => import('@/telas/Historico').then((m) => ({ default: m.Historico })))
const Pedidos = lazy(() => import('@/telas/Pedidos').then((m) => ({ default: m.Pedidos })))
const Usuarios = lazy(() => import('@/telas/Usuarios').then((m) => ({ default: m.Usuarios })))
const VisaoGeral = lazy(() => import('@/telas/VisaoGeral').then((m) => ({ default: m.VisaoGeral })))

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
        path: 'visao-geral',
        element: (
          <RotaProtegida perfis={[...COLONIA]}>
            <VisaoGeral />
          </RotaProtegida>
        ),
      },
      // o Kanban e o Estoque viraram a Visão geral: quem guardou o endereço antigo cai nela
      { path: 'kanban', element: <Navigate to="/visao-geral" replace /> },
      { path: 'estoque', element: <Navigate to="/visao-geral" replace /> },
      {
        path: 'estantes',
        element: (
          <RotaProtegida perfis={[...COLONIA]}>
            <Estantes />
          </RotaProtegida>
        ),
      },
      // o caminho fica: os e-mails da API mandam quem pediu para cá
      { path: 'pedidos', element: <Pedidos /> },
      { path: 'solicitar', element: <Navigate to="/pedidos" replace /> },
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
          <RotaProtegida perfis={[...COLONIA]}>
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
