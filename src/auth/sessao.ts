/**
 * Sessão do usuário — `contrato-api.md` §3.
 *
 * A sessão vive num cookie `httpOnly` que o JavaScript não consegue ler
 * (`docs/decisoes-de-stack.md` §2.1). Logo, "estou logado?" não é uma pergunta
 * que o front responde sozinho: ele pergunta ao servidor com
 * `GET /api/sessao`, que é o que o contrato manda chamar no boot.
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import type { Perfil } from '@/dominio/tipos'
import { ErroDeApi, api } from '@/lib/api'

export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
}

export interface Credenciais {
  email: string
  senha: string
}

export const CHAVE_SESSAO = ['sessao'] as const

/**
 * Quem sou eu. `null` quando não há sessão — **não** é erro.
 *
 * O 401 aqui é resposta esperada, não falha: significa "não logado". Tratar
 * como erro faria a tela piscar mensagem vermelha em quem só abriu o sistema
 * pela primeira vez.
 */
export function useSessao(): UseQueryResult<Usuario | null> {
  return useQuery<Usuario | null>({
    queryKey: CHAVE_SESSAO,
    queryFn: async () => {
      try {
        const { usuario } = await api<{ usuario: Usuario }>('/api/sessao')
        return usuario
      } catch (erro) {
        if (erro instanceof ErroDeApi && erro.ehNaoAutenticado) return null
        throw erro
      }
    },
    // O boot não pode ficar preso esperando retentativa: sem sessão, para o
    // login imediatamente.
    retry: false,
    staleTime: 5 * 60_000,
  })
}

/** `POST /api/sessao`. O perfil vem do servidor — o `RF-ACS-02` não admite outra fonte. */
export function useLogin(): UseMutationResult<Usuario, Error, Credenciais> {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: async (credenciais: Credenciais) => {
      const { usuario } = await api<{ usuario: Usuario }>('/api/sessao', {
        metodo: 'POST',
        corpo: credenciais,
      })
      return usuario
    },
    onSuccess: (usuario) => {
      cliente.setQueryData(CHAVE_SESSAO, usuario)
    },
  })
}

/**
 * `DELETE /api/sessao`.
 *
 * ⚠️ **Limpar o cache é parte do logout, não zelo.** O cache guarda dados da
 * colônia e de projetos de ética carregados com a permissão de quem saiu; sem
 * `clear()`, o próximo login no mesmo navegador — máquina compartilhada de
 * laboratório é o caso normal aqui — veria dado que o perfil dele talvez não
 * alcance. `RNF-07` e `RF-ACS-02`.
 *
 * `onSettled`: mesmo se a chamada falhar, a sessão local acaba. Melhor
 * derrubar o acesso local e o servidor expirar o cookie sozinho do que deixar
 * a tela aberta achando que ainda está logada.
 */
export function useLogout(): UseMutationResult<void, Error, void> {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: () => api<void>('/api/sessao', { metodo: 'DELETE' }),
    onSettled: () => {
      cliente.setQueryData(CHAVE_SESSAO, null)
      cliente.clear()
    },
  })
}
