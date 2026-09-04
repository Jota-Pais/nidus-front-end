/**
 * Queries da infraestrutura física — `contrato-api.md` §4 e §5.
 *
 * As chaves vêm de `@/app/chaves`, não são escritas aqui: invalidar
 * `['grade']` precisa casar por prefixo com a grade de toda estante em cache,
 * e isso só funciona se o nome for um só no projeto inteiro (`RF-CIC-02`).
 */
import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import { chaves } from '@/app/chaves'
import type { Estante, Grade } from '@/dominio/estante'
import { api } from '@/lib/api'

export function useEstantes(): UseQueryResult<Estante[]> {
  return useQuery({
    queryKey: chaves.estantes,
    queryFn: async () => {
      const { estantes } = await api<{ estantes: Estante[] }>('/api/estantes')
      return estantes
    },
  })
}

export function useGrade(idEstante: number | null): UseQueryResult<Grade> {
  return useQuery({
    queryKey: chaves.grade(idEstante ?? 0),
    queryFn: () => api<Grade>(`/api/estantes/${idEstante}/grade`),
    enabled: idEstante !== null,
  })
}
