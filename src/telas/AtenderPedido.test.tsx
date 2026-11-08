import { fireEvent, screen, waitFor } from '@testing-library/react'
import dayjs from 'dayjs'
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
  // entrega em 01/12, com 25 a 31 dias: os casais se formariam até 01/12 - 23 - 25
  acasalamentoNovo: {
    dataMinimaDeEntrega: '2027-01-10',
    viavel: false,
    formarCasais: { de: '2026-10-04', ate: '2026-10-14' },
    acasalamentos: { min: 1, max: 1 },
  },
})

/** daqui a tantos dias, na API e na tela: a janela de formar os casais conta a partir de hoje */
const daqui = (dias: number) => dayjs().add(dias, 'day').format('YYYY-MM-DD')
const naTela = (dias: number) => dayjs().add(dias, 'day').format('DD/MM/YYYY')

/** a janela sem nenhuma caixa que sirva, com 12 de qualquer sexo: de 2 a 4 acasalamentos */
const semNenhuma = (
  formarCasais: ResultadoDaBusca['acasalamentoNovo']['formarCasais'],
  acasalamentos = { min: 2, max: 4 },
) => ({
  ...resultado([], { m: 0, f: 0, qualquer: 12 }),
  casaisAFormar: 2,
  acasalamentoNovo: { dataMinimaDeEntrega: daqui(44), viavel: true, formarCasais, acasalamentos },
})

const renderizarSemNenhuma = () =>
  renderizar(
    <AtenderPedido
      solicitacao={{ ...pedido, machos: 0, femeas: 0, qualquer: 12 }}
      aoFechar={() => {}}
      aoConcluir={() => {}}
      aoRecusar={() => {}}
    />,
  )

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
        'As caixas não têm animais para o pedido inteiro. Para o que falta, seria necessário cerca de 1 acasalamento até 14/10/2026, e essa data já passou.',
      ),
    ).toBeTruthy()

    fireEvent.click(screen.getByRole('button', { name: 'Recusar' }))
    expect(recusar).toHaveBeenCalled()
  })

  it('sem nenhuma caixa, diz só que não há animais, quantos casais formar e quando', () => {
    estado.busca = semNenhuma({ de: daqui(5), ate: daqui(10) })
    renderizarSemNenhuma()

    expect(screen.getByText('Não há animais para esta entrega com a idade pedida.')).toBeTruthy()
    expect(
      screen.getByText(
        `Para atender este pedido, são necessários cerca de 2 a 4 acasalamentos entre ${naTela(5)} e ${naTela(10)}.`,
      ),
    ).toBeTruthy()
    // e mais nada: nem o resumo do pedido, nem a falta
    expect(screen.queryByText(/de idade · entrega em/)).toBeNull()
    expect(screen.queryByText(/^Ana ·/)).toBeNull()
    expect(screen.queryByText(/Faltam/)).toBeNull()
  })

  it('a janela de um dia só diz o dia; a que já começou vai de hoje até o fim', () => {
    // e as duas contas dando o mesmo, um número só
    estado.busca = semNenhuma({ de: daqui(7), ate: daqui(7) }, { min: 2, max: 2 })
    const umDia = renderizarSemNenhuma()
    expect(
      screen.getByText(
        `Para atender este pedido, são necessários cerca de 2 acasalamentos em ${naTela(7)}.`,
      ),
    ).toBeTruthy()
    umDia.unmount()

    estado.busca = semNenhuma({ de: daqui(-3), ate: daqui(4) })
    renderizarSemNenhuma()
    expect(
      screen.getByText(
        `Para atender este pedido, são necessários cerca de 2 a 4 acasalamentos entre hoje e ${naTela(4)}.`,
      ),
    ).toBeTruthy()
  })

  it('sem idade aceita que chegue desmamada, diz que não há quando formar', () => {
    estado.busca = semNenhuma(null)
    renderizarSemNenhuma()

    expect(
      screen.getByText(
        'Para atender este pedido, não há quando acasalar: na idade pedida, os filhotes ainda não estariam desmamados.',
      ),
    ).toBeTruthy()
  })
})
