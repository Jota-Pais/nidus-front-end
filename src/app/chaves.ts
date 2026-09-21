// chaves de cache, num lugar só
import type { QueryClient } from '@tanstack/react-query'
import type { CodigoEspecie } from '@/dominio/tipos'

export const chaves = {
  sessao: ['sessao'] as const,
  catalogo: ['catalogo'] as const,
  estantes: ['estantes'] as const,
  grade: (idEstante: number) => ['grade', idEstante] as const,
  caixa: (idCaixa: number) => ['caixa', idCaixa] as const,
  quadro: (especie: CodigoEspecie) => ['quadro', especie] as const,
  alertas: ['alertas'] as const,
}

/** invalida tudo que enxerga o estado da colônia. */
export function invalidarColonia(cliente: QueryClient, idCaixa?: number): Promise<void> {
  const alvos: readonly unknown[][] = [
    [...chaves.estantes],
    ['grade'],
    ['quadro'],
    [...chaves.alertas],
    ...(idCaixa === undefined ? [] : [[...chaves.caixa(idCaixa)]]),
  ]

  return Promise.all(
    alvos.map((queryKey) => cliente.invalidateQueries({ queryKey })),
  ).then(() => undefined)
}
