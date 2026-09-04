import { describe, expect, it } from 'vitest'
import { porLinha } from './estante'
import type { FaceDaGrade, Posicao } from './estante'

function posicao(linha: number, coluna: number): Posicao {
  return { linha, coluna, codigo: `${String.fromCharCode(64 + coluna)}${linha}`, caixa: null }
}

function face(linhas: number, colunas: number, posicoes: Posicao[]): FaceDaGrade {
  return { face: 'frontal', linhas, colunas, posicoes }
}

describe('porLinha — RF-INF-03', () => {
  it('agrupa nas linhas da topologia', () => {
    const posicoes = [posicao(1, 1), posicao(1, 2), posicao(2, 1), posicao(2, 2)]
    const linhas = porLinha(face(2, 2, posicoes))
    expect(linhas).toHaveLength(2)
    expect(linhas[0]?.map((p) => p.codigo)).toEqual(['A1', 'B1'])
    expect(linhas[1]?.map((p) => p.codigo)).toEqual(['A2', 'B2'])
  })

  it('desenha certo mesmo se a resposta vier fora de ordem', () => {
    const embaralhada = [posicao(2, 2), posicao(1, 2), posicao(2, 1), posicao(1, 1)]
    const linhas = porLinha(face(2, 2, embaralhada))
    expect(linhas[0]?.map((p) => p.codigo)).toEqual(['A1', 'B1'])
    expect(linhas[1]?.map((p) => p.codigo)).toEqual(['A2', 'B2'])
  })

  it('devolve uma linha por linha da topologia, mesmo se vierem menos posições', () => {
    const linhas = porLinha(face(8, 8, [posicao(1, 1)]))
    expect(linhas).toHaveLength(8)
    expect(linhas[7]).toEqual([])
  })

  it('ignora linha fora da topologia em vez de estourar a grade', () => {
    const linhas = porLinha(face(2, 2, [posicao(1, 1), posicao(99, 1)]))
    expect(linhas).toHaveLength(2)
    expect(linhas.flat()).toHaveLength(1)
  })

  it('preserva a capacidade de um ALESCO Modelo 1: 8 linhas de 8', () => {
    const posicoes: Posicao[] = []
    for (let l = 1; l <= 8; l++) for (let c = 1; c <= 8; c++) posicoes.push(posicao(l, c))
    const linhas = porLinha(face(8, 8, posicoes))
    expect(linhas).toHaveLength(8)
    expect(linhas.every((l) => l.length === 8)).toBe(true)
  })
})
