import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { chaves } from '@/app/chaves'
import { useRegistrarEntrega } from './consultas'

vi.mock('@/lib/api', () => ({ api: async () => ({}) }))

describe('registrar a entrega', () => {
  it('recarrega o kanban, a grade e as fichas: a entrega muda a caixa de coluna e tira animal dela', async () => {
    const cliente = new QueryClient()
    const consultas = [chaves.solicitacoes, chaves.quadro('rato'), chaves.grade(1), chaves.caixa(3)]
    for (const chave of consultas) cliente.setQueryData(chave, {})

    const envolver = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
    )
    const { result } = renderHook(() => useRegistrarEntrega(), { wrapper: envolver })

    await result.current.mutateAsync({ idSolicitacao: 7, dtEntrega: '2026-11-06' })

    for (const chave of consultas) {
      expect(cliente.getQueryState(chave)?.isInvalidated).toBe(true)
    }
  })
})
