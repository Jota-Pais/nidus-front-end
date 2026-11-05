// Como um pedido de animais se escreve na tela. A solicitação e a busca de atendimento usam
// as mesmas frases: o que o pesquisador conferiu é o que a equipe lê
import type { Cronograma } from './tipos'

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
