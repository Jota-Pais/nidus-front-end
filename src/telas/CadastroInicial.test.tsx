import { fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  APAGADO,
  botao,
  casal,
  catalogo,
  diaNoCalendario,
  erroDaApi,
  fichaDeCasal,
  fichaDeEstoque,
  mutacaoComResposta,
  parto,
  selecao,
} from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
import { FichaDaCaixa } from './FichaDaCaixa'
import type { PosicaoVazia } from './FichaDaCaixa'

const api = vi.hoisted(() => ({
  ficha: undefined as unknown,
  formar: vi.fn(),
  criar: vi.fn(),
  entrada: vi.fn(),
}))

vi.mock('@/dominio/consultas', () => ({
  useFicha: () => consulta(api.ficha),
  useCatalogo: () => consulta(catalogo),
  useFormarCasal: () => mutacaoComResposta(api.formar),
  useNovaCaixaDeEstoque: () => mutacaoComResposta(api.criar),
  useEntradaNaCaixa: () => mutacaoComResposta(api.entrada),
  useRegistrarNaFicha: () => mutacaoComResposta(vi.fn()),
  useCorrigirEvento: () => mutacaoComResposta(vi.fn()),
  useCorrigirAcasalamento: () => mutacaoComResposta(vi.fn()),
  useSemNinhada: () => mutacaoComResposta(vi.fn()),
  useMudanca: () => mutacaoComResposta(vi.fn()),
  useBaixa: () => mutacaoComResposta(vi.fn()),
  useAnularBaixa: () => mutacaoComResposta(vi.fn()),
  useVirarCaixaDeEstoque: () => mutacaoComResposta(vi.fn()),
  useEstantes: () => consulta([]),
  useGrade: () => consulta({ faces: [] }),
  useMudarDePosicao: () => ({ mutate: vi.fn(), isPending: false }),
}))

const DEMORA = { timeout: 10_000 }

const vazia: PosicaoVazia = {
  idEstante: 1,
  face: 'frontal',
  linha: 1,
  coluna: 2,
  codigo: 'F1B',
  sala: 'Sala 1',
  numeroVisivel: 'E-01',
}

const POSICAO = { idEstante: 1, face: 'frontal', linha: 1, coluna: 2 }

beforeEach(() => {
  // só o relógio: hoje é 30/10/2026
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-10-30T12:00:00'))
  api.ficha = undefined
  api.formar.mockReset().mockResolvedValue({ idCaixa: 50 })
  api.criar.mockReset().mockResolvedValue({ idCaixa: 51, codigo: 'F1B' })
  api.entrada.mockReset().mockResolvedValue({})
})

afterEach(() => vi.useRealTimers())

function abrirPosicaoVazia() {
  renderizar(<FichaDaCaixa idCaixa={null} posicaoVazia={vazia} aoFechar={() => {}} />)
}

/** Escolhe a opção que acabou de abrir: o antd deixa no DOM as listas que já fechou */
async function escolher(rotulo: string, opcao: string) {
  fireEvent.mouseDown(selecao(rotulo))
  const opcoes = await screen.findAllByTitle(opcao)
  fireEvent.click(opcoes[opcoes.length - 1] as HTMLElement)
}

const segmento = (texto: string) =>
  screen.getByText(texto, { selector: '.ant-segmented-item-label' })

function digitarNascimento(texto: string) {
  const campo = screen.getByLabelText('Data de nascimento')
  fireEvent.mouseDown(campo)
  fireEvent.change(campo, { target: { value: texto } })
  fireEvent.keyDown(campo, { key: 'Enter', code: 'Enter' })
}

describe('formar casal no Nº parto', { timeout: 40_000 }, () => {
  it('o parto atual começa no 1º e a ajuda diz para que serve', () => {
    abrirPosicaoVazia()

    expect(screen.getByText('Parto atual')).toBeTruthy()
    expect(
      screen.getByText('Se o casal já teve partos antes do Nidus, escolha em qual ele está'),
    ).toBeTruthy()
    expect(segmento('1º').closest('.ant-segmented-item')?.className ?? '').toContain(
      'ant-segmented-item-selected',
    )
    expect(
      [...document.querySelectorAll('.ant-segmented-item-label')].map((no) => no.textContent),
    ).toEqual(expect.arrayContaining(['1º', '2º', '3º', '4º', '5º']))
  })

  it('manda o parto atual escolhido para a API', async () => {
    abrirPosicaoVazia()

    await escolher('Linhagem', 'Wistar')
    await escolher('Grupo do macho (A-E)', 'A')
    await escolher('Grupo da fêmea (A-E)', 'B')
    fireEvent.click(segmento('3º'))
    fireEvent.click(botao('Formar casal', document.body))

    await waitFor(() => expect(api.formar).toHaveBeenCalled(), DEMORA)
    expect(api.formar).toHaveBeenCalledWith({
      posicao: POSICAO,
      idLinhagem: 1,
      grupoMacho: 'A',
      grupoFemea: 'B',
      dtFormacao: '2026-10-30',
      partoAtual: 3,
    })
  })

  it('na ficha de um casal formado no 3º parto, as pílulas 1 e 2 ficam apagadas e a linha diz por quê', () => {
    api.ficha = fichaDeCasal({
      casal: { ...casal(1, 'AB', true), partoInicial: 3 },
      partos: [parto({ id: 12, ordem: 3, dtPartoReal: null, nascidoM: null, nascidoF: null })],
    })
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    const pilula = (ordem: string) =>
      screen.getByText(ordem, { selector: 'button.ficha__parto' }) as HTMLButtonElement

    expect(pilula('1º').disabled).toBe(true)
    expect(pilula('2º').disabled).toBe(true)
    expect(pilula('3º').disabled).toBe(false)
    expect(pilula('3º').getAttribute('aria-pressed')).toBe('true')
    expect(screen.getByText('1º e 2º partos antes do Nidus')).toBeTruthy()
    // o contador conta os dois partos de antes do Nidus
    expect(screen.getByText('2/5')).toBeTruthy()

    fireEvent.click(pilula('1º'))
    expect(pilula('3º').getAttribute('aria-pressed')).toBe('true')
  })

  it('o casal formado no 1º parto não tem pílula apagada nem a linha', () => {
    api.ficha = fichaDeCasal()
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    expect(
      [...document.querySelectorAll<HTMLButtonElement>('button.ficha__parto')].some(
        (b) => b.disabled,
      ),
    ).toBe(false)
    expect(screen.queryByText(/antes do Nidus$/)).toBeNull()
  })
})

describe('nova caixa de estoque', { timeout: 40_000 }, () => {
  it('a janela da posição vazia escolhe entre formar casal e nova caixa de estoque', () => {
    abrirPosicaoVazia()

    expect(screen.getByText('Formar casal', { selector: '.ant-segmented-item-label' })).toBeTruthy()
    expect(screen.queryByText('Data de nascimento')).toBeNull()

    fireEvent.click(segmento('Nova caixa de estoque'))

    expect(screen.getByText('Data de nascimento')).toBeTruthy()
    expect(screen.queryByText('Parto atual')).toBeNull()
    expect(segmento('♂ Machos')).toBeTruthy()
    expect(segmento('♀ Fêmeas')).toBeTruthy()
  })

  it('manda a posição aninhada, o sexo, a quantidade e o nascimento; mostra a idade de hoje', async () => {
    abrirPosicaoVazia()
    fireEvent.click(segmento('Nova caixa de estoque'))

    await escolher('Linhagem', 'Swiss')
    fireEvent.click(segmento('♀ Fêmeas'))
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '12' } })
    digitarNascimento('25/09/2026')

    expect(await screen.findByText('35 dias hoje')).toBeTruthy()

    fireEvent.click(botao('Cadastrar caixa de estoque'))

    await waitFor(() => expect(api.criar).toHaveBeenCalled(), DEMORA)
    expect(api.criar).toHaveBeenCalledWith({
      posicao: POSICAO,
      idLinhagem: 2,
      sexo: 'F',
      quantidade: 12,
      dtNascimento: '2026-09-25',
    })
  })

  it('o calendário recusa nascimento no futuro e com menos de 21 dias', async () => {
    abrirPosicaoVazia()
    fireEvent.click(segmento('Nova caixa de estoque'))

    fireEvent.click(screen.getByLabelText('Data de nascimento'))

    // hoje é 30/10: 21 dias atrás é 09/10, o último dia que cabe
    await waitFor(() => expect(diaNoCalendario('2026-10-09')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-09')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-10')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-30')).toContain(APAGADO)
  })

  it('a recusa da API aparece no campo, e a de sequência no aviso', async () => {
    api.criar.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        dtNascimento: 'Nascimento no futuro',
      }),
    )
    abrirPosicaoVazia()
    fireEvent.click(segmento('Nova caixa de estoque'))

    await escolher('Linhagem', 'Wistar')
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '3' } })
    digitarNascimento('01/10/2026')
    fireEvent.click(botao('Cadastrar caixa de estoque'))

    expect(await screen.findByText('Nascimento no futuro', {}, DEMORA)).toBeTruthy()

    api.criar.mockRejectedValueOnce(
      erroDaApi(409, 'SEQUENCIA_INVALIDA', 'Posição ocupada: escolha outra.'),
    )
    fireEvent.click(botao('Cadastrar caixa de estoque'))

    expect(await screen.findByText('Posição ocupada: escolha outra.', {}, DEMORA)).toBeTruthy()
  })

  it('no celular, a janela da posição vazia tem as duas escolhas e o formulário', () => {
    const voltar = larguraDaTela(390)
    try {
      abrirPosicaoVazia()

      expect(segmento('Formar casal')).toBeTruthy()
      fireEvent.click(segmento('Nova caixa de estoque'))

      expect(document.querySelector('.janela--cheia')).not.toBeNull()
      expect(screen.getByText('Data de nascimento')).toBeTruthy()
      expect(botao('Cadastrar caixa de estoque')).toBeTruthy()
    } finally {
      voltar()
    }
  })
})

describe('acrescentar animais numa caixa de estoque', { timeout: 40_000 }, () => {
  it('manda a quantidade e o nascimento; sexo e linhagem vêm da caixa', async () => {
    api.ficha = fichaDeEstoque()
    renderizar(<FichaDaCaixa idCaixa={30} aoFechar={() => {}} />)

    fireEvent.click(botao('Acrescentar animais (cadastro inicial)'))
    fireEvent.change(screen.getByLabelText('Quantidade'), { target: { value: '8' } })
    digitarNascimento('20/09/2026')
    fireEvent.click(botao('Acrescentar'))

    await waitFor(() => expect(api.entrada).toHaveBeenCalled(), DEMORA)
    expect(api.entrada).toHaveBeenCalledWith({
      idCaixa: 30,
      quantidade: 8,
      dtNascimento: '2026-09-20',
    })
  })

  it('a origem nula aparece como cadastro inicial na ficha de estoque', () => {
    const base = fichaDeEstoque()
    api.ficha = fichaDeEstoque({
      grupos: [
        {
          ...(base.grupos[0] as (typeof base.grupos)[number]),
          origens: [
            {
              idParto: 0,
              ordem: null,
              casal: null,
              codigoOrigem: null,
              numeroVisivelOrigem: null,
              qtd: 6,
            },
          ],
        },
      ],
    })
    renderizar(<FichaDaCaixa idCaixa={30} aoFechar={() => {}} />)

    expect(screen.getByText('Cadastro inicial: 6 animais')).toBeTruthy()
    expect(screen.queryByText(/parto do casal/)).toBeNull()
  })
})
