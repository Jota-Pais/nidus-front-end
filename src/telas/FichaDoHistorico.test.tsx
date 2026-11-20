import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaixaLiberada, Catalogo } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { FichaDoHistorico } from './FichaDoHistorico'

const casal = (campos: Partial<CaixaLiberada['casais'][number]> = {}): CaixaLiberada['casais'][number] => ({
  id: 1,
  identificacao: 'AB',
  dtFormacao: '2026-03-01',
  dtEncerramento: '2026-10-20',
  motivoEncerramento: null,
  partos: 5,
  ultimoParto: 5,
  nascidos: 48,
  ...campos,
})

const casalDeRato: CaixaLiberada = {
  id: 41,
  codigo: 'F1A',
  sala: 'Sala 1',
  numeroVisivel: 'E-01',
  tipo: 'casal',
  linhagem: 'Wistar',
  idLinhagem: 1,
  sexo: null,
  dtLiberacao: '2026-11-08',
  motivoLiberacao: 'casal_encerrado',
  casais: [casal(), casal({ id: 2, identificacao: 'CD' })],
}

const estoqueDeRato: CaixaLiberada = {
  id: 42,
  codigo: 'F2B',
  sala: 'Sala 1',
  numeroVisivel: 'E-01',
  tipo: 'estoque',
  linhagem: 'SHR',
  idLinhagem: 2,
  sexo: 'F',
  dtLiberacao: '2026-10-01',
  motivoLiberacao: 'entrega',
  casais: [],
}

const catalogo: Catalogo = {
  especies: [
    {
      id: 1,
      codigo: 'rato',
      nome: 'Rato',
      linhagens: [
        { id: 1, nome: 'Wistar', ativa: true, cruzamento: 'rodizio' },
        { id: 2, nome: 'SHR', ativa: true, cruzamento: 'mesma_letra' },
      ],
    },
    {
      id: 2,
      codigo: 'camundongo',
      nome: 'Camundongo',
      linhagens: [{ id: 3, nome: 'Swiss', ativa: true, cruzamento: 'rodizio' }],
    },
  ],
}

const api = vi.hoisted(() => ({
  resposta: { caixas: [], temMais: false } as { caixas: unknown[]; temMais: boolean },
  filtros: [] as { idEspecie: number | null; idLinhagem: number | null; busca: string; limite: number }[],
}))

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta(catalogo),
  useCaixasLiberadas: (filtro: (typeof api.filtros)[number]) => {
    api.filtros.push(filtro)
    return { ...consulta(api.resposta), isFetching: false }
  },
}))

// a ficha tem as consultas dela; aqui só interessa qual caixa foi pedida
vi.mock('./FichaDaCaixa', () => ({
  FichaDaCaixa: ({ idCaixa }: { idCaixa: number | null }) =>
    idCaixa === null ? null : <div data-testid="ficha">ficha {idCaixa}</div>,
}))

const ultimoFiltro = () => api.filtros[api.filtros.length - 1]

beforeEach(() => {
  api.resposta = { caixas: [casalDeRato, estoqueDeRato], temMais: false }
  api.filtros = []
})

const abrir = () => renderizar(<FichaDoHistorico aberta aoFechar={() => {}} />)

describe('FichaDoHistorico', { timeout: 20_000 }, () => {
  it('abre com uma aba por espécie e a primeira consultada com o limite de 50', () => {
    abrir()

    expect(screen.getByRole('dialog', { name: 'Histórico das estantes' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Rato' })).toBeTruthy()
    expect(screen.getByRole('tab', { name: 'Camundongo' })).toBeTruthy()
    expect(ultimoFiltro()).toEqual({ idEspecie: 1, idLinhagem: null, busca: '', limite: 50 })
  })

  it('trocar de aba consulta a outra espécie', () => {
    abrir()

    fireEvent.click(screen.getByRole('tab', { name: 'Camundongo' }))

    expect(ultimoFiltro()).toMatchObject({ idEspecie: 2 })
  })

  it('a tabela mostra caixa, tipo, linhagem, casal e quando saiu', () => {
    abrir()

    const linha = screen.getByRole('button', { name: 'F1A' }).closest('tr') as HTMLElement
    expect(within(linha).getByText('Sala 1 · E-01')).toBeTruthy()
    expect(within(linha).getByText('Caixa de casal')).toBeTruthy()
    expect(within(linha).getByText('Wistar')).toBeTruthy()
    expect(within(linha).getByText('AB')).toBeTruthy()
    expect(within(linha).getByText(/01\/03\/2026 a 20\/10\/2026/)).toBeTruthy()
    expect(within(linha).getByText(/5 partos, 48 nascidos/)).toBeTruthy()
    expect(within(linha).getByText(/\+ 1 casal antes/)).toBeTruthy()
    expect(within(linha).getByText('08/11/2026 · Casal encerrado')).toBeTruthy()

    const estoque = screen.getByRole('button', { name: 'F2B' }).closest('tr') as HTMLElement
    expect(within(estoque).getByText('Caixa de estoque ♀')).toBeTruthy()
    expect(within(estoque).getByText('01/10/2026 · Entrega')).toBeTruthy()
  })

  it('clicar na caixa abre a ficha dela, e na linha também', () => {
    abrir()

    expect(screen.queryByTestId('ficha')).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'F1A' }))
    expect(screen.getByTestId('ficha').textContent).toBe('ficha 41')

    fireEvent.click(screen.getByText('Caixa de estoque ♀'))
    expect(screen.getByTestId('ficha').textContent).toBe('ficha 42')
  })

  it('sem caixas e sem filtro, explica que ainda nenhuma saiu da estante', () => {
    api.resposta = { caixas: [], temMais: false }
    abrir()

    expect(screen.getByText(/Nenhuma caixa de rato saiu da estante ainda/)).toBeTruthy()
  })

  it('sem caixas com busca, diz que nenhuma bate com o filtro', () => {
    api.resposta = { caixas: [], temMais: false }
    abrir()

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar' }), { target: { value: 'zzz' } })
    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Buscar' }), { key: 'Enter', keyCode: 13 })

    expect(ultimoFiltro()).toMatchObject({ busca: 'zzz', limite: 50 })
    expect(screen.getByText('Nenhuma caixa liberada com esse filtro.')).toBeTruthy()
  })

  it('só mostra o Mostrar mais quando há mais, e ele pede outras 50', () => {
    abrir()
    expect(screen.queryByRole('button', { name: 'Mostrar mais' })).toBeNull()
  })

  it('Mostrar mais soma 50 ao limite, e trocar o filtro volta aos 50', () => {
    api.resposta = { caixas: [casalDeRato], temMais: true }
    abrir()

    fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais' }))
    expect(ultimoFiltro()).toMatchObject({ limite: 100 })
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais' }))
    expect(ultimoFiltro()).toMatchObject({ limite: 150 })

    fireEvent.change(screen.getByRole('searchbox', { name: 'Buscar' }), { target: { value: 'ab' } })
    fireEvent.keyDown(screen.getByRole('searchbox', { name: 'Buscar' }), { key: 'Enter', keyCode: 13 })

    expect(ultimoFiltro()).toEqual({ idEspecie: 1, idLinhagem: null, busca: 'ab', limite: 50 })
  })

  it('escolher a linhagem filtra e volta o limite a 50', () => {
    api.resposta = { caixas: [casalDeRato], temMais: true }
    abrir()
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar mais' }))

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Linhagem' }))
    fireEvent.click(screen.getByTitle('SHR'))

    expect(ultimoFiltro()).toEqual({ idEspecie: 1, idLinhagem: 2, busca: '', limite: 50 })
  })
})

describe('FichaDoHistorico no celular', { timeout: 20_000 }, () => {
  it('troca a tabela por cartões, e o botão do cartão abre a ficha', () => {
    const voltar = larguraDaTela(390)

    try {
      abrir()

      expect(screen.queryByRole('table')).toBeNull()
      expect(screen.getByText('Caixa de estoque ♀')).toBeTruthy()
      fireEvent.click(screen.getAllByRole('button', { name: 'Abrir a ficha' })[1] as HTMLElement)

      expect(screen.getByTestId('ficha').textContent).toBe('ficha 42')
    } finally {
      voltar()
    }
  })
})
