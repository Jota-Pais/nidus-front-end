// Quadro de acompanhamento - 'contrato-api.md' §8
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query'
import { chaves, invalidarColonia } from '@/app/chaves'
import { api } from '@/lib/api'
import type { CodigoEspecie } from './tipos'
import type { PedidoDeTransicao, Quadro } from './quadro'

/** RF-CIC-01 - a espécie segrega no servidor; não existe "todas". */
export function useQuadro(especie: CodigoEspecie): UseQueryResult<Quadro> {
  return useQuery({
    queryKey: chaves.quadro(especie),
    queryFn: () => api<Quadro>(`/api/quadro?${new URLSearchParams({ especie }).toString()}`),
  })
}

interface VariaveisDeMovimento {
  idCaixa: number
  pedido: PedidoDeTransicao
}

/** PATCH /api/caixas/:id/estado - RF-CIC-03 */
export function useMoverCaixa(): UseMutationResult<unknown, Error, VariaveisDeMovimento> {
  const cliente = useQueryClient()

  return useMutation({
    mutationFn: ({ idCaixa, pedido }: VariaveisDeMovimento) =>
      api(`/api/caixas/${idCaixa}/estado`, { metodo: 'PATCH', corpo: pedido }),
    // RF-CIC-02: quadro e grade não podem divergir depois da mudança
    onSuccess: (_dados, { idCaixa }) => invalidarColonia(cliente, idCaixa),
  })
}
