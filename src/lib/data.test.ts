import { describe, expect, it } from 'vitest'
import {
  ateHoje,
  descreverDias,
  diasAte,
  formatarData,
  formatarDataCurta,
  hoje,
  idadeEmDias,
  maisTarde,
} from './data'

describe('formatarData', () => {
  it('exibe em dd/mm/aaaa', () => {
    expect(formatarData('2026-09-03')).toBe('03/09/2026')
  })

  it('não mostra "Invalid Date" para data ausente ou inválida', () => {
    expect(formatarData(null)).toBe('—')
    expect(formatarData(undefined)).toBe('—')
    expect(formatarData('')).toBe('—')
    expect(formatarData('03/09/2026')).toBe('—')
  })
})

describe('formatarDataCurta', () => {
  it('é o dd/mm do "P:" no card', () => {
    expect(formatarDataCurta('2026-10-28')).toBe('28/10')
    expect(formatarDataCurta(null)).toBe('—')
  })
})

describe('hoje', () => {
  it('sai no formato da API', () => {
    expect(hoje()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('maisTarde e ateHoje: os limites da data de um fato', () => {
  it('o primeiro dia é o mais tarde dos fatos de antes; sem nenhum, não há limite', () => {
    expect(maisTarde('2026-09-01', null, '2026-09-24', undefined)).toBe('2026-09-24')
    expect(maisTarde(null, undefined)).toBeUndefined()
  })

  it('o último dia é hoje, ou o primeiro dos fatos de depois que vier antes de hoje', () => {
    expect(ateHoje('2026-09-28', null, '2026-09-30')).toBe('2026-09-28')
    expect(ateHoje(null)).toBe(hoje())
    expect(ateHoje('2999-01-01')).toBe(hoje())
  })
})

describe('idadeEmDias', () => {
  it('conta os dias desde o nascimento; nascido hoje tem 0', () => {
    expect(idadeEmDias('2026-10-27', '2026-11-06')).toBe(10)
    expect(idadeEmDias('2026-11-06', '2026-11-06')).toBe(0)
  })

  it('descreve 1 dia no singular', () => {
    expect(descreverDias(1)).toBe('1 dia')
    expect(descreverDias(10)).toBe('10 dias')
  })
})

describe('diasAte', () => {
  it('conta os dias que faltam até a data; a de hoje é 0 e a que passou é negativa', () => {
    expect(diasAte('2026-11-14', '2026-11-07')).toBe(7)
    expect(diasAte('2026-11-07', '2026-11-07')).toBe(0)
    expect(diasAte('2026-11-05', '2026-11-07')).toBe(-2)
  })
})
