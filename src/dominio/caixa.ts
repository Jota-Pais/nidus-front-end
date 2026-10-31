// As colunas do kanban e as cores dos partos, como na spec do cliente (seções 1.9 e 5.2).
// A cor de cada coluna vem dos tokens (--estado-<coluna>-fundo/borda/texto), e a grade de
// estantes pinta a caixa com a mesma
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

/** Do 1º ao 5º parto: a bolinha do card e da grade é o parto atual do casal */
export const CORES_PARTO = ['#EC4899', '#FACC15', '#22D3EE', '#A3E635', '#6366F1']

export const MAX_PARTOS_POR_CASAL = 5

export function corDoParto(parto: number): string {
  return CORES_PARTO[Math.min(Math.max(parto, 1), CORES_PARTO.length) - 1] ?? '#EC4899'
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
