import { describe, expect, it } from 'vitest'
import { formatarData, idadeEmDias, paraArmazenamento, rotularData, somarDias } from './data'

describe('formatarData — RNF-04', () => {
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

describe('paraArmazenamento', () => {
  it('converte dd/mm/aaaa em aaaa-mm-dd', () => {
    expect(paraArmazenamento('03/09/2026')).toBe('2026-09-03')
  })

  it('devolve null em vez de lançar', () => {
    expect(paraArmazenamento('31/02/2026')).toBeNull()
    expect(paraArmazenamento('qualquer coisa')).toBeNull()
  })
})

describe('idadeEmDias — regra de arredondamento explícita', () => {
  it('conta 0 no próprio dia da base', () => {
    expect(idadeEmDias('2026-09-03', '2026-09-03')).toBe(0)
  })

  it('conta dias inteiros, sem fração', () => {
    expect(idadeEmDias('2026-09-03', '2026-09-24')).toBe(21)
  })

  it('atravessa mês e ano', () => {
    expect(idadeEmDias('2026-12-20', '2027-01-10')).toBe(21)
  })

  it('expõe os 22 dias do CONF-01: nascimento × desmame dão idades diferentes', () => {
    const nascimento = '2026-09-03'
    const desmame = somarDias(nascimento, 22)
    const entrega = '2026-11-01'
    expect(idadeEmDias(nascimento, entrega) - idadeEmDias(desmame, entrega)).toBe(22)
  })

  it('lança em data inválida em vez de devolver NaN', () => {
    expect(() => idadeEmDias('nao-e-data', '2026-09-03')).toThrow()
  })
})

describe('somarDias — cadeia temporal do RN-05', () => {
  it('gestação de 23 dias a partir do acasalamento', () => {
    expect(somarDias('2026-09-03', 23)).toBe('2026-09-26')
  })

  it('viabilidade mínima do RN-06 para 21 dias de idade são 66 dias', () => {
    expect(somarDias('2026-09-03', 23 + 22 + 21)).toBe(somarDias('2026-09-03', 66))
  })
})

describe('rotularData — RF-REP-02', () => {
  it('prefere a data real e a identifica como real', () => {
    expect(rotularData('2026-09-03', '2026-09-01')).toEqual({
      texto: '03/09/2026',
      natureza: 'real',
    })
  })

  it('cai para a prevista e diz que é prevista', () => {
    expect(rotularData(null, '2026-09-01')).toEqual({
      texto: '01/09/2026',
      natureza: 'previsto',
    })
  })

  it('sem nenhuma das duas, não inventa natureza', () => {
    expect(rotularData(null, null)).toEqual({ texto: '—', natureza: null })
  })
})
