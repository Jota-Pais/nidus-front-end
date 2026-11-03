import { describe, expect, it } from 'vitest'
import { descreverAnimais, descreverIdade, faixaDeIdade, totalDeAnimais } from './solicitacao'

describe('faixaDeIdade', () => {
  it('na faixa, vai o que foi digitado', () => {
    expect(faixaDeIdade({ modoIdade: 'faixa', idadeMin: 20, idadeMax: 40 })).toEqual({
      idadeMin: 20,
      idadeMax: 40,
    })
  })

  it('na exata, o máximo é o mínimo, mesmo que tenha sobrado um valor da faixa', () => {
    expect(faixaDeIdade({ modoIdade: 'exata', idadeMin: 28, idadeMax: 40 })).toEqual({
      idadeMin: 28,
      idadeMax: 28,
    })
  })
})

describe('descreverAnimais', () => {
  it('mostra só as partes que existem', () => {
    expect(descreverAnimais({ machos: 5, femeas: 0, qualquer: 10 })).toBe('5 M · 10 qualquer sexo')
    expect(descreverAnimais({ machos: 0, femeas: 8, qualquer: 0 })).toBe('8 F')
  })

  it('junta as três quando o pedido mistura', () => {
    expect(descreverAnimais({ machos: 4, femeas: 4, qualquer: 2 })).toBe(
      '4 M · 4 F · 2 qualquer sexo',
    )
  })

  it('mostra travessão quando não há animal, e não uma frase vazia', () => {
    expect(descreverAnimais({ machos: 0, femeas: 0, qualquer: 0 })).toBe('—')
    expect(descreverAnimais({})).toBe('—')
  })
})

describe('totalDeAnimais', () => {
  it('soma os três, com campo vazio valendo zero', () => {
    expect(totalDeAnimais({ machos: 5, femeas: null, qualquer: 10 })).toBe(15)
    expect(totalDeAnimais({})).toBe(0)
  })
})

describe('descreverIdade', () => {
  it('faixa vira "de a"', () => {
    expect(descreverIdade({ idadeMin: 20, idadeMax: 40 })).toBe('20 a 40 dias')
  })

  it('idade exata é um número só', () => {
    expect(descreverIdade({ idadeMin: 28, idadeMax: 28 })).toBe('28 dias')
  })
})
