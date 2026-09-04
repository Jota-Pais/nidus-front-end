/**
 * Perfil do usuário na sessão.
 *
 * A fonte de verdade é o servidor: `GET /api/sessao` (`contrato-api.md` §3).
 * O `RF-ACS-02` não admite outra — autorização e filtragem são decididas no
 * servidor, e o perfil vem junto da sessão.
 *
 * ⚠️ **O acesso de desenvolvimento é andaime com data para sair.** Enquanto a
 * API não sobe, `entrarComoDesenvolvimento` guarda um perfil em `localStorage`
 * só para percorrer as telas dos três atores. Ele **só vale quando o servidor
 * não respondeu**: havendo sessão real, ela ganha sempre. Sai junto com o card
 * "Login local com os três perfis" do back-end.
 */
import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Perfil } from '@/dominio/tipos'
import { Carregando } from '@/layout/Carregando'
import { CHAVE_PERFIL_DEV, PerfilContext } from './contexto'
import { useLogout, useSessao } from './sessao'

function lerPerfilSalvo(): Perfil | null {
  try {
    const salvo = window.localStorage.getItem(CHAVE_PERFIL_DEV)
    return salvo === 'pesquisador' || salvo === 'tecnico' || salvo === 'gestor' ? salvo : null
  } catch {
    return null
  }
}

export function ProvedorDePerfil({ children }: { children: ReactNode }) {
  const sessao = useSessao()
  const logout = useLogout()
  const [perfilDev, setPerfilDev] = useState<Perfil | null>(lerPerfilSalvo)

  const entrarComoDesenvolvimento = useCallback((novo: Perfil) => {
    setPerfilDev(novo)
    try {
      window.localStorage.setItem(CHAVE_PERFIL_DEV, novo)
    } catch {
      /* navegador sem storage: vale só em memória */
    }
  }, [])

  const sair = useCallback(() => {
    setPerfilDev(null)
    try {
      window.localStorage.removeItem(CHAVE_PERFIL_DEV)
    } catch {
      /* idem */
    }
    logout.mutate()
  }, [logout])

  const valor = useMemo(
    () => ({
      // A sessão do servidor ganha do andaime, sempre.
      perfil: sessao.data?.perfil ?? perfilDev,
      usuario: sessao.data ?? null,
      entrarComoDesenvolvimento,
      sair,
      saindo: logout.isPending,
    }),
    [sessao.data, perfilDev, entrarComoDesenvolvimento, sair, logout.isPending],
  )

  // Sem isto a aplicação pisca o login antes de a sessão chegar, e quem já
  // estava logado é jogado para fora por meio segundo a cada F5.
  if (sessao.isLoading) return <Carregando rotulo="Verificando a sessão…" />

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>
}
