import { Navigate } from 'react-router-dom'
import { usePerfil } from '@/auth/contexto'
import { rotaInicial } from './navegacao'

/** '/' manda cada perfil para a tela em que ele começa o dia */
export function RaizPorPerfil() {
  const { perfil } = usePerfil()
  return <Navigate to={perfil ? rotaInicial(perfil) : '/login'} replace />
}
