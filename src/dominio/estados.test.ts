import { describe, expect, it } from 'vitest'
import { COLUNAS_DO_QUADRO, ESTADO_CAIXA, GRAU_CERTEZA, ORDEM_GRAU_CERTEZA } from './estados'

describe('codificação visual — RNF-10, nada só por cor', () => {
  const tudo = [...Object.values(ESTADO_CAIXA), ...Object.values(GRAU_CERTEZA)]

  it('todo estado tem segundo canal: marcador e sigla', () => {
    for (const visual of tudo) {
      expect(visual.marcador.length).toBeGreaterThan(0)
      expect(visual.sigla.length).toBeGreaterThan(0)
      expect(visual.rotulo.length).toBeGreaterThan(0)
      expect(visual.descricao.length).toBeGreaterThan(0)
    }
  })

  it('marcadores e siglas são distinguíveis entre si dentro de cada conjunto', () => {
    for (const conjunto of [ESTADO_CAIXA, GRAU_CERTEZA]) {
      const visuais = Object.values(conjunto)
      expect(new Set(visuais.map((v) => v.marcador)).size).toBe(visuais.length)
      expect(new Set(visuais.map((v) => v.sigla)).size).toBe(visuais.length)
    }
  })
})

describe('COLUNAS_DO_QUADRO — RF-CIC-01', () => {
  it('são as cinco colunas, sem sobra nem falta', () => {
    expect(COLUNAS_DO_QUADRO).toHaveLength(5)
    expect(new Set(COLUNAS_DO_QUADRO).size).toBe(5)
    expect(Object.keys(ESTADO_CAIXA).sort()).toEqual([...COLUNAS_DO_QUADRO].sort())
  })

  it('a ordem vai da reprodução à expedição', () => {
    expect(COLUNAS_DO_QUADRO[0]).toBe('em_reproducao')
    expect(COLUNAS_DO_QUADRO.at(-1)).toBe('expedida')
  })
})

describe('ORDEM_GRAU_CERTEZA — RF-MOT-04', () => {
  it('consome do mais certo para o menos certo', () => {
    expect(ORDEM_GRAU_CERTEZA).toEqual(['confirmado', 'previsto', 'projetado'])
  })
})
