import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaixaCandidata, ResultadoDaBusca, Solicitacao } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { AtenderPedido } from './AtenderPedido'

const pedido: Solicitacao = {
  id: 12,
  dataSolicitacao: '2026-11-02',
  prazoResposta: '2026-11-16',
  dataAceite: null,
  dataRecusa: null,
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
  observacoes: null,
  status: 'enviada',
  motivoRecusa: null,
  reservaEmFalta: null,
}

const caixa = (dados: Partial<CaixaCandidata>): CaixaCandidata => ({
  idCaixa: 4,
  idParto: 10,
  codigo: 'F1A',
  numeroVisivel: 'E-01',
  estado: 'livres',
  casal: 'AB',
  parto: 2,
  origem: 'previsao',
  nascimento: '2026-11-03',
  idadeNaEntrega: 28,
  disponivel: { m: 2, f: 2 },
  alocar: { m: 0, f: 0 },
  sugerida: false,
  ...dados,
})

const estado = vi.hoisted(() => ({
  busca: null as ResultadoDaBusca | null,
  mutate: vi.fn(),
}))

vi.mock('@/dominio/consultas', () => ({
  useAtendimento: () => consulta(estado.busca),
  useAlocar: () => ({ mutate: estado.mutate, isPending: false }),
}))

const resultado = (candidatas: CaixaCandidata[], falta = { m: 0, f: 0, qualquer: 0 }) => ({
  faixa: { min: 25, max: 31 },
  candidatas,
  deficit: falta,
  casaisAFormar: 1,
  acasalamentoNovo: { dataMinimaDeEntrega: '2027-01-10', viavel: false },
})

const aceitar = () => screen.getByRole('button', { name: 'Aceitar e reservar' })

beforeEach(() => {
  estado.mutate.mockReset()
  // F1A é a sugestão e cobre o pedido; C2B fica de alternativa
  estado.busca = resultado([
    caixa({ sugerida: true, alocar: { m: 2, f: 2 } }),
    caixa({ idCaixa: 5, idParto: 11, codigo: 'C2B', parto: 1, disponivel: { m: 1, f: 3 } }),
  ])
})

describe('atender o pedido', { timeout: 30_000 }, () => {
  it('com a sugestão cobrindo o pedido, aceita e reserva o que está marcado', () => {
    renderizar(<AtenderPedido solicitacao={pedido} aoFechar={() => {}} aoRecusar={() => {}} />)

    expect(screen.getByText(/Pedido coberto/)).toBeTruthy()
    fireEvent.click(aceitar())

    expect(estado.mutate).toHaveBeenCalledWith(
      { idSolicitacao: 12, itens: [{ idParto: 10, machos: 2, femeas: 2 }] },
      expect.anything(),
    )
  })

  it('a equipe ajusta a sugestão e completa com outra caixa', async () => {
    renderizar(<AtenderPedido solicitacao={pedido} aoFechar={() => {}} aoRecusar={() => {}} />)

    fireEvent.change(screen.getByLabelText('Machos a reservar da caixa F1A'), {
      target: { value: '1' },
    })
    await waitFor(() => expect(screen.getByText(/Faltam 1 M/)).toBeTruthy())
    expect(aceitar()).toHaveProperty('disabled', true)

    // marcada, a outra caixa entra com o que falta
    fireEvent.click(screen.getByRole('checkbox', { name: /C2B/ }))
    await waitFor(() => expect(aceitar()).toHaveProperty('disabled', false))
    fireEvent.click(aceitar())

    expect(estado.mutate).toHaveBeenCalledWith(
      {
        idSolicitacao: 12,
        itens: [
          { idParto: 10, machos: 1, femeas: 2 },
          { idParto: 11, machos: 1, femeas: 0 },
        ],
      },
      expect.anything(),
    )
  })

  it('sem animais para o pedido inteiro, não aceita e aponta a recusa', () => {
    estado.busca = resultado([caixa({ sugerida: true, disponivel: { m: 2, f: 1 }, alocar: { m: 2, f: 1 } })], {
      m: 0,
      f: 1,
      qualquer: 0,
    })
    const recusar = vi.fn()
    renderizar(<AtenderPedido solicitacao={pedido} aoFechar={() => {}} aoRecusar={recusar} />)

    expect(aceitar()).toHaveProperty('disabled', true)
    expect(screen.getByText(/Faltam 1 F/)).toBeTruthy()
    expect(screen.getByText(/Recuse com o motivo/)).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }))
    expect(recusar).toHaveBeenCalled()
  })
})
