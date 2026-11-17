import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { BaixaDoParto, Casal, FichaDeCasal } from '@/dominio/tipos'
import {
  APAGADO,
  botao,
  botoes,
  casal,
  catalogo,
  celula,
  desmamado,
  diaNoCalendario,
  erroDaApi,
  estanteE01,
  fichaDeCasal,
  gradeE01,
  lugar,
  mutacaoComResposta,
  nomesDasAbas,
  parto,
  selecao,
  talvezBotao,
} from '@/testes/ficha'
import { consulta, renderizar } from '@/testes/renderizar'
import { EditarCasal } from './EditarCasal'

// O lápis Editar da ficha do casal: a aba Casal e uma aba por parto, cada seção com o seu Salvar e
// a sua rota. A ficha em volta (o título, as abas Reprodução e Ninhada) está em FichaDaCaixa.test

/** o que cada seção manda para a API */
const api = vi.hoisted(() => ({
  editar: vi.fn(),
  acasalamento: vi.fn(),
  corrigir: vi.fn(),
  baixa: vi.fn(),
  anulacao: vi.fn(),
}))

vi.mock('@/dominio/consultas', () => ({
  useCatalogo: () => consulta(catalogo),
  useEditarCasal: () => mutacaoComResposta(api.editar),
  useCorrigirAcasalamento: () => mutacaoComResposta(api.acasalamento),
  useCorrigirEvento: () => mutacaoComResposta(api.corrigir),
  useCorrigirBaixa: () => mutacaoComResposta(api.baixa),
  useAnularBaixa: () => mutacaoComResposta(api.anulacao),
  useEstantes: () => consulta([estanteE01]),
  useGrade: () => consulta(gradeE01),
}))

beforeEach(() => {
  api.editar.mockReset().mockResolvedValue(casal(1, 'AB', true))
  api.acasalamento.mockReset().mockResolvedValue(parto())
  api.corrigir.mockReset().mockResolvedValue({ parto: parto(), faltas: [] })
  api.baixa.mockReset().mockResolvedValue({ parto: parto(), faltas: [] })
  api.anulacao.mockReset().mockResolvedValue({ voltaram: [], soltos: { m: 0, f: 0 } })
})

/** o formulário do antd valida e responde depois de alguns ciclos: no jsdom, passa de 1 s */
const DEMORA = { timeout: 10_000 }

/** Uma baixa do 1º parto: a seleção de 01/10, 1 macho, na caixa do casal */
const baixa = (parcial: Partial<BaixaDoParto> = {}): BaixaDoParto => ({
  idOcorrencia: 41,
  dtFato: '2026-10-01',
  causa: 'eutanasia',
  codigo: 'F1A',
  m: 1,
  f: 0,
  doDesmame: false,
  comOutraNinhada: false,
  ...parcial,
})

/** Abre o lápis da ficha dada e, se pedido, a aba do parto */
async function abrir(ficha: FichaDeCasal = fichaDeCasal(), abaDoParto?: string) {
  renderizar(<EditarCasal casal={ficha.casal as Casal} ficha={ficha} />)
  fireEvent.click(document.querySelector('button[aria-label="Editar"]') as HTMLButtonElement)
  await screen.findByText(`Editar casal ${ficha.casal?.identificacao ?? ''}`)
  if (abaDoParto) fireEvent.click(screen.getByText(abaDoParto, { selector: '[role="tab"]' }))
}

/** A seção da aba aberta, pelo título */
function secao(nome: string): HTMLElement {
  const achada = document.querySelector<HTMLElement>(
    `.ant-tabs-tabpane-active section[aria-label="${nome}"]`,
  )
  if (!achada) throw new Error(`Sem a seção ${nome}`)
  return achada
}

/** O formulário de uma baixa, pela descrição: "Baixa de 01/10/2026, na caixa F1A: 1 macho" */
function linhaDaBaixa(descricao: string): HTMLElement {
  const achada = document.querySelector<HTMLElement>(`form[aria-label="Baixa de ${descricao}"]`)
  if (!achada) throw new Error(`Sem a baixa ${descricao}`)
  return achada
}

/** Digita o dia (dd/mm/aaaa) no campo de data */
function digitarData(campo: HTMLElement, dia: string) {
  fireEvent.mouseDown(campo)
  fireEvent.change(campo, { target: { value: dia } })
  fireEvent.keyDown(campo, { key: 'Enter', code: 'Enter' })
}

describe('o lápis Editar', { timeout: 40_000 }, () => {
  it('abre a aba Casal e uma aba por parto do casal da ficha', async () => {
    await abrir(
      fichaDeCasal({
        partos: [
          desmamado({ onde: [] }),
          parto({ id: 11, ordem: 2, dtAcasalamento: '2026-09-30', dtPartoReal: null }),
        ],
        // os partos do casal de antes na caixa não entram
        anteriores: [{ casal: casal(9, 'CD', false), partos: [parto({ id: 3, ordem: 4 })] }],
      }),
    )

    expect(nomesDasAbas().filter(Boolean)).toEqual(['Casal', '1º parto', '2º parto'])
  })

  it('a aba Casal mantém o aviso do cruzamento e salva só o que mudou, sem fechar a janela', async () => {
    await abrir()

    fireEvent.mouseDown(selecao('Grupo da fêmea (A-E)'))
    const opcoes = await screen.findAllByTitle('C')
    fireEvent.click(opcoes[opcoes.length - 1] as HTMLElement)
    expect(await screen.findByText('Par fora da regra de cruzamento')).toBeTruthy()

    fireEvent.click(botao('Salvar'))

    await waitFor(() => expect(api.editar).toHaveBeenCalled(), DEMORA)
    expect(api.editar).toHaveBeenCalledWith({ idCasal: 1, grupoFemea: 'C' })
    expect(await screen.findByText('Casal AC salvo.')).toBeTruthy()
    expect(screen.getByText('Editar casal AB')).toBeTruthy()
  })
})

describe('acasalamento e parto', { timeout: 40_000 }, () => {
  it('o acasalamento salva só a data, pela rota dele', async () => {
    await abrir(fichaDeCasal(), '1º parto')

    digitarData(within(secao('Acasalamento')).getByLabelText('Data do acasalamento'), '03/09/2026')
    fireEvent.click(botao('Salvar', secao('Acasalamento')))

    await waitFor(() => expect(api.acasalamento).toHaveBeenCalled(), DEMORA)
    expect(api.acasalamento).toHaveBeenCalledWith({ idParto: 10, dtAcasalamento: '2026-09-03' })
    expect(await screen.findByText('Acasalamento salvo.')).toBeTruthy()
  })

  it('o parto corrige a data e a contagem sem motivo', async () => {
    await abrir(fichaDeCasal(), '1º parto')

    expect(screen.queryByLabelText(/Motivo/)).toBeNull()
    fireEvent.change(within(secao('Parto')).getByLabelText('Machos nascidos'), {
      target: { value: '6' },
    })
    fireEvent.click(botao('Salvar', secao('Parto')))

    await waitFor(() => expect(api.corrigir).toHaveBeenCalled(), DEMORA)
    expect(api.corrigir).toHaveBeenCalledWith({
      idParto: 10,
      evento: 'nascimento',
      corpo: { dtPartoReal: '2026-09-24', nascidoM: 6, nascidoF: 5 },
    })
    expect(await screen.findByText('Parto salvo.')).toBeTruthy()
  })

  it('o parto fica entre o acasalamento e o desmame, e não passa do primeiro fato dos animais', async () => {
    await abrir(
      fichaDeCasal({
        partos: [desmamado({ dtDesmameReal: '2026-09-28', dtPrimeiroFato: '2026-09-26' })],
      }),
      '1º parto',
    )

    fireEvent.click(within(secao('Parto')).getByLabelText('Data do parto'))
    await waitFor(() => expect(diaNoCalendario('2026-09-24')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-08-31')).toContain(APAGADO)
    expect(diaNoCalendario('2026-09-01')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-26')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-27')).toContain(APAGADO)
  })

  it('com a caixa do casal ocupada por outra ninhada, os a mais vão para a caixa de estoque clicada', async () => {
    await abrir(
      fichaDeCasal({
        partos: [
          desmamado({ onde: [lugar({ idCaixa: 30, codigo: 'F1C', tipo: 'estoque', m: 4 })] }),
          parto({ id: 11, ordem: 2, dtAcasalamento: '2026-10-20', dtPartoReal: '2026-11-05' }),
        ],
      }),
      '1º parto',
    )

    fireEvent.change(within(secao('Parto')).getByLabelText('Machos nascidos'), {
      target: { value: '6' },
    })
    const caixa = (
      await screen.findByText(/em qual caixa de estoque entram os machos a mais/)
    ).closest('.ant-form-item') as HTMLElement
    fireEvent.click(celula(/^F1C: caixa de estoque com 6 machos/, caixa))
    fireEvent.click(botao('Salvar', secao('Parto')))

    await waitFor(() => expect(api.corrigir).toHaveBeenCalled(), DEMORA)
    expect(api.corrigir).toHaveBeenCalledWith({
      idParto: 10,
      evento: 'nascimento',
      corpo: { dtPartoReal: '2026-09-24', nascidoM: 6, nascidoF: 5, idCaixa: 30 },
    })
  })

  it('com a mais dos dois sexos e a caixa ocupada, pede um sexo por vez e prende o envio', async () => {
    await abrir(
      fichaDeCasal({
        partos: [
          desmamado({ onde: [] }),
          parto({ id: 11, ordem: 2, dtAcasalamento: '2026-10-20', dtPartoReal: '2026-11-05' }),
        ],
      }),
      '1º parto',
    )

    fireEvent.change(within(secao('Parto')).getByLabelText('Machos nascidos'), {
      target: { value: '6' },
    })
    fireEvent.change(within(secao('Parto')).getByLabelText('Fêmeas nascidas'), {
      target: { value: '6' },
    })

    expect(await screen.findByText(/Corrija um sexo de cada vez\./)).toBeTruthy()
    expect(botao('Salvar', secao('Parto'))).toHaveProperty('disabled', true)
  })

  it('o parto fechado sem ninhada corrige a data e o motivo do fechamento', async () => {
    await abrir(
      fichaDeCasal({
        casal: casal(1, 'AB', false),
        partos: [
          parto({
            dtPartoReal: null,
            nascidoM: null,
            nascidoF: null,
            onde: [],
            dtSemNinhada: '2026-10-30',
            motivoSemNinhada: 'não emprenhou',
          }),
        ],
      }),
      '1º parto',
    )

    expect(
      document.querySelector('.ant-tabs-tabpane-active section[aria-label="Baixas"]'),
    ).toBeNull()
    fireEvent.change(within(secao('Parto')).getByLabelText('Por que não nasceu'), {
      target: { value: 'a fêmea morreu' },
    })
    fireEvent.click(botao('Salvar', secao('Parto')))

    await waitFor(() => expect(api.corrigir).toHaveBeenCalled(), DEMORA)
    expect(api.corrigir).toHaveBeenCalledWith({
      idParto: 10,
      evento: 'sem-ninhada',
      corpo: { dtSemNinhada: '2026-10-30', motivo: 'a fêmea morreu' },
    })
    expect(await screen.findByText('Fechamento salvo.')).toBeTruthy()
  })

  it('o parto que não nasceu manda registrar na aba Ninhada, sem baixas nem desmame', async () => {
    await abrir(
      fichaDeCasal({ partos: [parto({ dtPartoReal: null, nascidoM: null, nascidoF: null })] }),
      '1º parto',
    )

    expect(
      within(secao('Parto')).getByText(
        'O parto ainda não foi registrado: registre na aba Ninhada.',
      ),
    ).toBeTruthy()
    expect(
      document.querySelector('.ant-tabs-tabpane-active section[aria-label="Desmame"]'),
    ).toBeNull()
  })
})

describe('baixas do parto', { timeout: 40_000 }, () => {
  it('cada baixa tem data, causa e contagem, e o Salvar manda o corpo dela pela rota da baixa', async () => {
    await abrir(
      fichaDeCasal({
        partos: [
          parto({
            baixas: [
              baixa(),
              baixa({ idOcorrencia: 42, causa: 'morte', dtFato: '2026-10-03', m: 0, f: 1 }),
            ],
          }),
        ],
      }),
      '1º parto',
    )

    const linha = linhaDaBaixa('01/10/2026, na caixa F1A: 1 macho')
    expect(linhaDaBaixa('03/10/2026, na caixa F1A: 1 fêmea')).toBeTruthy()
    // antes do desmame, as causas do aleitamento
    expect(within(linha).getByLabelText('Eutanásia (ajuste de ninhada)')).toHaveProperty(
      'checked',
      true,
    )
    fireEvent.change(within(linha).getByLabelText('Machos'), { target: { value: '2' } })
    fireEvent.click(within(linha).getByLabelText('Morte no aleitamento'))
    fireEvent.click(botao('Salvar', linha))

    await waitFor(() => expect(api.baixa).toHaveBeenCalled(), DEMORA)
    expect(api.baixa).toHaveBeenCalledWith({
      idParto: 10,
      idOcorrencia: 41,
      dtFato: '2026-10-01',
      tipo: 'morte',
      qtdM: 2,
      qtdF: 0,
    })
    expect(await screen.findByText('Baixa salva.')).toBeTruthy()
  })

  it('depois do desmame as causas são as comuns; até ele, as do aleitamento', async () => {
    await abrir(
      fichaDeCasal({
        partos: [
          desmamado({
            baixas: [baixa(), baixa({ idOcorrencia: 42, causa: 'morte', dtFato: '2026-10-20' })],
          }),
        ],
      }),
      '1º parto',
    )

    const depois = linhaDaBaixa('20/10/2026, na caixa F1A: 1 macho')
    expect(within(depois).getByLabelText('Morte')).toHaveProperty('checked', true)
    expect(within(depois).queryByLabelText('Morte no aleitamento')).toBeNull()
    expect(
      within(linhaDaBaixa('01/10/2026, na caixa F1A: 1 macho')).getByLabelText(
        'Morte no aleitamento',
      ),
    ).toBeTruthy()
  })

  it('excluir pede confirmação e anula a baixa sem motivo', async () => {
    await abrir(fichaDeCasal({ partos: [parto({ baixas: [baixa()] })] }), '1º parto')

    fireEvent.click(botao('Excluir', linhaDaBaixa('01/10/2026, na caixa F1A: 1 macho')))
    expect((await screen.findAllByText('Excluir a baixa?')).length).toBeGreaterThan(0)
    expect(
      screen.getByText('1 macho volta a viver, como se a baixa não tivesse acontecido.'),
    ).toBeTruthy()
    expect(api.anulacao).not.toHaveBeenCalled()
    fireEvent.click(botoes('Excluir').at(-1) as HTMLElement)

    await waitFor(() => expect(api.anulacao).toHaveBeenCalled(), DEMORA)
    expect(api.anulacao).toHaveBeenCalledWith({ idOcorrencia: 41 })
    expect(await screen.findByText('Baixa excluída.')).toBeTruthy()
  })

  it('quando a caixa da baixa não serve mais, a exclusão pede para qual caixa de estoque os animais voltam', async () => {
    api.anulacao.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        idCaixaMachos:
          'A caixa F1A já foi liberada: diga para qual caixa de estoque volta 1 macho.',
      }),
    )
    await abrir(
      fichaDeCasal({ partos: [desmamado({ baixas: [baixa({ dtFato: '2026-10-20' })] })] }),
      '1º parto',
    )
    const linha = () => linhaDaBaixa('20/10/2026, na caixa F1A: 1 macho')

    fireEvent.click(botao('Excluir', linha()))
    fireEvent.click((await waitFor(() => botoes('Excluir').at(-1))) as HTMLElement)

    expect(
      await screen.findByText(
        'A caixa F1A já foi liberada: diga para qual caixa de estoque volta 1 macho.',
        {},
        DEMORA,
      ),
    ).toBeTruthy()
    const campo = within(linha())
      .getByText('Para qual caixa de estoque voltam os machos')
      .closest('.ant-form-item') as HTMLElement
    fireEvent.click(celula(/^F1C: caixa de estoque com 6 machos/, campo))
    fireEvent.click(botao('Excluir', linha()))
    await waitFor(() => expect(screen.getAllByText('Excluir a baixa?').length).toBeGreaterThan(0))
    fireEvent.click(botoes('Excluir').at(-1) as HTMLElement)

    await waitFor(() => expect(api.anulacao).toHaveBeenCalledTimes(2), DEMORA)
    expect(api.anulacao).toHaveBeenLastCalledWith({ idOcorrencia: 41, idCaixaMachos: 30 })
  })

  it('a baixa do desmame e a que leva outra ninhada ficam só para ler', async () => {
    await abrir(
      fichaDeCasal({
        partos: [
          desmamado({
            baixas: [
              baixa({
                idOcorrencia: 43,
                causa: 'morte',
                dtFato: '2026-10-16',
                doDesmame: true,
                m: 2,
              }),
              baixa({
                idOcorrencia: 44,
                causa: 'morte',
                dtFato: '2026-10-25',
                codigo: 'F1C',
                comOutraNinhada: true,
              }),
            ],
          }),
        ],
      }),
      '1º parto',
    )

    const baixas = secao('Baixas')
    expect(
      within(baixas).getByText(/16\/10\/2026, na caixa F1A: 2 machos, não chegaram ao desmame/),
    ).toBeTruthy()
    expect(within(baixas).getByText(/numa baixa com animais de outra ninhada/)).toBeTruthy()
    expect(talvezBotao('Excluir', baixas)).toBeNull()
    expect(talvezBotao('Salvar', baixas)).toBeNull()
  })
})

describe('desmame', { timeout: 40_000 }, () => {
  const ficha = () => fichaDeCasal({ partos: [desmamado()] })

  it('só a data muda: o corpo leva só a data, e a API recalcula a contagem nela', async () => {
    await abrir(ficha(), '1º parto')

    digitarData(within(secao('Desmame')).getByLabelText('Data do desmame'), '14/10/2026')
    fireEvent.click(botao('Salvar', secao('Desmame')))

    await waitFor(() => expect(api.corrigir).toHaveBeenCalled(), DEMORA)
    expect(api.corrigir).toHaveBeenCalledWith({
      idParto: 10,
      evento: 'desmame',
      corpo: { dtDesmameReal: '2026-10-14' },
    })
    expect(await screen.findByText('Desmame salvo.')).toBeTruthy()
  })

  it('a contagem que mudou vai junto, só o sexo que mudou', async () => {
    await abrir(ficha(), '1º parto')

    fireEvent.change(within(secao('Desmame')).getByLabelText('Fêmeas desmamadas'), {
      target: { value: '3' },
    })
    fireEvent.click(botao('Salvar', secao('Desmame')))

    await waitFor(() => expect(api.corrigir).toHaveBeenCalled(), DEMORA)
    expect(api.corrigir).toHaveBeenCalledWith({
      idParto: 10,
      evento: 'desmame',
      corpo: { dtDesmameReal: '2026-10-16', desmamadoF: 3 },
    })
  })

  it('a recusa da API aparece no campo que ela aponta, e a janela fica aberta', async () => {
    api.corrigir.mockRejectedValueOnce(
      erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
        desmamadoM: 'A contagem do desmame só sobe desfazendo a baixa "não chegou ao desmame".',
      }),
    )
    await abrir(ficha(), '1º parto')

    fireEvent.change(within(secao('Desmame')).getByLabelText('Machos desmamados'), {
      target: { value: '5' },
    })
    fireEvent.click(botao('Salvar', secao('Desmame')))

    expect(
      await screen.findByText(
        'A contagem do desmame só sobe desfazendo a baixa "não chegou ao desmame".',
        {},
        DEMORA,
      ),
    ).toBeTruthy()
    expect(screen.queryByText('Confira os campos destacados.')).toBeNull()
    expect(screen.getByText('Editar casal AB')).toBeTruthy()
  })

  it('a data fica entre o parto e a primeira saída, e avisa quando a seleção vai junto', async () => {
    await abrir(
      fichaDeCasal({
        partos: [
          desmamado({
            dtDesmameReal: '2026-09-28',
            dtUltimaSelecao: '2026-09-26',
            dtPrimeiraSaida: '2026-09-30',
          }),
        ],
      }),
      '1º parto',
    )

    const campo = within(secao('Desmame')).getByLabelText('Data do desmame')
    fireEvent.click(campo)
    await waitFor(() => expect(diaNoCalendario('2026-09-24')).not.toBe('(sem dia)'))
    expect(diaNoCalendario('2026-09-23')).toContain(APAGADO)
    expect(diaNoCalendario('2026-09-24')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-09-30')).not.toContain(APAGADO)
    expect(diaNoCalendario('2026-10-01')).toContain(APAGADO)

    digitarData(campo, '25/09/2026')
    expect(
      await screen.findByText(
        'As eutanásias de seleção de 26/09/2026 passam para a data do desmame.',
      ),
    ).toBeTruthy()
  })
})
