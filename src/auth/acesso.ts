// primeiro acesso e senha esquecida: código no e-mail da UFSC, depois a senha nova
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult } from '@tanstack/react-query'
import { chaves } from '@/app/chaves'
import { api } from '@/lib/api'
import type { Usuario } from './sessao'

export interface CodigoEnviado {
  /** Por quanto tempo o código vale, para a tela avisar */
  validadeEmMinutos: number
}

export interface CodigoParaConferir {
  email: string
  codigo: string
}

export interface NovaSenha extends CodigoParaConferir {
  senha: string
  /** Só no primeiro acesso: quem já tem conta mantém o nome */
  nome?: string
}

/**
 * POST /api/acesso/codigo. A resposta é a mesma com ou sem conta para o e-mail:
 * a tela não tem como saber, e é de propósito
 */
export function usePedirCodigo(): UseMutationResult<CodigoEnviado, Error, string> {
  return useMutation({
    mutationFn: (email: string) =>
      api<CodigoEnviado>('/api/acesso/codigo', { metodo: 'POST', corpo: { email } }),
  })
}

/** POST /api/acesso/verificacao. Confere o código sem gastá-lo e diz se a conta é nova */
export function useVerificarCodigo(): UseMutationResult<
  { novo: boolean },
  Error,
  CodigoParaConferir
> {
  return useMutation({
    mutationFn: (dados: CodigoParaConferir) =>
      api<{ novo: boolean }>('/api/acesso/verificacao', { metodo: 'POST', corpo: dados }),
  })
}

/** POST /api/acesso/senha. Gasta o código, grava a senha e já abre a sessão, como o login */
export function useDefinirSenha(): UseMutationResult<Usuario, Error, NovaSenha> {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: async (dados: NovaSenha) => {
      const { usuario } = await api<{ usuario: Usuario }>('/api/acesso/senha', {
        metodo: 'POST',
        corpo: dados,
      })
      return usuario
    },
    onSuccess: (usuario) => {
      cliente.setQueryData(chaves.sessao, usuario)
    },
  })
}
