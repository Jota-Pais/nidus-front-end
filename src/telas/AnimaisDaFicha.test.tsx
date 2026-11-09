import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { EventoDaFicha } from '@/dominio/tipos'
import { hoje } from '@/lib/data'
import {
  APAGADO,
  botao,
  botoes,
  celula,
  diaNoCalendario,
  erroDaApi,
  estanteE01,
  gradeE01,
  grupo,
  mutacaoComResposta,
  selecao,
  talvezBotao,
} from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { BaixaNaCaixa, EventosDaFicha, MudarAnimais } from './AnimaisDaFicha'
import type { CaixaDaAcao, GrupoDaCaixa } from './AnimaisDaFicha'

/** o que cada ação manda para a API */
const api = vi.hoisted(() => ({ baixa: vi.fn(), mudanca: vi.fn(), anulacao: vi.fn() }))

vi.mock('@/dominio/consultas', () => ({
  useBaixa: () => mutacaoComResposta(api.baixa),
  useMudanca: () => mutacaoComResposta(api.mudanca),
  useAnularBaixa: () => mutacaoComResposta(api.anulacao),
  useEstantes: () => consulta([estanteE01]),
  useGrade: () => consulta(gradeE01),
}))

/** a caixa F1A, do casal AB, de linhagem Wistar (id 1) */
const caixaDoCasal: CaixaDaAcao = {
  id: 7,
  endereco: { sala: 'Sala 1', numeroVisivel: 'E-01', codigo: 'F1A' },
  idLinhagem: 1,
}

/** os 4 M e 4 F do 1º parto, nascidos em 24/09 */
const ninhada: GrupoDaCaixa[] = [{ dtNascimento: '2026-09-24', vivos: { m: 4, f: 4 } }]

beforeEach(() => {
  api.baixa.mockReset().mockResolvedValue({ baixas: { m: 0, f: 0 }, liberada: false, faltas: [] })
  api.mudanca.mockReset().mockResolvedValue({ caixas: [], liberada: false })
  api.anulacao.mockReset().mockResolvedValue({ voltaram: [], soltos: { m: 0, f: 0 } })
})

afterEach(() => vi.useRealTimers())

/** Hoje é o dia dado: só o relógio, para o calendário abrir no mês dele; o resto anda normal */
function fingirHoje(data: string) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(`${data}T12:00:00`))
}

const DEMORA = { timeout: 10_000 }

function digitar(rotulo: string | RegExp, valor: string, onde: HTMLElement = document.body) {
  fireEvent.change(within(onde).getByLabelText(rotulo), { target: { value: valor } })
}

/** Abre a lista do Select pelo rótulo e escolhe a opção */
async function escolher(rotulo: string | RegExp, opcao: string) {
  fireEvent.mouseDown(selecao(rotulo))
  fireEvent.click(await screen.findByTitle(opcao))
}

describe('baixa', { timeout: 30_000 }, () => {
  it('manda quantos de cada sexo, da idade da caixa, com a data e o motivo', async () => {
    const terminou = vi.fn()
    renderizar(
      <BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} reservas={[]} aoTerminar={terminou} />,
    )

    digitar('Machos', '2')
    digitar('Fêmeas', '1')
    digitar('Motivo (opcional)', 'morte')
    fireEvent.click(botao('Registrar baixa'))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      motivo: 'morte',
      itens: [
        { sexo: 'M', qtd: 2, dtNascimento: '2026-09-24' },
        { sexo: 'F', qtd: 1, dtNascimento: '2026-09-24' },
      ],
    })
    await waitFor(() => expect(terminou).toHaveBeenCalled())
  })

  it('sem nenhum animal, não registra', () => {
    renderizar(
      <BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} reservas={[]} aoTerminar={() => {}} />,
    )

    expect(botao('Registrar baixa')).toHaveProperty('disabled', true)
  })

  it('com mais de uma idade, pergunta de qual, e a data não fica antes do nascimento dela', async () => {
    fingirHoje('2026-10-05')
    const grupos: GrupoDaCaixa[] = [
      { dtNascimento: '2026-09-24', vivos: { m: 6, f: 0 } },
      { dtNascimento: '2026-10-02', vivos: { m: 3, f: 0 } },
    ]
    renderizar(
      <BaixaNaCaixa caixa={caixaDoCasal} grupos={grupos} reservas={[]} aoTerminar={() => {}} />,
    )

    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))
    // a caixa de estoque é de um sexo só: as fêmeas nem aparecem
    expect(screen.queryByLabelText('Fêmeas')).toBeNull()
    digitar('Machos', '1')

    fireEvent.click(screen.getByLabelText('Data'))
    await waitFor(() => expect(diaNoCalendario('2026-10-02')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-01')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-02')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-06')).toContain(APAGADO)

    fireEvent.click(botao('Registrar baixa'))
    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith(
      expect.objectContaining({ itens: [{ sexo: 'M', qtd: 1, dtNascimento: '2026-10-02' }] }),
    )
  })

  it('com reservados de mais de um pedido, a API pede de qual, e o campo aparece no sexo certo', async () => {
    api.baixa.mockRejectedValueOnce(
      erroDaApi(409, 'PEDIDO_NAO_INDICADO', 'Os livres nao bastam.', {
        'itens.0.idPedido': 'Escolha um dos pedidos: #7, #9.',
      }),
    )
    renderizar(
      <BaixaNaCaixa
        caixa={caixaDoCasal}
        grupos={ninhada}
        reservas={[
          { idPedido: 7, m: 0, f: 2 },
          { idPedido: 9, m: 0, f: 1 },
        ]}
        aoTerminar={() => {}}
      />,
    )

    // só as fêmeas: o item 0 que a API aponta é o delas
    digitar('Fêmeas', '4')
    fireEvent.click(botao('Registrar baixa'))

    expect(await screen.findByText('Escolha um dos pedidos: #7, #9.', {}, DEMORA)).toBeTruthy()
    const campo = /de qual pedido saem as fêmeas reservados/
    expect(screen.queryByText('Os livres nao bastam.')).toBeNull()

    await escolher(campo, 'Pedido #9')
    fireEvent.click(botao('Registrar baixa'))

    await waitFor(() => expect(api.baixa).toHaveBeenCalledTimes(2), DEMORA)
    expect(api.baixa).toHaveBeenLastCalledWith(
      expect.objectContaining({
        itens: [{ sexo: 'F', qtd: 4, dtNascimento: '2026-09-24', idPedido: 9 }],
      }),
    )
  })

  it('a data recusada aparece no campo dela', async () => {
    api.baixa.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        dtFato: 'A data e anterior a chegada dos animais na caixa.',
      }),
    )
    renderizar(
      <BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} reservas={[]} aoTerminar={() => {}} />,
    )

    digitar('Machos', '1')
    fireEvent.click(botao('Registrar baixa'))

    expect(
      await screen.findByText('A data e anterior a chegada dos animais na caixa.', {}, DEMORA),
    ).toBeTruthy()
    expect(screen.queryByText('Confira os campos destacados.')).toBeNull()
  })

  it('mostra a falta que a baixa abriu nos pedidos', async () => {
    api.baixa.mockResolvedValueOnce({
      baixas: { m: 1, f: 0 },
      liberada: false,
      faltas: [{ idPedido: 12, m: 1, f: 0, qualquer: 0 }],
    })
    renderizar(
      <BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} reservas={[]} aoTerminar={() => {}} />,
    )

    digitar('Machos', '1')
    fireEvent.click(botao('Registrar baixa'))

    expect(await screen.findAllByText('Reserva em falta', {}, DEMORA)).not.toHaveLength(0)
    expect(
      screen.getByText(/#12, 1 macho\. Em Pedidos, a reserva em falta pode ser completada/),
    ).toBeTruthy()
  })
})

/** Abre a mudança da caixa F1A, com os 4 M e 4 F do parto desmamado em 16/10 */
function abrirPassagem(reservas = [] as { idPedido: number; m: number; f: number }[]) {
  renderizar(
    <MudarAnimais
      caixa={caixaDoCasal}
      grupos={ninhada}
      reservas={reservas}
      desde="2026-10-16"
      botao="Passar para o estoque"
      aoTerminar={() => {}}
    />,
  )

  return {
    machos: grupo('Machos'),
    femeas: grupo('Fêmeas'),
    passar: () => fireEvent.click(botao('Passar para o estoque')),
  }
}

describe('mudança de caixa', { timeout: 30_000 }, () => {
  it('para cada sexo é a quantidade e um clique: a posição vazia vira caixa nova', async () => {
    const { machos, femeas, passar } = abrirPassagem()

    fireEvent.click(celula(/^F1B: posição vazia/, machos))
    fireEvent.click(celula(/^F1D: posição vazia/, femeas))
    passar()

    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    expect(api.mudanca).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      machos: {
        qtd: 4,
        dtNascimento: '2026-09-24',
        destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 2 } },
      },
      femeas: {
        qtd: 4,
        dtNascimento: '2026-09-24',
        destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 4 } },
      },
    })
  })

  it('só a caixa de estoque do sexo e da linhagem recebe; as outras ficam apagadas', async () => {
    const { machos, femeas, passar } = abrirPassagem()

    // F1C é de machos Wistar, F1E de fêmeas Wistar, F1F de machos Swiss
    expect(celula(/^F1C: caixa de estoque com 6 machos/, machos)).toHaveProperty('disabled', false)
    expect(celula('F1E: ocupada', machos)).toHaveProperty('disabled', true)
    expect(celula('F1F: ocupada', machos)).toHaveProperty('disabled', true)
    expect(celula('F1C: ocupada', femeas)).toHaveProperty('disabled', true)
    // a caixa de onde os animais saem não recebe
    expect(celula(/^F1A: a caixa de onde/, machos)).toHaveProperty('disabled', true)

    fireEvent.click(celula(/^F1C: caixa de estoque/, machos))
    digitar('Quantos fêmeas', '0', femeas)
    passar()

    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    expect(api.mudanca).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      machos: { qtd: 4, dtNascimento: '2026-09-24', destino: { idCaixa: 30 } },
    })
  })

  it('a posição que um sexo pegou não serve para o outro, e sem caixa não muda', async () => {
    const { machos, femeas, passar } = abrirPassagem()

    fireEvent.click(celula(/^F1B: posição vazia/, machos))

    expect(celula(/^F1B: já escolhida para os machos/, femeas)).toHaveProperty('disabled', true)
    passar()
    expect(await screen.findByText('Clique na caixa de destino', {}, DEMORA)).toBeTruthy()
    expect(api.mudanca).not.toHaveBeenCalled()
  })

  it('com reservados, leva só os de um pedido: a quantidade vira a dele', async () => {
    const { machos, femeas, passar } = abrirPassagem([{ idPedido: 12, m: 2, f: 0 }])

    // só os machos têm reservados: as fêmeas não têm o "Quais"
    expect(within(femeas).queryByLabelText('Quais fêmeas')).toBeNull()
    await escolher('Quais machos', 'Só os reservados do pedido #12')
    await waitFor(() =>
      expect(within(machos).getByLabelText('Quantos machos')).toHaveProperty('value', '2'),
    )

    fireEvent.click(celula(/^F1B: posição vazia/, machos))
    digitar('Quantos fêmeas', '0', femeas)
    passar()

    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    expect(api.mudanca).toHaveBeenCalledWith(
      expect.objectContaining({
        machos: {
          qtd: 2,
          dtNascimento: '2026-09-24',
          idPedido: 12,
          soDoPedido: true,
          destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 2 } },
        },
      }),
    )
  })

  it('a caixa recusada aparece no destino do sexo, e o pedido, quando a API pede', async () => {
    api.mudanca.mockRejectedValueOnce(
      erroDaApi(409, 'PEDIDO_NAO_INDICADO', 'Os livres nao bastam.', {
        'machos.idPedido': 'Escolha um dos pedidos: #12, #15.',
        'femeas.destino': 'Machos e femeas vao em caixas diferentes.',
      }),
    )
    const { machos, femeas, passar } = abrirPassagem([
      { idPedido: 12, m: 1, f: 0 },
      { idPedido: 15, m: 1, f: 0 },
    ])

    fireEvent.click(celula(/^F1B: posição vazia/, machos))
    fireEvent.click(celula(/^F1D: posição vazia/, femeas))
    passar()

    expect(
      await within(femeas).findByText('Machos e femeas vao em caixas diferentes.', {}, DEMORA),
    ).toBeTruthy()
    expect(await within(machos).findByText('Escolha um dos pedidos: #12, #15.')).toBeTruthy()
    expect(within(machos).getByLabelText(/de qual pedido saem os machos reservados/)).toBeTruthy()
  })

  it('a data da mudança é do desmame até hoje', async () => {
    fingirHoje('2026-10-20')
    abrirPassagem()

    fireEvent.click(screen.getByLabelText('Data da mudança'))
    await waitFor(() => expect(diaNoCalendario('2026-10-16')).not.toBe('(sem dia)'))

    expect(diaNoCalendario('2026-10-15')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-16')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-20')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-21')).toContain(APAGADO)
  })
})

const baixa = (idOcorrencia: number, anulavel: boolean): EventoDaFicha => ({
  dataHora: '2026-10-20T00:00:00.000Z',
  tipo: 'baixa',
  descricao: `Baixa de 2 machos nesta caixa${anulavel ? '' : ' (anulada)'}.`,
  autor: 'Ana Souza',
  idOcorrencia,
  anulavel,
})

describe('eventos e anulação da baixa', { timeout: 30_000 }, () => {
  const eventos: EventoDaFicha[] = [
    {
      dataHora: '2026-09-24T00:00:00.000Z',
      tipo: 'nascimento',
      descricao: 'Nasceram 5 machos e 5 femeas.',
      autor: 'Ana Souza',
      idOcorrencia: 3,
      anulavel: false,
    },
    baixa(40, false),
    baixa(41, true),
  ]

  function anularA(descricao: RegExp) {
    renderizar(<EventosDaFicha eventos={eventos} caixa={caixaDoCasal} />)
    const linha = screen.getByText(descricao).closest('li') as HTMLElement
    fireEvent.click(botao('Anular', linha))
    return linha
  }

  it('só a baixa que ainda pode ser anulada tem o Anular', () => {
    renderizar(<EventosDaFicha eventos={eventos} caixa={caixaDoCasal} />)

    expect(botoes('Anular')).toHaveLength(1)
    const anulada = screen.getByText(/\(anulada\)/).closest('li') as HTMLElement
    expect(talvezBotao('Anular', anulada)).toBeNull()
  })

  it('anula com o motivo; a caixa da baixa ainda serve, e nenhum destino vai', async () => {
    api.anulacao.mockResolvedValueOnce({
      voltaram: [{ sexo: 'M', qtd: 2, idCaixa: 7, codigo: 'F1A' }],
      soltos: { m: 0, f: 0 },
    })
    const linha = anularA(/^Baixa de 2 machos nesta caixa\.$/)

    digitar('Por que a baixa foi um engano', 'contada duas vezes', linha)
    fireEvent.click(botao('Anular baixa', linha))

    await waitFor(() => expect(api.anulacao).toHaveBeenCalled(), DEMORA)
    expect(api.anulacao).toHaveBeenCalledWith({ idOcorrencia: 41, motivo: 'contada duas vezes' })
    expect(await screen.findByText('Baixa anulada: 2 machos para a F1A.')).toBeTruthy()
  })

  it('quando a caixa não serve mais, a estante aparece só com as caixas de estoque que aceitam', async () => {
    api.anulacao.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        idCaixaMachos:
          'A caixa F1A ja foi liberada: diga para qual caixa de estoque voltam 2 machos.',
      }),
    )
    const linha = anularA(/^Baixa de 2 machos nesta caixa\.$/)

    digitar('Por que a baixa foi um engano', 'contada duas vezes', linha)
    fireEvent.click(botao('Anular baixa', linha))

    expect(
      await within(linha).findByText(
        'A caixa F1A ja foi liberada: diga para qual caixa de estoque voltam 2 machos.',
        {},
        DEMORA,
      ),
    ).toBeTruthy()
    // a volta não cria caixa: a posição vazia fica apagada, e só a de machos Wistar recebe
    expect(celula('F1B: posição vazia', linha)).toHaveProperty('disabled', true)
    expect(celula('F1F: ocupada', linha)).toHaveProperty('disabled', true)
    fireEvent.click(celula(/^F1C: caixa de estoque com 6 machos/, linha))
    fireEvent.click(botao('Anular baixa', linha))

    await waitFor(() => expect(api.anulacao).toHaveBeenCalledTimes(2), DEMORA)
    expect(api.anulacao).toHaveBeenLastCalledWith({
      idOcorrencia: 41,
      motivo: 'contada duas vezes',
      idCaixaMachos: 30,
    })
  })
})
