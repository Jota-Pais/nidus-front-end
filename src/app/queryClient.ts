/**
 * Configuração do TanStack Query.
 *
 * A escolha está registrada em `docs/decisoes-de-stack.md` §2.2, e o motivo é o
 * `RF-CIC-02`: grade, quadro e ficha leem os mesmos dados e **nunca podem
 * divergir**. Alterar pela ficha tem que refletir nas outras duas — é o que
 * `invalidateQueries` resolve por desenho.
 */
import { MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { ErroDeApi } from '@/lib/api'
import { chaves } from './chaves'

/**
 * Tratamento global de 401, pedido pelo card "Camada de acesso à API".
 *
 * Zerar a sessão em cache é o que manda o usuário ao login: `ProvedorDePerfil`
 * passa a ver `perfil: null` e `RotaProtegida` redireciona. Fazer isso aqui, e
 * não em cada tela, garante que **qualquer** requisição que pegue sessão
 * expirada derruba o acesso — inclusive uma que rodou em segundo plano
 * enquanto o técnico estava na sala.
 *
 * O 403 é diferente e não vem para cá: autenticado, mas o perfil não alcança o
 * recurso. Derrubar a sessão seria errado; quem trata é a tela, com
 * `EstadoDaConsulta`.
 */
function aoFalhar(cliente: QueryClient, erro: unknown, chaveDaConsulta?: readonly unknown[]) {
  if (!(erro instanceof ErroDeApi) || !erro.ehNaoAutenticado) return

  // A própria consulta de sessão já devolve null no 401: entrar aqui faria
  // laço de invalidação.
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

  return cliente
}
