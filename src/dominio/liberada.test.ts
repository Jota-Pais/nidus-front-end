import { describe, expect, it } from 'vitest'
import {
  casaisAntes,
  descreverPartos,
  descreverQuandoSaiu,
  descreverTipo,
  MOTIVO_DA_LIBERACAO,
  periodoDoCasal,
} from './liberada'
import type { CaixaLiberada, CasalDaCaixaLiberada } from './tipos'

const casal = (campos: Partial<CasalDaCaixaLiberada> = {}): CasalDaCaixaLiberada => ({
  id: 1,
  identificacao: 'AB',
  dtFormacao: '2026-03-01',
  dtEncerramento: '2026-10-20',
  motivoEncerramento: null,
  partos: 5,
  ultimoParto: 5,
  nascidos: 48,
  ...campos,
})

describe('descreverTipo', () => {
  it('casal e estoque, com o símbolo do sexo', () => {
    expect(descreverTipo({ tipo: 'casal', sexo: null })).toBe('Caixa de casal')
    expect(descreverTipo({ tipo: 'estoque', sexo: 'F' })).toBe('Caixa de estoque ♀')
    expect(descreverTipo({ tipo: 'estoque', sexo: 'M' })).toBe('Caixa de estoque ♂')
    expect(descreverTipo({ tipo: 'estoque', sexo: null })).toBe('Caixa de estoque')
  })
})

describe('descreverQuandoSaiu', () => {
  it('data e motivo', () => {
    expect(descreverQuandoSaiu({ dtLiberacao: '2026-11-08', motivoLiberacao: 'mudanca' })).toBe(
      '08/11/2026 · Mudança',
    )
  })

  it('cada motivo tem o seu texto', () => {
    expect(Object.values(MOTIVO_DA_LIBERACAO)).toEqual(['Entrega', 'Baixa', 'Mudança', 'Casal encerrado'])
  })

  it('só um dos dois, ou nenhum', () => {
    expect(descreverQuandoSaiu({ dtLiberacao: '2026-11-08', motivoLiberacao: null })).toBe('08/11/2026')
    expect(descreverQuandoSaiu({ dtLiberacao: null, motivoLiberacao: 'baixa' })).toBe('Baixa')
    expect(descreverQuandoSaiu({ dtLiberacao: null, motivoLiberacao: null })).toBe('—')
  })
})

describe('periodoDoCasal', () => {
  it('formação a encerramento, ou desde a formação', () => {
    expect(periodoDoCasal(casal())).toBe('01/03/2026 a 20/10/2026')
    expect(periodoDoCasal(casal({ dtEncerramento: null }))).toBe('desde 01/03/2026')
  })
})

describe('descreverPartos', () => {
  it('plural e singular', () => {
    expect(descreverPartos(casal())).toBe('5 partos, 48 nascidos')
    expect(descreverPartos(casal({ partos: 1, ultimoParto: 1, nascidos: 1 }))).toBe('1 parto, 1 nascido')
  })

  it('diz até qual parto foi quando o último não é o total', () => {
    expect(descreverPartos(casal({ partos: 3, ultimoParto: 5, nascidos: 30 }))).toBe(
      '3 partos (até o 5º), 30 nascidos',
    )
  })

  it('sem parto nascido: Nenhum parto', () => {
    expect(descreverPartos(casal({ partos: 0, ultimoParto: null, nascidos: 0 }))).toBe('Nenhum parto')
  })

  it('sem o último parto conhecido, não escreve o até', () => {
    expect(descreverPartos(casal({ partos: 2, ultimoParto: null, nascidos: 9 }))).toBe('2 partos, 9 nascidos')
  })
})

describe('casaisAntes', () => {
  const com = (n: number): Pick<CaixaLiberada, 'casais'> => ({
    casais: Array.from({ length: n }, (_, i) => casal({ id: i })),
  })

  it('só aparece quando há mais de um casal', () => {
    expect(casaisAntes(com(0))).toBeNull()
    expect(casaisAntes(com(1))).toBeNull()
    expect(casaisAntes(com(2))).toBe('+ 1 casal antes')
    expect(casaisAntes(com(3))).toBe('+ 2 casais antes')
  })
})
