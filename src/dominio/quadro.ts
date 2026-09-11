/**
 * Quadro de comprometimento — `contrato-api.md` §8.
 *
 * Transcrição do contrato. As cinco colunas vêm **sempre**, na ordem de
 * `COLUNAS_DO_QUADRO`, mesmo vazias: o front não inventa coluna nem reordena.
 *
 * ⚠️ A segregação por espécie é do servidor (`RF-CIC-01`) — o front pede uma
 * espécie e recebe só ela. Não é filtro de interface.
 */
import type { CodigoEspecie, EstadoCaixa, GrauCerteza, PorSexo } from './tipos'
import type { CasalNaGrade, ProximoEvento } from './estante'

export interface CardDoQuadro {
  idCaixa: number
  /** Endereço na estante. Ex.: `A1`. */
  codigo: string
  numeroVisivel: string
  sala: string
  linhagem: string
  casal: CasalNaGrade | null
  /** Já líquido (`RN-09`). O front nunca subtrai. */
  disponivel: PorSexo
  grauCerteza: GrauCerteza
  proximoEvento: ProximoEvento | null
}

export interface ColunaDoQuadro {
  estado: EstadoCaixa
  /** Total da coluna no servidor — pode ser maior que `cards.length`. */
  total: number
  cards: CardDoQuadro[]
}

export interface Quadro {
  especie: CodigoEspecie
  colunas: ColunaDoQuadro[]
}

/**
 * `RF-CIC-03` — o que a transição vai quebrar, quando o servidor devolve
 * **409 `TRANSICAO_CONTRARIA_COMPROMISSO`**.
 *
 * A transição é livre, inclusive retrocedendo; o que não é livre é quebrar
 * compromisso em silêncio. O front mostra isto ao usuário e, se ele insistir,
 * reenvia com `confirmar: true` — e aí grava **como exceção**.
 */
export interface CompromissoAfetado {
  idRemessa: number
  projeto: string
  qtdM: number
  qtdF: number
}

/** Corpo do `PATCH /api/caixas/:id/estado`. */
export interface PedidoDeTransicao {
  estado: EstadoCaixa
  justificativa: string | null
  confirmar: boolean
}

/**
 * Lê os compromissos afetados de um `409 TRANSICAO_CONTRARIA_COMPROMISSO`.
 *
 * O contrato põe `compromissosAfetados` **dentro de `erro`**, ao lado de
 * `codigo` e `mensagem` — não em `campos`. `ErroDeApi` é genérico e não
 * conhece o quadro, então quem sabe ler isto é este arquivo.
 *
 * Devolve lista vazia quando o corpo não tem a forma esperada: um 409 sem a
 * lista ainda é um 409 legítimo, e a tela mostra a mensagem do servidor.
 */
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
