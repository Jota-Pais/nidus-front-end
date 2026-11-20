import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chaves } from '@/app/chaves'
import { caminhoDasLiberadas, useCaixasLiberadas } from './consultas'

const chamadas = vi.hoisted(() => [] as string[])

vi.mock('@/lib/api', async (original) => ({
  ...(await original<typeof import('@/lib/api')>()),
  api: async (caminho: string) => {
    chamadas.push(caminho)
    return { caixas: [], temMais: false }
  },
}))

beforeEach(() => {
  chamadas.length = 0
})

describe('caminhoDasLiberadas', () => {
  it('manda a espécie e o limite, e nada do que está vazio', () => {
    expect(caminhoDasLiberadas({ idEspecie: 1, idLinhagem: null, busca: '', limite: 50 })).toBe(
      '/api/caixas/liberadas?idEspecie=1&limite=50',
    )
    expect(caminhoDasLiberadas({ idEspecie: 1, idLinhagem: null, busca: '   ', limite: 50 })).toBe(
      '/api/caixas/liberadas?idEspecie=1&limite=50',
    )
  })

  it('manda a linhagem e a busca aparada', () => {
    expect(caminhoDasLiberadas({ idEspecie: 2, idLinhagem: 7, busca: ' F1A ', limite: 100 })).toBe(
      '/api/caixas/liberadas?idEspecie=2&limite=100&idLinhagem=7&busca=F1A',
    )
  })
})

describe('useCaixasLiberadas', () => {
  const embrulho = (cliente: QueryClient) =>
    function Embrulho({ children }: { children: ReactNode }) {
      return <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
    }

  it('sem espécie fica desligada e não chama a API', () => {
    const cliente = new QueryClient()
    const { result } = renderHook(
      () => useCaixasLiberadas({ idEspecie: null, idLinhagem: null, busca: '', limite: 50 }),
      { wrapper: embrulho(cliente) },
    )

    expect(result.current.fetchStatus).toBe('idle')
    expect(chamadas).toEqual([])
  })

  it('com espécie busca, e guarda no cache pela chave das liberadas, com o filtro no fim', async () => {
    const cliente = new QueryClient()
    const filtro = { idEspecie: 3, idLinhagem: null, busca: '', limite: 50 }
    const { result } = renderHook(() => useCaixasLiberadas(filtro), { wrapper: embrulho(cliente) })

    await waitFor(() => expect(result.current.isSuccess).toBe(true))

    expect(chamadas).toEqual(['/api/caixas/liberadas?idEspecie=3&limite=50'])
    expect(cliente.getQueryData([...chaves.liberadas, filtro])).toEqual({ caixas: [], temMais: false })
  })
})
