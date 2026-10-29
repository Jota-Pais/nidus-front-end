// sessão do usuário: login, logout e quem está logado
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { chaves } from '@/app/chaves'
import type { Perfil } from '@/dominio/tipos'
import { ErroDeApi, api } from '@/lib/api'

export interface Usuario {
  id: number
  nome: string
  email: string
  perfil: Perfil
}

interface Credenciais {
  email: string
  senha: string
}

/** quem sou eu. null quando não há sessão - não é erro */
export function useSessao(): UseQueryResult<Usuario | null> {
  return useQuery<Usuario | null>({
    queryKey: chaves.sessao,
    queryFn: async () => {
      try {
        const { usuario } = await api<{ usuario: Usuario }>('/api/sessao')
        return usuario
      } catch (erro) {
        if (erro instanceof ErroDeApi && erro.ehNaoAutenticado) return null
        throw erro
      }
    },
    // O boot não pode ficar preso esperando retentativa: sem sessão, para o login imediatamente
    retry: false,
    staleTime: 5 * 60_000,
  })
}

/** POST /api/sessao. O perfil vem do servidor, nunca da tela */
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
      cliente.setQueryData(chaves.sessao, usuario)
    },
  })
}

/** DELETE /api/sessao */
export function useLogout(): UseMutationResult<void, Error, void> {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: () => api<void>('/api/sessao', { metodo: 'DELETE' }),
    onSettled: () => {
      cliente.setQueryData(chaves.sessao, null)
      cliente.clear()
    },
  })
}
