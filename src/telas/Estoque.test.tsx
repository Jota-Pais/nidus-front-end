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
      total: { m: 8, f: 5 },
    },
  ],
}

vi.mock('@/dominio/consultas', () => ({ useEstoque: () => consulta(estoque) }))

describe('tela de estoque', () => {
  it('mostra desmamados, nascidos e o total livre, sem parto previsto', () => {
    renderizar(<Estoque />)

    expect(screen.getByText('Wistar')).toBeTruthy()
    expect(screen.getByText('3 M · 3 F')).toBeTruthy()
    expect(screen.getByText('8 M · 5 F')).toBeTruthy()
    expect(screen.queryByText('Partos previstos')).toBeNull()
    expect(screen.queryByText('Próximo parto')).toBeNull()
  })
})
