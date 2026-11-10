import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { LugarDaRetirada, Pedido } from '@/dominio/tipos'
import { botao, erroDaApi, selecao, talvezBotao } from '@/testes/ficha'
import { consulta, mutacao, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { Pedidos } from './Pedidos'

const pedido = (
  id: number,
  status: Pedido['status'],
  motivoRecusa: string | null = null,
  reservaEmFalta: Pedido['reservaEmFalta'] = null,
): Pedido => ({
  id,
  dataPedido: '2026-11-0' + id,
  prazoResposta: status === 'enviado' ? '2026-11-15' : null,
  dataAceite: status === 'reservado' ? '2026-11-03' : status === 'aprovado' ? '2026-11-05' : null,
  dataRecusa: status === 'recusado' ? '2026-11-04' : null,
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
  dataEntregue: status === 'entregue' ? '2026-11-07' : null,
  observacoes: null,
  status,
  motivoRecusa,
  reservaEmFalta,
})

/** pedidos a mais, só no teste que precisa deles */
const extras = vi.hoisted(() => ({ lista: [] as Pedido[] }))

/** As ações que o teste acompanha. A entrega, a recusa e o desfazer respondem como o teste mandar */
const acoes = vi.hoisted(() => ({
  aprovar: vi.fn(),
  entregar: vi.fn(),
  recusar: vi.fn(),
  desfazer: vi.fn(),
  retirada: null as unknown,
}))

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta({ especies: [], paresGeneticos: [] }),
  useConferirViabilidade: mutacao,
  usePedidos: () =>
    consulta([
      pedido(1, 'enviado'),
      pedido(2, 'reservado'),
      pedido(3, 'recusado', 'Sem Wistar ate dezembro'),
      ...extras.lista,
    ]),
  useCriarPedido: mutacao,
  useAprovarPedido: () => ({ mutate: acoes.aprovar, isPending: false }),
  useRecusarPedido: () => ({ mutate: acoes.recusar, isPending: false }),
  useDesfazerReserva: () => ({ mutate: acoes.desfazer, isPending: false }),
  useRegistrarEntrega: () => ({ mutate: acoes.entregar, isPending: false }),
  useRetirada: () => acoes.retirada,
  // a janela de reservar
  useAtendimento: () => consulta(null),
  useAlocar: mutacao,
}))

/** a resposta (ou a recusa) da próxima chamada da ação, como a mutação a entrega */
function responder(
  acao: ReturnType<typeof vi.fn>,
  resposta: { sucesso: unknown } | { erro: Error },
) {
  acao.mockImplementation(
    (_dados: unknown, opcoes: { onSuccess: (r: unknown) => void; onError: (e: Error) => void }) =>
      'erro' in resposta ? opcoes.onError(resposta.erro) : opcoes.onSuccess(resposta.sucesso),
  )
}

const retiradaDoPedido: LugarDaRetirada[] = [
  {
    tipo: 'estoque',
    codigo: 'F2A',
    numeroVisivel: 'E-01',
    sexo: 'M',
    dtNascimento: '2026-10-01',
    qtd: 2,
    partos: [{ ordem: 2, casal: 'AB' }],
  },
  {
    tipo: 'casal',
    codigo: 'F1C',
    numeroVisivel: 'E-01',
    sexo: 'F',
    dtNascimento: '2026-10-03',
    qtd: 2,
    partos: [{ ordem: 1, casal: 'CD' }],
  },
]

beforeEach(() => {
  acoes.retirada = { data: retiradaDoPedido, isPending: false, isError: false, error: null }
})

afterEach(() => {
  extras.lista = []
  for (const acao of [acoes.aprovar, acoes.entregar, acoes.recusar, acoes.desfazer])
    acao.mockReset()
})

/** daqui a tantos dias, no formato da API: o aviso da entrega conta a partir de hoje */
const daqui = (dias: number) => dayjs().add(dias, 'day').format('YYYY-MM-DD')

/** aprovado, ainda sem os animais reservados */
const aprovadoSemReserva = (id: number, dataEntrega = daqui(30)): Pedido => ({
  ...pedido(id, 'aprovado'),
  dataEntrega,
})

// O getByRole calcula o nome acessível de cada elemento, e a tela com o formulário e a lista tem
// milhares: as consultas abaixo acham pelo atributo e pelo texto, que é o que o teste confere

/** as setas no fim das linhas com o nome dado ("Abrir o pedido #3", ou "Abrir o pedido") */
const setas = (nome: string) => [
  ...document.querySelectorAll<HTMLButtonElement>(`button[aria-label="${nome}"]`),
]

/** a janela de cima, quando abre */
const janelaAberta = () =>
  waitFor(() => {
    const janelas = document.querySelectorAll<HTMLElement>('[role="dialog"]')
    const ultima = janelas[janelas.length - 1]
    if (!ultima) throw new Error('Nenhuma janela aberta')
    return ultima
  })

/** abre o pedido pela seta no fim da linha, e devolve a janela dele */
async function abrir(nome: string) {
  const [seta] = setas(nome)
  if (!seta) throw new Error(`Sem a seta ${nome}`)
  fireEvent.click(seta)
  return janelaAberta()
}

/** o título da tela ou da seção */
const titulo = (texto: string, nivel: 1 | 2 | 3 = 1) =>
  screen.queryByText(texto, { selector: `h${nivel}` })

/**
 * A validação do antd é assíncrona e o erro entra no campo com animação: com os outros arquivos
 * rodando junto, o jsdom passa do 1 s padrão do findBy
 */
const DEMORA = { timeout: 10_000 }

/** a janela que abriu por cima do pedido, pelo título */
const janelaDe = async (titulo: string) =>
  (await screen.findByText(titulo)).closest<HTMLElement>('.ant-modal') ?? document.body

// A tela inteira do antd no jsdom leva de 4 a 9 s para montar, e bem mais com a suíte toda
// rodando junto: os 5 s padrão falham à toa
describe('lista de pedidos', { timeout: 40_000 }, () => {
  it('a linha não tem ação: o pedido aberto mostra tudo, e a equipe o vê pelo número', async () => {
    renderizar(<Pedidos />, 'tecnico')

    expect(talvezBotao('Recusar')).toBeNull()
    expect(talvezBotao('Registrar entrega')).toBeNull()

    const janela = await abrir('Abrir o pedido #3')
    expect(within(janela).getByText('Pedido #3')).toBeTruthy()
    expect(within(janela).getByText('ana@ufsc.br')).toBeTruthy()
    expect(within(janela).getByText('23080.000001/2026-54')).toBeTruthy()
    expect(within(janela).getByText('Sem Wistar ate dezembro')).toBeTruthy()
    expect(within(janela).getByText('Recusado em 04/11/2026')).toBeTruthy()
    // recusado não tem o que fazer: só fechar
    expect(botao('Fechar', janela)).toBeTruthy()
    expect(talvezBotao('Recusar', janela)).toBeNull()
  })

  it('clicar em qualquer lugar da linha abre o pedido', async () => {
    renderizar(<Pedidos />, 'tecnico')

    fireEvent.click(screen.getByText('Entrega em 01/12/2026'))

    expect(within(await janelaAberta()).getByText('Pedido #1')).toBeTruthy()
  })

  it('o técnico e o gestor veem os Pedidos, sem o formulário de pedir', () => {
    renderizar(<Pedidos />, 'gestor')

    expect(talvezBotao('Enviar pedido')).toBeNull()
    expect(titulo('Pedidos')).toBeTruthy()
  })

  it('o pesquisador vê o formulário de pedido', () => {
    renderizar(<Pedidos />, 'pesquisador')

    expect(titulo('Pedir animais')).toBeTruthy()
    expect(botao('Enviar pedido')).toBeTruthy()
  })

  it('o pesquisador vê só os dele, sem o número do pedido, e não decide nem registra entrega', async () => {
    renderizar(<Pedidos />, 'pesquisador')

    expect(screen.getByText('Meus pedidos')).toBeTruthy()
    const janela = await abrir('Abrir o pedido')

    expect(within(janela).queryByText(/#\d/)).toBeNull()
    expect(within(janela).queryByText('ana@ufsc.br')).toBeNull()
    expect(talvezBotao('Recusar', janela)).toBeNull()
    expect(talvezBotao('Registrar entrega', janela)).toBeNull()
  })

  it('de cara mostra a data, a situação com a entrega, quem pediu e o que pediu', () => {
    renderizar(<Pedidos />, 'tecnico')

    expect(screen.getByText('01/11/2026')).toBeTruthy()
    for (const entrega of ['01/12/2026', '02/12/2026', '03/12/2026']) {
      expect(screen.getByText(`Entrega em ${entrega}`)).toBeTruthy()
    }
    // o prazo para responder e a data da decisão ficam no pedido aberto
    expect(screen.queryByText(/Responder até/)).toBeNull()
    expect(screen.queryByText('Aprovado em 03/11/2026')).toBeNull()
    expect(screen.queryByText('Recusado em 04/11/2026')).toBeNull()
    expect(screen.getAllByText('4 ratos Wistar')).toHaveLength(3)
    expect(screen.getAllByText('2 machos · 2 fêmeas')).toHaveLength(3)
    expect(screen.queryByText('ana@ufsc.br')).toBeNull()
  })

  it('o entregue mostra, no lugar da entrega pedida, o dia em que foi entregue', async () => {
    extras.lista = [pedido(6, 'entregue')]
    renderizar(<Pedidos />, 'tecnico')

    expect(screen.getByText('Entregue em 07/11/2026')).toBeTruthy()
    expect(screen.queryByText('Entrega em 06/12/2026')).toBeNull()

    const janela = await abrir('Abrir o pedido #6')
    expect(within(janela).getByText('Entregue em 07/11/2026')).toBeTruthy()
    // entregue é final: só fechar
    expect(talvezBotao('Recusar', janela)).toBeNull()
    expect(talvezBotao('Desfazer reserva', janela)).toBeNull()
  })

  it('no computador, as informações ficam em colunas, sem rolar de lado', () => {
    renderizar(<Pedidos />, 'tecnico')

    for (const coluna of ['Pedido em', 'Situação', 'Quem pediu', 'Pedido']) {
      expect(screen.getByRole('columnheader', { name: coluna })).toBeTruthy()
    }
    // a entrega vem embaixo da situação, e não numa coluna a mais
    expect(screen.queryByRole('columnheader', { name: 'Entrega' })).toBeNull()
    expect(screen.getByText('Entrega em 01/12/2026')).toBeTruthy()
    expect(screen.getAllByText('Ana')).toHaveLength(3)
    expect(screen.getAllByText('4 ratos Wistar')).toHaveLength(3)
    expect(screen.getAllByText('2 machos · 2 fêmeas')).toHaveLength(3)
  })

  it('quem pediu vê quando chega, se aceitaram e o que pediu, sem o próprio nome', () => {
    renderizar(<Pedidos />, 'pesquisador')

    for (const coluna of ['Entrega', 'Situação', 'Pedido']) {
      expect(screen.getByRole('columnheader', { name: coluna })).toBeTruthy()
    }
    expect(screen.queryByRole('columnheader', { name: 'Quem pediu' })).toBeNull()
    expect(screen.queryByText('Ana')).toBeNull()
    expect(screen.getByText('Resposta até 15/11/2026')).toBeTruthy()
    expect(screen.getByText('Aprovado em 03/11/2026')).toBeTruthy()
    expect(screen.getAllByText('4 ratos Wistar')).toHaveLength(3)
    expect(screen.getAllByText('2 machos · 2 fêmeas · 28 dias de idade')).toHaveLength(3)
  })

  it('quem pediu vê o motivo da recusa na própria linha, sem abrir o pedido', () => {
    renderizar(<Pedidos />, 'pesquisador')

    expect(screen.getByText('Motivo: Sem Wistar ate dezembro')).toBeTruthy()
    expect(screen.getByText('Recusado')).toBeTruthy()
  })

  it('o filtro separa pendentes, aceitos, entregues e recusados, com a contagem', () => {
    extras.lista = [pedido(6, 'entregue')]
    renderizar(<Pedidos />, 'tecnico')

    expect(screen.getByText('Todos (4)')).toBeTruthy()
    expect(screen.getByText('Aguardando análise (1)')).toBeTruthy()
    expect(screen.getByText('Aprovados (1)')).toBeTruthy()
    expect(screen.getByText('Entregues (1)')).toBeTruthy()
    expect(screen.getByText('Recusados (1)')).toBeTruthy()

    fireEvent.click(screen.getByText('Aguardando análise (1)'))
    expect(setas('Abrir o pedido #1')).toHaveLength(1)
    expect(setas('Abrir o pedido #2')).toHaveLength(0)

    fireEvent.click(screen.getByText('Entregues (1)'))
    expect(setas('Abrir o pedido #6')).toHaveLength(1)
    expect(setas('Abrir o pedido #1')).toHaveLength(0)
  })

  it('a equipe vê o pedido mais novo primeiro, e o pesquisador a entrega mais próxima', () => {
    const datas = (mes: string) =>
      screen.getAllByText(new RegExp(`^0[1-3]/${mes}/2026$`)).map((celula) => celula.textContent)

    // a equipe vê a data do pedido; quem pediu, a da entrega
    const equipe = renderizar(<Pedidos />, 'tecnico')
    expect(datas('11')).toEqual(['03/11/2026', '02/11/2026', '01/11/2026'])
    equipe.unmount()

    renderizar(<Pedidos />, 'pesquisador')
    expect(datas('12')).toEqual(['01/12/2026', '02/12/2026', '03/12/2026'])
  })

  it('quem pediu vê o aprovado e o reservado como o mesmo aceito: a reserva é trabalho da equipe', () => {
    extras.lista = [aprovadoSemReserva(5)]
    renderizar(<Pedidos />, 'pesquisador')

    expect(screen.getAllByText('Aprovado, em andamento')).toHaveLength(2)
    expect(screen.getByText('Aprovado em 05/11/2026')).toBeTruthy()
    expect(screen.queryByText('Animais reservados')).toBeNull()
    expect(screen.queryByText('Aguardando animais')).toBeNull()
  })
})

describe('as ações da equipe em cada situação', { timeout: 40_000 }, () => {
  it('o pedido que chega se aprova ou recusa', async () => {
    renderizar(<Pedidos />, 'tecnico')

    const chegou = await abrir('Abrir o pedido #1')
    // o prazo para responder, que não vai na lista
    expect(within(chegou).getByText('Responder até 15/11/2026')).toBeTruthy()
    expect(botao('Aprovar', chegou)).toBeTruthy()
    expect(botao('Recusar', chegou)).toBeTruthy()
    expect(talvezBotao('Reservar animais', chegou)).toBeNull()
  })

  it('aprova direto do pedido aberto, que mostra o resumo', async () => {
    renderizar(<Pedidos />, 'tecnico')

    const janela = await abrir('Abrir o pedido #1')
    expect(within(janela).getByText('Machos')).toBeTruthy()
    expect(within(janela).getByText('Entrega')).toBeTruthy()
    expect(acoes.aprovar).not.toHaveBeenCalled()

    fireEvent.click(botao('Aprovar', janela))
    expect(acoes.aprovar).toHaveBeenCalledWith(1, expect.anything())
  })

  it('o aprovado se reserva ou recusa', async () => {
    extras.lista = [aprovadoSemReserva(5)]
    renderizar(<Pedidos />, 'tecnico')

    const aprovado = await abrir('Abrir o pedido #5')
    expect(within(aprovado).getByText('Aprovado em 05/11/2026')).toBeTruthy()
    expect(botao('Reservar animais', aprovado)).toBeTruthy()
    expect(botao('Recusar', aprovado)).toBeTruthy()
    expect(talvezBotao('Aprovar', aprovado)).toBeNull()
    expect(talvezBotao('Desfazer reserva', aprovado)).toBeNull()
  })

  it('Reservar animais abre a janela de reserva do pedido', async () => {
    extras.lista = [aprovadoSemReserva(5)]
    renderizar(<Pedidos />, 'tecnico')

    const janela = await abrir('Abrir o pedido #5')
    fireEvent.click(botao('Reservar animais', janela))

    expect(await screen.findByText('Reservar animais do pedido #5')).toBeTruthy()
  })

  it('o reservado se entrega, se recusa ou tem a reserva desfeita, mesmo sem falta', async () => {
    renderizar(<Pedidos />, 'tecnico')

    const reservado = await abrir('Abrir o pedido #2')
    expect(botao('Registrar entrega', reservado)).toBeTruthy()
    expect(botao('Recusar', reservado)).toBeTruthy()
    expect(botao('Desfazer reserva', reservado)).toBeTruthy()
    expect(talvezBotao('Completar reserva', reservado)).toBeNull()
  })

  it('o reservado em falta mostra quanto falta e se completa, e não se entrega assim', async () => {
    extras.lista = [pedido(4, 'reservado', null, { m: 1, f: 0, qualquer: 2 })]
    renderizar(<Pedidos />, 'tecnico')

    expect(screen.getByText('Reserva em falta: 1 macho e 2 de qualquer sexo')).toBeTruthy()
    const janela = await abrir('Abrir o pedido #4')
    expect(within(janela).getByText('Reserva em falta: 1 macho e 2 de qualquer sexo')).toBeTruthy()
    expect(talvezBotao('Registrar entrega', janela)).toBeNull()
    expect(botao('Desfazer reserva', janela)).toBeTruthy()

    fireEvent.click(botao('Completar reserva', janela))
    expect(await screen.findByText('Completar a reserva do pedido #4')).toBeTruthy()
  })

  it('cada situação tem a sua cor, do que espera a decisão ao entregue', () => {
    extras.lista = [aprovadoSemReserva(5), pedido(6, 'entregue')]
    renderizar(<Pedidos />, 'tecnico')

    const cor = (situacao: string) => screen.getByText(situacao).className
    expect(cor('Aguardando análise')).toContain('etiqueta--atencao')
    expect(cor('Aguardando animais')).toContain('etiqueta--informacao')
    expect(cor('Animais reservados')).toContain('etiqueta--sucesso')
    expect(cor('Entregue')).toContain('etiqueta--neutro')
    expect(cor('Recusado')).toContain('etiqueta--erro')
  })

  it('a equipe é avisada do aprovado sem reserva com a entrega perto; quem pediu não vê o aviso', () => {
    extras.lista = [
      aprovadoSemReserva(5, daqui(3)),
      aprovadoSemReserva(6, daqui(0)),
      aprovadoSemReserva(7, daqui(-1)),
      aprovadoSemReserva(8, daqui(8)),
    ]
    const equipe = renderizar(<Pedidos />, 'tecnico')

    expect(screen.getByText('Entrega em 3 dias, sem reserva')).toBeTruthy()
    expect(screen.getByText('Entrega hoje, sem reserva')).toBeTruthy()
    expect(screen.getByText('Entrega vencida, sem reserva')).toBeTruthy()
    expect(screen.getAllByText(/sem reserva$/)).toHaveLength(3)
    equipe.unmount()

    renderizar(<Pedidos />, 'pesquisador')

    expect(screen.queryByText(/sem reserva$/)).toBeNull()
  })
})

describe('recusar e desfazer a reserva', { timeout: 40_000 }, () => {
  it('recusar abre o motivo por cima do pedido', async () => {
    renderizar(<Pedidos />, 'tecnico')

    const janela = await abrir('Abrir o pedido #1')
    fireEvent.click(botao('Recusar', janela))

    expect(await screen.findByText('O motivo aparece para quem pediu.')).toBeTruthy()
    expect(document.querySelectorAll('[role="dialog"]')).toHaveLength(2)
    // o enviado não tem animais para soltar
    expect(screen.queryByText(/voltam a ficar livres/)).toBeNull()
  })

  it('o reservado também se recusa: avisa que os animais voltam a ficar livres, e diz quantos', async () => {
    responder(acoes.recusar, {
      sucesso: {
        idPedido: 2,
        status: 'recusado',
        motivo: 'Projeto cancelado',
        soltos: { m: 2, f: 2 },
      },
    })
    renderizar(<Pedidos />, 'tecnico')

    fireEvent.click(botao('Recusar', await abrir('Abrir o pedido #2')))
    const recusa = await janelaDe('Recusar o pedido #2')
    expect(
      within(recusa).getByText(
        'Os animais reservados para este pedido voltam a ficar livres, nas caixas onde estão.',
      ),
    ).toBeTruthy()

    fireEvent.change(within(recusa).getByLabelText('Motivo'), {
      target: { value: 'Projeto cancelado' },
    })
    fireEvent.click(botao('Recusar', recusa))

    await waitFor(() =>
      expect(acoes.recusar).toHaveBeenCalledWith(
        { idPedido: 2, motivo: 'Projeto cancelado' },
        expect.anything(),
      ),
    )
    expect(
      await screen.findByText('Pedido #2 recusado. 2 machos e 2 fêmeas voltaram a ficar livres.'),
    ).toBeTruthy()
  })

  it('desfazer a reserva confirma antes, diz o que acontece e quantos ficaram livres', async () => {
    responder(acoes.desfazer, {
      sucesso: { idPedido: 2, status: 'aprovado', soltos: { m: 0, f: 1 } },
    })
    renderizar(<Pedidos />, 'tecnico')

    fireEvent.click(botao('Desfazer reserva', await abrir('Abrir o pedido #2')))
    const desfazer = await janelaDe('Desfazer a reserva do pedido #2')
    expect(
      within(desfazer).getByText(
        'Os animais reservados voltam a ficar livres, nas caixas onde estão, e o pedido volta para Aguardando animais; depois, é só reservar de novo. Quem pediu não é avisado.',
      ),
    ).toBeTruthy()
    // sem falta, nada sobre falta
    expect(within(desfazer).queryByText(/em falta/)).toBeNull()

    fireEvent.click(botao('Desfazer reserva', desfazer))

    expect(acoes.desfazer).toHaveBeenCalledWith(2, expect.anything())
    expect(
      await screen.findByText('Reserva do pedido #2 desfeita. 1 fêmea voltou a ficar livre.'),
    ).toBeTruthy()
  })

  it('recusada porque o pedido mudou, a janela mostra o pedido como a lista voltou', async () => {
    extras.lista = [pedido(5, 'reservado')]
    const { redesenhar } = renderizar(<Pedidos />, 'tecnico')

    fireEvent.click(botao('Desfazer reserva', await abrir('Abrir o pedido #5')))
    const desfazer = await janelaDe('Desfazer a reserva do pedido #5')
    expect(within(desfazer).queryByText(/em falta/)).toBeNull()

    // uma baixa levou uma fêmea reservada: a API recusa, e a lista recarrega com a falta
    responder(acoes.desfazer, { erro: erroDaApi(409, 'PEDIDO_MUDOU', 'O pedido mudou.') })
    fireEvent.click(botao('Desfazer reserva', desfazer))
    extras.lista = [pedido(5, 'reservado', null, { m: 0, f: 1, qualquer: 0 })]
    redesenhar()

    expect(
      await within(desfazer).findByText('A reserva deste pedido está em falta: falta 1 fêmea.'),
    ).toBeTruthy()
  })

  it('desfazer a reserva em falta diz quanto falta', async () => {
    extras.lista = [pedido(4, 'reservado', null, { m: 2, f: 0, qualquer: 0 })]
    renderizar(<Pedidos />, 'tecnico')

    fireEvent.click(botao('Desfazer reserva', await abrir('Abrir o pedido #4')))

    expect(
      await screen.findByText('A reserva deste pedido está em falta: faltam 2 machos.'),
    ).toBeTruthy()
  })
})

describe('registrar a entrega', { timeout: 40_000 }, () => {
  async function abrirEntrega() {
    renderizar(<Pedidos />, 'tecnico')
    fireEvent.click(botao('Registrar entrega', await abrir('Abrir o pedido #2')))
    return janelaDe('Registrar a entrega do pedido #2')
  }

  it('mostra de quais caixas tirar os animais, com a data de nascimento de cada grupo', async () => {
    const entrega = await abrirEntrega()

    expect(within(entrega).getByText('Tirar das caixas')).toBeTruthy()
    expect(within(entrega).getByText('F2A')).toBeTruthy()
    expect(within(entrega).getByText('F1C')).toBeTruthy()
    expect(
      within(entrega).getByText(
        /^Nascimento em 01\/10\/2026 \(\d+ dias hoje\) · 2º parto do casal AB$/,
      ),
    ).toBeTruthy()
    expect(
      within(entrega).getByText(/^Nascimento em 03\/10\/2026 .* 1º parto do casal CD$/),
    ).toBeTruthy()
  })

  it('sem conseguir ler a retirada, avisa, e a entrega continua possível', async () => {
    acoes.retirada = {
      data: undefined,
      isPending: false,
      isError: true,
      error: new Error('Sem rede'),
    }
    const entrega = await abrirEntrega()

    expect(
      within(entrega).getByText('Não deu para ver de quais caixas tirar os animais.'),
    ).toBeTruthy()
    expect(within(entrega).getByText('Sem rede')).toBeTruthy()
    expect(botao('Registrar entrega', entrega)).toBeTruthy()
  })

  it('registrada, diz as caixas que a entrega esvaziou', async () => {
    responder(acoes.entregar, {
      sucesso: {
        idPedido: 2,
        status: 'entregue',
        dtEntrega: '2026-11-08',
        entregues: { m: 2, f: 2 },
        caixasLiberadas: ['F2A'],
      },
    })
    const entrega = await abrirEntrega()

    fireEvent.click(botao('Registrar entrega', entrega))

    await waitFor(() => expect(acoes.entregar).toHaveBeenCalled())
    expect(acoes.entregar.mock.calls[0]?.[0]).toEqual({
      idPedido: 2,
      dtEntrega: dayjs().format('YYYY-MM-DD'),
    })
    expect(
      await screen.findByText(
        'Entrega do pedido #2 registrada. A caixa F2A ficou vazia e foi liberada.',
      ),
    ).toBeTruthy()
  })

  it('animal fora da idade na data da entrega: diz quais e oferece desfazer a reserva', async () => {
    responder(acoes.entregar, {
      erro: erroDaApi(
        409,
        'IDADE_FORA_DA_FAIXA',
        'Na entrega em 08/11/2026, 2 machos da caixa F2A (nascimento em 01/10/2026) teriam 38 dias, fora da idade aceita no pedido (25 a 31 dias). Desfaca a reserva e reserve animais na idade.',
      ),
    })
    const entrega = await abrirEntrega()

    fireEvent.click(botao('Registrar entrega', entrega))

    const aviso = (
      await within(entrega).findByText(/fora da idade aceita/, {}, DEMORA)
    ).closest<HTMLElement>('[role="alert"]')
    expect(aviso).toBeTruthy()
    fireEvent.click(botao('Desfazer reserva', aviso!))

    expect(await screen.findByText('Desfazer a reserva do pedido #2')).toBeTruthy()
  })

  it('sem o desmame registrado: diz o que fazer, sem oferecer desfazer a reserva', async () => {
    responder(acoes.entregar, {
      erro: erroDaApi(
        409,
        'NAO_DESMAMADO',
        'O desmame de 2 femeas da caixa F1C (nascimento em 03/10/2026) ainda nao foi registrado: registre o desmame antes da entrega.',
      ),
    })
    const entrega = await abrirEntrega()

    fireEvent.click(botao('Registrar entrega', entrega))

    const aviso = (
      await within(entrega).findByText(/registre o desmame/, {}, DEMORA)
    ).closest<HTMLElement>('[role="alert"]')
    expect(aviso).toBeTruthy()
    expect(talvezBotao('Desfazer reserva', aviso!)).toBeNull()
  })

  it('a data que a API recusa aparece no campo', async () => {
    responder(acoes.entregar, {
      erro: erroDaApi(400, 'VALIDACAO', 'Confira os campos.', {
        dtEntrega: 'A data da entrega nao pode ser antes do pedido.',
      }),
    })
    const entrega = await abrirEntrega()

    fireEvent.click(botao('Registrar entrega', entrega))

    expect(
      await within(entrega).findByText(
        'A data da entrega nao pode ser antes do pedido.',
        {},
        DEMORA,
      ),
    ).toBeTruthy()
    // no campo, e não num aviso solto em cima
    expect(entrega.querySelector('.ant-alert')).toBeNull()
  })
})

describe('quem pede', { timeout: 40_000 }, () => {
  it('o nome já vem com o da conta, e a pessoa pode trocar', () => {
    renderizar(<Pedidos />, 'pesquisador', ' Beatriz Lima ')
    const nome = screen.getByLabelText<HTMLInputElement>('Nome')

    expect(nome.value).toBe('Beatriz Lima')
    // O e-mail é o da conta, embaixo do nome, e não se muda
    expect(screen.getByText('teste@ufsc.br')).toBeTruthy()

    fireEvent.change(nome, { target: { value: 'Beatriz Lima Souza' } })
    expect(nome.value).toBe('Beatriz Lima Souza')
  })

  it('conta sem nome deixa o campo em branco, para a pessoa escrever', () => {
    renderizar(<Pedidos />, 'pesquisador', '   ')

    expect(screen.getByLabelText<HTMLInputElement>('Nome').value).toBe('')
  })
})

describe('no celular', { timeout: 40_000 }, () => {
  let voltar = () => {}
  beforeEach(() => {
    voltar = larguraDaTela(390)
  })
  afterEach(() => voltar())

  /** os números dos pedidos na ordem dos cartões, pela seta de cada um */
  const ordemDosCartoes = () =>
    [...document.querySelectorAll<HTMLButtonElement>('.pedidos__cartao .pedidos__seta')].map(
      (seta) => seta.getAttribute('aria-label'),
    )

  it('a equipe vê um cartão por pedido, sem tabela: a situação, o que pediu, a entrega e quem pediu', () => {
    renderizar(<Pedidos />, 'tecnico')

    expect(screen.queryByRole('columnheader')).toBeNull()
    const lista = screen.getByRole('list', { name: 'Pedidos' })
    expect(within(lista).getAllByRole('listitem')).toHaveLength(3)
    expect(within(lista).getByText('Aguardando análise')).toBeTruthy()
    expect(within(lista).getAllByText('4 ratos Wistar')).toHaveLength(3)
    expect(within(lista).getByText('Entrega em 01/12/2026')).toBeTruthy()
    expect(within(lista).getByText('Ana · #1 de 01/11/2026')).toBeTruthy()
    // o filtro continua, numa linha só, e a lista diz quantos mostra
    expect(screen.getByText('Aguardando análise (1)')).toBeTruthy()
    expect(screen.getByText('3 pedidos')).toBeTruthy()
  })

  it('a equipe começa pelo pedido mais novo, e a ordem se troca no controle de cima', async () => {
    renderizar(<Pedidos />, 'tecnico')

    expect(ordemDosCartoes()).toEqual([
      'Abrir o pedido #3',
      'Abrir o pedido #2',
      'Abrir o pedido #1',
    ])

    fireEvent.mouseDown(selecao('Ordem da lista'))
    fireEvent.click(await screen.findByTitle('Entrega mais distante'))

    await waitFor(() =>
      expect(ordemDosCartoes()).toEqual([
        'Abrir o pedido #3',
        'Abrir o pedido #2',
        'Abrir o pedido #1',
      ]),
    )
    fireEvent.mouseDown(selecao('Ordem da lista'))
    fireEvent.click(await screen.findByTitle('Pedido mais antigo'))

    await waitFor(() =>
      expect(ordemDosCartoes()).toEqual([
        'Abrir o pedido #1',
        'Abrir o pedido #2',
        'Abrir o pedido #3',
      ]),
    )
  })

  it('tocar em qualquer lugar do cartão abre o pedido', async () => {
    renderizar(<Pedidos />, 'tecnico')

    fireEvent.click(screen.getByText('Entrega em 01/12/2026'))

    expect(within(await janelaAberta()).getByText('Pedido #1')).toBeTruthy()
  })

  it('quem pediu vê a entrega mais próxima primeiro, com a idade e a resposta, sem o número', () => {
    renderizar(<Pedidos />, 'pesquisador')

    const entregas = [...document.querySelectorAll('.pedidos__cartao .pedidos__entrega')].map(
      (no) => no.textContent,
    )
    expect(entregas).toEqual([
      'Entrega em 01/12/2026',
      'Entrega em 02/12/2026',
      'Entrega em 03/12/2026',
    ])
    expect(ordemDosCartoes()).toEqual(['Abrir o pedido', 'Abrir o pedido', 'Abrir o pedido'])
    expect(screen.getAllByText('2 machos · 2 fêmeas · 28 dias de idade')).toHaveLength(3)
    expect(screen.getByText('Resposta até 15/11/2026')).toBeTruthy()
    expect(screen.getByText('Motivo: Sem Wistar ate dezembro')).toBeTruthy()
    expect(screen.queryByText(/#\d/)).toBeNull()
    expect(screen.queryByText('Ana')).toBeNull()
  })

  it('no pedido aberto, a ação que leva adiante vai larga embaixo, e não há Fechar: o X fecha', async () => {
    renderizar(<Pedidos />, 'tecnico')

    const chegou = await abrir('Abrir o pedido #1')
    const principal = chegou.querySelector<HTMLElement>('.pedidos__rodapePrincipal')
    expect(principal && botao('Aprovar', principal)).toBeTruthy()
    expect(botao('Recusar', chegou).closest('.pedidos__rodapeSecundario')).toBeTruthy()
    expect(talvezBotao('Fechar', chegou)).toBeNull()
  })

  it('o pedido sem o que fazer abre sem rodapé', async () => {
    renderizar(<Pedidos />, 'tecnico')

    const recusado = await abrir('Abrir o pedido #3')
    expect(within(recusado).getByText('Recusado em 04/11/2026')).toBeTruthy()
    expect(recusado.querySelector('.ant-modal-footer')).toBeNull()
    expect(talvezBotao('Fechar', recusado)).toBeNull()
  })

  it('quem pediu fecha o pedido pelo X, sem Fechar no rodapé', async () => {
    renderizar(<Pedidos />, 'pesquisador')

    const janela = await abrir('Abrir o pedido')
    expect(talvezBotao('Fechar', janela)).toBeNull()
    expect(janela.querySelector('.ant-modal-footer')).toBeNull()
  })
})
