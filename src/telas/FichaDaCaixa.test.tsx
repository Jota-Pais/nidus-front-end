import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { FORMATO_DA_API, hoje } from '@/lib/data'
import {
  aba,
  abaAberta,
  acharBotao,
  APAGADO,
  botao,
  botoes,
  casal,
  celula,
  catalogo,
  desmamado,
  diaNoCalendario,
  erroDaApi,
  estanteE01,
  fichaDeCasal,
  gradeE01,
  grupo,
  mutacaoComResposta,
  nomesDasAbas,
  parto,
  selecao,
  talvezBotao,
} from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { FichaDaCaixa } from './FichaDaCaixa'

/** o que cada ação da ficha manda para a API */
const api = vi.hoisted(() => ({
  ficha: null as unknown,
  registrar: vi.fn(),
  corrigir: vi.fn(),
  acasalamento: vi.fn(),
  semNinhada: vi.fn(),
  mudanca: vi.fn(),
  baixa: vi.fn(),
  anulacao: vi.fn(),
  virar: vi.fn(),
}))

vi.mock('@/dominio/consultas', () => ({
  useFicha: () => consulta(api.ficha),
  useCatalogo: () => consulta(catalogo),
  useFormarCasal: () => mutacaoComResposta(vi.fn()),
  useRegistrarNaFicha: () => mutacaoComResposta(api.registrar),
  useCorrigirEvento: () => mutacaoComResposta(api.corrigir),
  useCorrigirAcasalamento: () => mutacaoComResposta(api.acasalamento),
  useSemNinhada: () => mutacaoComResposta(api.semNinhada),
  useMudanca: () => mutacaoComResposta(api.mudanca),
  useBaixa: () => mutacaoComResposta(api.baixa),
  useAnularBaixa: () => mutacaoComResposta(api.anulacao),
  useVirarCaixaDeEstoque: () => mutacaoComResposta(api.virar),
  useEstantes: () => consulta([estanteE01]),
  useGrade: () => consulta(gradeE01),
}))

beforeEach(() => {
  api.ficha = fichaDeCasal()
  api.registrar.mockReset().mockResolvedValue({})
  api.corrigir.mockReset().mockResolvedValue({ parto: parto(), faltas: [] })
  api.acasalamento.mockReset().mockResolvedValue(parto())
  api.semNinhada.mockReset().mockResolvedValue(parto())
  api.mudanca.mockReset().mockResolvedValue({ caixas: [], liberada: false })
  api.baixa.mockReset().mockResolvedValue({ baixas: { m: 0, f: 0 }, liberada: false, faltas: [] })
  api.virar.mockReset().mockResolvedValue({ idCaixa: 7, sexo: 'F' })
})

afterEach(() => vi.useRealTimers())

/** o formulário do antd valida e responde depois de alguns ciclos: no jsdom, passa de 1 s */
const DEMORA = { timeout: 10_000 }

function abrirFicha() {
  renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)
}

async function abrirNinhada() {
  abrirFicha()
  fireEvent.click(aba('Ninhada'))
  return abaAberta()
}

/** A seção da aba Ninhada que começa no título dado e vai até o título seguinte */
function secao(titulo: string): HTMLElement {
  const cabecalho = screen.getByText(titulo, { selector: 'h3' })
  const pedaco = document.createElement('div')
  for (
    let no = cabecalho.nextElementSibling;
    no && no.tagName !== 'H3';
    no = no.nextElementSibling
  ) {
    pedaco.appendChild(no.cloneNode(true))
  }
  return pedaco
}

/** O botão Corrigir logo abaixo do título da seção */
function corrigir(titulo: string) {
  const cabecalho = screen.getByText(titulo, { selector: 'h3' })
  for (
    let no = cabecalho.nextElementSibling;
    no && no.tagName !== 'H3';
    no = no.nextElementSibling
  ) {
    const achado = talvezBotao('Corrigir', no as HTMLElement)
    if (achado) return fireEvent.click(achado)
  }
  throw new Error(`Sem Corrigir em ${titulo}`)
}

// O modal do antd com as abas leva segundos para montar no jsdom, e o envio do formulário mais
// alguns: com a suíte inteira rodando, passa de 20 s
describe('formulários da ficha', { timeout: 40_000 }, () => {
  async function registrarDesmame() {
    await abrirNinhada()
    fireEvent.click(await acharBotao('Registrar desmame'))
  }

  it('a recusa da API aparece no campo que ela aponta, e não só "confira os campos"', async () => {
    api.registrar.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        desmamadoM: 'Acima dos vivos do dia: corrija o nascimento.',
      }),
    )

    await registrarDesmame()

    expect(
      await screen.findByText('Acima dos vivos do dia: corrija o nascimento.', {}, DEMORA),
    ).toBeTruthy()
    expect(screen.queryByText('Confira os campos destacados.')).toBeNull()
  })

  it('a regra recusada sem campo mostra o motivo no formulário', async () => {
    api.registrar.mockRejectedValueOnce(
      erroDaApi(409, 'SEQUENCIA_INVALIDA', 'O desmame deste parto ja foi registrado.'),
    )

    await registrarDesmame()

    expect(
      await screen.findByText('O desmame deste parto ja foi registrado.', {}, DEMORA),
    ).toBeTruthy()
  })

  it('o campo que o formulário não tem vira o motivo no aviso', async () => {
    api.registrar.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        idCasal: 'Este casal ja esta encerrado.',
      }),
    )

    await registrarDesmame()

    expect(await screen.findByText('Este casal ja esta encerrado.', {}, DEMORA)).toBeTruthy()
    expect(screen.queryByText('Confira os campos destacados.')).toBeNull()
  })

  it('o desmame é de hoje para trás: o calendário não oferece amanhã', async () => {
    await abrirNinhada()

    fireEvent.click(await screen.findByLabelText('Data do desmame'))

    await waitFor(() => expect(diaNoCalendario(hoje())).not.toBe('(sem dia)'))
    expect(diaNoCalendario(hoje())).not.toContain(APAGADO)
    expect(diaNoCalendario(dayjs().add(1, 'day').format(FORMATO_DA_API))).toContain(APAGADO)
  })
})

describe('desmame', { timeout: 40_000 }, () => {
  it('sugere os vivos e não manda caixa de recria: ninguém muda de caixa', async () => {
    await abrirNinhada()
    fireEvent.click(await acharBotao('Registrar desmame'))

    await waitFor(() => expect(api.registrar).toHaveBeenCalled(), DEMORA)
    expect(api.registrar).toHaveBeenCalledWith({
      caminho: '/api/partos/10/desmame',
      corpo: { dtDesmameReal: hoje(), desmamadoM: 4, desmamadoF: 4 },
    })
  })

  it('depois de uma rodada da seleção, a sugestão acompanha os vivos de agora', async () => {
    // a ficha desenhada de novo com o que a API devolver, sem desmontar: como depois de recarregar
    function FichaQueRecarrega() {
      const [, setVezes] = useState(0)
      return (
        <>
          <button type="button" onClick={() => setVezes((vezes) => vezes + 1)}>
            recarregar
          </button>
          <FichaDaCaixa idCaixa={7} aoFechar={() => {}} />
        </>
      )
    }
    renderizar(<FichaQueRecarrega />)
    fireEvent.click(aba('Ninhada'))
    await abaAberta()
    expect(screen.getByLabelText<HTMLInputElement>('Machos desmamados').value).toBe('4')

    // a seleção tirou 1 macho: a ficha recarrega com 3 vivos
    api.ficha = fichaDeCasal({ partos: [parto({ vivos: { m: 3, f: 4 } })] })
    fireEvent.click(screen.getByText('recarregar'))

    await waitFor(() =>
      expect(screen.getByLabelText<HTMLInputElement>('Machos desmamados').value).toBe('3'),
    )
    expect(screen.getByLabelText<HTMLInputElement>('Fêmeas desmamadas').value).toBe('4')
  })

  it('avisa que os desmamados a menos que os vivos viram baixa', async () => {
    await abrirNinhada()

    expect(screen.getByText(/Vivos hoje: 4 machos e 4 fêmeas\./)).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Machos desmamados'), { target: { value: '2' } })

    expect(
      await screen.findByText(
        '2 machos a menos que os vivos: a diferença vira baixa, "não chegou ao desmame", na data do desmame.',
      ),
    ).toBeTruthy()
  })

  it('a baixa da diferença que tira reservados avisa a falta do pedido', async () => {
    api.registrar.mockResolvedValueOnce({
      parto: parto(),
      faltas: [{ idPedido: 12, m: 1, f: 0, qualquer: 0 }],
    })
    await abrirNinhada()

    fireEvent.click(await acharBotao('Registrar desmame'))

    expect(
      await screen.findByText(/#12, 1 macho\. Em Pedidos, a reserva em falta/, {}, DEMORA),
    ).toBeTruthy()
  })

  it('o desmame registrado mostra os números da API e corrige só a data', async () => {
    api.ficha = fichaDeCasal({ partos: [desmamado()] })
    await abrirNinhada()

    const desmame = secao('Desmame')
    expect(within(desmame).getByText('Machos desmamados')).toBeTruthy()
    expect(within(desmame).queryByText(/Desmame total/)).toBeNull()

    corrigir('Desmame')
    expect(screen.queryByLabelText('Machos desmamados')).toBeNull()
    fireEvent.change(screen.getByLabelText('Motivo da correção'), {
      target: { value: 'data errada' },
    })
    fireEvent.click(botao('Salvar correção'))

    await waitFor(() => expect(api.corrigir).toHaveBeenCalled(), DEMORA)
    expect(api.corrigir).toHaveBeenCalledWith({
      idParto: 10,
      evento: 'desmame',
      corpo: { dtDesmameReal: '2026-10-16', motivo: 'data errada' },
    })
  })
})

describe('eutanásia de seleção', { timeout: 40_000 }, () => {
  it('é repetível: cada rodada vai sozinha, e o formulário volta ao começo', async () => {
    await abrirNinhada()

    expect(within(secao('Eutanásia de seleção')).getByText('1 M · 1 F')).toBeTruthy()
    fireEvent.change(screen.getByLabelText('Machos'), { target: { value: '1' } })
    fireEvent.click(botao('Registrar eutanásia'))

    await waitFor(() => expect(api.registrar).toHaveBeenCalled(), DEMORA)
    expect(api.registrar).toHaveBeenCalledWith({
      caminho: '/api/partos/10/selecao',
      corpo: { dtSelecao: hoje(), eutanasiadoM: 1, eutanasiadoF: 0 },
    })
    await waitFor(() => expect(screen.getByLabelText('Machos')).toHaveProperty('value', '0'))
  })

  it('com reservados de mais de um pedido, pede de qual, com os pedidos do parto', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        parto({
          reservados: [
            { idPedido: 7, m: 2, f: 0 },
            { idPedido: 9, m: 2, f: 0 },
          ],
        }),
      ],
    })
    api.registrar.mockRejectedValueOnce(
      erroDaApi(409, 'PEDIDO_NAO_INDICADO', 'Os livres nao bastam.', {
        idPedido: 'Escolha um dos pedidos: #7, #9.',
      }),
    )
    await abrirNinhada()

    fireEvent.change(screen.getByLabelText('Machos'), { target: { value: '4' } })
    fireEvent.click(botao('Registrar eutanásia'))

    expect(await screen.findByText('Escolha um dos pedidos: #7, #9.', {}, DEMORA)).toBeTruthy()
    fireEvent.mouseDown(selecao(/de qual pedido saem os animais reservados/))
    fireEvent.click(await screen.findByTitle('Pedido #9'))
    fireEvent.click(botao('Registrar eutanásia'))

    await waitFor(() => expect(api.registrar).toHaveBeenCalledTimes(2), DEMORA)
    expect(api.registrar).toHaveBeenLastCalledWith({
      caminho: '/api/partos/10/selecao',
      corpo: { dtSelecao: hoje(), eutanasiadoM: 4, eutanasiadoF: 0, idPedido: 9 },
    })

    // a rodada seguinte começa sem o pedido: os livres podem bastar, e a API pede de novo se não
    await waitFor(() => expect(screen.getByLabelText('Machos')).toHaveProperty('value', '0'))
    expect(screen.queryAllByLabelText(/de qual pedido saem os animais reservados/)).toHaveLength(0)
    fireEvent.change(screen.getByLabelText('Fêmeas'), { target: { value: '1' } })
    fireEvent.click(botao('Registrar eutanásia'))

    await waitFor(() => expect(api.registrar).toHaveBeenCalledTimes(3), DEMORA)
    expect(api.registrar).toHaveBeenLastCalledWith({
      caminho: '/api/partos/10/selecao',
      corpo: { dtSelecao: hoje(), eutanasiadoM: 0, eutanasiadoF: 1 },
    })
  })
})

describe('as datas da ninhada seguem a ordem dos eventos', { timeout: 40_000 }, () => {
  // acasalou em 01/09, nasceu em 24/09 e desmamou em 28/09: o calendário abre em setembro de 2026,
  // na data registrada
  beforeEach(() => {
    api.ficha = fichaDeCasal({ partos: [desmamado({ dtDesmameReal: '2026-09-28' })] })
  })

  async function abrirCalendario(titulo: string, rotulo: string) {
    await abrirNinhada()
    corrigir(titulo)
    fireEvent.click(await screen.findByLabelText(rotulo))
    await waitFor(() => expect(diaNoCalendario('2026-09-24')).not.toBe('(sem dia)'))
  }

  it('o parto corrigido fica entre o acasalamento e o desmame, os dois dias inclusive', async () => {
    await abrirCalendario('Parto', 'Data do parto')

    expect(diaNoCalendario('2026-08-31')).toContain(APAGADO)
    expect(diaNoCalendario('2026-09-01')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-28')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-29')).toContain(APAGADO)
  })

  it('o desmame corrigido não fica antes do parto', async () => {
    await abrirCalendario('Desmame', 'Data do desmame')

    expect(diaNoCalendario('2026-09-23')).toContain(APAGADO)
    expect(diaNoCalendario('2026-09-24')).not.toContain(APAGADO)
  })

  it('o acasalamento corrigido fica entre a formação e o parto', async () => {
    await abrirCalendario('Acasalamento', 'Data do acasalamento')

    expect(diaNoCalendario('2026-08-31')).toContain(APAGADO)
    expect(diaNoCalendario('2026-09-01')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-24')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-25')).toContain(APAGADO)
  })
})

describe('correções do parto', { timeout: 40_000 }, () => {
  it('o acasalamento se corrige com a data e o motivo', async () => {
    await abrirNinhada()

    corrigir('Acasalamento')
    fireEvent.change(screen.getByLabelText('Motivo da correção'), {
      target: { value: 'nova monta' },
    })
    fireEvent.click(botao('Salvar correção'))

    await waitFor(() => expect(api.acasalamento).toHaveBeenCalled(), DEMORA)
    expect(api.acasalamento).toHaveBeenCalledWith({
      idParto: 10,
      dtAcasalamento: '2026-09-01',
      motivo: 'nova monta',
    })
  })

  it('com a ninhada na caixa do casal, os a mais entram nela: a correção não pede caixa', async () => {
    await abrirNinhada()

    corrigir('Parto')
    fireEvent.change(screen.getByLabelText('Machos nascidos'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Motivo da correção'), {
      target: { value: 'contagem errada' },
    })

    expect(screen.queryByText(/em qual caixa de estoque entram/)).toBeNull()
    fireEvent.click(botao('Salvar correção'))

    await waitFor(() => expect(api.corrigir).toHaveBeenCalled(), DEMORA)
    expect(api.corrigir).toHaveBeenCalledWith({
      idParto: 10,
      evento: 'nascimento',
      corpo: { dtPartoReal: '2026-09-24', nascidoM: 6, nascidoF: 5, motivo: 'contagem errada' },
    })
  })

  it('com a caixa do casal liberada, os a mais vão para a caixa de estoque clicada', async () => {
    const liberada = fichaDeCasal({
      casal: casal(1, 'AB', false),
      partos: [
        desmamado({
          onde: [
            {
              idCaixa: 30,
              codigo: 'F1C',
              numeroVisivel: 'E-01',
              tipo: 'estoque',
              m: 4,
              f: 0,
              reservados: 0,
            },
          ],
        }),
      ],
    })
    api.ficha = {
      ...liberada,
      caixa: {
        ...liberada.caixa,
        ativa: false,
        estado: null,
        dtLiberacao: '2026-10-20',
        motivoLiberacao: 'mudanca',
      },
    }
    await abrirNinhada()

    corrigir('Parto')
    fireEvent.change(screen.getByLabelText('Machos nascidos'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Motivo da correção'), {
      target: { value: 'contagem errada' },
    })

    const caixa = (
      await screen.findByText(/em qual caixa de estoque entram os machos a mais/)
    ).closest('.ant-form-item') as HTMLElement
    // só caixa que já existe: a posição vazia fica apagada
    expect(celula('F1B: posição vazia', caixa)).toHaveProperty('disabled', true)
    fireEvent.click(celula(/^F1C: caixa de estoque com 6 machos/, caixa))
    fireEvent.click(botao('Salvar correção'))

    await waitFor(() => expect(api.corrigir).toHaveBeenCalled(), DEMORA)
    expect(api.corrigir).toHaveBeenCalledWith({
      idParto: 10,
      evento: 'nascimento',
      corpo: {
        dtPartoReal: '2026-09-24',
        nascidoM: 6,
        nascidoF: 5,
        motivo: 'contagem errada',
        idCaixa: 30,
      },
    })
  })

  it('a troca de sexo não cria animal: com a caixa liberada, não pede caixa de estoque', async () => {
    const liberada = fichaDeCasal({
      casal: casal(1, 'AB', false),
      partos: [desmamado({ onde: [] })],
    })
    api.ficha = { ...liberada, caixa: { ...liberada.caixa, ativa: false, estado: null } }
    await abrirNinhada()

    corrigir('Parto')
    // um macho a mais sozinho é animal novo, e pede a caixa
    fireEvent.change(screen.getByLabelText('Machos nascidos'), { target: { value: '6' } })
    expect(await screen.findByText(/em qual caixa de estoque entram os machos a mais/)).toBeTruthy()

    // com uma fêmea a menos, era um macho registrado como fêmea: a API troca o sexo
    fireEvent.change(screen.getByLabelText('Fêmeas nascidas'), { target: { value: '4' } })
    await waitFor(() => expect(screen.queryByText(/em qual caixa de estoque entram/)).toBeNull())
  })

  it('com a caixa do casal ocupada por outra ninhada, os a mais de dois sexos pedem um sexo por vez', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({ onde: [] }),
        parto({
          id: 11,
          ordem: 2,
          dtAcasalamento: '2026-10-20',
          dtPartoReal: '2026-11-05',
          baixasAntesDoDesmame: { m: 0, f: 0 },
        }),
      ],
    })
    abrirFicha()
    fireEvent.click(await acharBotao('1º'))
    fireEvent.click(aba('Ninhada'))

    corrigir('Parto')
    fireEvent.change(screen.getByLabelText('Machos nascidos'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Fêmeas nascidas'), { target: { value: '6' } })

    expect(await screen.findByText(/Corrija um sexo de cada vez\./)).toBeTruthy()
    // a API recusaria: o envio fica preso até sobrar um sexo só
    expect(botao('Salvar correção')).toHaveProperty('disabled', true)
  })

  it('a caixa do casal que a API diz não servir pede a estante, um sexo por vez', async () => {
    api.ficha = fichaDeCasal({ partos: [desmamado()] })
    api.corrigir.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        idCaixa: 'A caixa F1A do casal tem agora a ninhada do 2o parto: diga em qual caixa.',
      }),
    )
    await abrirNinhada()

    corrigir('Parto')
    fireEvent.change(screen.getByLabelText('Machos nascidos'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Motivo da correção'), {
      target: { value: 'contagem errada' },
    })
    fireEvent.click(botao('Salvar correção'))

    // a recusa aparece no campo da caixa, que a ficha não sabia que precisava
    expect(
      await screen.findByText(
        'A caixa F1A do casal tem agora a ninhada do 2o parto: diga em qual caixa.',
        {},
        DEMORA,
      ),
    ).toBeTruthy()
    expect(screen.getByText(/em qual caixa de estoque entram os machos a mais/)).toBeTruthy()

    // com a mais dos dois sexos, a estante sai, o aviso explica e o envio fica preso
    fireEvent.change(screen.getByLabelText('Fêmeas nascidas'), { target: { value: '6' } })
    expect(await screen.findByText(/Corrija um sexo de cada vez\./)).toBeTruthy()
    expect(screen.queryByText(/em qual caixa de estoque entram/)).toBeNull()
    expect(botao('Salvar correção')).toHaveProperty('disabled', true)
  })
})

describe('parto pendente', { timeout: 40_000 }, () => {
  const pendente = () =>
    parto({
      dtPartoReal: null,
      nascidoM: null,
      nascidoF: null,
      vivos: { m: 0, f: 0 },
      onde: [],
      baixasAntesDoDesmame: { m: 0, f: 0 },
    })

  it('o casal encerrado com parto pendente: registra o parto ou fecha sem ninhada', async () => {
    api.ficha = fichaDeCasal({ casal: casal(1, 'AB', false), partos: [pendente()] })
    await abrirNinhada()

    expect(botao('Registrar parto')).toBeTruthy()
    fireEvent.click(botao('Fechar sem ninhada'))
    fireEvent.change(screen.getByLabelText('Por que não vai nascer'), {
      target: { value: 'não emprenhou' },
    })
    fireEvent.click(botoes('Fechar sem ninhada').at(-1) as HTMLElement)

    await waitFor(() => expect(api.semNinhada).toHaveBeenCalled(), DEMORA)
    expect(api.semNinhada).toHaveBeenCalledWith({
      idParto: 10,
      dtSemNinhada: hoje(),
      motivo: 'não emprenhou',
    })
  })

  it('o sem ninhada fica entre o encerramento do casal e hoje', async () => {
    // só o relógio: o calendário abre em outubro, no dia de hoje
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-30T12:00:00'))
    api.ficha = fichaDeCasal({ casal: casal(1, 'AB', false), partos: [pendente()] })
    await abrirNinhada()

    fireEvent.click(botao('Fechar sem ninhada'))
    fireEvent.click(screen.getByLabelText('Data'))

    await waitFor(() => expect(diaNoCalendario('2026-10-27')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-26')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-27')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-30')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-31')).toContain(APAGADO)
  })

  it('o casal ativo não fecha sem ninhada', async () => {
    api.ficha = fichaDeCasal({ partos: [pendente()] })
    await abrirNinhada()

    expect(botao('Registrar parto')).toBeTruthy()
    expect(talvezBotao('Fechar sem ninhada')).toBeNull()
  })

  it('o parto fechado sem ninhada diz quando e por quê', async () => {
    api.ficha = fichaDeCasal({
      casal: casal(1, 'AB', false),
      partos: [{ ...pendente(), dtSemNinhada: '2026-10-30', motivoSemNinhada: 'não emprenhou' }],
    })
    await abrirNinhada()

    expect(screen.getByText('Fechado sem ninhada em 30/10/2026: não emprenhou')).toBeTruthy()
    expect(talvezBotao('Registrar parto')).toBeNull()
  })
})

describe('onde estão os animais do parto', { timeout: 40_000 }, () => {
  it('lê onde estão e os reservados da API, e só a caixa da ficha tem as ações', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({
          vivos: { m: 4, f: 4 },
          onde: [
            {
              idCaixa: 7,
              codigo: 'F1A',
              numeroVisivel: 'E-01',
              tipo: 'casal',
              m: 2,
              f: 4,
              reservados: 0,
            },
            {
              idCaixa: 30,
              codigo: 'F1C',
              numeroVisivel: 'E-01',
              tipo: 'estoque',
              m: 2,
              f: 0,
              reservados: 2,
            },
          ],
          reservados: [{ idPedido: 12, m: 2, f: 0 }],
        }),
      ],
    })
    await abrirNinhada()

    expect(screen.getByText('F1A (E-01), nesta caixa: 2 machos e 4 fêmeas')).toBeTruthy()
    expect(screen.getByText('F1C (E-01), estoque: 2 machos, 2 reservados')).toBeTruthy()
    expect(screen.getByText(/2 machos reservados/)).toBeTruthy()
    expect(botao('Passar para o estoque')).toBeTruthy()
    expect(botao('Baixa')).toBeTruthy()
  })

  it('os reservados que já foram para o estoque não viram "só os do pedido" na caixa do casal', async () => {
    // 2 machos do #12 estão na F1C; na caixa do casal, só livres
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({
          onde: [
            {
              idCaixa: 7,
              codigo: 'F1A',
              numeroVisivel: 'E-01',
              tipo: 'casal',
              m: 2,
              f: 4,
              reservados: 0,
            },
            {
              idCaixa: 30,
              codigo: 'F1C',
              numeroVisivel: 'E-01',
              tipo: 'estoque',
              m: 2,
              f: 0,
              reservados: 2,
            },
          ],
          reservados: [{ idPedido: 12, m: 2, f: 0 }],
        }),
      ],
    })
    await abrirNinhada()

    fireEvent.click(botao('Passar para o estoque'))

    expect(within(grupo('Machos')).getByLabelText('Quantos machos')).toHaveProperty('value', '2')
    expect(screen.queryByLabelText('Quais machos')).toBeNull()
  })

  it('com os reservados na caixa do casal, leva só os do pedido', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({
          onde: [
            {
              idCaixa: 7,
              codigo: 'F1A',
              numeroVisivel: 'E-01',
              tipo: 'casal',
              m: 4,
              f: 4,
              reservados: 2,
            },
          ],
          reservados: [{ idPedido: 12, m: 2, f: 0 }],
        }),
      ],
    })
    await abrirNinhada()

    fireEvent.click(botao('Passar para o estoque'))
    const machos = grupo('Machos')
    fireEvent.mouseDown(selecao('Quais machos'))
    fireEvent.click(await screen.findByTitle('Só os reservados do pedido #12'))
    await waitFor(() =>
      expect(within(machos).getByLabelText('Quantos machos')).toHaveProperty('value', '2'),
    )
    // as fêmeas não têm reservado
    expect(screen.queryByLabelText('Quais fêmeas')).toBeNull()
  })

  it('passa para o estoque os desmamados desta caixa, na data do desmame em diante', async () => {
    api.ficha = fichaDeCasal({ partos: [desmamado()] })
    await abrirNinhada()

    fireEvent.click(botao('Passar para o estoque'))
    const machos = grupo('Machos')
    const femeas = grupo('Fêmeas')
    fireEvent.click(celula(/^F1C: caixa de estoque com 6 machos/, machos))
    fireEvent.click(celula(/^F1E: caixa de estoque com 3 fêmeas/, femeas))
    fireEvent.click(botoes('Passar para o estoque').at(-1) as HTMLElement)

    await waitFor(() => expect(api.mudanca).toHaveBeenCalled(), DEMORA)
    expect(api.mudanca).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      machos: { qtd: 4, dtNascimento: '2026-09-24', destino: { idCaixa: 30 } },
      femeas: { qtd: 4, dtNascimento: '2026-09-24', destino: { idCaixa: 31 } },
    })
  })

  it('antes do desmame, a ninhada só sai por baixa', async () => {
    await abrirNinhada()

    expect(talvezBotao('Passar para o estoque')).toBeNull()
    fireEvent.click(botao('Baixa'))
    // a seleção, que também pede machos e fêmeas, continua na aba: os campos são os da baixa
    const baixa = botao('Registrar baixa').closest('form') as HTMLElement
    fireEvent.change(within(baixa).getByLabelText('Fêmeas'), { target: { value: '1' } })
    fireEvent.click(botao('Registrar baixa', baixa))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      itens: [{ sexo: 'F', qtd: 1, dtNascimento: '2026-09-24' }],
    })
  })

  it('com todos fora da caixa, mostra onde estão e não oferece ação', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({
          onde: [
            {
              idCaixa: 20,
              codigo: 'F2C',
              numeroVisivel: 'E-01',
              tipo: 'estoque',
              m: 4,
              f: 0,
              reservados: 0,
            },
            {
              idCaixa: 21,
              codigo: 'F2D',
              numeroVisivel: 'E-01',
              tipo: 'estoque',
              m: 0,
              f: 4,
              reservados: 0,
            },
          ],
        }),
      ],
    })
    await abrirNinhada()

    expect(screen.getByText('F2C (E-01), estoque: 4 machos')).toBeTruthy()
    expect(talvezBotao('Passar para o estoque')).toBeNull()
    expect(talvezBotao('Baixa')).toBeNull()
  })
})

describe('abas da ficha do casal', { timeout: 20_000 }, () => {
  it('são Reprodução, Ninhada e Eventos', async () => {
    abrirFicha()

    expect(await waitFor(() => nomesDasAbas().filter(Boolean))).toEqual([
      'Reprodução',
      'Ninhada',
      'Eventos',
    ])
  })

  it('os eventos têm o Anular na baixa que ainda pode ser anulada', async () => {
    api.ficha = fichaDeCasal({
      eventos: [
        {
          dataHora: '2026-09-24T00:00:00.000Z',
          tipo: 'baixa',
          descricao: 'Eutanasia de selecao do 1o parto do casal AB: 1 macho e 1 femea.',
          autor: 'Ana Souza',
          idOcorrencia: 40,
          anulavel: true,
        },
      ],
    })
    abrirFicha()
    fireEvent.click(aba('Eventos'))

    expect(await screen.findByText(/Eutanasia de selecao do 1o parto/)).toBeTruthy()
    expect(botao('Anular')).toBeTruthy()
  })

  it('a baixa pode ser da ninhada de um casal de antes: a estante da anulação oferece a linhagem dele também', async () => {
    api.ficha = fichaDeCasal({
      casal: { ...casal(2, 'CD', true), dtFormacao: '2026-11-01' },
      partos: [],
      anteriores: [
        // a ninhada dele saiu da caixa antes de o casal CD ser formado
        {
          casal: { ...casal(1, 'AB', false), linhagem: 'Swiss' },
          partos: [desmamado({ vivos: { m: 0, f: 0 }, onde: [] })],
        },
      ],
      eventos: [
        {
          dataHora: '2026-10-20T00:00:00.000Z',
          tipo: 'baixa',
          descricao: 'Baixa de 2 machos nesta caixa.',
          autor: 'Ana Souza',
          idOcorrencia: 41,
          anulavel: true,
        },
      ],
    })
    api.anulacao.mockReset()
    api.anulacao
      .mockRejectedValueOnce(
        erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
          idCaixaMachos: 'A caixa F1A tem outro casal: diga para qual caixa voltam 2 machos.',
        }),
      )
      .mockResolvedValueOnce({
        voltaram: [{ sexo: 'M', qtd: 2, idCaixa: 32, codigo: 'F1F' }],
        soltos: { m: 0, f: 0 },
      })
    abrirFicha()
    fireEvent.click(aba('Eventos'))
    const linha = (await screen.findByText('Baixa de 2 machos nesta caixa.')).closest(
      'li',
    ) as HTMLElement

    fireEvent.click(botao('Anular', linha))
    fireEvent.change(within(linha).getByLabelText('Por que a baixa foi um engano'), {
      target: { value: 'contada duas vezes' },
    })
    fireEvent.click(botao('Anular baixa', linha))
    await within(linha).findByText(
      'A caixa F1A tem outro casal: diga para qual caixa voltam 2 machos.',
      {},
      DEMORA,
    )

    // F1C é de machos Wistar, a linhagem do casal de agora, e F1F de machos Swiss, a do de antes
    expect(celula(/^F1C: caixa de estoque com 6 machos/, linha)).toHaveProperty('disabled', false)
    expect(celula(/^F1F: caixa de estoque com 2 machos/, linha)).toHaveProperty('disabled', false)
    expect(celula('F1E: ocupada', linha)).toHaveProperty('disabled', true)
    fireEvent.click(celula(/^F1F: caixa de estoque/, linha))
    fireEvent.click(botao('Anular baixa', linha))

    await waitFor(() => expect(api.anulacao).toHaveBeenCalledTimes(2), DEMORA)
    expect(api.anulacao).toHaveBeenLastCalledWith({
      idOcorrencia: 41,
      motivo: 'contada duas vezes',
      idCaixaMachos: 32,
    })
  })
})

describe('aba Reprodução', { timeout: 20_000 }, () => {
  // conta no texto da aba: os repetidos vinham no meio de uma linha, não num elemento só deles
  it('mostra cada dado do casal e do acasalamento uma vez só', async () => {
    abrirFicha()

    const aba = await abaAberta()
    const texto = aba.textContent ?? ''
    // a formação do casal é o acasalamento do 1º parto
    expect(texto.match(/01\/09\/2026/g)).toHaveLength(1)
    // o título da seção é o parto, e "Acasalamento" fica só no campo
    expect(texto.match(/Acasalamento/g)).toHaveLength(1)
    // AB é o macho A e a fêmea B, que já aparecem nos campos
    expect(texto).not.toContain('AB')
    expect(within(aba).getByText('1/5')).toBeTruthy()
  })

  it('o acasalamento seguinte aparece nas duas abas sem repetir o id do campo', async () => {
    abrirFicha()
    await abaAberta()

    // o 2º parto ainda não existe: as abas Reprodução e Ninhada, montadas juntas, oferecem o acasalamento
    fireEvent.click(screen.getByText('2º', { selector: 'button' }))
    fireEvent.click(aba('Ninhada'))
    await abaAberta()
    fireEvent.click(aba('Reprodução'))
    await abaAberta()

    const ids = [...document.querySelectorAll('input[id$="_dtAcasalamento"]')].map(
      (campo) => campo.id,
    )
    expect(ids).toHaveLength(2)
    expect(new Set(ids).size).toBe(2)
  })

  it('mostra o parto e o desmame previstos do parto escolhido', async () => {
    abrirFicha()

    const aba = await abaAberta()
    expect(within(aba).getByText('Parto previsto')).toBeTruthy()
    expect(within(aba).getByText('24/09/2026')).toBeTruthy()
    expect(within(aba).getByText('Desmame previsto')).toBeTruthy()
    expect(within(aba).getByText('16/10/2026')).toBeTruthy()
  })

  it('casal encerrado diz quando encerrou', async () => {
    api.ficha = fichaDeCasal({ casal: casal(1, 'AB', false), partos: [desmamado({ onde: [] })] })
    abrirFicha()

    expect(await screen.findByText('Casal encerrado em 27/10/2026')).toBeTruthy()
    expect(botao('Formar casal')).toBeTruthy()
  })
})

describe('encerrar casal', { timeout: 40_000 }, () => {
  it('encerra com a data e o motivo, do último acasalamento até hoje', async () => {
    // só o relógio: o calendário abre em outubro, no dia de hoje
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-30T12:00:00'))
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({ onde: [] }),
        parto({
          id: 11,
          ordem: 2,
          dtAcasalamento: '2026-10-20',
          dtPartoReal: null,
          nascidoM: null,
          nascidoF: null,
          vivos: { m: 0, f: 0 },
          baixasAntesDoDesmame: { m: 0, f: 0 },
          onde: [],
        }),
      ],
    })
    abrirFicha()

    fireEvent.click(await acharBotao('Encerrar casal'))
    fireEvent.change(screen.getByLabelText('Motivo'), {
      target: { value: 'queda de produtividade' },
    })
    fireEvent.click(botao('Encerrar'))

    await waitFor(() => expect(api.registrar).toHaveBeenCalled(), DEMORA)
    expect(api.registrar).toHaveBeenCalledWith({
      caminho: '/api/casais/1/encerramento',
      corpo: { dtEncerramento: '2026-10-30', motivo: 'queda de produtividade' },
    })

    fireEvent.click(screen.getByLabelText('Data'))
    await waitFor(() => expect(diaNoCalendario('2026-10-20')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-19')).toContain(APAGADO)
    expect(diaNoCalendario('2026-10-20')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-30')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-31')).toContain(APAGADO)
  })
})

describe('casal novo na caixa', { timeout: 20_000 }, () => {
  it('a ficha mostra os partos do casal de antes e abre no que ainda tem animais na caixa', async () => {
    api.ficha = fichaDeCasal({
      casal: casal(2, 'CD', true),
      partos: [parto({ id: 20, dtPartoReal: null, nascidoM: null, nascidoF: null, onde: [] })],
      anteriores: [{ casal: casal(1, 'AB', false), partos: [parto({ id: 15, ordem: 5 })] }],
    })
    abrirFicha()

    expect(await screen.findByText('Partos do casal AB (encerrado)')).toBeTruthy()
    expect(screen.getByText(/5º parto do casal AB/)).toBeTruthy()
  })

  it('com desmamados na caixa, casal novo só depois que eles forem para o estoque', async () => {
    api.ficha = fichaDeCasal({ casal: casal(1, 'AB', false), partos: [desmamado()] })
    abrirFicha()

    expect(await screen.findByText(/A caixa ainda tem desmamados/)).toBeTruthy()
    expect(talvezBotao('Formar casal')).toBeNull()
  })

  it('com parto pendente do casal encerrado, casal novo só depois que ele nascer ou fechar', async () => {
    api.ficha = fichaDeCasal({
      casal: casal(1, 'AB', false),
      partos: [
        desmamado({ onde: [] }),
        parto({ id: 11, ordem: 2, dtPartoReal: null, nascidoM: null, nascidoF: null, onde: [] }),
      ],
    })
    abrirFicha()

    expect(
      await screen.findByText(/O 2º parto ainda não nasceu: registre o parto ou feche sem ninhada/),
    ).toBeTruthy()
    expect(talvezBotao('Formar casal')).toBeNull()
  })

  it('a caixa liberada não recebe casal: a posição recebe caixa nova', async () => {
    const vazia = fichaDeCasal({ casal: casal(1, 'AB', false), partos: [desmamado({ onde: [] })] })
    api.ficha = {
      ...vazia,
      caixa: {
        ...vazia.caixa,
        ativa: false,
        estado: null,
        dtLiberacao: '2026-10-28',
        motivoLiberacao: 'casal_encerrado',
      },
    }
    abrirFicha()

    expect(
      await screen.findByText(/^Caixa liberada em 28\/10\/2026: o casal encerrou sem animais nela/),
    ).toBeTruthy()
    expect(talvezBotao('Formar casal')).toBeNull()
  })

  it('a caixa do casal encerrado que ficou com um sexo só pode virar caixa de estoque', async () => {
    api.ficha = fichaDeCasal({
      casal: casal(1, 'AB', false),
      virarEstoque: 'F',
      partos: [
        desmamado({
          onde: [
            {
              idCaixa: 7,
              codigo: 'F1A',
              numeroVisivel: 'E-01',
              tipo: 'casal',
              m: 0,
              f: 4,
              reservados: 0,
            },
          ],
        }),
      ],
    })
    abrirFicha()

    fireEvent.click(await acharBotao('Virar caixa de estoque'))
    expect(screen.getByText('Sobraram na caixa só desmamados de um sexo: 4 fêmeas')).toBeTruthy()

    // a confirmação diz o que muda, e o botão dela vira a caixa
    expect(
      await screen.findByText(/A caixa passa a ser a caixa de estoque destas 4 fêmeas/),
    ).toBeTruthy()
    fireEvent.click(botoes('Virar caixa de estoque').at(-1) as HTMLElement)

    await waitFor(() => expect(api.virar).toHaveBeenCalledWith(7), DEMORA)
    expect(await screen.findByText('A caixa virou caixa de estoque.')).toBeTruthy()
  })
})
