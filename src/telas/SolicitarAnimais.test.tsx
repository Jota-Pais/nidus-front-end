import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { Solicitacao } from '@/dominio/tipos'
import { consulta, mutacao, renderizar } from '@/testes/renderizar'
import { SolicitarAnimais } from './SolicitarAnimais'

const solicitacao = (
  id: number,
  status: Solicitacao['status'],
  motivoRecusa: string | null = null,
): Solicitacao => ({
  id,
  protocoloCeua: '23080.000001/2026-54',
  pesquisador: 'Ana',
  email: 'ana@ufsc.br',
  especie: 'rato',
  idLinhagem: 1,
  linhagem: 'Wistar',
  machos: 2,
  femeas: 2,
  qualquer: 0,
  idadeMin: 28,
  idadeMax: 28,
  dataEntrega: '2026-12-01',
  cronograma: 'unica',
  observacoes: null,
  status,
  motivoRecusa,
})

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta({ especies: [], paresGeneticos: [] }),
  useConferirViabilidade: mutacao,
  useSolicitacoes: () =>
    consulta([
      solicitacao(1, 'enviada'),
      solicitacao(2, 'aprovada'),
      solicitacao(3, 'recusada', 'Sem Wistar ate dezembro'),
    ]),
  useCriarSolicitacao: mutacao,
  useRecusarSolicitacao: mutacao,
  useRegistrarEntrega: mutacao,
}))

// A tela inteira do antd no jsdom leva de 4 a 9 s para montar: os 5 s padrão falham à toa
describe('lista de solicitações', { timeout: 20_000 }, () => {
  it('o técnico recusa a enviada e registra a entrega da alocada', () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getAllByRole('button', { name: 'Recusar' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Registrar entrega' })).toHaveLength(1)
    // a equipe se refere ao pedido pelo número
    expect(screen.getAllByRole('columnheader', { name: '#' }).length).toBeGreaterThan(0)
  })

  it('o técnico e o gestor não veem o formulário de pedido', () => {
    renderizar(<SolicitarAnimais />, 'gestor')

    expect(screen.queryByRole('button', { name: 'Enviar solicitação' })).toBeNull()
    expect(screen.getByRole('heading', { name: 'Solicitações', level: 1 })).toBeTruthy()
  })

  it('o pesquisador vê o formulário de pedido', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByRole('button', { name: 'Enviar solicitação' })).toBeTruthy()
  })

  it('o pesquisador vê só as dele, sem o número do pedido, e não decide nem registra entrega', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByRole('heading', { name: 'Minhas solicitações' })).toBeTruthy()
    expect(screen.queryByRole('columnheader', { name: '#' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar entrega' })).toBeNull()
  })

  it('quem pediu vê o motivo da recusa', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByText(/Motivo: Sem Wistar ate dezembro/)).toBeTruthy()
    expect(screen.getByText('Recusada')).toBeTruthy()
  })

  it('a alocada aparece como Aprovada, e não como linguagem da equipe', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByText('Aprovada')).toBeTruthy()
    expect(screen.queryByText('Caixas alocadas')).toBeNull()
  })
})

describe('quem pede', { timeout: 20_000 }, () => {
  it('o nome já vem com o da conta, e a pessoa pode trocar', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador', ' Beatriz Lima ')
    const nome = screen.getByLabelText<HTMLInputElement>('Nome')

    expect(nome.value).toBe('Beatriz Lima')
    // O e-mail é o da conta, embaixo do nome, e não se muda
    expect(screen.getByText('teste@ufsc.br')).toBeTruthy()

    fireEvent.change(nome, { target: { value: 'Beatriz Lima Souza' } })
    expect(nome.value).toBe('Beatriz Lima Souza')
  })

  it('conta sem nome deixa o campo em branco, para a pessoa escrever', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador', '   ')

    expect(screen.getByLabelText<HTMLInputElement>('Nome').value).toBe('')
  })
})
