import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { LugarCandidato, Pedido, ResultadoDaBusca } from '@/dominio/tipos'
import { botao, erroDaApi } from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { AtenderPedido } from './AtenderPedido'

const aprovado: Pedido = {
  id: 12,
  dataPedido: '2026-11-02',
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
  dataEntregue: null,
  observacoes: null,
  status: 'aprovado',
  motivoRecusa: null,
  reservaEmFalta: null,
}

/** O reservado que perdeu 1 macho e 1 fêmea numa baixa: a janela completa só isso */
const emFalta: Pedido = {
  ...aprovado,
  status: 'reservado',
  reservaEmFalta: { m: 1, f: 1, qualquer: 0 },
}

const lugar = (dados: Partial<LugarCandidato>): LugarCandidato => ({
  idCaixa: 4,
  codigo: 'F1A',
  numeroVisivel: 'E-01',
  tipo: 'casal',
  dtNascimento: '2026-11-03',
  idadeNaEntrega: 28,
  origem: 'previsao',
  livres: { m: 2, f: 2 },
  partos: [{ ordem: 2, casal: 'AB' }],
  alocar: { m: 0, f: 0 },
  sugerida: false,
  ...dados,
})

/** o "3 de 4" do placar no rótulo dado, com a classe que diz se está completo */
const placar = (rotulo: string) => {
  const conta = screen.getByText(rotulo).closest('.atender__dado')?.querySelector('dd')
  if (!conta) throw new Error(`sem ${rotulo} no placar`)
  return conta
}

const estado = vi.hoisted(() => ({
  busca: null as ResultadoDaBusca | null,
  mutate: vi.fn(),
}))

vi.mock('@/dominio/consultas', () => ({
  useAtendimento: () => consulta(estado.busca),
  useAlocar: () => ({ mutate: estado.mutate, isPending: false }),
}))

const resultado = (candidatas: LugarCandidato[], falta = { m: 0, f: 0, qualquer: 0 }) => ({
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

/** a janela sem nenhum lugar que sirva, com 12 de qualquer sexo: de 2 a 4 acasalamentos */
const semNenhum = (
  formarCasais: ResultadoDaBusca['acasalamentoNovo']['formarCasais'],
  acasalamentos = { min: 2, max: 4 },
) => ({
  ...resultado([], { m: 0, f: 0, qualquer: 12 }),
  casaisAFormar: 2,
  acasalamentoNovo: { dataMinimaDeEntrega: daqui(44), viavel: true, formarCasais, acasalamentos },
})

function abrir(
  pedido: Pedido = aprovado,
  acoes: Partial<Record<'aoFechar' | 'aoConcluir' | 'aoRecusar', () => void>> = {},
) {
  return renderizar(
    <AtenderPedido
      pedido={pedido}
      aoFechar={acoes.aoFechar ?? (() => {})}
      aoConcluir={acoes.aoConcluir ?? (() => {})}
      aoRecusar={acoes.aoRecusar ?? (() => {})}
    />,
  )
}

const abrirSemNenhum = () => abrir({ ...aprovado, machos: 0, femeas: 0, qualquer: 12 })

const reservar = () => botao('Reservar')

/** a mutação responde como a API: o sucesso com a resposta dada, ou a recusa */
function responder(resposta: { sucesso: unknown } | { erro: Error }) {
  estado.mutate.mockImplementation(
    (_dados: unknown, opcoes: { onSuccess: (r: unknown) => void; onError: (e: Error) => void }) =>
      'erro' in resposta ? opcoes.onError(resposta.erro) : opcoes.onSuccess(resposta.sucesso),
  )
}

beforeEach(() => {
  estado.mutate.mockReset()
  // F1A é a sugestão e cobre o pedido; F2B, a mesma caixa de estoque com duas idades, fica de
  // alternativa
  estado.busca = resultado([
    lugar({ sugerida: true, alocar: { m: 2, f: 2 } }),
    lugar({
      idCaixa: 5,
      codigo: 'F2B',
      tipo: 'estoque',
      dtNascimento: '2026-11-01',
      idadeNaEntrega: 30,
      origem: 'de_fato',
      livres: { m: 1, f: 0 },
      partos: [{ ordem: 1, casal: 'CD' }],
    }),
    lugar({
      idCaixa: 5,
      codigo: 'F2B',
      tipo: 'estoque',
      dtNascimento: '2026-11-04',
      idadeNaEntrega: 27,
      origem: 'de_fato',
      livres: { m: 3, f: 0 },
      partos: [{ ordem: 1, casal: 'EF' }],
    }),
  ])
})

describe('reservar os animais do pedido aprovado', { timeout: 30_000 }, () => {
  it('a ninhada do cadastro inicial aparece como Cadastro inicial, sem casal nem parto', () => {
    estado.busca = resultado([
      lugar({
        idCaixa: 8,
        codigo: 'F3A',
        tipo: 'estoque',
        dtNascimento: '2026-10-05',
        origem: 'de_fato',
        sugerida: true,
        alocar: { m: 2, f: 2 },
        partos: [{ ordem: null, casal: null }],
      }),
    ])
    abrir()

    expect(screen.getByText('Cadastro inicial · nascidos em 05/10/2026')).toBeTruthy()
    expect(screen.queryByText(/parto do casal/)).toBeNull()
    expect(screen.getByLabelText('Reservar da caixa F3A, nascimento em 05/10/2026')).toBeTruthy()
  })

  it('com a sugestão cobrindo o pedido, reserva o lugar marcado: a caixa e a data de nascimento', () => {
    abrir()

    // o placar diz que o pedido está coberto, sem frase
    expect(placar('Machos').textContent).toBe('2 de 2')
    expect(placar('Machos').className).toContain('completa')
    expect(placar('Fêmeas').textContent).toBe('2 de 2')
    expect(screen.getByText('aceita de 25 a 31')).toBeTruthy()
    // só o lugar da caixa do casal ainda mama
    expect(screen.getAllByText('Desmama até a entrega')).toHaveLength(1)
    fireEvent.click(reservar())

    expect(estado.mutate).toHaveBeenCalledWith(
      {
        idPedido: 12,
        itens: [{ idCaixa: 4, dtNascimento: '2026-11-03', machos: 2, femeas: 2 }],
      },
      expect.anything(),
    )
  })

  it('recusada e recarregada a busca, o lugar com menos livres que o marcado prende o envio', () => {
    estado.mutate.mockImplementationOnce(
      (_dados: unknown, opcoes: { onError: (e: Error) => void }) => {
        // outra pessoa reservou um macho da F1A: a busca volta com 1 livre
        estado.busca = resultado([
          lugar({ sugerida: true, alocar: { m: 1, f: 2 }, livres: { m: 1, f: 2 } }),
        ])
        opcoes.onError(erroDaApi(409, 'SEM_ANIMAIS', 'Os animais mudaram.'))
      },
    )
    abrir()
    // a reserva marcada à mão: 2 machos e 2 fêmeas da F1A
    fireEvent.click(screen.getByLabelText('Reservar da caixa F2B, nascimento em 04/11/2026'))
    fireEvent.click(reservar())

    expect(
      screen.getByText(
        'Livres agora na F1A, desta idade: 1 macho e 2 fêmeas. Ajuste o que reservar dela.',
      ),
    ).toBeTruthy()
    expect(reservar()).toHaveProperty('disabled', true)
  })

  it('cada lugar diz a caixa, quando os animais nasceram e de que parto vieram', () => {
    abrir()

    expect(screen.getAllByText('F2B')).toHaveLength(2)
    expect(screen.getByText('Nascimento em 01/11/2026 · 1º parto do casal CD')).toBeTruthy()
    expect(screen.getByText('Nascimento em 04/11/2026 · 1º parto do casal EF')).toBeTruthy()
    expect(screen.getAllByText('caixa de estoque · E-01')).toHaveLength(2)
    expect(screen.getByText('caixa do casal · E-01')).toBeTruthy()
    // marcado, cada sexo diz de quantos livres; desmarcado, só quantos livres tem
    const lugares = document.querySelector<HTMLElement>('.atender__lista')!
    expect(within(lugares).getAllByText('de 2')).toHaveLength(2)
    expect(screen.getByText('1 livre')).toBeTruthy()
    expect(screen.getByText('3 livres')).toBeTruthy()
  })

  it('a janela é a de reservar os animais, e diz quando ficaram reservados', async () => {
    responder({
      sucesso: { idPedido: 12, status: 'reservado', reservados: { m: 2, f: 2 }, falta: null },
    })
    const fechar = vi.fn()
    const concluir = vi.fn()
    abrir(aprovado, { aoFechar: fechar, aoConcluir: concluir })

    expect(screen.getByText('Reservar animais do pedido #12')).toBeTruthy()
    fireEvent.click(reservar())

    expect(await screen.findByText('Animais reservados para o pedido #12.')).toBeTruthy()
    // reservado, fecha também o pedido aberto embaixo
    expect(concluir).toHaveBeenCalled()
    expect(fechar).not.toHaveBeenCalled()
  })

  it('a equipe ajusta a sugestão e completa com outro lugar da mesma caixa', async () => {
    abrir()

    fireEvent.change(
      screen.getByLabelText('Machos a reservar da caixa F1A, nascimento em 03/11/2026'),
      { target: { value: '1' } },
    )
    await waitFor(() => expect(placar('Machos').textContent).toBe('1 de 2'))
    expect(placar('Machos').className).not.toContain('completa')
    expect(reservar()).toHaveProperty('disabled', true)

    // marcado, o outro lugar entra com o que falta
    fireEvent.click(screen.getByLabelText('Reservar da caixa F2B, nascimento em 04/11/2026'))
    await waitFor(() => expect(reservar()).toHaveProperty('disabled', false))
    fireEvent.click(reservar())

    expect(estado.mutate).toHaveBeenCalledWith(
      {
        idPedido: 12,
        itens: [
          { idCaixa: 4, dtNascimento: '2026-11-03', machos: 1, femeas: 2 },
          { idCaixa: 5, dtNascimento: '2026-11-04', machos: 1, femeas: 0 },
        ],
      },
      expect.anything(),
    )
  })

  it('o que passa do pedido não vai, e o aviso diz quanto sobra', async () => {
    abrir()

    fireEvent.click(screen.getByLabelText('Reservar da caixa F2B, nascimento em 01/11/2026'))
    // o pedido já estava coberto: o lugar entra vazio, e a equipe põe 1 macho a mais
    fireEvent.change(
      screen.getByLabelText('Machos a reservar da caixa F2B, nascimento em 01/11/2026'),
      { target: { value: '1' } },
    )

    expect(await screen.findByText('Há 1 macho a mais nas caixas marcadas.')).toBeTruthy()
    expect(reservar()).toHaveProperty('disabled', true)
  })

  it('o zero fica no placeholder: apagado o número, o campo não volta como "0"', () => {
    abrir()

    fireEvent.click(screen.getByLabelText('Reservar da caixa F2B, nascimento em 01/11/2026'))
    const machos = screen.getByLabelText<HTMLInputElement>(
      'Machos a reservar da caixa F2B, nascimento em 01/11/2026',
    )
    // o pedido já estava coberto: o lugar entra com 0, que aparece só no placeholder
    expect(machos.value).toBe('')
    expect(machos.placeholder).toBe('0')

    fireEvent.change(machos, { target: { value: '1' } })
    expect(machos.value).toBe('1')
    fireEvent.change(machos, { target: { value: '' } })
    expect(machos.value).toBe('')
  })

  it('sem animais para o pedido inteiro, não aceita e diz o que seria preciso para a entrega', () => {
    estado.busca = resultado(
      [lugar({ sugerida: true, livres: { m: 2, f: 1 }, alocar: { m: 2, f: 1 } })],
      {
        m: 0,
        f: 1,
        qualquer: 0,
      },
    )
    const recusar = vi.fn()
    abrir(aprovado, { aoRecusar: recusar })

    expect(reservar()).toHaveProperty('disabled', true)
    expect(placar('Fêmeas').textContent).toBe('1 de 2')
    expect(screen.getByText('As caixas não têm animais para o pedido inteiro.')).toBeTruthy()
    expect(
      screen.getByText(
        'Para o que falta, seria necessário cerca de 1 acasalamento até 14/10/2026, e essa data já passou.',
      ),
    ).toBeTruthy()

    fireEvent.click(botao('Recusar'))
    expect(recusar).toHaveBeenCalled()
  })

  it('sem nenhum lugar, diz só que não há animais, quantos casais formar e quando', () => {
    estado.busca = semNenhum({ de: daqui(5), ate: daqui(10) })
    abrirSemNenhum()

    expect(screen.getByText('Não há animais para esta entrega com a idade pedida.')).toBeTruthy()
    expect(
      screen.getByText(
        `Para atender este pedido, são necessários cerca de 2 a 4 acasalamentos entre ${naTela(5)} e ${naTela(10)}.`,
      ),
    ).toBeTruthy()
    // e mais nada: nem o placar, nem os lugares
    expect(screen.queryByText('Idade na entrega')).toBeNull()
  })

  it('a janela de um dia só diz o dia; a que já começou vai de hoje até o fim', () => {
    // e as duas contas dando o mesmo, um número só
    estado.busca = semNenhum({ de: daqui(7), ate: daqui(7) }, { min: 2, max: 2 })
    const umDia = abrirSemNenhum()
    expect(
      screen.getByText(
        `Para atender este pedido, são necessários cerca de 2 acasalamentos em ${naTela(7)}.`,
      ),
    ).toBeTruthy()
    umDia.unmount()

    estado.busca = semNenhum({ de: daqui(-3), ate: daqui(4) })
    abrirSemNenhum()
    expect(
      screen.getByText(
        `Para atender este pedido, são necessários cerca de 2 a 4 acasalamentos entre hoje e ${naTela(4)}.`,
      ),
    ).toBeTruthy()
  })

  it('sem idade aceita que chegue desmamada, diz que não há quando formar', () => {
    estado.busca = semNenhum(null)
    abrirSemNenhum()

    expect(
      screen.getByText(
        'Para atender este pedido, não há quando acasalar: na idade pedida, os filhotes ainda não estariam desmamados.',
      ),
    ).toBeTruthy()
  })
})

describe('a recusa da reserva', { timeout: 30_000 }, () => {
  it('reservado por outra pessoa antes: avisa e fecha, e a lista mostra o pedido reservado', async () => {
    responder({
      erro: erroDaApi(409, 'PEDIDO_JA_RESERVADO', 'Os animais do pedido #12 ja estao reservados.'),
    })
    const concluir = vi.fn()
    abrir(aprovado, { aoConcluir: concluir })

    fireEvent.click(reservar())

    expect(await screen.findByText('Os animais do pedido #12 ja estao reservados.')).toBeTruthy()
    expect(concluir).toHaveBeenCalled()
  })

  it('a outra recusa fica na janela, para a equipe escolher outro lugar', async () => {
    responder({
      erro: erroDaApi(
        409,
        'SEM_ANIMAIS',
        'A caixa F1A tem 1 macho livre do nascimento de 03/11/2026, e a reserva pediu 2.',
      ),
    })
    const concluir = vi.fn()
    abrir(aprovado, { aoConcluir: concluir })

    fireEvent.click(reservar())

    expect(
      (await screen.findByText(/A caixa F1A tem 1 macho livre/)).closest('[role="alert"]'),
    ).toBeTruthy()
    expect(concluir).not.toHaveBeenCalled()
  })
})

describe('completar a reserva em falta', { timeout: 30_000 }, () => {
  beforeEach(() => {
    // a busca procura só a falta: a sugestão completa 1 macho e 1 fêmea
    estado.busca = resultado([
      lugar({ sugerida: true, livres: { m: 2, f: 2 }, alocar: { m: 1, f: 1 } }),
      lugar({
        idCaixa: 5,
        codigo: 'F2B',
        tipo: 'estoque',
        dtNascimento: '2026-11-01',
        livres: { m: 3, f: 0 },
      }),
    ])
  })

  it('a janela diz o que falta e conta só a falta no placar', () => {
    abrir(emFalta)

    expect(screen.getByText('Completar a reserva do pedido #12')).toBeTruthy()
    expect(
      screen.getByText(
        'A reserva deste pedido está em falta: faltam 1 macho e 1 fêmea. Os que continuam reservados ficam; marque de qual caixa completar.',
      ),
    ).toBeTruthy()
    expect(placar('Machos').textContent).toBe('1 de 1')
    expect(placar('Fêmeas').textContent).toBe('1 de 1')
  })

  it('completa aos poucos: só o macho que há, e a resposta diz o que ainda falta', async () => {
    responder({
      sucesso: {
        idPedido: 12,
        status: 'reservado',
        reservados: { m: 1, f: 0 },
        falta: { m: 0, f: 1, qualquer: 0 },
      },
    })
    abrir(emFalta)

    fireEvent.change(
      screen.getByLabelText('Fêmeas a reservar da caixa F1A, nascimento em 03/11/2026'),
      { target: { value: '0' } },
    )
    await waitFor(() => expect(placar('Fêmeas').textContent).toBe('0 de 1'))
    expect(botao('Completar')).toHaveProperty('disabled', false)
    fireEvent.click(botao('Completar'))

    expect(estado.mutate).toHaveBeenCalledWith(
      { idPedido: 12, itens: [{ idCaixa: 4, dtNascimento: '2026-11-03', machos: 1, femeas: 0 }] },
      expect.anything(),
    )
    expect(
      await screen.findByText('Reserva do pedido #12 completada em parte: ainda falta 1 fêmea.'),
    ).toBeTruthy()
  })

  it('não passa do que falta', async () => {
    abrir(emFalta)

    fireEvent.change(
      screen.getByLabelText('Machos a reservar da caixa F1A, nascimento em 03/11/2026'),
      { target: { value: '2' } },
    )

    await waitFor(() => expect(botao('Completar')).toHaveProperty('disabled', true))
    expect(screen.getByText('Há 1 macho a mais nas caixas marcadas.')).toBeTruthy()
  })

  it('completo, diz que a reserva está completa', async () => {
    responder({
      sucesso: { idPedido: 12, status: 'reservado', reservados: { m: 1, f: 1 }, falta: null },
    })
    abrir(emFalta)

    fireEvent.click(botao('Completar'))

    expect(await screen.findByText('Reserva do pedido #12 completa.')).toBeTruthy()
  })

  it('sem lugar que sirva, diz que não há animais livres para completar', () => {
    estado.busca = semNenhum({ de: daqui(5), ate: daqui(10) })
    abrir(emFalta)

    expect(
      screen.getByText('Não há animais livres para completar a reserva com a idade pedida.'),
    ).toBeTruthy()
    expect(screen.getByText(/^Para completar, são necessários/)).toBeTruthy()
  })
})

describe('reservar no celular', { timeout: 30_000 }, () => {
  it('Cancelar e Reservar dividem o rodapé, e o Recusar vai para o fim da janela, longe deles', () => {
    const voltar = larguraDaTela(390)
    try {
      estado.busca = resultado([lugar({ sugerida: true, alocar: { m: 2, f: 2 } })])
      const recusar = vi.fn()
      abrir(aprovado, { aoRecusar: recusar })

      const rodape = document.querySelector<HTMLElement>('.ant-modal-footer')!
      expect(botao('Cancelar', rodape)).toBeTruthy()
      expect(botao('Reservar', rodape)).toBeTruthy()
      expect(within(rodape).queryByText('Recusar')).toBeNull()

      fireEvent.click(botao('Recusar o pedido'))
      expect(recusar).toHaveBeenCalled()
    } finally {
      voltar()
    }
  })
})
