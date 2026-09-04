import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '@/layout/AppLayout'
import { Erro } from '@/layout/Erro'
import { RotaProtegida } from '@/layout/RotaProtegida'
import { GradeEstantes } from '@/telas/estantes/GradeEstantes'
import { Infraestrutura } from '@/telas/Infraestrutura'
import { Login } from '@/telas/Login'
import { PainelAlertas } from '@/telas/PainelAlertas'
import { Projetos } from '@/telas/Projetos'
import { Quadro } from '@/telas/Quadro'
import { RegistrosTecnico } from '@/telas/RegistrosTecnico'
import { Solicitacoes } from '@/telas/Solicitacoes'
import { RaizPorPerfil } from '@/layout/RaizPorPerfil'

/**
 * Rotas da aplicação.
 *
 * O `perfis` de cada rota é **navegação**, não autorização: o `RF-ACS-02` manda
 * a autorização ser decidida no servidor.
 */
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
        path: 'alertas',
        element: (
          <RotaProtegida perfis={['tecnico', 'gestor']}>
            <PainelAlertas />
          </RotaProtegida>
        ),
      },
      {
        // O card "Layout base" nomeia as duas: a segunda permite mandar link
        // direto para uma estante, que é como o técnico vai compartilhar
        // "olha a E-03".
        path: 'estantes',
        element: (
          <RotaProtegida perfis={['tecnico', 'gestor']}>
            <GradeEstantes />
          </RotaProtegida>
        ),
      },
      {
        path: 'estantes/:id',
        element: (
          <RotaProtegida perfis={['tecnico', 'gestor']}>
            <GradeEstantes />
          </RotaProtegida>
        ),
      },
      {
        path: 'quadro',
        element: (
          <RotaProtegida perfis={['tecnico', 'gestor']}>
            <Quadro />
          </RotaProtegida>
        ),
      },
      {
        path: 'registros',
        element: (
          <RotaProtegida perfis={['tecnico', 'gestor']}>
            <RegistrosTecnico />
          </RotaProtegida>
        ),
      },
      { path: 'solicitacoes', element: <Solicitacoes /> },
      {
        path: 'infraestrutura',
        element: (
          <RotaProtegida perfis={['gestor']}>
            <Infraestrutura />
          </RotaProtegida>
        ),
      },
      {
        path: 'projetos',
        element: (
          <RotaProtegida perfis={['gestor']}>
            <Projetos />
          </RotaProtegida>
        ),
      },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
])
