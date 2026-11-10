import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { GrupoDoEstoque } from '@/dominio/tipos'
import { hoje } from '@/lib/data'
import {
  aba,
  APAGADO,
  botao,
  catalogo,
  celula,
  casal,
  desmamado,
  diaNoCalendario,
  estanteE01,
  eventoDeBaixa,
  fichaDeEstoque,
  gradeE01,
  grupo,
  mutacaoComResposta,
  nomesDasAbas,
  selecao,
  talvezBotao,
  talvezGrupo,
} from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { FichaDoEstoque } from './EstoqueDaFicha'

const api = vi.hoisted(() => ({ baixa: vi.fn(), mudanca: vi.fn(), anulacao: vi.fn() }))

vi.mock('@/dominio/consultas', () => ({
  useBaixa: () => mutacaoComResposta(api.baixa),
  useMudanca: () => mutacaoComResposta(api.mudanca),
  useAnularBaixa: () => mutacaoComResposta(api.anulacao),
  useVirarCaixaDeEstoque: () => mutacaoComResposta(vi.fn()),
  useCatalogo: () => consulta(catalogo),
  useEstantes: () => consulta([estanteE01]),
  useGrade: () => consulta(gradeE01),
}))

beforeEach(() => {
  api.baixa.mockReset().mockResolvedValue({ baixas: { m: 1, f: 0 }, liberada: false, faltas: [] })
  api.mudanca.mockReset().mockResolvedValue({ caixas: [], liberada: false })
  api.anulacao.mockReset()
})

const DEMORA = { timeout: 10_000 }

/** a F1C com machos de duas idades: 6 de 24/09 (2 reservados para o #12) e 3 de 02/10 */
const comDuasIdades = fichaDeEstoque({
  total: 9,
  livre: 7,
  nascimentoAte: '2026-10-02',
  grupos: [
    ...fichaDeEstoque().grupos,
    {
      dtNascimento: '2026-10-02',
      idadeDias: 36,
      total: 3,
      reservados: 0,
      livres: 3,
      origens: [
        {
          idParto: 20,
          ordem: 2,
          casal: 'CD',
          codigoOrigem: 'F2A',
          numeroVisivelOrigem: 'E-02',
          qtd: 3,
        },
      ],
      pedidos: [],
      dtChegada: '2026-10-20',
    },
  ],
})

/** Hoje é o dia dado: só o relógio, para o calendário abrir no mês dele */
function fingirHoje(data: string) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(`${data}T12:00:00`))
}

afterEach(() => vi.useRealTimers())

describe('ficha da caixa de estoque', { timeout: 30_000 }, () => {
  it('mostra os vivos por idade, de onde vieram e o que cada pedido tem reservado nela', () => {
    renderizar(<FichaDoEstoque ficha={comDuasIdades} />)

    expect(screen.getByText('Nascidos em 24/09/2026, 44 dias')).toBeTruthy()
    expect(screen.getByText('6 machos: 2 reservados e 4 livres')).toBeTruthy()
    expect(screen.getByText('6 do 1º parto do casal AB, caixa F1A (E-01)')).toBeTruthy()
    expect(screen.getByText('3 do 2º parto do casal CD, caixa F2A (E-02)')).toBeTruthy()
    expect(screen.getByText('Pedido #12')).toBeTruthy()
    expect(nomesDasAbas()).toEqual(['Animais', 'Eventos'])
  })

  it('a caixa que já foi de casal mostra os casais de antes, sem ação', async () => {
    renderizar(
      <FichaDoEstoque
        ficha={fichaDeEstoque({
          casaisAnteriores: [{ casal: casal(1, 'AB', false), partos: [desmamado()] }],
        })}
      />,
    )

    fireEvent.click(aba('Casais anteriores'))

    expect(await screen.findByText('Casal AB · Wistar')).toBeTruthy()
    expect(
      screen.getByText(
        '1º parto: nasceu em 24/09/2026, 5 M e 5 F; desmame em 16/10/2026, 4 M e 4 F',
      ),
    ).toBeTruthy()
  })

  it('a caixa liberada diz quando e por quê, e não oferece ação', () => {
    const liberada = fichaDeEstoque({ total: 0, reservado: 0, livre: 0, grupos: [], pedidos: [] })
    renderizar(
      <FichaDoEstoque
        ficha={{
          ...liberada,
          caixa: {
            ...liberada.caixa,
            ativa: false,
            fase: null,
            atrasado: false,
            dtLiberacao: '2026-11-08',
            motivoLiberacao: 'entrega',
          },
        }}
      />,
    )

    expect(
      screen.getByText(/^Caixa liberada em 08\/11\/2026: a entrega levou os últimos animais/),
    ).toBeTruthy()
    expect(talvezBotao('Baixa')).toBeNull()
    expect(talvezBotao('Mudar animais')).toBeNull()
  })

  it('a baixa pede de qual idade e manda os machos dela', async () => {
    renderizar(<FichaDoEstoque ficha={comDuasIdades} />)

    fireEvent.click(botao('Baixa'))
    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))
    fireEvent.change(screen.getByLabelText('Machos'), { target: { value: '1' } })
    fireEvent.click(botao('Registrar baixa'))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith({
      idCaixa: 30,
      dtFato: hoje(),
      itens: [{ sexo: 'M', qtd: 1, dtNascimento: '2026-10-02' }],
    })
  })

  it('mudar animais leva para outra caixa de machos da linhagem, ou para uma posição vazia', async () => {
    renderizar(<FichaDoEstoque ficha={fichaDeEstoque()} />)

    fireEvent.click(botao('Mudar animais'))
    const machos = grupo('Machos')

    // a própria F1C não recebe; a de fêmeas e a de outra linhagem ficam apagadas
    expect(celula(/^F1C: a caixa de onde/, machos)).toHaveProperty('disabled', true)
    expect(celula('F1E: ocupada', machos)).toHaveProperty('disabled', true)
    expect(celula('F1F: ocupada', machos)).toHaveProperty('disabled', true)
    expect(talvezGrupo('Fêmeas')).toBeNull()

    fireEvent.change(within(machos).getByLabelText('Quantos machos'), { target: { value: '3' } })
    fireEvent.click(celula(/^F1D: posição vazia/, machos))
    fireEvent.click(botao('Mudar animais'))

    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    expect(api.mudanca).toHaveBeenCalledWith({
      idCaixa: 30,
      dtFato: hoje(),
      machos: {
        qtd: 3,
        dtNascimento: '2026-09-24',
        destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 4 } },
      },
    })
  })

  it('levar só os reservados de um pedido vale na idade que os tem', async () => {
    renderizar(<FichaDoEstoque ficha={comDuasIdades} />)

    fireEvent.click(botao('Mudar animais'))
    // os 2 reservados do #12 são de 24/09, a idade que a mudança abre
    fireEvent.mouseDown(selecao('Quais machos'))
    fireEvent.click(await screen.findByTitle('Só os reservados do pedido #12'))
    await waitFor(() =>
      expect(within(grupo('Machos')).getByLabelText('Quantos machos')).toHaveProperty('value', '2'),
    )

    // a de 02/10 não tem reservado: volta aos livres, todos dela, sem escolher pedido
    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))
    await waitFor(() => expect(screen.queryByLabelText('Quais machos')).toBeNull())
    expect(within(grupo('Machos')).getByLabelText('Quantos machos')).toHaveProperty('value', '3')
  })

  it('"só os do pedido" oferece só os pedidos com reservado na idade escolhida', async () => {
    // o #12 tem 2 machos de 24/09 e o #15, 1 de 02/10
    const [velhos, novos] = comDuasIdades.grupos as [GrupoDoEstoque, GrupoDoEstoque]
    renderizar(
      <FichaDoEstoque
        ficha={{
          ...comDuasIdades,
          reservado: 3,
          pedidos: [
            { idPedido: 12, qtd: 2 },
            { idPedido: 15, qtd: 1 },
          ],
          grupos: [
            velhos,
            { ...novos, reservados: 1, livres: 2, pedidos: [{ idPedido: 15, qtd: 1 }] },
          ],
        }}
      />,
    )

    fireEvent.click(botao('Mudar animais'))
    fireEvent.mouseDown(selecao('Quais machos'))
    expect(await screen.findByTitle('Só os reservados do pedido #12')).toBeTruthy()
    expect(screen.queryByTitle('Só os reservados do pedido #15')).toBeNull()

    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))
    fireEvent.mouseDown(selecao('Quais machos'))
    fireEvent.click(await screen.findByTitle('Só os reservados do pedido #15'))
    await waitFor(() =>
      expect(within(grupo('Machos')).getByLabelText('Quantos machos')).toHaveProperty('value', '1'),
    )
    expect(screen.queryByTitle('Só os reservados do pedido #12')).toBeNull()
  })

  it('a baixa não fica antes da chegada dos animais da idade na caixa', async () => {
    fingirHoje('2026-10-25')
    renderizar(<FichaDoEstoque ficha={comDuasIdades} />)

    fireEvent.click(botao('Baixa'))
    // os de 24/09 chegaram em 16/10
    fireEvent.click(screen.getByLabelText('Data'))
    await waitFor(() => expect(diaNoCalendario('2026-10-16')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-15')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-16')).not.toContain(APAGADO)

    // os de 02/10 chegaram em 20/10
    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))
    await waitFor(() => expect(diaNoCalendario('2026-10-19')).toContain(APAGADO))
    expect(diaNoCalendario('2026-10-20')).not.toContain(APAGADO)
  })

  it('a mudança não fica antes da chegada; sem chegada, vale o nascimento', async () => {
    fingirHoje('2026-10-25')
    const [velhos, novos] = comDuasIdades.grupos as [GrupoDoEstoque, GrupoDoEstoque]
    renderizar(
      <FichaDoEstoque
        ficha={{ ...comDuasIdades, grupos: [velhos, { ...novos, dtChegada: null }] }}
      />,
    )

    fireEvent.click(botao('Mudar animais'))
    fireEvent.click(screen.getByLabelText('Data da mudança'))
    await waitFor(() => expect(diaNoCalendario('2026-10-16')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-15')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-16')).not.toContain(APAGADO)

    fireEvent.click(screen.getByLabelText(/^nascidos em 02\/10\/2026/))
    await waitFor(() => expect(diaNoCalendario('2026-10-15')).not.toContain(APAGADO))
    expect(diaNoCalendario('2026-10-01')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-02')).not.toContain(APAGADO)
  })

  it('os eventos da caixa ficam na aba deles, com o Anular na baixa', async () => {
    renderizar(
      <FichaDoEstoque
        ficha={fichaDeEstoque({
          eventos: [
            eventoDeBaixa(50, 'Baixa de 1 macho nesta caixa.', {
              sexos: { m: 1, f: 0 },
              idLinhagem: 1,
              voltaNaOrigem: true,
            }),
          ],
        })}
      />,
    )

    fireEvent.click(aba('Eventos'))

    expect(await screen.findByText('Baixa de 1 macho nesta caixa.')).toBeTruthy()
    expect(botao('Anular')).toBeTruthy()
  })

  it('a baixa de quando a caixa era de casal volta para o estoque da linhagem que o evento diz', async () => {
    api.anulacao.mockResolvedValueOnce({
      voltaram: [{ sexo: 'M', qtd: 2, idCaixa: 32, codigo: 'F1F' }],
      soltos: { m: 0, f: 0 },
    })
    renderizar(
      <FichaDoEstoque
        ficha={fichaDeEstoque({
          // o AB, Swiss, teve a ninhada aqui antes de a caixa virar estoque de machos Wistar
          casaisAnteriores: [
            {
              casal: { ...casal(1, 'AB', false), linhagem: 'Swiss', idLinhagem: 2 },
              partos: [desmamado()],
            },
          ],
          eventos: [
            eventoDeBaixa(
              51,
              'Baixa de 2 machos nesta caixa.',
              { sexos: { m: 2, f: 0 }, idLinhagem: 2, voltaNaOrigem: false },
              '2026-10-01T00:00:00.000Z',
            ),
          ],
        })}
      />,
    )
    fireEvent.click(aba('Eventos'))
    const linha = (await screen.findByText('Baixa de 2 machos nesta caixa.')).closest(
      'li',
    ) as HTMLElement

    fireEvent.click(botao('Anular', linha))
    fireEvent.change(within(linha).getByLabelText('Por que a baixa foi um engano'), {
      target: { value: 'contada duas vezes' },
    })

    // a própria F1C não recebe a si mesma; a F1F, de machos Swiss como a baixa, recebe
    expect(within(linha).queryByText(/voltam as fêmeas/)).toBeNull()
    expect(celula(/^F1C: a caixa de onde/, linha)).toHaveProperty('disabled', true)
    expect(celula(/^F1F: caixa de estoque com 2 machos/, linha)).toHaveProperty('disabled', false)
    fireEvent.click(celula(/^F1F: caixa de estoque/, linha))
    fireEvent.click(botao('Anular baixa', linha))

    await waitFor(() => expect(api.anulacao).toHaveBeenCalled(), DEMORA)
    expect(api.anulacao).toHaveBeenCalledWith({
      idOcorrencia: 51,
      motivo: 'contada duas vezes',
      idCaixaMachos: 32,
    })
  })

  it('a caixa liberada por uma baixa mostra o evento com o Anular, e mais nenhuma ação', async () => {
    const liberada = fichaDeEstoque({
      total: 0,
      reservado: 0,
      livre: 0,
      grupos: [],
      pedidos: [],
      eventos: [
        eventoDeBaixa(52, 'Baixa de 6 machos nesta caixa.', {
          sexos: { m: 6, f: 0 },
          idLinhagem: 1,
          voltaNaOrigem: false,
        }),
      ],
    })
    renderizar(
      <FichaDoEstoque
        ficha={{
          ...liberada,
          caixa: {
            ...liberada.caixa,
            ativa: false,
            fase: null,
            atrasado: false,
            dtLiberacao: '2026-10-20',
            motivoLiberacao: 'baixa',
          },
        }}
      />,
    )

    expect(
      screen.getByText(/^Caixa liberada em 20\/10\/2026: a baixa dos últimos animais/),
    ).toBeTruthy()
    expect(talvezBotao('Baixa')).toBeNull()
    expect(talvezBotao('Mudar animais')).toBeNull()
    fireEvent.click(aba('Eventos'))
    expect(await screen.findByText('Baixa de 6 machos nesta caixa.')).toBeTruthy()
    expect(botao('Anular')).toBeTruthy()
  })
})
