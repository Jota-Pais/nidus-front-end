// As colunas do kanban e os partos, como na spec do cliente (seções 1.9 e 5.2). As cores vêm
// dos tokens: a de cada coluna é --estado-<coluna>-fundo/borda/texto, e a grade de estantes pinta
// a caixa com a mesma; a de cada parto é COR_DO_PARTO
import { COR_DO_PARTO } from '@/app/tokens'
import { formatarData } from '@/lib/data'
import { descreverQuantos } from './pedido'
import type {
  DataISO,
  Destino,
  EstadoCaixa,
  EstoqueNoCard,
  Face,
  FaltaDoPedido,
  FichaDeCasal,
  MotivoDaLiberacao,
  OndeEstao,
  Parto,
  PorSexo,
  Sexo,
} from './tipos'

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

export const COLUNA = Object.fromEntries(
  COLUNAS.map((coluna) => [coluna.estado, coluna]),
) as Record<EstadoCaixa, Coluna>

export const MAX_PARTOS_POR_CASAL = 5

/** A cor do parto, do 1º ao 5º: a bolinha do card e da grade é o parto atual do casal */
export function corDoParto(parto: number): (typeof COR_DO_PARTO)[number] {
  return COR_DO_PARTO[Math.min(Math.max(parto, 1), COR_DO_PARTO.length) - 1]!
}

export const SIMBOLO_DO_SEXO: Record<Sexo, string> = { M: '♂', F: '♀' }

export const SEXOS: readonly Sexo[] = ['M', 'F']

export const ROTULO_DO_SEXO: Record<Sexo, string> = { M: 'Machos', F: 'Fêmeas' }

/** O grupo de cada sexo no corpo da mudança, e o nome dele nos formulários */
export const CAMPO_DO_SEXO: Record<Sexo, 'machos' | 'femeas'> = { M: 'machos', F: 'femeas' }

/** Quantos são do sexo: o 'm' ou o 'f' */
export function doSexo(quantos: PorSexo, sexo: Sexo): number {
  return sexo === 'M' ? quantos.m : quantos.f
}

/**
 * Quantos animais a mais a correção do nascimento cria, por sexo. Um sexo que sobe enquanto o
 * outro desce é troca de sexo (eram machos registrados como fêmeas), e não animal novo: é a mesma
 * conta da API. Só o que sobra da troca precisa de lugar
 */
export function aMaisNaCorrecao(atual: PorSexo, nova: PorSexo): PorSexo {
  const m = nova.m - atual.m
  const f = nova.f - atual.f
  const troca = m > 0 && f < 0 ? Math.min(m, -f) : f > 0 && m < 0 ? Math.min(f, -m) : 0

  return { m: Math.max(m - troca, 0), f: Math.max(f - troca, 0) }
}

/** Os vivos do parto que estão na caixa; nenhum, undefined */
export function vivosNaCaixa(parto: Pick<Parto, 'onde'>, idCaixa: number): OndeEstao | undefined {
  return parto.onde.find((lugar) => lugar.idCaixa === idCaixa && lugar.m + lugar.f > 0)
}

/** Todos os partos que passaram pela caixa de casal: os do casal dela e os dos casais de antes */
export function partosDaCaixa(ficha: Pick<FichaDeCasal, 'partos' | 'anteriores'>): Parto[] {
  return [...ficha.partos, ...ficha.anteriores.flatMap((anterior) => anterior.partos)]
}

/** Um lugar clicado na estante: uma caixa que já existe (idCaixa) ou uma posição vazia */
export interface LugarNaEstante {
  idEstante: number
  codigo: string
  face: Face
  linha: number
  coluna: number
  idCaixa: number | null
}

/** O destino que a API espera: a caixa clicada, ou a posição vazia onde nasce uma caixa nova */
export function destinoDoLugar(lugar: LugarNaEstante): Destino {
  if (lugar.idCaixa !== null) return { idCaixa: lugar.idCaixa }

  const { idEstante, face, linha, coluna } = lugar
  return { posicao: { idEstante, face, linha, coluna } }
}

const POR_QUE_LIBEROU: Record<MotivoDaLiberacao, string> = {
  entrega: 'a entrega levou os últimos animais',
  baixa: 'a baixa dos últimos animais a esvaziou',
  mudanca: 'os últimos animais mudaram de caixa',
  casal_encerrado: 'o casal encerrou sem animais nela',
}

/** "Caixa liberada em 08/11/2026: a entrega levou os últimos animais. ..." */
export function descreverLiberacao(
  dtLiberacao: DataISO | null,
  motivo: MotivoDaLiberacao | null,
): string {
  const porque = motivo === null ? '' : `: ${POR_QUE_LIBEROU[motivo]}`
  return `Caixa liberada em ${formatarData(dtLiberacao)}${porque}. A posição recebe caixa nova.`
}

/** "6 machos" / "1 fêmea" */
export function contarDoSexo(qtd: number, sexo: Sexo): string {
  if (sexo === 'M') return `${qtd} ${qtd === 1 ? 'macho' : 'machos'}`
  return `${qtd} ${qtd === 1 ? 'fêmea' : 'fêmeas'}`
}

/** "reservado", "reservadas": concorda com o sexo e com quantos são */
function reservadoDoSexo(qtd: number, sexo: Sexo): string {
  return `${sexo === 'F' ? 'reservada' : 'reservado'}${qtd === 1 ? '' : 's'}`
}

/** "2 reservados", "1 reservada", "0 reservadas": os reservados de uma caixa de um sexo só */
export function reservadosDoSexo(qtd: number, sexo: Sexo): string {
  return `${qtd} ${reservadoDoSexo(qtd, sexo)}`
}

/** ", 2 reservados", ", todas reservadas" ou nada, depois de quantos animais há */
function quantosReservados(reservados: number, total: number, sexo: Sexo): string {
  if (reservados === 0) return ''
  if (reservados === total) {
    return total === 1
      ? `, ${reservadoDoSexo(1, sexo)}`
      : `, ${sexo === 'F' ? 'todas' : 'todos'} ${reservadoDoSexo(total, sexo)}`
  }
  return `, ${reservadosDoSexo(reservados, sexo)}`
}

/** O que a caixa de estoque tem, numa linha: "6 machos, 2 reservados", "3 fêmeas, todas reservadas" */
export function descreverEstoque(
  estoque: Pick<EstoqueNoCard, 'sexo' | 'total' | 'reservado'>,
): string {
  return `${contarDoSexo(estoque.total, estoque.sexo)}${quantosReservados(estoque.reservado, estoque.total, estoque.sexo)}`
}

/**
 * Na grade, caixa em Livres sem casal ativo fica neutra, como posição vazia. A cor da coluna
 * vale para quem tem casal ou já virou estoque, reserva ou envio
 */
export function pintaNaGrade(estado: EstadoCaixa | null, temCasal: boolean): boolean {
  return estado !== null && (temCasal || estado !== 'livres')
}

/**
 * Os pedidos que perderam animais reservados numa baixa, numa seleção, num desmame ou numa
 * correção: o que falta em cada um, e o que a equipe pode fazer. Sem falta, null
 */
export function descreverFalta(faltas: FaltaDoPedido[]): string | null {
  if (faltas.length === 0) return null

  const cada = faltas.map((falta) => `#${falta.idPedido}, ${descreverQuantos(falta)}`).join('; ')
  const quem = faltas.length === 1 ? 'O pedido ficou' : 'Os pedidos ficaram'

  return (
    `${quem} com menos animais do que o reservado: ${cada}. ` +
    'Em Pedidos, a reserva em falta pode ser completada com outros animais ou desfeita.'
  )
}
