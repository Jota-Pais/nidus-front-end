import { describe, expect, it } from 'vitest'
import { ErroDeApi, ErroDeRede } from '@/lib/api'
import { criarQueryClient } from './queryClient'

/** Lê a política configurada, em vez de reescrevê-la no teste */
function politicaDeRetentativa() {
  const opcoes = criarQueryClient().getDefaultOptions().queries
  const retry = opcoes?.retry
  if (typeof retry !== 'function') throw new Error('retry deveria ser função')
  return retry as (tentativas: number, erro: Error) => boolean
}

describe('retry das queries', () => {
  const deveRepetir = politicaDeRetentativa()

  it('não repete erro de contrato: 401, 403 e 409 são resposta, não falha', () => {
    const naoAutenticado = new ErroDeApi(401, {
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'x' },
    })
    const semPermissao = new ErroDeApi(403, { erro: { codigo: 'SEM_PERMISSAO', mensagem: 'x' } })
    const regra = new ErroDeApi(409, { erro: { codigo: 'PRAZO_INVIAVEL', mensagem: 'x' } })

    expect(deveRepetir(0, naoAutenticado)).toBe(false)
    expect(deveRepetir(0, semPermissao)).toBe(false)
    expect(deveRepetir(0, regra)).toBe(false)
  })

  it('repete erro de rede: a API na Render dorme e leva até um minuto para acordar', () => {
    const rede = new ErroDeRede(new TypeError('Failed to fetch'))
    expect(deveRepetir(0, rede)).toBe(true)
    expect(deveRepetir(1, rede)).toBe(true)
  })

  it('desiste depois de duas tentativas, em vez de martelar o servidor', () => {
    expect(deveRepetir(2, new ErroDeRede(new TypeError('Failed to fetch')))).toBe(false)
  })
})

describe('retry das mutações', () => {
  it('não repete escrita: repetir sem saber se a primeira chegou pode prometer o mesmo animal duas vezes', () => {
    expect(criarQueryClient().getDefaultOptions().mutations?.retry).toBe(false)
  })
})
