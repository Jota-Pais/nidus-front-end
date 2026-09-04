/**
 * Configuração do TanStack Query.
 *
 * A escolha está registrada em `docs/decisoes-de-stack.md` §2.2, e o motivo é o
 * `RF-CIC-02`: grade, quadro e ficha leem os mesmos dados e **nunca podem
 * divergir**. Alterar pela ficha tem que refletir nas outras duas — é o que
 * `invalidateQueries` resolve por desenho.
 */
import { QueryClient } from '@tanstack/react-query'
import { ErroDeApi } from '@/lib/api'

export function criarQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        /**
         * Meio minuto. A colônia muda por ação de gente, não por relógio: o que
         * mantém a tela correta é a invalidação depois da mutação, não a
         * expiração.
         */
        staleTime: 30_000,

        /**
         * Erro de contrato não melhora repetindo — 401, 403 e 409 são resposta,
         * não falha. Já erro de rede merece tentativa: a API na Render dorme
         * por inatividade e leva de 30s a 1min para acordar
         * (`docs/decisoes-de-stack.md` §1.3).
         */
        retry: (tentativas, erro) => (erro instanceof ErroDeApi ? false : tentativas < 2),
        retryDelay: (tentativas) => Math.min(1000 * 2 ** tentativas, 15_000),

        /**
         * O técnico deixa a aba aberta e volta depois de um turno na sala. Ao
         * voltar, o que está na tela precisa ser o estado atual da colônia.
         */
        refetchOnWindowFocus: true,
      },
      mutations: {
        // Repetir uma escrita sem saber se a primeira chegou é como o RN-09 é
        // violado. Falhou, o usuário decide.
        retry: false,
      },
    },
  })
}
