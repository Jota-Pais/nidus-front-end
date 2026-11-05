import { screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { CardDoKanban, Kanban as Quadro } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { Kanban } from './Kanban'

const card = (idCaixa: number, casal: CardDoKanban['casal']): CardDoKanban => ({
  idCaixa,
  codigo: `F1${String.fromCharCode(64 + idCaixa)}`,
  numeroVisivel: 'E-01',
  linhagem: 'Wistar',
  casal,
})

const quadro: Quadro = {
  colunas: [
    {
      estado: 'livres',
      cards: [
        card(1, {
          identificacao: 'AB',
          partoAtual: 2,
          partoPrevisto: '2026-11-20',
          encerrado: false,
        }),
        card(2, { identificacao: 'BC', partoAtual: 5, partoPrevisto: null, encerrado: true }),
        card(3, { identificacao: 'CD', partoAtual: 2, partoPrevisto: null, encerrado: true }),
        card(4, null),
        card(5, { identificacao: 'DE', partoAtual: 5, partoPrevisto: null, encerrado: false }),
      ],
    },
  ],
}

vi.mock('@/dominio/consultas', () => ({
  useKanban: () => consulta(quadro),
  useFicha: () => ({ data: undefined, isPending: false, error: null }),
}))

vi.mock('./useMudarDeColuna', () => ({ useMudarDeColuna: () => () => {} }))

describe('card do kanban', () => {
  it('mostra o número do parto ao lado da bolinha', () => {
    renderizar(<Kanban />)

    expect(screen.getAllByText('2º').length).toBeGreaterThan(0)
  })

  it('casal ativo no 5º parto avisa o último parto; encerrado, no 5º ou antes, diz casal encerrado', () => {
    renderizar(<Kanban />)

    expect(screen.getAllByText(/Último parto/)).toHaveLength(1)
    expect(screen.getAllByText(/Casal encerrado/)).toHaveLength(2)
  })

  it('caixa livre sem casal diz que não tem casal ativo', () => {
    renderizar(<Kanban />)

    expect(screen.getByText('Sem casal ativo')).toBeTruthy()
  })
})
