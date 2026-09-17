/**
 * Chaves de cache, num lugar só.
 *
 * Os nomes são os do card "Camada de acesso à API" do backlog — o back-end
 * escreveu o contrato contra eles, então não são escolha livre.
 *
 * São planas de propósito: `invalidateQueries({ queryKey: ['grade'] })` casa por
 * prefixo e derruba a grade de **todas** as estantes. É isso que cumpre o
 * `RF-CIC-02` sem a tela precisar saber quais estantes estão em cache.
 */
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

/**
 * Invalida tudo que enxerga o estado da colônia.
 *
 * **É o coração do `RF-CIC-02`**: "quadro e grade leem da mesma fonte e nunca
 * divergem". Toda mutação em caixa, casal ou parto passa por aqui — alterar
 * pela ficha tem que aparecer na grade e no quadro sem F5.
 *
 * Chamar isto é mais barato que errar: invalidar demais custa um refetch,
 * invalidar de menos deixa duas telas discordando sobre onde está um animal.
 */
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
