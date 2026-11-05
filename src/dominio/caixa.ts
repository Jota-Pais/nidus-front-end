// As colunas do kanban e os partos, como na spec do cliente (seções 1.9 e 5.2). As cores vêm
// dos tokens: a de cada coluna é --estado-<coluna>-fundo/borda/texto, e a grade de estantes pinta
// a caixa com a mesma; a de cada parto é COR_DO_PARTO
import { COR_DO_PARTO } from '@/app/tokens'
import type { EstadoCaixa } from './tipos'

interface Coluna {
  estado: EstadoCaixa
  rotulo: string
  /** o que o card diz embaixo */
  legenda: string
}

export const COLUNAS: Coluna[] = [
  { estado: 'livres', rotulo: 'Livres', legenda: 'Casal ativo' },
  { estado: 'pre_reserva', rotulo: 'Pré-reserva', legenda: 'Pré-reserva' },
  { estado: 'estoque', rotulo: 'Estoque', legenda: 'Animais de estoque' },
  { estado: 'reserva', rotulo: 'Reserva', legenda: 'Animais de reserva' },
  { estado: 'enviado', rotulo: 'Enviado', legenda: 'Enviado' },
]

export const COLUNA = Object.fromEntries(COLUNAS.map((coluna) => [coluna.estado, coluna])) as Record<
  EstadoCaixa,
  Coluna
>

export const MAX_PARTOS_POR_CASAL = 5

/** A cor do parto, do 1º ao 5º: a bolinha do card e da grade é o parto atual do casal */
export function corDoParto(parto: number): (typeof COR_DO_PARTO)[number] {
  return COR_DO_PARTO[Math.min(Math.max(parto, 1), COR_DO_PARTO.length) - 1]!
}

/**
 * Na grade, caixa em Livres sem casal ativo fica neutra, como posição vazia. A cor da coluna
 * vale para quem tem casal ou já virou estoque, reserva ou envio
 */
export function pintaNaGrade(estado: EstadoCaixa, temCasal: boolean): boolean {
  return temCasal || estado !== 'livres'
}

/** Caixa de estoque, reserva ou enviada não tem casal produzindo: não mostra parto previsto */
export function mostraPrevisao(estado: EstadoCaixa): boolean {
  return estado === 'livres' || estado === 'pre_reserva'
}
