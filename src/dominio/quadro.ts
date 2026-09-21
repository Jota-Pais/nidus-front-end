// Quadro de comprometimento - 'contrato-api.md' §8
import type { CodigoEspecie, EstadoCaixa, GrauCerteza, PorSexo } from './tipos'
import type { CasalNaGrade, ProximoEvento } from './estante'

export interface CardDoQuadro {
  idCaixa: number
  /** endereço na estante. ex: A1 */
  codigo: string
  numeroVisivel: string
  sala: string
  linhagem: string
  casal: CasalNaGrade | null
  /** Já líquido (RN-09). O front nunca subtrai */
  disponivel: PorSexo
  grauCerteza: GrauCerteza
  proximoEvento: ProximoEvento | null
}

export interface ColunaDoQuadro {
  estado: EstadoCaixa
  /** Total da coluna no servidor - pode ser maior que 'cards.length' */
  total: number
  cards: CardDoQuadro[]
}

export interface Quadro {
  especie: CodigoEspecie
  colunas: ColunaDoQuadro[]
}

/**
 * RF-CIC-03 - o que a transição vai quebrar, quando o servidor devolve 409
 * 'TRANSICAO_CONTRARIA_COMPROMISSO'
 */
export interface CompromissoAfetado {
  idRemessa: number
  projeto: string
  qtdM: number
  qtdF: number
}

/** Corpo do PATCH /api/caixas/:id/estado */
export interface PedidoDeTransicao {
  estado: EstadoCaixa
  justificativa: string | null
  confirmar: boolean
}

/** Lê os compromissos afetados de um 409 TRANSICAO_CONTRARIA_COMPROMISSO. */
export function compromissosAfetados(corpoDoErro: unknown): CompromissoAfetado[] {
  if (typeof corpoDoErro !== 'object' || corpoDoErro === null) return []
  const lista = (corpoDoErro as { compromissosAfetados?: unknown }).compromissosAfetados
  if (!Array.isArray(lista)) return []

  return lista.filter(
    (item): item is CompromissoAfetado =>
      typeof item === 'object' &&
      item !== null &&
      typeof (item as CompromissoAfetado).idRemessa === 'number' &&
      typeof (item as CompromissoAfetado).projeto === 'string',
  )
}
