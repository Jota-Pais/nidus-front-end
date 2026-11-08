// As colunas do kanban e os partos, como na spec do cliente (seções 1.9 e 5.2). As cores vêm
// dos tokens: a de cada coluna é --estado-<coluna>-fundo/borda/texto, e a grade de estantes pinta
// a caixa com a mesma; a de cada parto é COR_DO_PARTO
import { COR_DO_PARTO } from '@/app/tokens'
import type { EstadoCaixa, EstoqueNoCard, FaltaNaReserva, Sexo } from './tipos'

interface Coluna {
  estado: EstadoCaixa
  rotulo: string
  /** o que o card diz embaixo */
  legenda: string
}

export const COLUNAS: Coluna[] = [
  { estado: 'livres', rotulo: 'Livres', legenda: 'Casal ativo' },
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

export const SIMBOLO_DO_SEXO: Record<Sexo, string> = { M: '♂', F: '♀' }

/** "6 machos" / "1 fêmea" */
export function contarDoSexo(qtd: number, sexo: Sexo): string {
  if (sexo === 'M') return `${qtd} ${qtd === 1 ? 'macho' : 'machos'}`
  return `${qtd} ${qtd === 1 ? 'fêmea' : 'fêmeas'}`
}

/** O que a caixa de estoque tem, numa linha: "6 machos, 2 reservados" */
export function descreverEstoque(estoque: Pick<EstoqueNoCard, 'sexo' | 'total' | 'reservado'>): string {
  const reservados =
    estoque.reservado === 0
      ? ''
      : estoque.reservado === estoque.total
        ? ', todos reservados'
        : `, ${estoque.reservado} ${estoque.reservado === 1 ? 'reservado' : 'reservados'}`

  return `${contarDoSexo(estoque.total, estoque.sexo)}${reservados}`
}

/**
 * Na grade, caixa em Livres sem casal ativo fica neutra, como posição vazia. A cor da coluna
 * vale para quem tem casal ou já virou estoque, reserva ou envio
 */
export function pintaNaGrade(estado: EstadoCaixa, temCasal: boolean): boolean {
  return temCasal || estado !== 'livres'
}

/**
 * A ninhada que ficou com menos animais do que o reservado, depois do desmame ou da correção:
 * quanto falta, de quais pedidos, e o que a equipe pode fazer
 */
export function descreverFalta(falta: FaltaNaReserva): string {
  const pedidos = falta.pedidos
    .map((pedido) => `#${pedido.idSolicitacao} (${pedido.m} M, ${pedido.f} F)`)
    .join(', ')

  return (
    `A ninhada ficou com menos animais do que o reservado: faltam ${falta.m} M e ${falta.f} F. ` +
    `Reservado para ${falta.pedidos.length > 1 ? 'os pedidos' : 'o pedido'} ${pedidos}. ` +
    'Em Solicitações, a reserva do pedido em falta pode ser desfeita.'
  )
}
