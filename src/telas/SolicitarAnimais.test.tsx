import { fireEvent, screen, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Solicitacao } from '@/dominio/tipos'
import { consulta, mutacao, renderizar } from '@/testes/renderizar'
import { SolicitarAnimais } from './SolicitarAnimais'

const solicitacao = (
  id: number,
  status: Solicitacao['status'],
  motivoRecusa: string | null = null,
  reservaEmFalta: Solicitacao['reservaEmFalta'] = null,
): Solicitacao => ({
  id,
  dataSolicitacao: '2026-11-0' + id,
  prazoResposta: status === 'enviada' ? '2026-11-15' : null,
  dataAceite:
    status === 'aprovada' ? '2026-11-03' : status === 'em_atendimento' ? '2026-11-05' : null,
  dataRecusa: status === 'recusada' ? '2026-11-04' : null,
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
  dataEntrega: '2026-12-0' + id,
  observacoes: null,
  status,
  motivoRecusa,
  reservaEmFalta,
})

/** pedidos a mais, só no teste que precisa deles */
const extras = vi.hoisted(() => ({ lista: [] as Solicitacao[] }))

const aprovar = vi.hoisted(() => vi.fn())

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta({ especies: [], paresGeneticos: [] }),
  useConferirViabilidade: mutacao,
  useSolicitacoes: () =>
    consulta([
      solicitacao(1, 'enviada'),
      solicitacao(2, 'aprovada'),
      solicitacao(3, 'recusada', 'Sem Wistar ate dezembro'),
      ...extras.lista,
    ]),
  useCriarSolicitacao: mutacao,
  useRecusarSolicitacao: mutacao,
  useAprovarSolicitacao: () => ({ mutate: aprovar, isPending: false }),
  useDesfazerReserva: mutacao,
  useRegistrarEntrega: mutacao,
  // a janela de reservar
  useAtendimento: () => consulta(null),
  useAlocar: mutacao,
}))

/** daqui a tantos dias, no formato da API: o aviso da entrega conta a partir de hoje */
const daqui = (dias: number) => dayjs().add(dias, 'day').format('YYYY-MM-DD')

/** aprovada, ainda sem os animais reservados */
const aprovadaSemReserva = (id: number, dataEntrega = daqui(30)): Solicitacao => ({
  ...solicitacao(id, 'em_atendimento'),
  dataEntrega,
})

/** O jsdom não tem largura: aqui o Grid do antd acha que a tela é larga */
function emTelaLarga(teste: () => void) {
  const original = window.matchMedia
  window.matchMedia = ((query: string) => ({
    ...original(query),
    matches: true,
  })) as typeof window.matchMedia
  try {
    teste()
  } finally {
    window.matchMedia = original
  }
}

/** abre o pedido pela seta no fim da linha, e devolve a janela dele */
async function abrir(nome: string) {
  fireEvent.click(screen.getByRole('button', { name: nome }))
  return screen.findByRole('dialog')
}

// A tela inteira do antd no jsdom leva de 4 a 9 s para montar: os 5 s padrão falham à toa
describe('lista de solicitações', { timeout: 20_000 }, () => {
  it('a linha não tem ação: o pedido aberto mostra tudo, e a equipe o vê pelo número', async () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.queryByRole('button', { name: 'Recusar' })).toBeNull()
    expect(screen.queryByRole('button', { name: 'Registrar entrega' })).toBeNull()

    const janela = await abrir('Abrir o pedido #3')
    expect(within(janela).getByText('Pedido #3')).toBeTruthy()
    expect(within(janela).getByText('ana@ufsc.br')).toBeTruthy()
    expect(within(janela).getByText('23080.000001/2026-54')).toBeTruthy()
    expect(within(janela).getByText('Sem Wistar ate dezembro')).toBeTruthy()
    // recusada não tem o que fazer: só fechar
    expect(within(janela).getByRole('button', { name: 'Fechar' })).toBeTruthy()
    expect(within(janela).queryByRole('button', { name: 'Recusar' })).toBeNull()
  })

  it('clicar em qualquer lugar da linha abre o pedido', async () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    fireEvent.click(screen.getByText('Responder até 15/11/2026'))

    expect(within(await screen.findByRole('dialog')).getByText('Pedido #1')).toBeTruthy()
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

  it('o pesquisador vê só as dele, sem o número do pedido, e não decide nem registra entrega', async () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByRole('heading', { name: 'Minhas solicitações' })).toBeTruthy()
    fireEvent.click(screen.getAllByRole('button', { name: 'Abrir o pedido' })[0]!)
    const janela = await screen.findByRole('dialog')

    expect(within(janela).queryByText(/#\d/)).toBeNull()
    expect(within(janela).queryByText('ana@ufsc.br')).toBeNull()
    expect(within(janela).queryByRole('button', { name: 'Recusar' })).toBeNull()
    expect(within(janela).queryByRole('button', { name: 'Registrar entrega' })).toBeNull()
  })

  it('de cara mostra a data, a situação com a data da decisão, quem pediu e o que pediu', () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getByText('01/11/2026')).toBeTruthy()
    expect(screen.getByText('Responder até 15/11/2026')).toBeTruthy()
    expect(screen.getByText('Aceita em 03/11/2026')).toBeTruthy()
    expect(screen.getByText('Recusada em 04/11/2026')).toBeTruthy()
    expect(screen.getAllByText('2 M · 2 F · Wistar')).toHaveLength(3)
    expect(screen.queryByText('ana@ufsc.br')).toBeNull()
  })

  it('em tela larga, as informações ficam em colunas, sem rolar de lado', () => {
    emTelaLarga(() => {
      renderizar(<SolicitarAnimais />, 'tecnico')

      for (const coluna of ['Pedido em', 'Situação', 'Quem pediu e o quê', 'Entrega']) {
        expect(screen.getByRole('columnheader', { name: coluna })).toBeTruthy()
      }
      expect(screen.getAllByText('Ana')).toHaveLength(3)
    })
  })

  it('quem pediu vê quando chega, se aceitaram e o que pediu, sem o próprio nome', () => {
    emTelaLarga(() => {
      renderizar(<SolicitarAnimais />, 'pesquisador')

      for (const coluna of ['Entrega', 'Situação', 'O que pediu']) {
        expect(screen.getByRole('columnheader', { name: coluna })).toBeTruthy()
      }
      expect(screen.queryByRole('columnheader', { name: 'Quem pediu e o quê' })).toBeNull()
      expect(screen.queryByText('Ana')).toBeNull()
      expect(screen.getByText('Resposta até 15/11/2026')).toBeTruthy()
      expect(screen.getByText('Aceita em 03/11/2026')).toBeTruthy()
      expect(screen.getAllByText('Wistar · 28 dias de idade')).toHaveLength(3)
    })
  })

  it('quem pediu vê o motivo da recusa na própria linha, sem abrir o pedido', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByText('Motivo: Sem Wistar ate dezembro')).toBeTruthy()
    expect(screen.getByText('Recusada')).toBeTruthy()
  })

  it('o filtro separa pendentes, aceitas e recusadas, com a contagem', () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getByText('Pendentes (1)')).toBeTruthy()
    expect(screen.getByText('Aceitas (1)')).toBeTruthy()
    expect(screen.queryByText(/A cumprir/)).toBeNull()
    expect(screen.getByText('Recusadas (1)')).toBeTruthy()

    fireEvent.click(screen.getByRole('radio', { name: /Pendentes/ }))
    expect(screen.getByRole('button', { name: 'Abrir o pedido #1' })).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Abrir o pedido #2' })).toBeNull()
  })

  it('a equipe vê o pedido mais novo primeiro, e o pesquisador a entrega mais próxima', () => {
    const datas = (mes: string) =>
      screen.getAllByText(new RegExp(`^0[1-3]/${mes}/2026$`)).map((celula) => celula.textContent)

    // a equipe vê a data do pedido; quem pediu, a da entrega
    const equipe = renderizar(<SolicitarAnimais />, 'tecnico')
    expect(datas('11')).toEqual(['03/11/2026', '02/11/2026', '01/11/2026'])
    equipe.unmount()

    renderizar(<SolicitarAnimais />, 'pesquisador')
    expect(datas('12')).toEqual(['01/12/2026', '02/12/2026', '03/12/2026'])
  })

  it('o pedido com a reserva em falta mostra quanto falta e pode ter a reserva desfeita', async () => {
    extras.lista = [solicitacao(4, 'aprovada', null, { m: 2, f: 0 })]
    try {
      renderizar(<SolicitarAnimais />, 'tecnico')

      expect(screen.getByText('Reserva em falta: 2 M e 0 F')).toBeTruthy()
      const janela = await abrir('Abrir o pedido #4')
      expect(within(janela).getByRole('button', { name: 'Registrar entrega' })).toBeTruthy()

      // confirma antes, dizendo o que acontece com as reservas e que quem pediu não é avisado
      fireEvent.click(within(janela).getByRole('button', { name: 'Desfazer reserva' }))
      expect(
        await screen.findByText(
          'As reservas são canceladas e o pedido volta para Aguardando animais; depois, é só reservar de novo. Quem pediu não é avisado.',
        ),
      ).toBeTruthy()
      expect(screen.getByText(/faltam até 2 M e 0 F/)).toBeTruthy()
    } finally {
      extras.lista = []
    }
  })

  it('a alocada aparece como Animais reservados, e não como linguagem da equipe', () => {
    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByText('Animais reservados')).toBeTruthy()
    expect(screen.queryByText('Aprovada')).toBeNull()
    expect(screen.queryByText('Caixas alocadas')).toBeNull()
  })
})

describe('aprovar e reservar', { timeout: 20_000 }, () => {
  afterEach(() => {
    extras.lista = []
    aprovar.mockReset()
  })

  it('o pedido que chega se aprova ou recusa; o aprovado, se reserva ou recusa', async () => {
    extras.lista = [aprovadaSemReserva(5)]
    renderizar(<SolicitarAnimais />, 'tecnico')

    const chegou = await abrir('Abrir o pedido #1')
    expect(within(chegou).getByRole('button', { name: 'Aprovar' })).toBeTruthy()
    expect(within(chegou).getByRole('button', { name: 'Recusar' })).toBeTruthy()
    expect(within(chegou).queryByRole('button', { name: 'Reservar animais' })).toBeNull()
    fireEvent.click(within(chegou).getByRole('button', { name: 'Fechar' }))

    const aprovado = await abrir('Abrir o pedido #5')
    expect(within(aprovado).getByRole('button', { name: 'Reservar animais' })).toBeTruthy()
    expect(within(aprovado).getByRole('button', { name: 'Recusar' })).toBeTruthy()
    expect(within(aprovado).queryByRole('button', { name: 'Aprovar' })).toBeNull()
  })

  it('aprova direto do pedido aberto, que mostra o resumo', async () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    const janela = await abrir('Abrir o pedido #1')
    expect(within(janela).getByText('Machos')).toBeTruthy()
    expect(within(janela).getByText('Entrega')).toBeTruthy()
    expect(aprovar).not.toHaveBeenCalled()

    fireEvent.click(within(janela).getByRole('button', { name: 'Aprovar' }))
    expect(aprovar).toHaveBeenCalledWith(1, expect.anything())
  })

  it('recusar abre o motivo por cima do pedido', async () => {
    renderizar(<SolicitarAnimais />, 'tecnico')

    const janela = await abrir('Abrir o pedido #1')
    fireEvent.click(within(janela).getByRole('button', { name: 'Recusar' }))

    expect(await screen.findByText('O motivo aparece para quem pediu.')).toBeTruthy()
    expect(screen.getAllByRole('dialog')).toHaveLength(2)
  })

  it('Reservar animais abre a janela de reserva do pedido', async () => {
    extras.lista = [aprovadaSemReserva(5)]
    renderizar(<SolicitarAnimais />, 'tecnico')

    const janela = await abrir('Abrir o pedido #5')
    fireEvent.click(within(janela).getByRole('button', { name: 'Reservar animais' }))

    expect(await screen.findByText('Reservar animais do pedido #5')).toBeTruthy()
  })

  it('a equipe vê Aguardando animais e quando aprovou; quem pediu, Aceito, em andamento', () => {
    extras.lista = [aprovadaSemReserva(5)]
    const equipe = renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getByText('Aguardando animais')).toBeTruthy()
    expect(screen.getByText('Aprovada em 05/11/2026')).toBeTruthy()
    expect(screen.getByText('Animais reservados')).toBeTruthy()
    expect(screen.queryByText('Aceito, em andamento')).toBeNull()
    // o verde (sucesso e institucional) é só dos animais reservados; o aprovado ainda está em
    // andamento, no tom do que aguarda análise
    expect(screen.getByText('Aguardando animais').className).toContain('etiqueta--informacao')
    expect(screen.getByText('Animais reservados').className).toContain('etiqueta--sucesso')
    equipe.unmount()

    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.getByText('Aceito, em andamento')).toBeTruthy()
    expect(screen.getByText('Aceito em 05/11/2026')).toBeTruthy()
    expect(screen.getByText('Animais reservados')).toBeTruthy()
    expect(screen.queryByText('Aguardando animais')).toBeNull()
  })

  it('a equipe é avisada do aprovado sem reserva com a entrega perto; quem pediu não vê o aviso', () => {
    extras.lista = [
      aprovadaSemReserva(5, daqui(3)),
      aprovadaSemReserva(6, daqui(0)),
      aprovadaSemReserva(7, daqui(-1)),
      aprovadaSemReserva(8, daqui(8)),
    ]
    const equipe = renderizar(<SolicitarAnimais />, 'tecnico')

    expect(screen.getByText('Entrega em 3 dias, sem reserva')).toBeTruthy()
    expect(screen.getByText('Entrega hoje, sem reserva')).toBeTruthy()
    expect(screen.getByText('Entrega vencida, sem reserva')).toBeTruthy()
    expect(screen.getAllByText(/sem reserva$/)).toHaveLength(3)
    equipe.unmount()

    renderizar(<SolicitarAnimais />, 'pesquisador')

    expect(screen.queryByText(/sem reserva$/)).toBeNull()
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
