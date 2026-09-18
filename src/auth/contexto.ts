/**
 * Contexto e hook da sessão. Separado do provedor porque o Fast Refresh do Vite
 * exige que um arquivo de componente exporte só componentes.
 */
import { createContext, useContext } from 'react'
import type { Perfil } from '@/dominio/tipos'
import type { Usuario } from './sessao'

export interface Sessao {
  /** Perfil corrente. Vem do servidor; `null` = não logado. */
  perfil: Perfil | null
  /** Usuário da sessão real. `null` = não logado. */
  usuario: Usuario | null
  sair: () => void
  saindo: boolean
}

export const PerfilContext = createContext<Sessao | null>(null)

export function usePerfil(): Sessao {
  const contexto = useContext(PerfilContext)
  if (!contexto) throw new Error('usePerfil precisa estar dentro de <ProvedorDePerfil>')
  return contexto
}
