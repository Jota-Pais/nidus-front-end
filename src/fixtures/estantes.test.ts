import { describe, expect, it } from 'vitest'
import { MODELOS_ESTANTE, enderecosDaEstante, faixaDeLetras } from './estantes'

describe('MODELOS_ESTANTE — Anexo A.2', () => {
  it('a capacidade declarada é linhas × colunas × 2 faces', () => {
    for (const modelo of MODELOS_ESTANTE) {
      expect(modelo.linhas * modelo.colunas * 2).toBe(modelo.capacidade)
    }
  })

  it('reproduz as quatro capacidades do cliente', () => {
    expect(MODELOS_ESTANTE.map((m) => m.capacidade)).toEqual([128, 50, 112, 40])
  })
})

describe('enderecosDaEstante — RF-INF-02 e RF-INF-03', () => {
  const alescoM1 = MODELOS_ESTANTE[0]!
  const tecniplastM1 = MODELOS_ESTANTE[2]!

  it('gera uma posição por capacidade do modelo', () => {
    for (const modelo of MODELOS_ESTANTE) {
      expect(enderecosDaEstante(1, modelo)).toHaveLength(modelo.capacidade)
    }
  })

  it('não repete endereço dentro da estante', () => {
    for (const modelo of MODELOS_ESTANTE) {
      const codigos = enderecosDaEstante(1, modelo).map((e) => e.codigo)
      expect(new Set(codigos).size).toBe(codigos.length)
    }
  })

  it('continua a sequência de letras na traseira: ALESCO M1 é A–H e I–P', () => {
    expect(faixaDeLetras(alescoM1, 'frontal')).toEqual(['A', 'H'])
    expect(faixaDeLetras(alescoM1, 'traseira')).toEqual(['I', 'P'])
  })

  it('continua a sequência no TECNIPLAST M1: A–G e H–N', () => {
    expect(faixaDeLetras(tecniplastM1, 'frontal')).toEqual(['A', 'G'])
    expect(faixaDeLetras(tecniplastM1, 'traseira')).toEqual(['H', 'N'])
  })

  it('nenhuma letra aparece nas duas faces — a face não é sufixo', () => {
    const enderecos = enderecosDaEstante(1, alescoM1)
    const letra = (codigo: string) => codigo[0]
    const frontais = new Set(
      enderecos.filter((e) => e.face === 'frontal').map((e) => letra(e.codigo)),
    )
    const traseiras = enderecos
      .filter((e) => e.face === 'traseira')
      .map((e) => letra(e.codigo))
    expect(traseiras.some((l) => frontais.has(l))).toBe(false)
  })

  it('CONF-07: trocar o eixo da letra troca o endereço, e só isso', () => {
    const porColuna = enderecosDaEstante(1, tecniplastM1, 'coluna')
    const porLinha = enderecosDaEstante(1, tecniplastM1, 'linha')
    expect(porColuna).toHaveLength(porLinha.length)
    expect(porColuna[0]!.codigo).toBe('A1')
    expect(porLinha[0]!.codigo).toBe('A1')
    // linha 1, coluna 2: com a letra na coluna vira B1; na linha, A2.
    expect(porColuna[1]!.codigo).toBe('B1')
    expect(porLinha[1]!.codigo).toBe('A2')
  })
})
