/**
 * Contexto e hook da sessão. Separado do provedor porque o Fast Refresh do Vite
 * exige que um arquivo de componente exporte só componentes.
 */
import { createContext, useContext } from 'react'
import type { Perfil } from '@/dominio/tipos'

export interface Sessao {
  perfil: Perfil | null
  entrar: (perfil: Perfil) => void
  sair: () => void
}

export const PerfilContext = createContext<Sessao | null>(null)

export const CHAVE_PERFIL = 'nidus.perfil'

export function usePerfil(): Sessao {
  const contexto = useContext(PerfilContext)
  if (!contexto) throw new Error('usePerfil precisa estar dentro de <ProvedorDePerfil>')
  return contexto
}
