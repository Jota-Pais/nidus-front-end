/**
 * Queries da infraestrutura física — `contrato-api.md` §5.
 *
 * As chaves são hierárquicas de propósito: invalidar `['estantes']` derruba a
 * lista e todas as grades de uma vez. É o que cumpre o `RF-CIC-02` — grade e
 * quadro leem da mesma fonte e nunca divergem — quando a ficha da posição
 * gravar uma alteração.
 */
import { useQuery } from '@tanstack/react-query'
import type { UseQueryResult } from '@tanstack/react-query'
import type { Estante, Grade } from '@/dominio/estante'
import { api } from '@/lib/api'

export const chaves = {
  todas: ['estantes'] as const,
  lista: () => [...chaves.todas, 'lista'] as const,
  grade: (idEstante: number) => [...chaves.todas, 'grade', idEstante] as const,
}

export function useEstantes(): UseQueryResult<Estante[]> {
  return useQuery({
    queryKey: chaves.lista(),
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
