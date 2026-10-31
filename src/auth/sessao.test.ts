import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErroDeApi, ErroDeRede } from '@/lib/api'
import { CREDENCIAL_INVALIDA, SESSAO_EXPIRADA } from '@/lib/erros'
import { entrar, repetirSessao } from './sessao'

afterEach(() => {
  vi.unstubAllGlobals()
})

function fingirResposta(status: number, corpo: unknown) {
  vi.stubGlobal(
    'fetch',
    vi.fn(() => Promise.resolve(new Response(JSON.stringify(corpo), { status }))),
  )
}

describe('repetirSessao — falha da API não vira logout', () => {
  it('repete enquanto a Render acorda (502, 503) ou falta rede', () => {
    expect(repetirSessao(0, new ErroDeApi(502, '<html>Bad Gateway</html>'))).toBe(true)
    expect(repetirSessao(3, new ErroDeApi(503, null))).toBe(true)
    expect(repetirSessao(5, new ErroDeRede(new TypeError('Failed to fetch')))).toBe(true)
  })

  it('desiste depois de seis tentativas', () => {
    expect(repetirSessao(6, new ErroDeRede(new TypeError('Failed to fetch')))).toBe(false)
  })

  it('não repete resposta da API: 403 e 409 não melhoram tentando de novo', () => {
    expect(repetirSessao(0, new ErroDeApi(403, null))).toBe(false)
    expect(repetirSessao(0, new ErroDeApi(409, null))).toBe(false)
  })
})

describe('entrar — 401 no login é credencial errada', () => {
  it('troca a mensagem de sessão expirada pela de credencial', async () => {
    fingirResposta(401, {
      erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'E-mail ou senha invalidos.' },
    })
    const erro = (await entrar({ email: 'a@ufsc.br', senha: 'x' }).catch(
      (e: unknown) => e,
    )) as Error
    expect(erro.message).toBe(CREDENCIAL_INVALIDA)
    expect(erro.message).not.toBe(SESSAO_EXPIRADA)
  })

  it('outros erros passam como vieram', async () => {
    fingirResposta(409, { erro: { codigo: 'CONTA_INATIVA', mensagem: 'Conta desativada.' } })
    const erro = await entrar({ email: 'a@ufsc.br', senha: 'x' }).catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroDeApi)
  })
})
