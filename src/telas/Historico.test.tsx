import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FiltroDoHistorico } from '@/dominio/consultas'
import type { RegistroDoHistorico } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { Historico } from './Historico'

const filtros = vi.hoisted(() => [] as unknown[])

// o histórico e a trilha numeram cada um o seu: o 7 aparece nas duas fontes
const registros: RegistroDoHistorico[] = [
  {
    fonte: 'trilha',
    id: 7,
    dataHora: '2026-11-08T14:30:00.000Z',
    usuario: 'Ana Souza',
    entidade: 'caixa',
    idEntidade: 4,
    onde: 'Caixa F1B',
    acao: 'baixa',
    descricao: 'Em 2026-11-08: baixa de 1 M na F1B (morte).',
    dados: { dtFato: '2026-11-08', motivo: 'morte' },
  },
  {
    fonte: 'historico',
    id: 7,
    dataHora: '2026-11-08T13:00:00.000Z',
    usuario: 'Carlos Mendes',
    entidade: 'pedido',
    idEntidade: 3,
    onde: null,
    acao: 'aprovacao',
    descricao: 'Pedido #3 aprovado.',
    dados: null,
  },
]

vi.mock('@/dominio/consultas', () => ({
  useHistorico: (filtro: unknown) => {
    filtros.push(filtro)
    return consulta(registros)
  },
}))

// a ficha de verdade lê a caixa da API: aqui basta saber qual caixa ela abriu
vi.mock('./FichaDaCaixa', () => ({
  FichaDaCaixa: ({ idCaixa }: { idCaixa: number | null }) =>
    idCaixa === null ? null : <div>ficha da caixa {idCaixa}</div>,
}))

beforeEach(() => {
  filtros.length = 0
})

describe('tela Histórico', { timeout: 20_000 }, () => {
  it('mostra o histórico e a trilha dos animais juntos, mesmo com o número repetido entre os dois', () => {
    const { container } = renderizar(<Historico />, 'gestor')

    // as linhas de dados da tabela; a busca por papel na tabela inteira é lenta no jsdom
    const linhas = [...container.querySelectorAll<HTMLElement>('tbody tr.ant-table-row')]
    expect(linhas).toHaveLength(2)
    expect(within(linhas[0]!).getByText('Em 2026-11-08: baixa de 1 M na F1B (morte).')).toBeTruthy()
    expect(within(linhas[0]!).getByText('Caixa F1B')).toBeTruthy()
    expect(within(linhas[1]!).getByText('Pedido #3')).toBeTruthy()
  })

  it('a linha de uma caixa abre a ficha dela, liberada ou não; a de outra entidade não abre nada', () => {
    const { container } = renderizar(<Historico />, 'gestor')
    const [daCaixa, doPedido] = [
      ...container.querySelectorAll<HTMLElement>('tbody tr.ant-table-row'),
    ]

    expect(screen.queryByText(/^ficha da caixa/)).toBeNull()
    expect(within(doPedido!).queryByRole('button')).toBeNull()
    fireEvent.click(within(daCaixa!).getByText('Caixa F1B'))

    expect(screen.getByText('ficha da caixa 4')).toBeTruthy()
  })

  it('filtra por pedido, e não mais por solicitação', () => {
    renderizar(<Historico />, 'gestor')

    fireEvent.mouseDown(screen.getByRole('combobox'))

    expect(screen.getByTitle('Pedido')).toBeTruthy()
    expect(screen.queryByTitle('Solicitação')).toBeNull()
  })

  it('a busca vai para a consulta', () => {
    renderizar(<Historico />, 'gestor')

    const busca = screen.getByPlaceholderText('Buscar por pessoa ou texto')
    fireEvent.change(busca, { target: { value: 'Ana' } })
    fireEvent.keyDown(busca, { key: 'Enter', code: 'Enter', keyCode: 13 })

    expect(filtros.at(-1)).toEqual({
      entidade: null,
      idEntidade: null,
      busca: 'Ana',
    } satisfies FiltroDoHistorico)
  })
})

describe('Histórico no celular', { timeout: 20_000 }, () => {
  it('cada registro é um cartão com o texto inteiro; o da caixa abre a ficha', () => {
    const voltar = larguraDaTela(390)
    try {
      const { container } = renderizar(<Historico />, 'gestor')

      expect(container.querySelector('table')).toBeNull()
      const lista = screen.getByRole('list', { name: 'Registros do histórico' })
      const [daCaixa, doPedido] = within(lista).getAllByRole('listitem')
      expect(within(daCaixa!).getByText('Em 2026-11-08: baixa de 1 M na F1B (morte).')).toBeTruthy()
      expect(within(daCaixa!).getByText(/· Ana Souza$/)).toBeTruthy()
      expect(within(doPedido!).getByText('Pedido #3')).toBeTruthy()
      expect(within(doPedido!).queryByRole('button')).toBeNull()

      fireEvent.click(within(daCaixa!).getByText('Caixa F1B'))
      expect(screen.getByText('ficha da caixa 4')).toBeTruthy()
    } finally {
      voltar()
    }
  })
})
