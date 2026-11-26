import { describe, expect, it } from 'vitest'
import { gradeCom as gradeDasMedidas } from '@/testes/estante'
import {
  avisoDaTraseira,
  avisoDasCaixasFora,
  avisoDoUso,
  caixasForaDoFormato,
  codigoDaPosicao,
  descreverFormato,
  descreverMedidas,
  medidasQueCabem,
  usadoPor,
} from './formato'
import type { Face } from './tipos'

/** Uma estante de 2 faces de 8 × 8, com caixa só nas posições pedidas */
const gradeCom = (...ocupadas: [Face, number, number][]) =>
  gradeDasMedidas({ faces: 2, linhas: 8, colunas: 8 }, ...ocupadas)

const estantes = (...numeros: [string, string][]) =>
  numeros.map(([numeroVisivel, sala], indice) => ({ id: indice + 1, numeroVisivel, sala }))

describe('codigoDaPosicao', () => {
  it('a frontal conta as letras do A', () => {
    expect(codigoDaPosicao('frontal', 1, 1, 8)).toBe('F1A')
    expect(codigoDaPosicao('frontal', 8, 8, 8)).toBe('F8H')
  })

  it('a traseira continua as letras da frontal: com 8 colunas, de I a P', () => {
    expect(codigoDaPosicao('traseira', 1, 1, 8)).toBe('T1I')
    expect(codigoDaPosicao('traseira', 2, 8, 8)).toBe('T2P')
  })

  it('com 9 colunas, a traseira começa no J', () => {
    expect(codigoDaPosicao('traseira', 1, 1, 9)).toBe('T1J')
    expect(codigoDaPosicao('traseira', 1, 9, 9)).toBe('T1R')
  })

  it('com 1 face de 26 colunas, a frontal vai até o Z', () => {
    expect(codigoDaPosicao('frontal', 3, 26, 26)).toBe('F3Z')
  })
})

describe('descreverMedidas e descreverFormato', () => {
  it('diz as faces, as linhas por colunas e quantas caixas cabem', () => {
    expect(descreverMedidas({ faces: 2, linhas: 8, colunas: 8 })).toBe(
      '2 faces de 8 × 8 (128 caixas)',
    )
    expect(descreverMedidas({ faces: 1, linhas: 5, colunas: 4 })).toBe(
      '1 face de 5 × 4 (20 caixas)',
    )
    expect(descreverMedidas({ faces: 1, linhas: 1, colunas: 1 })).toBe('1 face de 1 × 1 (1 caixa)')
  })

  it('o formato na escolha leva o nome antes das medidas', () => {
    expect(descreverFormato({ nome: 'ALESCO Modelo 1', faces: 2, linhas: 8, colunas: 8 })).toBe(
      'ALESCO Modelo 1 · 2 faces de 8 × 8 (128 caixas)',
    )
  })
})

describe('medidasQueCabem', () => {
  it('devolve as medidas inteiras de 1 a 26 com uma letra por coluna', () => {
    expect(medidasQueCabem(2, 8, 13)).toEqual({ faces: 2, linhas: 8, colunas: 13 })
    expect(medidasQueCabem(1, 26, 26)).toEqual({ faces: 1, linhas: 26, colunas: 26 })
  })

  it('não desenha o que falta, o que passa de 26 nem o que fica sem letra', () => {
    expect(medidasQueCabem(2, undefined, 8)).toBeNull()
    expect(medidasQueCabem(2, 8, null)).toBeNull()
    expect(medidasQueCabem(2, 27, 8)).toBeNull()
    expect(medidasQueCabem(2, 8, 0)).toBeNull()
    expect(medidasQueCabem(2, 8, 14)).toBeNull()
    expect(medidasQueCabem(3, 8, 8)).toBeNull()
  })
})

describe('caixasForaDoFormato', () => {
  it('lista as caixas além das linhas ou das colunas, da frontal para a traseira', () => {
    const grade = gradeCom(
      ['traseira', 8, 3],
      ['frontal', 8, 1],
      ['frontal', 1, 1],
      ['frontal', 2, 6],
    )

    expect(caixasForaDoFormato(grade, { faces: 2, linhas: 7, colunas: 5 })).toEqual([
      'F2F',
      'F8A',
      'T8K',
    ])
  })

  it('com uma face só, toda caixa da traseira fica de fora', () => {
    const grade = gradeCom(['frontal', 1, 1], ['traseira', 1, 1])

    expect(caixasForaDoFormato(grade, { faces: 1, linhas: 8, colunas: 8 })).toEqual(['T1I'])
  })

  it('o formato que cobre todas as caixas não deixa nenhuma de fora', () => {
    const grade = gradeCom(['frontal', 5, 5], ['traseira', 5, 5])

    expect(caixasForaDoFormato(grade, { faces: 2, linhas: 5, colunas: 5 })).toEqual([])
  })
})

describe('avisoDasCaixasFora', () => {
  it('fala de uma caixa no singular', () => {
    expect(avisoDasCaixasFora(['F8A'])).toBe(
      'A caixa F8A fica fora deste formato. Mude-a de lugar antes de trocar.',
    )
  })

  it('lista as caixas como no resto do app', () => {
    expect(avisoDasCaixasFora(['F8A', 'T8C'])).toBe(
      'As caixas F8A e T8C ficam fora deste formato. Mude-as de lugar antes de trocar.',
    )
    expect(avisoDasCaixasFora(['F8A', 'F8B', 'T8C'])).toBe(
      'As caixas F8A, F8B e T8C ficam fora deste formato. Mude-as de lugar antes de trocar.',
    )
  })
})

describe('avisoDaTraseira', () => {
  const de8 = { faces: 2, linhas: 8, colunas: 8 }

  it('com outro número de colunas, diz a letra da 1ª coluna da traseira antes e depois', () => {
    expect(avisoDaTraseira(de8, { faces: 2, linhas: 8, colunas: 9 })).toBe(
      'Com 9 colunas, as letras da face traseira mudam: T1I passa a T1J.',
    )
    expect(avisoDaTraseira(de8, { faces: 2, linhas: 5, colunas: 1 })).toBe(
      'Com 1 coluna, as letras da face traseira mudam: T1I passa a T1B.',
    )
  })

  it('com as mesmas colunas, ou sem traseira antes ou depois, não avisa', () => {
    expect(avisoDaTraseira(de8, { faces: 2, linhas: 5, colunas: 8 })).toBeNull()
    expect(avisoDaTraseira(de8, { faces: 1, linhas: 8, colunas: 9 })).toBeNull()
    expect(avisoDaTraseira({ faces: 1, linhas: 8, colunas: 8 }, de8)).toBeNull()
  })
})

describe('o uso do formato', () => {
  it('diz por quem o formato é usado', () => {
    expect(usadoPor({ estantes: estantes(['E-01', 'Sala 1'], ['E-06', 'Sala 2']) })).toBe(
      'Usado por E-01 e E-06',
    )
    expect(usadoPor({ estantes: estantes(['E-01', 'Sala 1']) })).toBe('Usado por E-01')
  })

  it('avisa que mudar as medidas muda as estantes, com a sala de cada uma', () => {
    expect(avisoDoUso({ estantes: estantes(['E-01', 'Sala 1'], ['E-06', 'Sala 2']) })).toBe(
      'Usado pelas estantes E-01 (Sala 1) e E-06 (Sala 2): mudar faces, linhas ou colunas muda essas estantes também.',
    )
    expect(avisoDoUso({ estantes: estantes(['E-01', 'Sala 1']) })).toBe(
      'Usado pela estante E-01 (Sala 1): mudar faces, linhas ou colunas muda essa estante também.',
    )
    expect(avisoDoUso({ estantes: [] })).toBeNull()
  })
})
