/**
 * Alertas do ciclo — `contrato-api.md` §8, `RF-REP-07`.
 */
import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { chaves } from '@/app/chaves'
import { api } from '@/lib/api'
import type { Alertas } from './alertas'

export function useAlertas(): UseQueryResult<Alertas> {
  return useQuery({
    queryKey: chaves.alertas,
    queryFn: () => api<Alertas>('/api/alertas'),
  })
}
