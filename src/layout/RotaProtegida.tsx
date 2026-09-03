import { Navigate, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import { usePerfil } from '@/auth/contexto'
import { rotaInicial } from './navegacao'
import type { Perfil } from '@/dominio/tipos'

/**
 * Barra rota por perfil **na navegação**, não na autorização.
 *
 * `RF-ACS-02`: a autorização é decidida no servidor. Isto evita que o usuário
 * caia numa tela que não é dele e veja um erro feio — não protege dado nenhum.
 */
export function RotaProtegida({
  perfis,
  children,
}: {
  perfis?: Perfil[]
  children: ReactNode
}) {
  const { perfil } = usePerfil()
  const { pathname } = useLocation()

  if (!perfil) return <Navigate to="/login" replace state={{ de: pathname }} />
  if (perfis && !perfis.includes(perfil)) return <Navigate to={rotaInicial(perfil)} replace />

  return <>{children}</>
}
