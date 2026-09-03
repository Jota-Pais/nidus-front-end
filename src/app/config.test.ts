import { describe, expect, it } from 'vitest'
import { validarAmbiente } from './config'

describe('validarAmbiente', () => {
  it('aceita o .env.example', () => {
    expect(validarAmbiente({ VITE_API_URL: 'http://localhost:3000', VITE_AMBIENTE: 'local' })).toEqual(
      { apiUrl: 'http://localhost:3000', ambiente: 'local' },
    )
  })

  it('assume local quando o ambiente não vem declarado', () => {
    expect(validarAmbiente({ VITE_API_URL: 'https://api.exemplo.com' }).ambiente).toBe('local')
  })

  it('recusa API_URL ausente, com mensagem que aponta o .env.example', () => {
    expect(() => validarAmbiente({})).toThrow(/\.env\.example/)
    expect(() => validarAmbiente({})).toThrow(/VITE_API_URL/)
  })

  it('recusa "localhost:3000": new URL() aceita, mas não é http nem https', () => {
    expect(() => validarAmbiente({ VITE_API_URL: 'localhost:3000' })).toThrow(/https?:/)
  })

  it('aceita as duas formas que a equipe realmente usa', () => {
    expect(validarAmbiente({ VITE_API_URL: 'http://localhost:3000' }).apiUrl).toBe(
      'http://localhost:3000',
    )
    expect(
      validarAmbiente({ VITE_API_URL: 'https://nidus-api.onrender.com', VITE_AMBIENTE: 'producao' })
        .apiUrl,
    ).toBe('https://nidus-api.onrender.com')
  })

  it('recusa rótulo de ambiente fora dos três valores', () => {
    expect(() =>
      validarAmbiente({ VITE_API_URL: 'https://api.exemplo.com', VITE_AMBIENTE: 'prod' }),
    ).toThrow(/VITE_AMBIENTE/)
  })
})
