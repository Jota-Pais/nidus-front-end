// sessão do usuário: login, logout e quem está logado
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { chaves } from '@/app/chaves'
import type { Perfil } from '@/dominio/tipos'
import { ErroDeApi, api } from '@/lib/api'
import { CREDENCIAL_INVALIDA } from '@/lib/erros'

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
    retry: repetirSessao,
    staleTime: 5 * 60_000,
  })
}

/**
 * Sem sessão o 401 já voltou null e vai para o login na hora. Só repete falha de verdade
 * (502/503 da Render acordando, sem rede), que não pode virar logout. Seis tentativas com o
 * intervalo do queryClient dão uns 45s, o tempo de a API acordar
 */
export function repetirSessao(tentativas: number, erro: Error): boolean {
  const ehResposta = erro instanceof ErroDeApi && erro.status < 500
  return !ehResposta && tentativas < 6
}

/** POST /api/sessao. Só aqui 401 é credencial errada; no resto do sistema é sessão expirada */
export async function entrar(credenciais: Credenciais): Promise<Usuario> {
  try {
    const { usuario } = await api<{ usuario: Usuario }>('/api/sessao', {
      metodo: 'POST',
      corpo: credenciais,
    })
    return usuario
  } catch (erro) {
    if (erro instanceof ErroDeApi && erro.ehNaoAutenticado) throw new Error(CREDENCIAL_INVALIDA)
    throw erro
  }
}

/** O perfil vem do servidor, nunca da tela */
export function useLogin(): UseMutationResult<Usuario, Error, Credenciais> {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: entrar,
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
