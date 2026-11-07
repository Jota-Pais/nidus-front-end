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
  estoque: null,
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
          ninhadas: [
            { casal: 'AB', parto: 1, m: 1, f: 0, idadeDias: 10 },
            { casal: 'AB', parto: 2, m: 2, f: 0, idadeDias: 0 },
          ],
        }),
        card(2, {
          identificacao: 'BC',
          partoAtual: 5,
          partoPrevisto: null,
          encerrado: true,
          ninhadas: [],
        }),
        card(3, {
          identificacao: 'CD',
          partoAtual: 2,
          partoPrevisto: null,
          encerrado: true,
          aguardandoDesmame: true,
          ninhadas: [],
        }),
        card(4, null),
        card(5, {
          identificacao: 'DE',
          partoAtual: 5,
          partoPrevisto: null,
          encerrado: false,
          ninhadas: [],
        }),
        // casal novo numa caixa onde o casal encerrado deixou a ninhada do 5º parto
        card(6, {
          identificacao: 'EA',
          partoAtual: 1,
          partoPrevisto: '2026-11-30',
          encerrado: false,
          ninhadas: [{ casal: 'DE', parto: 5, m: 3, f: 4, idadeDias: 10 }],
        }),
      ],
    },
    {
      estado: 'estoque',
      cards: [
        {
          ...card(7, null),
          codigo: 'F2C',
          estoque: { sexo: 'M', total: 6, reservado: 2, nascimentoDe: null, nascimentoAte: null },
        },
      ],
    },
    {
      estado: 'enviado',
      cards: [
        {
          ...card(8, null),
          codigo: 'F2D',
          estoque: { sexo: 'F', total: 0, reservado: 0, nascimentoDe: null, nascimentoAte: null },
        },
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
    expect(screen.getAllByText(/Aguardando desmame/)).toHaveLength(1)
  })

  it('mostra cada ninhada que já nasceu, com quantos animais e a idade de hoje', () => {
    renderizar(<Kanban />)

    const [ninhadas] = screen.getAllByRole('list', { name: 'Animais na caixa' })
    expect(ninhadas?.textContent).toContain('1 M · 0 F10 dias')
    expect(ninhadas?.textContent).toContain('2 M · 0 F0 dias')
  })

  it('casal novo não esconde a ninhada que o casal encerrado deixou na caixa', () => {
    renderizar(<Kanban />)

    const listas = screen.getAllByRole('list', { name: 'Animais na caixa' })
    expect(listas.at(-1)?.textContent).toContain('DE 5º3 M · 4 F10 dias')
  })

  it('caixa livre sem casal diz que não tem casal ativo', () => {
    renderizar(<Kanban />)

    expect(screen.getByText('Sem casal ativo')).toBeTruthy()
  })
})

describe('card da caixa de estoque', () => {
  it('mostra o sexo, quantos animais tem e quantos estão reservados', () => {
    renderizar(<Kanban />)

    expect(screen.getByText('♂ 6')).toBeTruthy()
    expect(screen.getByText('6 machos, 2 reservados')).toBeTruthy()
    expect(screen.getByText('Animais de estoque')).toBeTruthy()
  })

  it('não se arrasta: a coluna dela sai do que está reservado', () => {
    renderizar(<Kanban />)

    const cardDeEstoque = screen.getByText('F2C').closest('.kanban__card')
    const cardDeCasal = screen.getByText('F1A').closest('.kanban__card')

    expect(cardDeEstoque?.getAttribute('draggable')).toBe('false')
    expect(cardDeCasal?.getAttribute('draggable')).toBe('true')
  })

  it('a enviada mostra o endereço entre parênteses: a posição já ficou livre', () => {
    renderizar(<Kanban />)

    expect(screen.getByText('(F2D)')).toBeTruthy()
  })
})
