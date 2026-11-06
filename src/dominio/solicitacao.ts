// Como um pedido de animais se escreve na tela. A solicitação e a busca de atendimento usam
// as mesmas frases: o que o pesquisador conferiu é o que a equipe lê
import type { Cronograma, Solicitacao } from './tipos'

export const ROTULO_CRONOGRAMA: Record<Cronograma, string> = {
  unica: 'Cota única',
  semanal: 'Semanal',
  quinzenal: 'Quinzenal',
  mensal: 'Mensal',
}

/** As opções do pedido, na ordem do seletor */
export const CRONOGRAMAS_DO_PEDIDO = [
  'unica',
  'semanal',
  'quinzenal',
  'mensal',
] as const satisfies readonly Cronograma[]

/** Campo vazio do formulário conta como zero */
interface Quantidades {
  machos?: number | null | undefined
  femeas?: number | null | undefined
  qualquer?: number | null | undefined
}

export function totalDeAnimais({ machos, femeas, qualquer }: Quantidades): number {
  return (machos ?? 0) + (femeas ?? 0) + (qualquer ?? 0)
}

/** "5 M · 5 F · 10 qualquer sexo", só com as partes que existem */
export function descreverAnimais({ machos, femeas, qualquer }: Quantidades): string {
  const partes = [
    machos ? `${machos} M` : null,
    femeas ? `${femeas} F` : null,
    qualquer ? `${qualquer} qualquer sexo` : null,
  ].filter((parte) => parte !== null)

  return partes.length > 0 ? partes.join(' · ') : '—'
}

/** Faixa ("de 20 a 40 dias") ou idade exata: a escolha do pedido e da busca */
export type ModoDeIdade = 'faixa' | 'exata'

/** O que o campo de idade guarda. O máximo vem nulo quando está em branco ou escondido */
export interface CamposDeIdade {
  modoIdade: ModoDeIdade
  idadeMin: number
  idadeMax?: number | null | undefined
}

/** A faixa que vai para a API. Na exata, o máximo é o próprio mínimo, sobre o que tiver ficado */
export function faixaDeIdade({ modoIdade, idadeMin, idadeMax }: CamposDeIdade) {
  return { idadeMin, idadeMax: modoIdade === 'exata' ? idadeMin : (idadeMax ?? idadeMin) }
}

/** "20 a 40 dias", ou "28 dias" quando a idade é exata */
export function descreverIdade({ idadeMin, idadeMax }: { idadeMin: number; idadeMax: number }) {
  return idadeMin === idadeMax ? `${idadeMin} dias` : `${idadeMin} a ${idadeMax} dias`
}

/**
 * Os pedidos de quem pede, pela data de entrega, da mais cedo para a mais tarde. No mesmo dia,
 * o pedido feito antes vem primeiro. Devolve uma cópia: a lista do cache não é mexida
 */
export function porDataDeEntrega<T extends { id: number; dataEntrega: string }>(
  pedidos: readonly T[],
): T[] {
  // A data vem como AAAA-MM-DD, então a ordem do texto é a ordem do calendário
  return [...pedidos].sort((a, b) => a.dataEntrega.localeCompare(b.dataEntrega) || a.id - b.id)
}

export type FiltroDeSolicitacao = 'todas' | 'pendentes' | 'aceitas' | 'recusadas'

export const FILTROS_DE_SOLICITACAO: { valor: FiltroDeSolicitacao; rotulo: string }[] = [
  { valor: 'todas', rotulo: 'Todas' },
  { valor: 'pendentes', rotulo: 'Pendentes' },
  { valor: 'aceitas', rotulo: 'Aceitas' },
  { valor: 'recusadas', rotulo: 'Recusadas' },
]

export function entraNoFiltro(filtro: FiltroDeSolicitacao, s: Solicitacao): boolean {
  switch (filtro) {
    case 'todas':
      return true
    case 'pendentes':
      return s.status === 'enviada' || s.status === 'em_analise'
    case 'aceitas':
      return s.status === 'aprovada' || s.status === 'ajustada' || s.status === 'em_atendimento'
    case 'recusadas':
      return s.status === 'recusada'
  }
}

export type OrdemDeSolicitacao = 'pedido' | 'entrega'

export const ORDENS_DE_SOLICITACAO: { value: OrdemDeSolicitacao; label: string }[] = [
  { value: 'pedido', label: 'Data do pedido' },
  { value: 'entrega', label: 'Data de entrega' },
]

export function porDataDoPedido<T extends { id: number; dataSolicitacao: string }>(
  pedidos: readonly T[],
): T[] {
  return [...pedidos].sort(
    (a, b) => b.dataSolicitacao.localeCompare(a.dataSolicitacao) || b.id - a.id,
  )
}

export function ordenarSolicitacoes<
  T extends { id: number; dataSolicitacao: string; dataEntrega: string },
>(ordem: OrdemDeSolicitacao, pedidos: readonly T[]): T[] {
  return ordem === 'entrega' ? porDataDeEntrega(pedidos) : porDataDoPedido(pedidos)
}
