// A estante, a grade e os formatos nos testes: cada teste diz só as medidas e onde há caixa
import { codigoDaPosicao, facesDa } from '@/dominio/formato'
import type { Medidas } from '@/dominio/formato'
import type { CaixaNaGrade, EstanteDoFormato, Face, Formato, Grade } from '@/dominio/tipos'

/** Uma caixa sem ciclo aberto: para a estante, só importa que a posição está ocupada */
const caixa = (id: number): CaixaNaGrade => ({
  id,
  fase: null,
  atrasado: false,
  idLinhagem: 1,
  linhagem: 'Wistar',
  casal: null,
  estoque: null,
})

/** A grade de uma estante com as medidas, com caixa só nas posições pedidas: [face, linha, coluna] */
export function gradeCom(medidas: Medidas, ...ocupadas: [Face, number, number][]): Grade {
  return {
    faces: facesDa(medidas.faces).map((face) => ({
      face,
      posicoes: Array.from({ length: medidas.linhas * medidas.colunas }, (_, indice) => {
        const linha = Math.floor(indice / medidas.colunas) + 1
        const coluna = (indice % medidas.colunas) + 1
        const ocupada = ocupadas.some(([f, l, c]) => f === face && l === linha && c === coluna)
        return {
          linha,
          coluna,
          codigo: codigoDaPosicao(face, linha, coluna, medidas.colunas),
          caixa: ocupada ? caixa(indice + 1) : null,
        }
      }),
    })),
  }
}

/** Um formato com as medidas e as estantes que o usam; a capacidade sai das medidas */
export const formato = (
  id: number,
  nome: string,
  { faces, linhas, colunas }: Medidas,
  estantes: EstanteDoFormato[] = [],
): Formato => ({ id, nome, faces, linhas, colunas, capacidade: faces * linhas * colunas, estantes })
