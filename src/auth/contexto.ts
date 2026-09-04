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
  /** Usuário da sessão real. `null` quando só há o acesso de desenvolvimento. */
  usuario: Usuario | null
  /** ⚠️ Andaime: só enquanto a API não existe. Ver `ProvedorDePerfil`. */
  entrarComoDesenvolvimento: (perfil: Perfil) => void
  sair: () => void
  saindo: boolean
}

export const PerfilContext = createContext<Sessao | null>(null)

/** Chave do perfil de desenvolvimento no `localStorage`. Some com o andaime. */
export const CHAVE_PERFIL_DEV = 'nidus.perfil-dev'

export function usePerfil(): Sessao {
  const contexto = useContext(PerfilContext)
  if (!contexto) throw new Error('usePerfil precisa estar dentro de <ProvedorDePerfil>')
  return contexto
}
