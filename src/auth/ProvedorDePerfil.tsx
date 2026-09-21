// perfil do usuário na sessão
import { useCallback, useMemo } from 'react'
import type { ReactNode } from 'react'
import { Carregando } from '@/layout/Carregando'
import { PerfilContext } from './contexto'
import { useLogout, useSessao } from './sessao'

export function ProvedorDePerfil({ children }: { children: ReactNode }) {
  const sessao = useSessao()
  const logout = useLogout()

  const sair = useCallback(() => logout.mutate(), [logout])

  const valor = useMemo(
    () => ({
      perfil: sessao.data?.perfil ?? null,
      usuario: sessao.data ?? null,
      sair,
      saindo: logout.isPending,
    }),
    [sessao.data, sair, logout.isPending],
  )

  // sem isto a aplicação pisca o login antes de a sessão chegar, e quem já estava logado é
  // jogado para fora por meio segundo a cada F5
  if (sessao.isLoading) return <Carregando rotulo="Verificando a sessão…" />

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>
}
