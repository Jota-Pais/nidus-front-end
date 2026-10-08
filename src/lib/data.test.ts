import { describe, expect, it } from 'vitest'
import { formatarData, formatarDataCurta, hoje } from './data'

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
