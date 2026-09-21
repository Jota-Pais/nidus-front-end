import { describe, expect, it } from 'vitest'
import { REGEX_PROJETO_ETICA } from '@/fixtures/catalogo'
import { DIGITOS_DO_PROJETO, estaCompleto, formatarProjeto, somenteDigitos } from './mascara'

describe('máscara do projeto de ética — RF-DEM-06', () => {
  it('monta a forma do Anexo A.4 a partir dos dígitos', () => {
    expect(formatarProjeto('23080001234202611')).toBe('23080.001234/2026-11')
  })

  it('não completa o que ainda não foi digitado', () => {
    expect(formatarProjeto('2308')).toBe('2308')
    expect(formatarProjeto('23080')).toBe('23080')
    expect(formatarProjeto('230800')).toBe('23080.0')
  })

  it('ignora o que o usuário colar de separador ou de letra', () => {
    expect(formatarProjeto('23080.001234/2026-11')).toBe('23080.001234/2026-11')
    expect(formatarProjeto('n 23080 001234 2026 11')).toBe('23080.001234/2026-11')
  })

  it('para no décimo sétimo dígito, mesmo se colarem mais', () => {
    expect(somenteDigitos('2308000123420261199999')).toHaveLength(DIGITOS_DO_PROJETO)
    expect(formatarProjeto('2308000123420261199999')).toBe('23080.001234/2026-11')
  })

  it('a forma completa passa na expressão do Anexo A', () => {
    expect(REGEX_PROJETO_ETICA.test(formatarProjeto('23080001234202611'))).toBe(true)
  })

  /**
   * A máscara é posicional de propósito: o Anexo A deixa em aberto se o prefixo 23080 é fixo
   * Ela formata; quem cobra a instituição é a expressão - e, de verdade, o servidor
   */
  it('formata número de outra instituição sem reclamar, e a expressão é que recusa', () => {
    expect(formatarProjeto('99999001234202611')).toBe('99999.001234/2026-11')
    expect(estaCompleto('99999.001234/2026-11')).toBe(true)
    expect(REGEX_PROJETO_ETICA.test('99999.001234/2026-11')).toBe(false)
  })

  it('só está completo com os dezessete dígitos', () => {
    expect(estaCompleto('23080.001234/2026-1')).toBe(false)
    expect(estaCompleto('23080.001234/2026-11')).toBe(true)
    expect(estaCompleto('')).toBe(false)
    expect(estaCompleto(null)).toBe(false)
  })
})
