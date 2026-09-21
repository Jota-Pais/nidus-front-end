// Anexo A.2 - os 4 modelos de estante e a geração da grade vazia
import type { Endereco, Face } from '@/dominio/tipos'

export interface ModeloEstante {
  id: number
  fabricante: 'ALESCO' | 'TECNIPLAST'
  nome: string
  linhas: number
  /** Colunas por face. A capacidade total considera as duas faces */
  colunas: number
  capacidade: number
}

export const MODELOS_ESTANTE: ModeloEstante[] = [
  { id: 1, fabricante: 'ALESCO', nome: 'Modelo 1', linhas: 8, colunas: 8, capacidade: 128 },
  { id: 2, fabricante: 'ALESCO', nome: 'Modelo 2', linhas: 5, colunas: 5, capacidade: 50 },
  { id: 3, fabricante: 'TECNIPLAST', nome: 'Modelo 1', linhas: 8, colunas: 7, capacidade: 112 },
  { id: 4, fabricante: 'TECNIPLAST', nome: 'Modelo 2', linhas: 5, colunas: 4, capacidade: 40 },
]

export const FACES: Face[] = ['frontal', 'traseira']

const ALFABETO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

/** CONF-07 - a letra da estante designa linha ou coluna? */
export type EixoDaLetra = 'coluna' | 'linha'
export const EIXO_DA_LETRA: EixoDaLetra = 'coluna'

/** Gera todos os endereços de uma estante, nas duas faces. */
export function enderecosDaEstante(
  idEstante: number,
  modelo: ModeloEstante,
  eixo: EixoDaLetra = EIXO_DA_LETRA,
): Endereco[] {
  const enderecos: Endereco[] = []

  FACES.forEach((face, indiceFace) => {
    const quantidadeDeLetras = eixo === 'coluna' ? modelo.colunas : modelo.linhas
    const deslocamento = indiceFace * quantidadeDeLetras

    for (let linha = 1; linha <= modelo.linhas; linha++) {
      for (let coluna = 1; coluna <= modelo.colunas; coluna++) {
        const indiceDaLetra = (eixo === 'coluna' ? coluna : linha) - 1 + deslocamento
        const letra = ALFABETO[indiceDaLetra]
        if (letra === undefined) {
          throw new Error(
            `Topologia sem letra disponível: ${modelo.fabricante} ${modelo.nome}, índice ${indiceDaLetra}`,
          )
        }
        const numero = eixo === 'coluna' ? linha : coluna
        enderecos.push({ idEstante, face, linha, coluna, codigo: `${letra}${numero}` })
      }
    }
  })

  return enderecos
}

/** Faixa de letras de uma face, para rótulo de cabeçalho. ex: ['A', 'H'] */
export function faixaDeLetras(
  modelo: ModeloEstante,
  face: Face,
  eixo: EixoDaLetra = EIXO_DA_LETRA,
): [string, string] {
  const quantidade = eixo === 'coluna' ? modelo.colunas : modelo.linhas
  const inicio = (face === 'frontal' ? 0 : 1) * quantidade
  const primeira = ALFABETO[inicio]
  const ultima = ALFABETO[inicio + quantidade - 1]
  if (primeira === undefined || ultima === undefined) {
    throw new Error(`Topologia sem letra disponível: ${modelo.fabricante} ${modelo.nome}`)
  }
  return [primeira, ultima]
}
