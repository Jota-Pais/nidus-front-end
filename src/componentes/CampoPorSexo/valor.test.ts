import { describe, expect, it } from 'vitest'
import { estaCompleto, paraPorSexo, total, VAZIO } from './valor'

describe('ValorPorSexo — zero não é vazio', () => {
  /**
   * A distinção que este teste protege: "nasceram 0 machos" é uma resposta, "ainda
   * não respondi" não é. Se o campo tratasse null como 0, um formulário enviado
   * pela metade viraria ninhada zerada no banco - e o RNF-06 não deixa apagar
   */
  it('zero é resposta completa; nulo não é', () => {
    expect(estaCompleto({ m: 0, f: 0 })).toBe(true)
    expect(estaCompleto({ m: 0, f: null })).toBe(false)
    expect(estaCompleto(VAZIO)).toBe(false)
    expect(estaCompleto(null)).toBe(false)
    expect(estaCompleto(undefined)).toBe(false)
  })

  it('só converte para a forma do contrato quando as duas pontas existem', () => {
    expect(paraPorSexo({ m: 4, f: 6 })).toEqual({ m: 4, f: 6 })
    expect(paraPorSexo({ m: 0, f: 0 })).toEqual({ m: 0, f: 0 })
    expect(paraPorSexo({ m: 4, f: null })).toBeNull()
    expect(paraPorSexo(VAZIO)).toBeNull()
  })

  it('o total é só rótulo — soma, e é tudo o que faz', () => {
    expect(total({ m: 4, f: 6 })).toBe(10)
  })
})
