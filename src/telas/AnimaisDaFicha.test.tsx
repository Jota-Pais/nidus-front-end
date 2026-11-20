import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { hoje } from '@/lib/data'
import {
  APAGADO,
  botao,
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
import { BaixaNaCaixa, MudarAnimais } from './AnimaisDaFicha'
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

/** os 4 M e 4 F do 1º parto, nascidos em 24/09, com o que cada pedido tem reservado neles */
const ninhadaCom = (reservas: GrupoDaCaixa['reservas'] = []): GrupoDaCaixa[] => [
  { dtNascimento: '2026-09-24', vivos: { m: 4, f: 4 }, reservas, dtChegada: null },
]

const ninhada = ninhadaCom()

beforeEach(() => {
  api.baixa
    .mockReset()
    .mockResolvedValue({ idOcorrencia: 41, baixas: { m: 0, f: 0 }, liberada: false, faltas: [] })
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
  it('manda quantos de cada sexo, da idade da caixa, com a data e a causa Morte', async () => {
    const terminou = vi.fn()
    renderizar(<BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} aoTerminar={terminou} />)

    digitar('Machos', '2')
    digitar('Fêmeas', '1')
    fireEvent.click(screen.getByLabelText('Morte'))
    fireEvent.click(botao('Registrar baixa'))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      tipo: 'morte',
      itens: [
        { sexo: 'M', qtd: 2, dtNascimento: '2026-09-24' },
        { sexo: 'F', qtd: 1, dtNascimento: '2026-09-24' },
      ],
    })
    await waitFor(() => expect(terminou).toHaveBeenCalled())
  })

  it('a causa não tem padrão: sem escolher, não registra e o campo pede', async () => {
    renderizar(<BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} aoTerminar={() => {}} />)

    expect(screen.getByLabelText('Morte')).toHaveProperty('checked', false)
    expect(screen.getByLabelText('Eutanásia')).toHaveProperty('checked', false)
    digitar('Machos', '1')
    fireEvent.click(botao('Registrar baixa'))

    expect(await screen.findByText('Escolha a causa', {}, DEMORA)).toBeTruthy()
    expect(api.baixa).not.toHaveBeenCalled()
  })

  it('no aleitamento, a eutanásia é o ajuste de ninhada e vai com o parto; a morte é a do aleitamento', async () => {
    renderizar(
      <BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} aoTerminar={() => {}} idParto={20} />,
    )

    // sem padrão também aqui: antes vinha marcada a eutanásia
    expect(screen.getByLabelText('Eutanásia (ajuste de ninhada)')).toHaveProperty('checked', false)
    expect(screen.getByLabelText('Morte no aleitamento')).toHaveProperty('checked', false)
    expect(screen.queryByLabelText('Morte')).toBeNull()
    digitar('Machos', '1')
    fireEvent.click(screen.getByLabelText('Eutanásia (ajuste de ninhada)'))
    fireEvent.click(botao('Registrar baixa'))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith(
      expect.objectContaining({ tipo: 'eutanasia', idParto: 20 }),
    )

    // trocando para a morte no aleitamento, a baixa deixa de ser a seleção do parto
    fireEvent.click(screen.getByLabelText('Morte no aleitamento'))
    fireEvent.click(botao('Registrar baixa'))
    await waitFor(() => expect(api.baixa).toHaveBeenCalledTimes(2), DEMORA)
    expect(api.baixa.mock.calls[1]?.[0]).toEqual(expect.objectContaining({ tipo: 'morte' }))
    expect(api.baixa.mock.calls[1]?.[0]).not.toHaveProperty('idParto')
  })

  it('a mensagem de sucesso traz o Desfazer, que anula a baixa recém-criada', async () => {
    renderizar(<BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} aoTerminar={() => {}} />)

    digitar('Machos', '1')
    fireEvent.click(screen.getByLabelText('Morte'))
    fireEvent.click(botao('Registrar baixa'))

    fireEvent.click(await screen.findByRole('button', { name: 'Desfazer' }, DEMORA))

    await waitFor(() => expect(api.anulacao).toHaveBeenCalled(), DEMORA)
    expect(api.anulacao).toHaveBeenCalledWith({
      idOcorrencia: 41,
      motivo: expect.stringContaining('Desfeita'),
    })
    expect(await screen.findByText('Baixa desfeita.', {}, DEMORA)).toBeTruthy()
  })

  it('a baixa que libera a caixa não oferece o Desfazer', async () => {
    api.baixa.mockResolvedValueOnce({
      idOcorrencia: 42,
      baixas: { m: 1, f: 0 },
      liberada: true,
      faltas: [],
    })
    renderizar(<BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} aoTerminar={() => {}} />)

    digitar('Machos', '1')
    fireEvent.click(screen.getByLabelText('Morte'))
    fireEvent.click(botao('Registrar baixa'))

    expect(await screen.findByText(/A caixa ficou vazia e foi liberada/, {}, DEMORA)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Desfazer' })).toBeNull()
  })

  it('sem nenhum animal, não registra', () => {
    renderizar(<BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} aoTerminar={() => {}} />)

    expect(botao('Registrar baixa')).toHaveProperty('disabled', true)
  })

  it('com mais de uma idade, pergunta de qual, e a data não fica antes do nascimento dela', async () => {
    fingirHoje('2026-10-05')
    const grupos: GrupoDaCaixa[] = [
      { dtNascimento: '2026-09-24', vivos: { m: 6, f: 0 }, reservas: [], dtChegada: null },
      { dtNascimento: '2026-10-02', vivos: { m: 3, f: 0 }, reservas: [], dtChegada: null },
    ]
    renderizar(<BaixaNaCaixa caixa={caixaDoCasal} grupos={grupos} aoTerminar={() => {}} />)

    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))
    // a caixa de estoque é de um sexo só: as fêmeas nem aparecem
    expect(screen.queryByLabelText('Fêmeas')).toBeNull()
    digitar('Machos', '1')

    fireEvent.click(screen.getByLabelText('Data'))
    await waitFor(() => expect(diaNoCalendario('2026-10-02')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-01')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-02')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-06')).toContain(APAGADO)

    fireEvent.click(screen.getByLabelText('Morte'))
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
        grupos={ninhadaCom([
          { idPedido: 7, m: 0, f: 2 },
          { idPedido: 9, m: 0, f: 1 },
        ])}
        aoTerminar={() => {}}
      />,
    )

    // só as fêmeas: o item 0 que a API aponta é o delas
    digitar('Fêmeas', '4')
    fireEvent.click(screen.getByLabelText('Morte'))
    fireEvent.click(botao('Registrar baixa'))

    expect(await screen.findByText('Escolha um dos pedidos: #7, #9.', {}, DEMORA)).toBeTruthy()
    const campo = /de qual pedido saem as fêmeas reservadas$/
    expect(screen.queryByText('Os livres nao bastam.')).toBeNull()

    await escolher(campo, 'Pedido #9')
    fireEvent.click(screen.getByLabelText('Morte'))
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
    renderizar(<BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} aoTerminar={() => {}} />)

    digitar('Machos', '1')
    fireEvent.click(screen.getByLabelText('Morte'))
    fireEvent.click(botao('Registrar baixa'))

    expect(
      await screen.findByText('A data e anterior a chegada dos animais na caixa.', {}, DEMORA),
    ).toBeTruthy()
    expect(screen.queryByText('Confira os campos destacados.')).toBeNull()
  })

  it('mostra a falta que a baixa abriu nos pedidos', async () => {
    api.baixa.mockResolvedValueOnce({
      idOcorrencia: 43,
      baixas: { m: 1, f: 0 },
      liberada: false,
      faltas: [{ idPedido: 12, m: 1, f: 0, qualquer: 0 }],
    })
    renderizar(<BaixaNaCaixa caixa={caixaDoCasal} grupos={ninhada} aoTerminar={() => {}} />)

    digitar('Machos', '1')
    fireEvent.click(screen.getByLabelText('Morte'))
    fireEvent.click(botao('Registrar baixa'))

    expect(await screen.findAllByText('Reserva em falta', {}, DEMORA)).not.toHaveLength(0)
    expect(
      screen.getByText(/#12, 1 macho\. Em Pedidos, a reserva em falta pode ser completada/),
    ).toBeTruthy()
  })
})

/** Abre a mudança da caixa F1A, com os 4 M e 4 F do parto desmamado em 16/10 */
function abrirPassagem(reservas: GrupoDaCaixa['reservas'] = []) {
  renderizar(
    <MudarAnimais
      caixa={caixaDoCasal}
      grupos={ninhadaCom(reservas)}
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

describe('passagem para outra caixa', { timeout: 30_000 }, () => {
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
    digitar('Quantas fêmeas', '0', femeas)
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
    digitar('Quantas fêmeas', '0', femeas)
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

  it('o pedido de "só os reservados" é o da idade escolhida, e trocar a idade volta aos livres', async () => {
    renderizar(
      <MudarAnimais
        caixa={caixaDoCasal}
        grupos={[
          { dtNascimento: '2026-09-24', vivos: { m: 6, f: 0 }, reservas: [], dtChegada: null },
          {
            dtNascimento: '2026-10-02',
            vivos: { m: 3, f: 0 },
            reservas: [{ idPedido: 12, m: 1, f: 0 }],
            dtChegada: null,
          },
        ]}
        botao="Passar para outra caixa"
        aoTerminar={() => {}}
      />,
    )

    // a primeira idade não tem reservado: não há de qual pedido escolher
    expect(screen.queryByLabelText('Quais machos')).toBeNull()

    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))
    await escolher('Quais machos', 'Só os reservados do pedido #12')
    await waitFor(() =>
      expect(screen.getByLabelText('Quantos machos')).toHaveProperty('value', '1'),
    )

    fireEvent.click(screen.getByLabelText(/^nascidos em 24\/09\/2026/))
    await waitFor(() =>
      expect(screen.getByLabelText('Quantos machos')).toHaveProperty('value', '6'),
    )
    expect(screen.queryByLabelText('Quais machos')).toBeNull()

    fireEvent.click(celula(/^F1B: posição vazia/))
    fireEvent.click(botao('Passar para outra caixa'))
    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    expect(api.mudanca).toHaveBeenCalledWith(
      expect.objectContaining({
        machos: {
          qtd: 6,
          dtNascimento: '2026-09-24',
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

    fireEvent.click(screen.getByLabelText('Data'))
    await waitFor(() => expect(diaNoCalendario('2026-10-16')).not.toBe('(sem dia)'))

    expect(diaNoCalendario('2026-10-15')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-16')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-20')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-21')).toContain(APAGADO)
  })
})

/** As caixas de um sexo na mudança, cada uma com a estante e o campo de destino dela */
const partesDe = (sexo: HTMLElement) => [...sexo.querySelectorAll<HTMLElement>('.animais__parte')]

const quantos = (sexo: HTMLElement, rotulo: string) =>
  (within(sexo).getByLabelText(rotulo) as HTMLInputElement).value

/** "+ outra caixa" no grupo do sexo */
const maisUma = (sexo: HTMLElement) => fireEvent.click(botao('+ outra caixa', sexo))

/** A caixa de número 'n' (de 1) do sexo */
const parteN = (sexo: HTMLElement, n: number) => partesDe(sexo)[n - 1] as HTMLElement

describe('passagem de um sexo dividido em várias caixas', { timeout: 60_000 }, () => {
  it('"+ outra caixa" divide: a nova leva metade da última, depois o que falta, e a soma aparece', async () => {
    const { machos } = abrirPassagem()

    // uma caixa só: sem soma e sem "Tirar"
    expect(partesDe(machos)).toHaveLength(1)
    expect(within(machos).queryByText(/nas caixas/)).toBeNull()
    expect(talvezBotao('Tirar', machos)).toBeNull()

    maisUma(machos)
    expect(partesDe(machos)).toHaveLength(2)
    expect(quantos(machos, 'Quantos machos')).toBe('2')
    expect(quantos(machos, 'Quantos machos na 2ª caixa')).toBe('2')
    expect(within(machos).getByText('4 de 4 nas caixas')).toBeTruthy()

    // tirando um da primeira, sobra um: a próxima caixa recebe o que falta
    digitar('Quantos machos', '1', machos)
    expect(await within(machos).findByText('3 de 4 nas caixas; 1 fica na F1A')).toBeTruthy()

    maisUma(machos)
    expect(quantos(machos, 'Quantos machos na 3ª caixa')).toBe('1')
    expect(within(machos).getByText('4 de 4 nas caixas')).toBeTruthy()
  })

  it('os rótulos falam da caixa só quando há mais de uma', async () => {
    const { machos } = abrirPassagem()

    fireEvent.click(celula(/^F1B: posição vazia/, machos))
    expect(within(machos).getByText('Para onde vão os machos')).toBeTruthy()

    maisUma(machos)
    expect(within(machos).getByText('♂ Machos na 1ª caixa')).toBeTruthy()
    expect(within(machos).getByText('♂ Machos na 2ª caixa')).toBeTruthy()
    expect(within(machos).getAllByText('Para onde vão 2 machos')).toHaveLength(2)

    digitar('Quantos machos na 2ª caixa', '1', machos)
    digitar('Quantos machos', '3', machos)
    expect(await within(machos).findByText('Para onde vão 3 machos')).toBeTruthy()
    expect(within(machos).getByText('Para onde vai 1 macho')).toBeTruthy()
  })

  it('o botão desabilita quando as caixas são tantas quanto os animais', () => {
    const { machos } = abrirPassagem()

    for (let caixas = 1; caixas < 4; caixas += 1) {
      expect(botao('+ outra caixa', machos)).toHaveProperty('disabled', false)
      maisUma(machos)
    }

    // 4 machos em 4 caixas: uma para cada
    expect(partesDe(machos)).toHaveLength(4)
    expect(botao('+ outra caixa', machos)).toHaveProperty('disabled', true)
  })

  it('o limite é de 20 caixas por sexo', () => {
    renderizar(
      <MudarAnimais
        caixa={caixaDoCasal}
        grupos={[{ dtNascimento: '2026-09-24', vivos: { m: 30, f: 0 }, reservas: [], dtChegada: null }]}
        botao="Passar para o estoque"
        aoTerminar={() => {}}
      />,
    )
    const machos = grupo('Machos')

    for (let caixas = 1; caixas < 20; caixas += 1) maisUma(machos)

    expect(partesDe(machos)).toHaveLength(20)
    expect(botao('+ outra caixa', machos)).toHaveProperty('disabled', true)
  })

  it('"Tirar" devolve os animais da caixa para a primeira e some quando sobra uma', async () => {
    const { machos } = abrirPassagem()

    maisUma(machos)
    maisUma(machos)
    // [2, 1, 1]
    expect(quantos(machos, 'Quantos machos')).toBe('2')
    expect(partesDe(machos)).toHaveLength(3)
    expect(within(machos).getByLabelText('Tirar a 2ª caixa dos machos')).toBeTruthy()
    expect(within(machos).queryByLabelText('Tirar a 1ª caixa dos machos')).toBeNull()

    fireEvent.click(within(machos).getByLabelText('Tirar a 3ª caixa dos machos'))
    await waitFor(() => expect(partesDe(machos)).toHaveLength(2))
    expect(quantos(machos, 'Quantos machos')).toBe('3')
    expect(within(machos).getByText('4 de 4 nas caixas')).toBeTruthy()

    fireEvent.click(within(machos).getByLabelText('Tirar a 2ª caixa dos machos'))
    await waitFor(() => expect(partesDe(machos)).toHaveLength(1))
    expect(quantos(machos, 'Quantos machos')).toBe('4')
    expect(talvezBotao('Tirar', machos)).toBeNull()
    expect(within(machos).queryByText(/nas caixas/)).toBeNull()
  })

  it('cada caixa tem o máximo do que sobra, e o que passa dele é cortado no máximo ao sair do campo', async () => {
    const { machos } = abrirPassagem()
    const maximo = (rotulo: string) => within(machos).getByLabelText(rotulo).getAttribute('aria-valuemax')

    maisUma(machos)
    // [2, 2]: cada uma pode ir até o que a outra deixa
    expect(maximo('Quantos machos')).toBe('2')
    expect(maximo('Quantos machos na 2ª caixa')).toBe('2')

    digitar('Quantos machos', '1', machos)
    await waitFor(() => expect(maximo('Quantos machos na 2ª caixa')).toBe('3'))
    expect(maximo('Quantos machos')).toBe('2')

    // a soma nunca passa do total pelo campo: o que passa do máximo não vale e, ao sair, volta a ele
    const segunda = within(machos).getByLabelText('Quantos machos na 2ª caixa')
    fireEvent.change(segunda, { target: { value: '4' } })
    fireEvent.blur(segunda)
    await waitFor(() => expect(quantos(machos, 'Quantos machos na 2ª caixa')).toBe('3'))
    expect(within(machos).getByText('4 de 4 nas caixas')).toBeTruthy()
  })

  it('o destino de uma caixa não aparece nas outras partes nem no outro sexo: posição e caixa de estoque ficam apagadas', () => {
    const { machos, femeas } = abrirPassagem()

    maisUma(machos)
    const [primeira, segunda] = [parteN(machos, 1), parteN(machos, 2)]
    const deFemeas = parteN(femeas, 1)

    fireEvent.click(celula(/^F1B: posição vazia/, primeira))
    fireEvent.click(celula(/^F1C: caixa de estoque/, segunda))

    // a posição vazia da 1ª: apagada na 2ª (outra caixa dos machos) e nas fêmeas (os machos)
    expect(celula('F1B: já escolhida para outra caixa dos machos', segunda)).toHaveProperty('disabled', true)
    expect(celula('F1B: já escolhida para os machos', deFemeas)).toHaveProperty('disabled', true)
    // a própria parte ainda a vê e a tem marcada
    expect(celula(/^F1B: posição vazia/, primeira)).toHaveProperty('disabled', false)
    // a caixa de estoque da 2ª: apagada na 1ª
    expect(celula(/^F1C: caixa de estoque já escolhida para outra caixa dos machos/, primeira)).toHaveProperty('disabled', true)
    expect(celula(/^F1C: caixa de estoque com 6 machos/, segunda)).toHaveProperty('disabled', false)

    // as fêmeas escolhem a delas, e os machos veem que ela é das fêmeas
    fireEvent.click(celula(/^F1D: posição vazia/, deFemeas))
    expect(celula('F1D: já escolhida para as fêmeas', primeira)).toHaveProperty('disabled', true)
    expect(celula('F1D: já escolhida para as fêmeas', segunda)).toHaveProperty('disabled', true)
  })

  it('a parte nova começa sem destino marcado e vê o da primeira só como ocupado', () => {
    const { machos } = abrirPassagem()

    maisUma(machos)
    // nada escolhido ainda: nenhuma célula marcada em parte alguma
    expect(within(machos).queryAllByRole('button', { pressed: true })).toHaveLength(0)

    const [primeira, segunda] = [parteN(machos, 1), parteN(machos, 2)]
    fireEvent.click(celula(/^F1C: caixa de estoque/, primeira))

    // a 1ª mantém o destino marcado; a 2ª não marca nada e vê o lugar da 1ª apagado, sem a cor de estoque
    expect(celula(/^F1C: caixa de estoque/, primeira).getAttribute('aria-pressed')).toBe('true')
    expect(within(segunda).queryAllByRole('button', { pressed: true })).toHaveLength(0)
    const naSegunda = celula(/^F1C: caixa de estoque já escolhida/, segunda)
    expect(naSegunda).toHaveProperty('disabled', true)
    expect(naSegunda.className).not.toContain('miniGrade__celula--estoque')
    expect(naSegunda.className).not.toContain('miniGrade__celula--marcada')
  })

  it('a parte sem animais não segura o lugar que tinha', async () => {
    const { machos } = abrirPassagem()

    maisUma(machos)
    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 2)))
    expect(celula('F1B: já escolhida para outra caixa dos machos', parteN(machos, 1))).toHaveProperty('disabled', true)

    digitar('Quantos machos', '4', machos)
    digitar('Quantos machos na 2ª caixa', '0', machos)

    await waitFor(() => expect(celula(/^F1B: posição vazia/, parteN(machos, 1))).toHaveProperty('disabled', false))
  })

  it('o corpo: dividido vai a lista, o outro sexo com uma caixa vai como objeto, e a parte com 0 fica de fora', async () => {
    const { machos, femeas, passar } = abrirPassagem()

    maisUma(machos)
    maisUma(machos)
    // [2, 1, 1]: a do meio fica com 0
    digitar('Quantos machos na 2ª caixa', '0', machos)
    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 1)))
    fireEvent.click(celula(/^F1C: caixa de estoque/, parteN(machos, 3)))
    fireEvent.click(celula(/^F1D: posição vazia/, femeas))
    passar()

    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    expect(api.mudanca).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      machos: [
        {
          qtd: 2,
          dtNascimento: '2026-09-24',
          destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 2 } },
        },
        { qtd: 1, dtNascimento: '2026-09-24', destino: { idCaixa: 30 } },
      ],
      femeas: {
        qtd: 4,
        dtNascimento: '2026-09-24',
        destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 4 } },
      },
    })
  })

  it('se só uma caixa fica com animais, vai como objeto, não como lista de uma', async () => {
    const { machos, femeas, passar } = abrirPassagem()

    maisUma(machos)
    digitar('Quantos machos na 2ª caixa', '0', machos)
    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 1)))
    digitar('Quantas fêmeas', '0', femeas)
    passar()

    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    expect(api.mudanca).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      machos: {
        qtd: 2,
        dtNascimento: '2026-09-24',
        destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 2 } },
      },
    })
  })

  it('o erro do servidor cai na caixa certa, contando só as que foram mandadas (com uma de 0 no meio)', async () => {
    api.mudanca.mockRejectedValueOnce(
      erroDaApi(409, 'SEM_ANIMAIS', 'As caixas somam 5, mas so ha 4.', {
        'machos.1.destino': 'Esta caixa ja esta em outra parte.',
        'machos.0.qtd': 'Passa do total: sobram 2 para esta caixa.',
      }),
    )
    const { machos, femeas, passar } = abrirPassagem()

    maisUma(machos)
    maisUma(machos)
    digitar('Quantos machos na 2ª caixa', '0', machos)
    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 1)))
    fireEvent.click(celula(/^F1C: caixa de estoque/, parteN(machos, 3)))
    digitar('Quantas fêmeas', '0', femeas)
    passar()

    // machos.1 da API é a 3ª do formulário (a 2ª, de 0, não foi mandada); machos.0 é a 1ª
    expect(await within(parteN(machos, 3)).findByText('Esta caixa ja esta em outra parte.', {}, DEMORA)).toBeTruthy()
    expect(within(parteN(machos, 1)).getByText('Passa do total: sobram 2 para esta caixa.')).toBeTruthy()
    expect(within(parteN(machos, 2)).queryByText(/ja esta em outra parte|Passa do total/)).toBeNull()
  })

  it('com uma caixa só mandada, o erro vem sem índice e cai na caixa que foi (não na primeira)', async () => {
    api.mudanca.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        'machos.destino': 'Essa posicao ja tem uma caixa.',
      }),
    )
    const { machos, femeas, passar } = abrirPassagem()

    maisUma(machos)
    // a 1ª fica com 0, a 2ª leva os 4: só a 2ª é mandada
    digitar('Quantos machos', '0', machos)
    digitar('Quantos machos na 2ª caixa', '4', machos)
    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 2)))
    digitar('Quantas fêmeas', '0', femeas)
    passar()

    expect(await within(parteN(machos, 2)).findByText('Essa posicao ja tem uma caixa.', {}, DEMORA)).toBeTruthy()
    expect(within(parteN(machos, 1)).queryByText('Essa posicao ja tem uma caixa.')).toBeNull()
  })

  it('o pedido que a API pede para uma caixa da lista (machos.0.idPedido) cai no campo de qual pedido do sexo', async () => {
    api.mudanca.mockRejectedValueOnce(
      erroDaApi(409, 'PEDIDO_NAO_INDICADO', 'Os livres nao bastam.', {
        'machos.0.idPedido': 'Escolha um dos pedidos: #12, #15.',
      }),
    )
    const { machos, femeas, passar } = abrirPassagem([
      { idPedido: 12, m: 1, f: 0 },
      { idPedido: 15, m: 1, f: 0 },
    ])

    maisUma(machos)
    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 1)))
    fireEvent.click(celula(/^F1C: caixa de estoque/, parteN(machos, 2)))
    digitar('Quantas fêmeas', '0', femeas)
    passar()

    expect(await within(machos).findByText('Escolha um dos pedidos: #12, #15.', {}, DEMORA)).toBeTruthy()
    expect(within(machos).getByLabelText(/de qual pedido saem os machos reservados/)).toBeTruthy()
  })

  it('"Só os reservados do pedido" vale para todas as caixas, e o erro do pedido cai em "Quais"', async () => {
    api.mudanca.mockRejectedValueOnce(
      erroDaApi(409, 'SEM_ANIMAIS', 'Nao ha reservados que bastem.', {
        'machos.1.idPedido': 'Reservados do pedido #12 insuficientes.',
      }),
    )
    const { machos, femeas, passar } = abrirPassagem([{ idPedido: 12, m: 3, f: 0 }])

    await escolher('Quais machos', 'Só os reservados do pedido #12')
    await waitFor(() => expect(quantos(machos, 'Quantos machos')).toBe('3'))
    maisUma(machos)
    expect(quantos(machos, 'Quantos machos')).toBe('2')
    expect(quantos(machos, 'Quantos machos na 2ª caixa')).toBe('1')
    expect(within(machos).getByText('3 de 3 nas caixas')).toBeTruthy()

    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 1)))
    fireEvent.click(celula(/^F1C: caixa de estoque/, parteN(machos, 2)))
    digitar('Quantas fêmeas', '0', femeas)
    passar()

    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    const { machos: lista } = api.mudanca.mock.calls[0]?.[0] as { machos: unknown[] }
    expect(lista).toEqual([
      expect.objectContaining({ qtd: 2, idPedido: 12, soDoPedido: true }),
      expect.objectContaining({ qtd: 1, idPedido: 12, soDoPedido: true }),
    ])
    expect(await within(machos).findByText('Reservados do pedido #12 insuficientes.', {}, DEMORA)).toBeTruthy()
  })

  it('trocar o "Quais" volta o sexo a uma caixa só, com o destino da primeira', async () => {
    const { machos } = abrirPassagem([{ idPedido: 12, m: 2, f: 0 }])

    maisUma(machos)
    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 1)))
    expect(partesDe(machos)).toHaveLength(2)

    await escolher('Quais machos', 'Só os reservados do pedido #12')

    await waitFor(() => expect(partesDe(machos)).toHaveLength(1))
    expect(quantos(machos, 'Quantos machos')).toBe('2')
    expect(celula(/^F1B: posição vazia/, machos).getAttribute('aria-pressed')).toBe('true')
  })

  it('trocar a idade volta cada sexo a uma caixa só, com todos da idade nova', async () => {
    renderizar(
      <MudarAnimais
        caixa={caixaDoCasal}
        grupos={[
          { dtNascimento: '2026-09-24', vivos: { m: 6, f: 0 }, reservas: [], dtChegada: null },
          { dtNascimento: '2026-10-02', vivos: { m: 3, f: 0 }, reservas: [], dtChegada: null },
        ]}
        botao="Passar para outra caixa"
        aoTerminar={() => {}}
      />,
    )
    const machos = grupo('Machos')

    maisUma(machos)
    expect(partesDe(machos)).toHaveLength(2)

    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))

    await waitFor(() => expect(partesDe(machos)).toHaveLength(1))
    expect(quantos(machos, 'Quantos machos')).toBe('3')
    expect(talvezBotao('Tirar', machos)).toBeNull()
  })

  it('a mensagem de sucesso conta cada caixa, com "e" só antes da última', async () => {
    api.mudanca.mockResolvedValueOnce({
      caixas: [
        { idCaixa: 40, codigo: 'F1B', sexo: 'M', qtd: 2 },
        { idCaixa: 30, codigo: 'F1C', sexo: 'M', qtd: 1 },
        { idCaixa: 41, codigo: 'F1D', sexo: 'F', qtd: 4 },
      ],
      liberada: false,
    })
    const { machos, femeas, passar } = abrirPassagem()

    maisUma(machos)
    digitar('Quantos machos na 2ª caixa', '1', machos)
    fireEvent.click(celula(/^F1B: posição vazia/, parteN(machos, 1)))
    fireEvent.click(celula(/^F1C: caixa de estoque/, parteN(machos, 2)))
    fireEvent.click(celula(/^F1D: posição vazia/, femeas))
    passar()

    expect(
      await screen.findByText('2 machos para a F1B, 1 macho para a F1C e 4 fêmeas para a F1D.', {}, DEMORA),
    ).toBeTruthy()
  })

  it('a mensagem com uma caixa só segue como antes', async () => {
    api.mudanca.mockResolvedValueOnce({
      caixas: [{ idCaixa: 40, codigo: 'F1B', sexo: 'M', qtd: 4 }],
      liberada: true,
    })
    const { machos, femeas, passar } = abrirPassagem()

    fireEvent.click(celula(/^F1B: posição vazia/, machos))
    digitar('Quantas fêmeas', '0', femeas)
    passar()

    expect(
      await screen.findByText('4 machos para a F1B. A caixa F1A ficou vazia e foi liberada.', {}, DEMORA),
    ).toBeTruthy()
  })
})
