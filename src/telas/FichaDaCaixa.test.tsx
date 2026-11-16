import { cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import dayjs from 'dayjs'
import { useState } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { FichaDeCasal } from '@/dominio/tipos'
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
  fichaDeEstoque,
  gradeE01,
  grupo,
  lugar,
  mutacaoComResposta,
  nomesDasAbas,
  parto,
  selecao,
  talvezBotao,
} from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { larguraDaTela } from '@/testes/tela'
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
  mover: vi.fn(),
  editar: vi.fn(),
  editarEstoque: vi.fn(),
}))

vi.mock('@/dominio/consultas', () => ({
  useFicha: () => consulta(api.ficha),
  useCatalogo: () => consulta(catalogo),
  useFormarCasal: () => mutacaoComResposta(vi.fn()),
  useRegistrarNaFicha: () => mutacaoComResposta(api.registrar),
  useCorrigirEvento: () => mutacaoComResposta(api.corrigir),
  useCorrigirAcasalamento: () => mutacaoComResposta(api.acasalamento),
  useEditarCasal: () => mutacaoComResposta(api.editar),
  useEditarCaixaDeEstoque: () => mutacaoComResposta(api.editarEstoque),
  useSemNinhada: () => mutacaoComResposta(api.semNinhada),
  useMudanca: () => mutacaoComResposta(api.mudanca),
  useBaixa: () => mutacaoComResposta(api.baixa),
  useAnularBaixa: () => mutacaoComResposta(api.anulacao),
  useVirarCaixaDeEstoque: () => mutacaoComResposta(api.virar),
  useEstantes: () => consulta([estanteE01]),
  useGrade: () => consulta(gradeE01),
  useMudarDePosicao: () => ({ mutate: api.mover, isPending: false }),
}))

beforeEach(() => {
  api.ficha = fichaDeCasal()
  api.registrar.mockReset().mockResolvedValue({})
  api.corrigir.mockReset().mockResolvedValue({ parto: parto(), faltas: [] })
  api.acasalamento.mockReset().mockResolvedValue(parto())
  api.semNinhada.mockReset().mockResolvedValue(parto())
  api.mudanca.mockReset().mockResolvedValue({ caixas: [], liberada: false })
  api.baixa
    .mockReset()
    .mockResolvedValue({ idOcorrencia: 41, baixas: { m: 0, f: 0 }, liberada: false, faltas: [] })
  api.anulacao.mockReset().mockResolvedValue({ voltaram: [], soltos: { m: 0, f: 0 } })
  api.virar.mockReset().mockResolvedValue({ idCaixa: 7, sexo: 'F' })
  api.mover.mockReset()
  api.editar.mockReset().mockResolvedValue(casal(1, 'AA', true))
  api.editarEstoque.mockReset().mockResolvedValue(fichaDeEstoque())
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

describe('mudar a caixa de lugar e o atraso, na ficha', { timeout: 40_000 }, () => {
  it('no celular, a caixa muda de lugar pela ficha: toca a posição vazia e confirma o destino', async () => {
    const voltar = larguraDaTela(390)

    try {
      abrirFicha()

      fireEvent.click(await acharBotao('Mudar de lugar'))
      // só a posição vazia serve; a caixa ocupada fica apagada, e a própria caixa diz onde está
      expect(celula('F1C: ocupada').disabled).toBe(true)
      expect(celula('F1A: onde a caixa está').disabled).toBe(true)
      expect(botao('Mudar').disabled).toBe(true)

      fireEvent.click(celula('F1B: posição vazia, a caixa vai para cá'))
      fireEvent.click(botao('Mudar para F1B'))

      expect(api.mover).toHaveBeenCalledWith(
        { idCaixa: 7, idEstante: 1, face: 'frontal', linha: 1, coluna: 2 },
        expect.anything(),
      )
    } finally {
      voltar()
    }
  })

  it('no computador não há Mudar de lugar: a caixa se arrasta na grade', async () => {
    abrirFicha()

    await abaAberta()
    expect(talvezBotao('Mudar de lugar')).toBeNull()
  })

  it('a caixa liberada não muda de lugar, nem no celular', async () => {
    const voltar = larguraDaTela(390)

    try {
      api.ficha = fichaDeCasal({
        caixa: { ...fichaDeCasal().caixa, ativa: false, dtLiberacao: '2026-10-20', fase: null },
      })
      abrirFicha()

      await abaAberta()
      expect(talvezBotao('Mudar de lugar')).toBeNull()
    } finally {
      voltar()
    }
  })

  it('a caixa atrasada diz na ficha por quê: no toque, o título da célula não aparece', async () => {
    // a ninhada nasceu em 24/09 e ainda mama: passou dos 22 dias
    api.ficha = fichaDeCasal({ caixa: { ...fichaDeCasal().caixa, atrasado: true } })
    abrirFicha()

    expect(
      await screen.findByText('Atrasado: filhotes com mais de 22 dias sem desmame.'),
    ).toBeTruthy()
  })
})

describe('a aba Ninhada no celular', { timeout: 40_000 }, () => {
  it('cada ação é um botão, e o formulário dela abre um de cada vez', async () => {
    const voltar = larguraDaTela(390)

    try {
      const painel = await abrirNinhada()

      // nada aberto: só os botões das ações, sem os campos
      expect(within(painel).queryByLabelText('Machos')).toBeNull()
      expect(within(painel).queryByLabelText('Machos desmamados')).toBeNull()

      fireEvent.click(botao('Registrar baixa', painel))
      await waitFor(() => expect(within(painel).getByLabelText('Machos')).toBeTruthy(), DEMORA)

      // abrir o desmame fecha a baixa
      fireEvent.click(botao('Registrar desmame', painel))
      await waitFor(
        () => expect(within(painel).getByLabelText('Machos desmamados')).toBeTruthy(),
        DEMORA,
      )
      expect(within(painel).queryByLabelText('Machos')).toBeNull()

      // e o Cancelar volta o desmame para trás do botão
      fireEvent.click(botao('Cancelar', painel))
      await waitFor(
        () => expect(within(painel).queryByLabelText('Machos desmamados')).toBeNull(),
        DEMORA,
      )
    } finally {
      voltar()
    }
  })

  it('no computador, o formulário do desmame continua aberto como sempre', async () => {
    const painel = await abrirNinhada()

    expect(within(painel).getByLabelText('Machos desmamados')).toBeTruthy()
  })
})

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

  it('a correção do desmame reaberta começa de novo com a data registrada, e não com o campo apagado', async () => {
    api.ficha = fichaDeCasal({ partos: [desmamado()] })
    await abrirNinhada()

    corrigir('Desmame')
    const campo = () => screen.getByLabelText('Data do desmame') as HTMLInputElement
    expect(campo().value).toBe('16/10/2026')

    // apagar a data e cancelar: o campo vazio não fica guardado para a próxima vez
    const limpar = campo().closest('.ant-picker')?.querySelector('.ant-picker-clear') as HTMLElement
    fireEvent.mouseDown(limpar)
    fireEvent.mouseUp(limpar)
    fireEvent.click(limpar)
    await waitFor(() => expect(campo().value).toBe(''), DEMORA)
    fireEvent.click(botao('Cancelar', campo().closest('form') as HTMLElement))

    corrigir('Desmame')
    expect(campo().value).toBe('16/10/2026')
  })
})

describe('baixa da ninhada', { timeout: 40_000 }, () => {
  it('o resumo mostra as baixas do parto, sem a eutanásia de seleção à parte', async () => {
    await abrirNinhada()

    expect(within(secao('Baixas')).getByText('1 M · 1 F')).toBeTruthy()
    expect(screen.queryByText('Eutanásia de seleção')).toBeNull()
    expect(talvezBotao('Registrar eutanásia')).toBeNull()
    expect(screen.queryByText('Baixas até agora')).toBeNull()
  })

  it('o botão da baixa fica logo abaixo da contagem das baixas, e o formulário abre ali', async () => {
    api.ficha = fichaDeCasal({ partos: [desmamado()] })
    await abrirNinhada()

    // na seção Baixas, e não mais em Onde estão, que fica com a passagem para o estoque
    expect(talvezBotao('Registrar baixa', secao('Baixas'))).toBeTruthy()
    expect(talvezBotao('Registrar baixa', secao('Onde estão'))).toBeNull()
    expect(talvezBotao('Passar para o estoque', secao('Onde estão'))).toBeTruthy()

    fireEvent.click(botao('Registrar baixa'))
    expect(within(secao('Baixas')).getByLabelText('Machos')).toBeTruthy()
    expect(within(secao('Onde estão')).queryByLabelText('Machos')).toBeNull()
  })

  it('no celular, o botão da baixa também fica na seção Baixas, uma ação aberta por vez', async () => {
    const voltar = larguraDaTela(390)

    try {
      api.ficha = fichaDeCasal({ partos: [desmamado()] })
      await abrirNinhada()

      expect(talvezBotao('Registrar baixa', secao('Baixas'))).toBeTruthy()
      fireEvent.click(botao('Registrar baixa'))
      await waitFor(
        () => expect(within(secao('Baixas')).getByLabelText('Machos')).toBeTruthy(),
        DEMORA,
      )

      // abrir a passagem fecha a baixa, e o botão dela volta à seção Baixas
      fireEvent.click(botao('Passar para o estoque'))
      await waitFor(
        () => expect(within(secao('Baixas')).queryByLabelText('Machos')).toBeNull(),
        DEMORA,
      )
      expect(talvezBotao('Registrar baixa', secao('Baixas'))).toBeTruthy()
    } finally {
      voltar()
    }
  })

  it('antes do desmame a ação única vem com Eutanásia e vale para o parto escolhido', async () => {
    await abrirNinhada()

    fireEvent.click(botao('Registrar baixa'))
    expect(screen.getByLabelText('Eutanásia')).toHaveProperty('checked', true)
    fireEvent.change(screen.getByLabelText('Machos'), { target: { value: '1' } })
    fireEvent.click(botao('Registrar baixa'))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      tipo: 'eutanasia',
      idParto: 10,
      itens: [{ sexo: 'M', qtd: 1, dtNascimento: '2026-09-24' }],
    })
    // a mensagem de sucesso traz o Desfazer, que anula a baixa recém-criada
    fireEvent.click(await screen.findByRole('button', { name: 'Desfazer' }, DEMORA))
    await waitFor(() => expect(api.anulacao).toHaveBeenCalled(), DEMORA)
    expect(api.anulacao).toHaveBeenCalledWith({
      idOcorrencia: 41,
      motivo: expect.stringContaining('Desfeita'),
    })
  })

  it('depois do desmame o padrão é Morte, e a baixa não é mais seleção do parto', async () => {
    api.ficha = fichaDeCasal({ partos: [desmamado()] })
    await abrirNinhada()

    fireEvent.click(botao('Registrar baixa'))
    expect(screen.getByLabelText('Morte')).toHaveProperty('checked', true)
    fireEvent.change(screen.getByLabelText('Machos'), { target: { value: '1' } })
    fireEvent.click(botao('Registrar baixa'))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa.mock.calls[0]?.[0]).toMatchObject({ tipo: 'morte' })
    expect(api.baixa.mock.calls[0]?.[0]).not.toHaveProperty('idParto')
  })
})

describe('as datas da ninhada seguem a ordem dos eventos', { timeout: 40_000 }, () => {
  // acasalou em 01/09, nasceu em 24/09 e desmamou em 28/09: o calendário abre em setembro de 2026,
  // na data registrada
  beforeEach(() => {
    api.ficha = fichaDeCasal({ partos: [desmamado({ dtDesmameReal: '2026-09-28' })] })
  })

  /** 'titulo' nulo: o campo já está na tela, sem Corrigir (a data do acasalamento) */
  async function abrirCalendario(titulo: string | null, rotulo: string) {
    await abrirNinhada()
    if (titulo) corrigir(titulo)
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

  it('o parto corrigido não passa do primeiro fato dos animais', async () => {
    api.ficha = fichaDeCasal({
      partos: [desmamado({ dtDesmameReal: '2026-09-28', dtPrimeiroFato: '2026-09-26' })],
    })
    await abrirCalendario('Parto', 'Data do parto')

    expect(diaNoCalendario('2026-09-26')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-27')).toContain(APAGADO)
  })

  it('o desmame corrigido fica entre o parto e a primeira saída dos animais: a seleção não limita', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({
          dtDesmameReal: '2026-09-28',
          dtUltimaSelecao: '2026-09-26',
          dtPrimeiraSaida: '2026-09-30',
        }),
      ],
    })
    await abrirCalendario('Desmame', 'Data do desmame')

    expect(diaNoCalendario('2026-09-23')).toContain(APAGADO)
    expect(diaNoCalendario('2026-09-24')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-25')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-30')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-01')).toContain(APAGADO)
  })

  it('com a seleção lançada hoje, o desmame corrigido volta para março, e o campo avisa que a seleção vai junto', async () => {
    // o caso da ninhada antiga: nasceu em 28/02, a seleção e o desmame foram lançados hoje (16/11)
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-11-16T12:00:00'))
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({
          ordem: 2,
          dtPartoReal: '2026-02-28',
          dtDesmameReal: '2026-11-16',
          dtUltimaSelecao: '2026-11-16',
        }),
      ],
    })
    await abrirNinhada()

    corrigir('Desmame')
    expect((screen.getByLabelText('Data do desmame') as HTMLInputElement).value).toBe('16/11/2026')
    fireEvent.click(screen.getByLabelText('Data do desmame'))
    await waitFor(() => expect(diaNoCalendario('2026-11-16')).not.toBe('(sem dia)'))
    // de 28/02 (o parto) até hoje; depois, o futuro
    expect(diaNoCalendario('2026-11-15')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-11-16')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-11-17')).toContain(APAGADO)
    expect(screen.queryByText(/passam para a data do desmame/)).toBeNull()

    const campo = screen.getByLabelText('Data do desmame')
    fireEvent.mouseDown(campo)
    fireEvent.change(campo, { target: { value: '20/03/2026' } })
    fireEvent.keyDown(campo, { key: 'Enter', code: 'Enter' })

    await screen.findByText('As eutanásias de seleção de 16/11/2026 passam para a data do desmame.')
    // o aviso não impede: o botão continua habilitado
    const salvar = screen.getByRole('button', { name: 'Salvar correção' }) as HTMLButtonElement
    expect(salvar.disabled).toBe(false)
  })

  it('o desmame registrado pode ficar antes da última seleção, com o aviso embaixo do campo', async () => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date('2026-10-10T12:00:00'))
    api.ficha = fichaDeCasal({ partos: [parto({ dtUltimaSelecao: '2026-10-03' })] })
    await abrirNinhada()

    const campo = screen.getByLabelText('Data do desmame')
    fireEvent.click(campo)
    await waitFor(() => expect(diaNoCalendario('2026-10-03')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-02')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-03')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-10')).not.toContain(APAGADO)
    // com a data de hoje, depois da seleção, nenhum aviso
    expect(screen.queryByText(/passam para a data do desmame/)).toBeNull()

    fireEvent.mouseDown(campo)
    fireEvent.change(campo, { target: { value: '02/10/2026' } })
    fireEvent.keyDown(campo, { key: 'Enter', code: 'Enter' })

    await screen.findByText('As eutanásias de seleção de 03/10/2026 passam para a data do desmame.')
  })

  it('a data do acasalamento fica entre a formação e o parto', async () => {
    await abrirCalendario(null, 'Data do acasalamento')

    expect(diaNoCalendario('2026-08-31')).toContain(APAGADO)
    expect(diaNoCalendario('2026-09-01')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-24')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-25')).toContain(APAGADO)
  })
})

describe('correções do parto', { timeout: 40_000 }, () => {
  /** Digita o dia (dd/mm/aaaa) na data do acasalamento da aba Ninhada já aberta */
  async function escolherAcasalamento(dia: string) {
    const campo = await screen.findByLabelText('Data do acasalamento')
    fireEvent.mouseDown(campo)
    fireEvent.change(campo, { target: { value: dia } })
    fireEvent.keyDown(campo, { key: 'Enter', code: 'Enter' })
  }

  it('a data do acasalamento grava ao escolher o dia, sem Corrigir nem motivo', async () => {
    await abrirNinhada()
    expect(talvezBotao('Corrigir', secao('Acasalamento'))).toBeNull()

    await escolherAcasalamento('03/09/2026')

    await waitFor(() => expect(api.acasalamento).toHaveBeenCalled(), DEMORA)
    expect(api.acasalamento).toHaveBeenCalledWith({ idParto: 10, dtAcasalamento: '2026-09-03' })
    expect(screen.queryByLabelText('Motivo da correção')).toBeNull()
  })

  it('a recusa da API volta a data de antes e diz por quê no campo', async () => {
    api.acasalamento.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        dtAcasalamento: 'A data não pode ser antes do 1º parto.',
      }),
    )

    await abrirNinhada()
    await escolherAcasalamento('03/09/2026')

    await waitFor(() => expect(api.acasalamento).toHaveBeenCalled(), DEMORA)
    // com o arquivo inteiro rodando, o campo leva mais de 1 s para mostrar a recusa
    expect(
      await screen.findByText('A data não pode ser antes do 1º parto.', {}, DEMORA),
    ).toBeTruthy()
    await waitFor(
      () =>
        expect((screen.getByLabelText('Data do acasalamento') as HTMLInputElement).value).toBe(
          '01/09/2026',
        ),
      DEMORA,
    )
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

  it('com a caixa do casal ocupada por outra ninhada, os a mais vão para a caixa de estoque clicada', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({ onde: [lugar({ idCaixa: 30, codigo: 'F1C', tipo: 'estoque', m: 4 })] }),
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

  it('a troca de sexo não cria animal: com a caixa ocupada, não pede caixa de estoque', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({ onde: [lugar({ idCaixa: 30, codigo: 'F1C', tipo: 'estoque', m: 4 })] }),
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
              pedidos: [],
            },
            {
              idCaixa: 30,
              codigo: 'F1C',
              numeroVisivel: 'E-01',
              tipo: 'estoque',
              m: 2,
              f: 0,
              reservados: 2,
              pedidos: [{ idPedido: 12, m: 2, f: 0 }],
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
    expect(botao('Registrar baixa')).toBeTruthy()
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
              pedidos: [],
            },
            {
              idCaixa: 30,
              codigo: 'F1C',
              numeroVisivel: 'E-01',
              tipo: 'estoque',
              m: 2,
              f: 0,
              reservados: 2,
              pedidos: [{ idPedido: 12, m: 2, f: 0 }],
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
              pedidos: [{ idPedido: 12, m: 2, f: 0 }],
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

  it('"só os do pedido" oferece só os pedidos com reservado nesta caixa, sem teto chutado', async () => {
    // o #12 tem 2 machos aqui; o #15 tem 2 machos do mesmo parto, mas na F1C
    api.ficha = fichaDeCasal({
      partos: [
        desmamado({
          onde: [
            lugar({
              idCaixa: 7,
              m: 4,
              f: 4,
              reservados: 2,
              pedidos: [{ idPedido: 12, m: 2, f: 0 }],
            }),
            lugar({
              idCaixa: 30,
              codigo: 'F1C',
              tipo: 'estoque',
              m: 2,
              reservados: 2,
              pedidos: [{ idPedido: 15, m: 2, f: 0 }],
            }),
          ],
          reservados: [
            { idPedido: 12, m: 2, f: 0 },
            { idPedido: 15, m: 2, f: 0 },
          ],
        }),
      ],
    })
    await abrirNinhada()

    fireEvent.click(botao('Passar para o estoque'))
    fireEvent.mouseDown(selecao('Quais machos'))

    expect(await screen.findByTitle('Só os reservados do pedido #12')).toBeTruthy()
    expect(screen.queryByTitle('Só os reservados do pedido #15')).toBeNull()
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
    fireEvent.click(botao('Registrar baixa'))
    const baixa = botao('Registrar baixa').closest('form') as HTMLElement
    fireEvent.change(within(baixa).getByLabelText('Fêmeas'), { target: { value: '1' } })
    fireEvent.click(botao('Registrar baixa', baixa))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith({
      idCaixa: 7,
      dtFato: hoje(),
      tipo: 'eutanasia',
      idParto: 10,
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
              pedidos: [],
            },
            {
              idCaixa: 21,
              codigo: 'F2D',
              numeroVisivel: 'E-01',
              tipo: 'estoque',
              m: 0,
              f: 4,
              reservados: 0,
              pedidos: [],
            },
          ],
        }),
      ],
    })
    await abrirNinhada()

    expect(screen.getByText('F2C (E-01), estoque: 4 machos')).toBeTruthy()
    expect(talvezBotao('Passar para o estoque')).toBeNull()
    expect(talvezBotao('Registrar baixa')).toBeNull()
  })
})

describe('abas da ficha do casal', { timeout: 20_000 }, () => {
  it('são Reprodução e Ninhada', async () => {
    abrirFicha()

    expect(await waitFor(() => nomesDasAbas().filter(Boolean))).toEqual(['Reprodução', 'Ninhada'])
  })

  it('a aba Ninhada não tem a lista Baixas lançadas', async () => {
    abrirFicha()
    fireEvent.click(aba('Ninhada'))
    await abaAberta()

    expect(screen.queryByText('Baixas lançadas')).toBeNull()
    expect(talvezBotao('Anular')).toBeNull()
  })
})

describe('caixa liberada', { timeout: 40_000 }, () => {
  /** a F1A liberada pela baixa dos últimos 4 M e 4 F, que mamavam; o casal já estava encerrado */
  const liberada = (): FichaDeCasal => {
    const ficha = fichaDeCasal({
      casal: casal(1, 'AB', false),
      partos: [parto({ vivos: { m: 0, f: 0 }, onde: [], baixasAntesDoDesmame: { m: 5, f: 5 } })],
    })
    return {
      ...ficha,
      caixa: {
        ...ficha.caixa,
        ativa: false,
        fase: null,
        atrasado: false,
        dtLiberacao: '2026-10-20',
        motivoLiberacao: 'baixa',
      },
    }
  }

  it('a ficha não lança fato novo, mas corrige o que já foi registrado', async () => {
    api.ficha = liberada()
    abrirFicha()

    expect(await screen.findByText('Liberada')).toBeTruthy()
    expect(
      screen.getByText(/^Caixa liberada em 20\/10\/2026: a baixa dos últimos animais/),
    ).toBeTruthy()
    expect(talvezBotao('Formar casal')).toBeNull()

    fireEvent.click(aba('Ninhada'))
    const ninhada = await abaAberta()
    expect(within(ninhada).getByText('Data do acasalamento')).toBeTruthy()
    expect(talvezBotao('Registrar desmame', ninhada)).toBeNull()
    expect(talvezBotao('Registrar baixa', ninhada)).toBeNull()
    expect(within(ninhada).getByText('A ninhada não chegou ao desmame.')).toBeTruthy()
    // o nascimento; a data do acasalamento se edita direto no campo
    expect(botoes('Corrigir', ninhada)).toHaveLength(1)
  })

  it('corrigir o nascimento com animais a mais pede a caixa de estoque: a liberada não recebe', async () => {
    api.ficha = liberada()
    abrirFicha()
    fireEvent.click(aba('Ninhada'))
    await abaAberta()

    corrigir('Parto')
    fireEvent.change(screen.getByLabelText('Machos nascidos'), { target: { value: '6' } })

    expect(await screen.findByText(/em qual caixa de estoque entram os machos a mais/)).toBeTruthy()
  })

  it('depois da baixa que libera a caixa, a ficha continua aberta, agora liberada, sem Desfazer', async () => {
    api.baixa.mockResolvedValueOnce({
      idOcorrencia: 42,
      baixas: { m: 4, f: 4 },
      liberada: true,
      faltas: [],
    })
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

    fireEvent.click(botao('Registrar baixa'))
    const baixa = botao('Registrar baixa').closest('form') as HTMLElement
    fireEvent.change(within(baixa).getByLabelText('Machos'), { target: { value: '4' } })
    fireEvent.change(within(baixa).getByLabelText('Fêmeas'), { target: { value: '4' } })
    fireEvent.click(botao('Registrar baixa', baixa))
    expect(await screen.findByText(/A caixa ficou vazia e foi liberada\./, {}, DEMORA)).toBeTruthy()

    // a API devolve a caixa liberada (ativa: false), e a mesma ficha a mostra
    api.ficha = liberada()
    fireEvent.click(screen.getByText('recarregar'))

    expect(await screen.findByText('Liberada')).toBeTruthy()
    // a baixa que esvaziou a caixa pediria caixa para voltar: a mensagem não oferece o Desfazer
    expect(screen.queryByRole('button', { name: 'Desfazer' })).toBeNull()
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

  it('o parto que ainda não existe diz que o acasalamento abre automaticamente, sem formulário', async () => {
    abrirFicha()
    await abaAberta()

    // o 2º parto ainda não existe: nas abas Reprodução e Ninhada, só o aviso
    fireEvent.click(screen.getByText('2º', { selector: 'button' }))
    const abre =
      /O acasalamento do 2º parto abre automaticamente, 6 dias depois do nascimento do 1º/
    expect(within(await abaAberta()).getByText(abre)).toBeTruthy()
    fireEvent.click(aba('Ninhada'))
    expect(within(await abaAberta()).getByText(abre)).toBeTruthy()

    expect(document.querySelectorAll('input[id$="_dtAcasalamento"]')).toHaveLength(0)
    expect(talvezBotao('Registrar acasalamento')).toBeNull()
  })

  it('o acasalamento que abriu automaticamente é só a data no campo, sem texto nem Corrigir', async () => {
    const pendente = (dtAcasalamento: string) =>
      parto({
        id: 11,
        ordem: 2,
        dtAcasalamento,
        dtPartoReal: null,
        nascidoM: null,
        nascidoF: null,
        vivos: { m: 0, f: 0 },
        baixasAntesDoDesmame: { m: 0, f: 0 },
        onde: [],
      })
    // 30/09 é o parto do 1º (24/09) mais 6 dias
    api.ficha = fichaDeCasal({ partos: [desmamado({ onde: [] }), pendente('2026-09-30')] })
    await abrirNinhada()
    fireEvent.click(screen.getByText('2º', { selector: 'button' }))

    const ninhada = await abaAberta()
    expect((within(ninhada).getByLabelText('Data do acasalamento') as HTMLInputElement).value).toBe(
      '30/09/2026',
    )
    expect(within(ninhada).queryByText(/Aberto automaticamente/)).toBeNull()
    expect(talvezBotao('Corrigir', secao('Acasalamento'))).toBeNull()
  })

  it('parto nascido mostra "Parto" com a data real; o desmame segue previsto', async () => {
    abrirFicha()

    const aba = await abaAberta()
    expect(within(aba).getByText('Parto')).toBeTruthy()
    expect(within(aba).queryByText('Parto previsto')).toBeNull()
    expect(within(aba).getByText('24/09/2026')).toBeTruthy()
    expect(within(aba).getByText('Desmame previsto')).toBeTruthy()
    expect(within(aba).getByText('16/10/2026')).toBeTruthy()
  })

  it('parto ainda não nascido mostra a previsão do parto e do desmame', async () => {
    api.ficha = fichaDeCasal({
      partos: [
        parto({
          dtPartoReal: null,
          dtPartoPrevisto: '2026-09-25',
          dtDesmamePrevisto: '2026-10-17',
        }),
      ],
    })
    abrirFicha()

    const aba = await abaAberta()
    expect(within(aba).getByText('Parto previsto')).toBeTruthy()
    expect(within(aba).getByText('25/09/2026')).toBeTruthy()
    expect(within(aba).getByText('Desmame previsto')).toBeTruthy()
  })

  it('desmame registrado mostra "Desmame" com a data real', async () => {
    api.ficha = fichaDeCasal({ partos: [desmamado({ dtDesmameReal: '2026-10-18' })] })
    abrirFicha()

    const aba = await abaAberta()
    expect(within(aba).getByText('Desmame')).toBeTruthy()
    expect(within(aba).queryByText('Desmame previsto')).toBeNull()
    expect(within(aba).getByText('18/10/2026')).toBeTruthy()
  })

  it('casal encerrado diz quando encerrou', async () => {
    api.ficha = fichaDeCasal({ casal: casal(1, 'AB', false), partos: [desmamado({ onde: [] })] })
    abrirFicha()

    expect(await screen.findByText('Casal encerrado em 27/10/2026')).toBeTruthy()
    expect(botao('Formar casal')).toBeTruthy()
  })
})

describe('encerrar casal', { timeout: 40_000 }, () => {
  it('encerra com a data e o motivo até hoje; antes do acasalamento pendente também, que se desfaz', async () => {
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

    // o 2º parto ainda não nasceu: o limite é o acasalamento do 1º (01/09), e a API desfaz o
    // acasalamento de 20/10 se o encerramento vier antes dele
    fireEvent.click(screen.getByLabelText('Data'))
    await waitFor(() => expect(diaNoCalendario('2026-10-20')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-10-01')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-19')).not.toContain(APAGADO)
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
        fase: null,
        atrasado: false,
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
              pedidos: [],
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

describe('editar o casal pelo lápis', { timeout: 30_000 }, () => {
  const lapis = () => document.querySelector<HTMLButtonElement>('button[aria-label="Editar casal"]')

  /** escolhe a opção no Select do rótulo: a da lista aberta por último, que é a deste campo */
  async function escolher(rotulo: string, opcao: string) {
    fireEvent.mouseDown(selecao(rotulo))
    const opcoes = await screen.findAllByTitle(opcao)
    fireEvent.click(opcoes[opcoes.length - 1] as HTMLElement)
  }

  async function abrirEdicao() {
    abrirFicha()
    fireEvent.click(lapis() as HTMLButtonElement)
    return screen.findByText('Editar casal AB')
  }

  it('o técnico e o gestor veem o lápis no título da ficha; o pesquisador, não', () => {
    abrirFicha()
    expect(lapis()).not.toBeNull()
    cleanup()

    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />, 'gestor')
    expect(lapis()).not.toBeNull()
    cleanup()

    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />, 'pesquisador')
    expect(lapis()).toBeNull()
  })

  it('a caixa de estoque não tem casal para editar', () => {
    api.ficha = fichaDeEstoque()
    abrirFicha()

    expect(lapis()).toBeNull()
  })

  it('abre preenchido e manda só as letras que mudaram', async () => {
    await abrirEdicao()

    expect(selecao('Linhagem').closest('.ant-select')?.textContent).toContain('Wistar')
    expect(selecao('Grupo do macho (A-E)').closest('.ant-select')?.textContent).toContain('A')
    expect(selecao('Grupo da fêmea (A-E)').closest('.ant-select')?.textContent).toContain('B')

    await escolher('Grupo da fêmea (A-E)', 'A')
    fireEvent.click(botao('Salvar'))

    await waitFor(() => expect(api.editar).toHaveBeenCalled(), DEMORA)
    expect(api.editar).toHaveBeenCalledWith({ idCasal: 1, grupoFemea: 'A' })
  })

  it('o parto em que entrou e a linhagem vão juntos, com o nome dos campos da API', async () => {
    await abrirEdicao()

    await escolher('Linhagem', 'Swiss')
    fireEvent.click(screen.getByText('3º', { selector: '.ant-segmented-item-label' }))
    fireEvent.click(botao('Salvar'))

    await waitFor(() => expect(api.editar).toHaveBeenCalled(), DEMORA)
    expect(api.editar).toHaveBeenCalledWith({ idCasal: 1, idLinhagem: 2, partoInicial: 3 })
  })

  it('a recusa da API aparece no campo que ela apontou, e a janela fica aberta', async () => {
    api.editar.mockReset().mockRejectedValue(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        idLinhagem:
          'A caixa de estoque F2C tem animais deste casal junto com animais de outra ninhada.',
      }),
    )
    await abrirEdicao()

    await escolher('Linhagem', 'Swiss')
    fireEvent.click(botao('Salvar'))

    expect(
      await screen.findByText(
        'A caixa de estoque F2C tem animais deste casal junto com animais de outra ninhada.',
        {},
        DEMORA,
      ),
    ).toBeTruthy()
    expect(screen.getByText('Editar casal AB')).toBeTruthy()
  })
})

describe('editar a caixa de estoque pelo lápis', { timeout: 30_000 }, () => {
  const lapis = () =>
    document.querySelector<HTMLButtonElement>('button[aria-label="Editar caixa de estoque"]')

  /**
   * A F1C de machos Wistar com duas idades: a de 24/09 com 4 do cadastro inicial (entraram em
   * 10/11) e 2 do 1º parto do casal AB; a de 01/10, com 3 de outro cadastro (entraram em 12/11)
   */
  function estoqueDoCadastro() {
    const base = fichaDeEstoque()
    const grupo = base.grupos[0] as (typeof base.grupos)[number]
    return fichaDeEstoque({
      grupos: [
        {
          ...grupo,
          origens: [
            {
              idParto: 40,
              ordem: null,
              casal: null,
              codigoOrigem: null,
              numeroVisivelOrigem: null,
              qtd: 4,
              dtEntrada: '2026-11-10',
            },
            { ...(grupo.origens[0] as (typeof grupo.origens)[number]), qtd: 2 },
          ],
        },
        {
          ...grupo,
          dtNascimento: '2026-10-01',
          origens: [
            {
              idParto: 41,
              ordem: null,
              casal: null,
              codigoOrigem: null,
              numeroVisivelOrigem: null,
              qtd: 3,
              dtEntrada: '2026-11-12',
            },
          ],
        },
      ],
    })
  }

  async function abrirEdicao() {
    api.ficha = estoqueDoCadastro()
    abrirFicha()
    fireEvent.click(lapis() as HTMLButtonElement)
    return screen.findByText('Editar caixa de estoque F1C')
  }

  /** Digita o dia (dd/mm/aaaa) no campo dado e confirma */
  function digitarData(campo: HTMLElement, dia: string) {
    fireEvent.mouseDown(campo)
    fireEvent.change(campo, { target: { value: dia } })
    fireEvent.keyDown(campo, { key: 'Enter', code: 'Enter' })
  }

  const camposDeNascimento = () =>
    screen.getAllByLabelText(/Nascimento do cadastro inicial/) as HTMLInputElement[]

  it('o técnico e o gestor veem o lápis na caixa de estoque; o pesquisador e a caixa liberada, não', () => {
    api.ficha = fichaDeEstoque()
    abrirFicha()
    expect(lapis()).not.toBeNull()
    cleanup()

    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />, 'gestor')
    expect(lapis()).not.toBeNull()
    cleanup()

    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />, 'pesquisador')
    expect(lapis()).toBeNull()
    cleanup()

    const liberada = fichaDeEstoque()
    api.ficha = { ...liberada, caixa: { ...liberada.caixa, ativa: false } }
    abrirFicha()
    expect(lapis()).toBeNull()
  })

  it('a caixa de casal não tem o lápis do estoque', () => {
    abrirFicha()
    expect(lapis()).toBeNull()
  })

  it('abre preenchida, com um nascimento por ninhada do cadastro e o de casal só como texto', async () => {
    await abrirEdicao()

    expect(selecao('Linhagem').closest('.ant-select')?.textContent).toContain('Wistar')
    expect(camposDeNascimento().map((campo) => campo.value)).toEqual(['24/09/2026', '01/10/2026'])
    expect(
      screen.getByText('Entraram no estoque em 10/11/2026: o nascimento não passa disso.'),
    ).toBeTruthy()
    expect(
      screen.getByText('2 do 1º parto do casal AB, caixa F1A: corrija pela ficha do casal.'),
    ).toBeTruthy()
  })

  it('manda só o que mudou: o sexo, e o nascimento da ninhada com o id do parto dela', async () => {
    await abrirEdicao()

    fireEvent.click(screen.getByText('♀ Fêmeas', { selector: '.ant-segmented-item-label' }))
    digitarData(camposDeNascimento()[1] as HTMLElement, '28/09/2026')
    fireEvent.click(botao('Salvar'))

    await waitFor(() => expect(api.editarEstoque).toHaveBeenCalled(), DEMORA)
    expect(api.editarEstoque).toHaveBeenCalledWith({
      idCaixa: 30,
      sexo: 'F',
      nascimentos: [{ idParto: 41, dtNascimento: '2026-09-28' }],
    })
  })

  it('sem mudança nenhuma, fecha sem chamar a API', async () => {
    await abrirEdicao()

    fireEvent.click(botao('Salvar'))

    await waitFor(
      () => expect(screen.queryByText('Editar caixa de estoque F1C')).toBeNull(),
      DEMORA,
    )
    expect(api.editarEstoque).not.toHaveBeenCalled()
  })

  it('a recusa da API aparece no campo que ela apontou, e a janela fica aberta', async () => {
    api.editarEstoque.mockReset().mockRejectedValue(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        sexo: '2 machos desta caixa estão reservados (pedido #12), e o pedido conta pelo sexo.',
      }),
    )
    await abrirEdicao()

    fireEvent.click(screen.getByText('♀ Fêmeas', { selector: '.ant-segmented-item-label' }))
    fireEvent.click(botao('Salvar'))

    expect(
      await screen.findByText(
        '2 machos desta caixa estão reservados (pedido #12), e o pedido conta pelo sexo.',
        {},
        DEMORA,
      ),
    ).toBeTruthy()
    expect(screen.getByText('Editar caixa de estoque F1C')).toBeTruthy()
  })

  it('a recusa do nascimento vai para o campo da ninhada certa, mesmo com só ela no corpo', async () => {
    api.editarEstoque.mockReset().mockRejectedValue(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        'nascimentos.0.dtNascimento': 'Não pode ser depois da entrada no estoque (12/11/2026).',
      }),
    )
    await abrirEdicao()

    digitarData(camposDeNascimento()[1] as HTMLElement, '28/09/2026')
    fireEvent.click(botao('Salvar'))

    const mensagem = await screen.findByText(
      'Não pode ser depois da entrada no estoque (12/11/2026).',
      {},
      DEMORA,
    )
    // no segundo campo de nascimento, o que mudou, e não no primeiro
    const doCampo = mensagem.closest('.ant-form-item')
    expect(doCampo?.textContent).toContain('3 animais')
  })
})
