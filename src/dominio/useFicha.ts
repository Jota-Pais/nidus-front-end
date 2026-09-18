/**
 * Ficha da posição — `contrato-api.md` §6, `GET /api/caixas/:id`.
 */
import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { chaves } from '@/app/chaves'
import { api } from '@/lib/api'
import type { Ficha } from './ficha'

/** `null` mantém a consulta desligada — é assim que o modal fechado não busca nada. */
export function useFicha(idCaixa: number | null): UseQueryResult<Ficha> {
  return useQuery({
    queryKey: chaves.caixa(idCaixa ?? 0),
    queryFn: () => api<Ficha>(`/api/caixas/${idCaixa}`),
    enabled: idCaixa !== null,
  })
}

export const PARAM_FICHA = 'ficha'
export const PARAM_ABA = 'aba'

/**
 * Devolve a função que as telas chamam pra abrir a ficha — `RF-CIC-02`, mesma
 * fonte da grade e do quadro. Separado de `componentes/FichaDaCaixa` porque o
 * Fast Refresh do Vite exige que um arquivo de componente exporte só
 * componentes (mesmo motivo de `auth/contexto.ts`).
 */
export function useAbrirFicha(): (idCaixa: number) => void {
  const [, setParams] = useSearchParams()

  return (idCaixa: number) =>
    setParams((atual) => {
      const proximo = new URLSearchParams(atual)
      proximo.set(PARAM_FICHA, String(idCaixa))
      proximo.set(PARAM_ABA, 'dados')
      return proximo
    })
}
