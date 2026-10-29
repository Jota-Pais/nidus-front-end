// configuração do TanStack Query
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ErroDeApi } from '@/lib/api'
import { chaves } from './chaves'

/** Tratamento global de 401: a sessão vira null e a rota protegida manda para o login */
function aoFalhar(cliente: QueryClient, erro: unknown, chaveDaConsulta?: readonly unknown[]) {
  if (!(erro instanceof ErroDeApi) || !erro.ehNaoAutenticado) return

  // A própria consulta de sessão já devolve null no 401: entrar aqui faria laço de invalidação
  if (chaveDaConsulta?.[0] === chaves.sessao[0]) return

  cliente.setQueryData(chaves.sessao, null)
}

export function criarQueryClient(): QueryClient {
  const cliente: QueryClient = new QueryClient({
    queryCache: new QueryCache({
      onError: (erro, consulta) => aoFalhar(cliente, erro, consulta.queryKey),
    }),
    mutationCache: new MutationCache({
      onError: (erro) => aoFalhar(cliente, erro),
    }),
    defaultOptions: {
      queries: {
        /**
         * Meio minuto. A colônia muda por ação de gente, não por relógio: o que
         * mantém a tela correta é a invalidação depois da mutação, não a expiração
         */
        staleTime: 30_000,

        /**
         * erro de contrato não melhora repetindo - 401, 403 e 409 são resposta, não falha. Já
         * erro de rede merece tentativa: a API na Render dorme por inatividade e leva de 30s a
         * 1min para acordar.
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
        // repetir uma escrita sem saber se a primeira chegou pode prometer o mesmo animal
        // duas vezes. Falhou, o usuário decide
        retry: false,
      },
    },
  })

  return cliente
}
