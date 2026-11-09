// chaves de cache, num lugar só
import type { QueryClient } from '@tanstack/react-query'
import type { CodigoEspecie } from '@/dominio/tipos'

/**
 * Tudo o que mostra animais começa por este prefixo: o kanban, a grade, as fichas, o estoque, a
 * busca, os pedidos (a falta de cada um), a retirada e o histórico (a trilha). Uma baixa, uma
 * mudança ou uma entrega mexe em vários deles ao mesmo tempo, e o prefixo derruba todos de uma vez
 */
const COLONIA = 'colonia'

export const chaves = {
  sessao: ['sessao'] as const,
  catalogo: ['catalogo'] as const,
  salas: ['salas'] as const,
  estantes: ['estantes'] as const,
  projetos: ['projetos'] as const,
  usuarios: ['usuarios'] as const,
  colonia: [COLONIA] as const,
  quadro: (especie: CodigoEspecie) => [COLONIA, 'quadro', especie] as const,
  grade: (idEstante: number) => [COLONIA, 'grade', idEstante] as const,
  caixa: (idCaixa: number) => [COLONIA, 'caixa', idCaixa] as const,
  estoque: (especie: CodigoEspecie) => [COLONIA, 'estoque', especie] as const,
  pedidos: [COLONIA, 'pedidos'] as const,
  atendimento: (idPedido: number) => [COLONIA, 'atendimento', idPedido] as const,
  retirada: (idPedido: number) => [COLONIA, 'retirada', idPedido] as const,
  historico: [COLONIA, 'historico'] as const,
}

/**
 * Depois de qualquer mudança nos animais (nascimento, seleção, desmame, baixa, mudança, anulação,
 * correção, reserva, entrega), tudo o que os mostra recarrega junto. O que não está na tela sai do
 * cache: aberto depois (a retirada da entrega, a janela de reservar, outra ficha, o kanban), carrega
 * do zero, sem mostrar por um instante as caixas e os números de antes da ação
 */
export function invalidarColonia(cliente: QueryClient): Promise<void> {
  cliente.removeQueries({ queryKey: chaves.colonia, type: 'inactive' })
  return cliente.invalidateQueries({ queryKey: chaves.colonia })
}

/**
 * Criar e aprovar um pedido não mexem nos animais, mas a API grava os dois no histórico: recarrega
 * a lista de pedidos e o histórico, e mais nada
 */
export async function invalidarPedidos(cliente: QueryClient): Promise<void> {
  await Promise.all([
    cliente.invalidateQueries({ queryKey: chaves.pedidos }),
    cliente.invalidateQueries({ queryKey: chaves.historico }),
  ])
}
