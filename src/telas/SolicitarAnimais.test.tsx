import { screen } from '@testing-library/react'
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
  projeto: '23080.000001/2026-01',
  solicitante: 'Ana',
  especie: 'rato',
  idLinhagem: 1,
  linhagem: 'Wistar',
  machos: 2,
  femeas: 2,
  idade: 28,
  dataEntrega: '2026-12-01',
  cronograma: 'unica',
  status,
  motivoRecusa,
})

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta({ especies: [], paresGeneticos: [] }),
  useProjetos: () => consulta([]),
  useEstoque: () => consulta(undefined),
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

describe('lista de solicitações', () => {
  it('o técnico recusa a enviada e registra a entrega da alocada', () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getAllByRole('button', { name: 'Recusar' })).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: 'Registrar entrega' })).toHaveLength(1)
  })

  it('o pesquisador não decide nem registra entrega', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar entrega' })).toBeNull()
  })

  it('quem pediu vê o motivo da recusa', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByText(/Sem Wistar ate dezembro/)).toBeTruthy()
  })
})
