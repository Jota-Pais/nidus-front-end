import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ErroDeApi, ErroDeRede, api, montarUrl } from './api'

/** monta uma resposta como a API devolveria, sem depender de rede. */
function resposta(status: number, corpo?: unknown): Response {
  const texto = corpo === undefined ? '' : JSON.stringify(corpo)
  return new Response(texto, { status, headers: { 'Content-Type': 'application/json' } })
}

const chamadas: RequestInit[] = []

beforeEach(() => {
  chamadas.length = 0
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function fingirFetch(devolver: Response | (() => never)) {
  vi.stubGlobal(
    'fetch',
    vi.fn((_url: string, init: RequestInit) => {
      chamadas.push(init)
      if (typeof devolver === 'function') devolver()
      return Promise.resolve(devolver)
    }),
  )
}

describe('montarUrl', () => {
  it('não duplica nem engole a barra, seja qual for o formato do .env', () => {
    expect(montarUrl('http://localhost:3000', '/api/sessao')).toBe('http://localhost:3000/api/sessao')
    expect(montarUrl('http://localhost:3000/', '/api/sessao')).toBe(
      'http://localhost:3000/api/sessao',
    )
    expect(montarUrl('http://localhost:3000/', 'api/sessao')).toBe('http://localhost:3000/api/sessao')
  })
})

describe('api — chamada com cookie de sessão', () => {
  it('manda credentials include em toda requisição, senão o cookie de sessão não vai', async () => {
    fingirFetch(resposta(200, { ok: true }))
    await api('/api/sessao')
    expect(chamadas[0]?.credentials).toBe('include')
  })

  it('não manda Content-Type quando não há corpo', async () => {
    fingirFetch(resposta(200, { ok: true }))
    await api('/api/sessao')
    expect(chamadas[0]?.headers).toEqual({})
  })

  it('serializa o corpo e declara JSON no POST', async () => {
    fingirFetch(resposta(200, { ok: true }))
    await api('/api/sessao', { metodo: 'POST', corpo: { email: 'a@ufsc.br', senha: 'x' } })
    expect(chamadas[0]?.method).toBe('POST')
    expect(chamadas[0]?.body).toBe('{"email":"a@ufsc.br","senha":"x"}')
    expect(chamadas[0]?.headers).toEqual({ 'Content-Type': 'application/json' })
  })

  it('devolve undefined no 204 do logout, sem tentar parsear corpo vazio', async () => {
    fingirFetch(new Response(null, { status: 204 }))
    await expect(api('/api/sessao', { metodo: 'DELETE' })).resolves.toBeUndefined()
  })
})

describe('api — erros no envelope da API', () => {
  it('401 vira ErroDeApi com a mensagem única, sem vazar o e-mail', async () => {
    fingirFetch(
      resposta(401, {
        erro: { codigo: 'NAO_AUTENTICADO', mensagem: 'Usuário ana@ufsc.br não existe.' },
      }),
    )
    const erro = await api('/api/sessao').catch((e: unknown) => e)
    expect(erro).toBeInstanceOf(ErroDeApi)
    expect((erro as ErroDeApi).ehNaoAutenticado).toBe(true)
    expect((erro as ErroDeApi).message).not.toContain('ana@ufsc.br')
  })

  it('409 é marcado como regra de negócio e mantém a mensagem do servidor', async () => {
    fingirFetch(
      resposta(409, {
        erro: {
          codigo: 'PRAZO_INVIAVEL',
          mensagem: 'Para 21 dias de idade, a entrega mais próxima é 08/11/2026.',
          requisito: 'RN-06',
        },
      }),
    )
    const erro = (await api('/api/solicitacoes').catch((e: unknown) => e)) as ErroDeApi
    expect(erro.ehRegraDeNegocio).toBe(true)
    expect(erro.codigo).toBe('PRAZO_INVIAVEL')
    expect(erro.requisito).toBe('RN-06')
    expect(erro.message).toContain('08/11/2026')
  })

  it('400 VALIDACAO carrega os campos para o formulário marcar', async () => {
    fingirFetch(
      resposta(400, {
        erro: {
          codigo: 'VALIDACAO',
          mensagem: 'Entrada inválida.',
          campos: { email: 'Informe o e-mail institucional.' },
        },
      }),
    )
    const erro = (await api('/api/sessao').catch((e: unknown) => e)) as ErroDeApi
    expect(erro.campos).toEqual({ email: 'Informe o e-mail institucional.' })
  })

  it('não quebra quando o corpo é HTML de gateway em vez do contrato', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.resolve(new Response('<html>Bad Gateway</html>', { status: 502 }))),
    )
    const erro = (await api('/api/estantes').catch((e: unknown) => e)) as ErroDeApi
    expect(erro).toBeInstanceOf(ErroDeApi)
    expect(erro.codigo).toBeNull()
    expect(erro.message).toMatch(/Tente de novo/)
  })
})

describe('api — falha de rede', () => {
  it('vira ErroDeRede, com aviso sobre a API dormindo na Render', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new TypeError('Failed to fetch'))),
    )
    const erro = (await api('/api/estantes').catch((e: unknown) => e)) as ErroDeRede
    expect(erro).toBeInstanceOf(ErroDeRede)
    expect(erro.message).toMatch(/acordar/)
  })

  it('deixa o AbortError passar, para o cancelamento do TanStack Query funcionar', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new DOMException('cancelado', 'AbortError'))),
    )
    const erro = (await api('/api/estantes').catch((e: unknown) => e)) as Error
    expect(erro).not.toBeInstanceOf(ErroDeRede)
    expect(erro.name).toBe('AbortError')
  })
})
