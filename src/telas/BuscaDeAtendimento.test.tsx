import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ResultadoDaBusca, Solicitacao } from '@/dominio/tipos'
import { consulta, mutacao, renderizar } from '@/testes/renderizar'
import { BuscaDeAtendimento } from './BuscaDeAtendimento'

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

/** uma caixa com 2 M e 1 F: cobre os machos e só uma das fêmeas */
const busca = vi.hoisted(() => ({ deficit: { m: 0, f: 1, qualquer: 0 } }))

const resultado = (): ResultadoDaBusca => ({
  faixa: { min: 25, max: 31 },
  candidatas: [
    {
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
      disponivel: { m: 2, f: 1 },
      alocar: { m: 2, f: 1 },
      sugerida: true,
    },
  ],
  deficit: busca.deficit,
  casaisAFormar: 1,
  acasalamentoNovo: { dataMinimaDeEntrega: '2027-01-10', viavel: false },
})

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta({ especies: [], paresGeneticos: [] }),
  useSolicitacoes: () => consulta([pedido]),
  useAlocar: mutacao,
  buscarAtendimento: async () => resultado(),
}))

async function buscarOPedido() {
  renderizar(
    <QueryClientProvider client={new QueryClient()}>
      <BuscaDeAtendimento />
    </QueryClientProvider>,
  )

  fireEvent.mouseDown(screen.getAllByRole('combobox')[0]!)
  fireEvent.click(await screen.findByText(/^#12 —/))

  return screen.findByRole('button', { name: /Alocar as caixas sugeridas/ })
}

beforeEach(() => {
  busca.deficit = { m: 0, f: 1, qualquer: 0 }
})

// A busca inteira do antd no jsdom, com a escolha no Select, leva até 30 s para montar aqui
describe('alocar da busca de atendimento', { timeout: 60_000 }, () => {
  it('sem animais para o pedido inteiro, não aloca e diz por quê', async () => {
    const alocar = await buscarOPedido()

    expect(alocar).toHaveProperty('disabled', true)
    expect(screen.getByText(/Só dá para alocar o pedido inteiro/)).toBeTruthy()
  })

  it('com o pedido inteiro coberto, aloca', async () => {
    busca.deficit = { m: 0, f: 0, qualquer: 0 }

    const alocar = await buscarOPedido()

    expect(alocar).toHaveProperty('disabled', false)
    expect(screen.queryByText(/Só dá para alocar o pedido inteiro/)).toBeNull()
  })
})
