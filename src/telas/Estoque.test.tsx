import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Estoque as DadosDoEstoque } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { Estoque } from './Estoque'

const estoque: DadosDoEstoque = {
  especie: 'rato',
  linhagens: [
    {
      idLinhagem: 1,
      linhagem: 'Wistar',
      confirmado: { m: 3, f: 3 },
      previsto: { m: 5, f: 2 },
      projetado: { m: 4, f: 4 },
      total: { m: 12, f: 9 },
      proximoParto: '2026-11-20',
    },
  ],
}

vi.mock('@/dominio/consultas', () => ({ useEstoque: () => consulta(estoque) }))

describe('tela de estoque', () => {
  it('mostra cada faixa e o total livre da linhagem', () => {
    renderizar(<Estoque />)

    expect(screen.getByText('Wistar')).toBeTruthy()
    expect(screen.getByText('3 M · 3 F')).toBeTruthy()
    expect(screen.getByText('12 M · 9 F')).toBeTruthy()
    expect(screen.getByText('20/11/2026')).toBeTruthy()
  })
})
