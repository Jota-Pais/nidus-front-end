import { describe, expect, it } from 'vitest'
import { proximoNumeroDeEstante } from './estante'

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
