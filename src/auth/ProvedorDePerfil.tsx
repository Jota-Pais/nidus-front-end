/**
 * Perfil do usuário na sessão.
 *
 * ⚠️ **Isto é andaime, não autenticação.** A decisão entre cookie de sessão
 * `httpOnly` e JWT está aberta no backlog, e o SSO ID-UFSC é mock no escopo do
 * semestre (depende do SETIC/UFSC, `PEN-09`).
 *
 * O que **não** muda quando a autenticação real entrar: o `RF-ACS-02` manda a
 * autorização ser decidida no **servidor**. O perfil daqui serve só para montar
 * menu e esconder botão por conveniência. Nunca é permissão.
 */
import { useCallback, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Perfil } from '@/dominio/tipos'
import { CHAVE_PERFIL, PerfilContext } from './contexto'

function lerPerfilSalvo(): Perfil | null {
  try {
    const salvo = window.localStorage.getItem(CHAVE_PERFIL)
    return salvo === 'pesquisador' || salvo === 'tecnico' || salvo === 'gestor' ? salvo : null
  } catch {
    return null
  }
}

export function ProvedorDePerfil({ children }: { children: ReactNode }) {
  const [perfil, setPerfil] = useState<Perfil | null>(lerPerfilSalvo)

  const entrar = useCallback((novo: Perfil) => {
    setPerfil(novo)
    try {
      window.localStorage.setItem(CHAVE_PERFIL, novo)
    } catch {
      /* navegador sem storage: a sessão vive só em memória */
    }
  }, [])

  const sair = useCallback(() => {
    setPerfil(null)
    try {
      window.localStorage.removeItem(CHAVE_PERFIL)
    } catch {
      /* idem */
    }
  }, [])

  const valor = useMemo(() => ({ perfil, entrar, sair }), [perfil, entrar, sair])

  return <PerfilContext.Provider value={valor}>{children}</PerfilContext.Provider>
}
