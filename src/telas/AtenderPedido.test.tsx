import { fireEvent, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { CaixaCandidata, ResultadoDaBusca, Solicitacao } from '@/dominio/tipos'
import { consulta, renderizar } from '@/testes/renderizar'
import { AtenderPedido } from './AtenderPedido'

const pedido: Solicitacao = {
  id: 12,
  dataSolicitacao: '2026-11-02',
  prazoResposta: null,
  dataAceite: '2026-11-05',
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
  status: 'em_atendimento',
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
  // entrega em 01/12 com 28 dias: o casal teria de ser formado até 01/12 - 23 - 28 dias
  acasalamentoNovo: { dataMinimaDeEntrega: '2027-01-10', acasalarAte: '2026-10-11', viavel: false },
})

const reservar = () => screen.getByRole('button', { name: 'Reservar' })

beforeEach(() => {
  estado.mutate.mockReset()
  // F1A é a sugestão e cobre o pedido; C2B fica de alternativa
  estado.busca = resultado([
    caixa({ sugerida: true, alocar: { m: 2, f: 2 } }),
    caixa({ idCaixa: 5, idParto: 11, codigo: 'C2B', parto: 1, disponivel: { m: 1, f: 3 } }),
  ])
})

describe('reservar os animais do pedido aprovado', { timeout: 30_000 }, () => {
  it('com a sugestão cobrindo o pedido, reserva o que está marcado', () => {
    renderizar(
      <AtenderPedido
        solicitacao={pedido}
        aoFechar={() => {}}
        aoConcluir={() => {}}
        aoRecusar={() => {}}
      />,
    )

    expect(screen.getByText('Pedido coberto: 2 machos e 2 fêmeas.')).toBeTruthy()
    fireEvent.click(reservar())

    expect(estado.mutate).toHaveBeenCalledWith(
      { idSolicitacao: 12, itens: [{ idParto: 10, machos: 2, femeas: 2 }] },
      expect.anything(),
    )
  })

  it('a janela é a de reservar os animais, e diz quando ficaram reservados', async () => {
    estado.mutate.mockImplementation((_dados: unknown, opcoes: { onSuccess: () => void }) =>
      opcoes.onSuccess(),
    )
    const fechar = vi.fn()
    const concluir = vi.fn()
    renderizar(
      <AtenderPedido
        solicitacao={pedido}
        aoFechar={fechar}
        aoConcluir={concluir}
        aoRecusar={() => {}}
      />,
    )

    expect(screen.getByText('Reservar animais do pedido #12')).toBeTruthy()
    expect(screen.queryByText(/Atender/)).toBeNull()
    fireEvent.click(reservar())

    expect(await screen.findByText('Animais reservados para o pedido #12.')).toBeTruthy()
    // reservado, fecha também o pedido aberto embaixo
    expect(concluir).toHaveBeenCalled()
    expect(fechar).not.toHaveBeenCalled()
  })

  it('a equipe ajusta a sugestão e completa com outra caixa', async () => {
    renderizar(
      <AtenderPedido
        solicitacao={pedido}
        aoFechar={() => {}}
        aoConcluir={() => {}}
        aoRecusar={() => {}}
      />,
    )

    fireEvent.change(screen.getByLabelText('Machos a reservar da caixa F1A'), {
      target: { value: '1' },
    })
    await waitFor(() => expect(screen.getByText('Falta 1 macho.')).toBeTruthy())
    expect(reservar()).toHaveProperty('disabled', true)

    // marcada, a outra caixa entra com o que falta
    fireEvent.click(screen.getByRole('checkbox', { name: /C2B/ }))
    await waitFor(() => expect(reservar()).toHaveProperty('disabled', false))
    fireEvent.click(reservar())

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

  it('sem animais para o pedido inteiro, não aceita e diz o que seria preciso para a entrega', () => {
    estado.busca = resultado(
      [caixa({ sugerida: true, disponivel: { m: 2, f: 1 }, alocar: { m: 2, f: 1 } })],
      {
        m: 0,
        f: 1,
        qualquer: 0,
      },
    )
    const recusar = vi.fn()
    renderizar(
      <AtenderPedido
        solicitacao={pedido}
        aoFechar={() => {}}
        aoConcluir={() => {}}
        aoRecusar={recusar}
      />,
    )

    expect(reservar()).toHaveProperty('disabled', true)
    expect(screen.getByText('Falta 1 fêmea.')).toBeTruthy()
    expect(
      screen.getByText(
        'As caixas não têm animais para o pedido inteiro. Para o que falta, seria necessário formar cerca de 1 casal até 11/10/2026, e essa data já passou.',
      ),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }))
    expect(recusar).toHaveBeenCalled()
  })

  it('sem nenhuma caixa, diz só que não há animais e quantos casais formar, até quando', () => {
    estado.busca = {
      ...resultado([], { m: 0, f: 0, qualquer: 12 }),
      casaisAFormar: 2,
      acasalamentoNovo: {
        dataMinimaDeEntrega: '2026-11-20',
        acasalarAte: '2026-11-17',
        viavel: true,
      },
    }
    renderizar(
      <AtenderPedido
        solicitacao={{ ...pedido, machos: 0, femeas: 0, qualquer: 12 }}
        aoFechar={() => {}}
        aoConcluir={() => {}}
        aoRecusar={() => {}}
      />,
    )

    expect(screen.getByText('Não há animais para esta entrega com a idade pedida.')).toBeTruthy()
    expect(
      screen.getByText('Para isso, é necessário formar cerca de 2 casais até 17/11/2026.'),
    ).toBeTruthy()
    // e mais nada: nem o resumo do pedido, nem a falta
    expect(screen.queryByText(/de idade · entrega em/)).toBeNull()
    expect(screen.queryByText(/^Ana ·/)).toBeNull()
    expect(screen.queryByText(/Faltam/)).toBeNull()
  })
})
