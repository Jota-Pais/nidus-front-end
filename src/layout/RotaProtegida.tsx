import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePerfil } from '@/auth/contexto'
import { rotaInicial } from './navegacao'
import type { Perfil } from '@/dominio/tipos'

/** Barra rota por perfil na navegação, não na autorização */
export function RotaProtegida({
  perfis,
  children,
}: {
  perfis?: Perfil[]
  children: ReactNode
}) {
  const { perfil } = usePerfil()
  const { pathname } = useLocation()

  // Rota protegida sem sessão vai para o login e, depois de entrar, volta para
  // o destino. Guardar o caminho aqui é a primeira metade; a segunda está em
  // Login.tsx.
  if (!perfil) return <Navigate to="/login" replace state={{ de: pathname }} />
  if (perfis && !perfis.includes(perfil)) return <Navigate to={rotaInicial(perfil)} replace />

  return <>{children}</>
}
