// tipos da infraestrutura física, na forma que a API devolve.
import type { EstadoCaixa, Face, FinalidadeCaixa } from './tipos'

export interface Topologia {
  faces: number
  linhas: number
  colunas: number
  capacidade: number
}

export interface Ocupacao {
  capacidade: number
  ocupada: number
  livre: number
}

export interface Estante {
  id: number
  sala: string
  fabricante: string
  modelo: string
  /** Como a estante está numerada no mundo físico. ex: E-03 */
  numeroVisivel: string
  topologia: Topologia
  /** RF-INF-06 - capacidade instalada, ocupada e livre */
  ocupacao: Ocupacao
  ativa: boolean
}

export interface CasalNaGrade {
  id: number
  /** Dupla de grupos genéticos; o primeiro caractere é o do macho. ex: 'AB' */
  identificacao: string
  cicloAtual: number
  maxCiclos: number
}

export type TipoDeEvento = 'parto_previsto' | 'desmame_previsto' | 'reacasalamento_liberado'

export interface ProximoEvento {
  tipo: TipoDeEvento
  data: string
  /** A data prevista passou sem confirmação. */
  atrasado: boolean
}

export interface CaixaNaGrade {
  id: number
  especie: string
  linhagem: string
  finalidade: FinalidadeCaixa
  estado: EstadoCaixa
  casal: CasalNaGrade | null
  proximoEvento: ProximoEvento | null
}

export interface Posicao {
  linha: number
  coluna: number
  /** Endereço como aparece na etiqueta física (RF-INF-02). */
  codigo: string
  /** null = posição vazia. O back-end gera a grade completa; o front desenha. */
  caixa: CaixaNaGrade | null
}

export interface FaceDaGrade {
  face: Face
  linhas: number
  colunas: number
  /** vem completo: 'linhas × colunas' itens, em ordem linha-major */
  posicoes: Posicao[]
}

export interface Grade {
  estante: Omit<Estante, 'ocupacao' | 'ativa'>
  faces: FaceDaGrade[]
}

export const ROTULO_EVENTO: Record<TipoDeEvento, string> = {
  parto_previsto: 'Parto previsto',
  desmame_previsto: 'Desmame previsto',
  reacasalamento_liberado: 'Reacasalamento liberado',
}

/** divide as posições de uma face em linhas, para a grade desenhar */
export function porLinha(face: FaceDaGrade): Posicao[][] {
  const linhas: Posicao[][] = Array.from({ length: face.linhas }, () => [])
  for (const posicao of face.posicoes) {
    const indice = posicao.linha - 1
    if (indice >= 0 && indice < linhas.length) linhas[indice]?.push(posicao)
  }
  return linhas.map((linha) => [...linha].sort((a, b) => a.coluna - b.coluna))
}
