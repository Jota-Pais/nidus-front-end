import { describe, expect, it } from 'vitest'
import { caixasNaGrade, porQueNaoRemove, proximoNumeroDeEstante } from './estante'
import type { Grade } from './tipos'

const comNumeros = (...numeros: string[]) => numeros.map((numeroVisivel) => ({ numeroVisivel }))

describe('proximoNumeroDeEstante', () => {
  it('começa em E-01 quando não há estante', () => {
    expect(proximoNumeroDeEstante([])).toBe('E-01')
  })

  it('segue o maior número, de qualquer sala e fora de ordem', () => {
    expect(proximoNumeroDeEstante(comNumeros('E-03', 'E-01', 'E-02'))).toBe('E-04')
  })

  it('não preenche o buraco de uma estante removida', () => {
    expect(proximoNumeroDeEstante(comNumeros('E-01', 'E-04'))).toBe('E-05')
  })

  it('lê o número escrito sem hífen ou em minúscula', () => {
    expect(proximoNumeroDeEstante(comNumeros('E7', 'e-09'))).toBe('E-10')
  })

  it('ignora número fora do formato E-NN', () => {
    expect(proximoNumeroDeEstante(comNumeros('Rack A', 'E-02'))).toBe('E-03')
  })

  it('passa de dois dígitos sem cortar', () => {
    expect(proximoNumeroDeEstante(comNumeros('E-99'))).toBe('E-100')
  })
})

describe('remover a estante', () => {
  const posicao = (codigo: string, comCaixa: boolean) => ({
    linha: 1,
    coluna: 1,
    codigo,
    caixa: comCaixa
      ? {
          id: 1,
          fase: null,
          atrasado: false,
          idLinhagem: null,
          linhagem: null,
          casal: null,
          estoque: null,
        }
      : null,
  })

  it('conta as caixas das duas faces', () => {
    const grade: Grade = {
      faces: [
        { face: 'frontal', posicoes: [posicao('F1A', true), posicao('F1B', false)] },
        { face: 'traseira', posicoes: [posicao('T1C', true)] },
      ],
    }

    expect(caixasNaGrade(grade)).toBe(2)
    expect(caixasNaGrade({ faces: [] })).toBe(0)
  })

  it('explica por que a estante com caixa não sai', () => {
    expect(porQueNaoRemove(1)).toBe('Só dá para remover a estante vazia. Esta tem 1 caixa.')
    expect(porQueNaoRemove(12)).toBe('Só dá para remover a estante vazia. Esta tem 12 caixas.')
  })
})
