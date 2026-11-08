import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Casal, Estante, Ficha, FichaDeEstoque, Grade, Parto } from '@/dominio/tipos'
import { ErroDeApi } from '@/lib/api'
import { consulta, mutacao, renderizar } from '@/testes/renderizar'
import { FichaDaCaixa } from './FichaDaCaixa'

const parto = (parcial: Partial<Parto> = {}): Parto => ({
  id: 10,
  ordem: 1,
  dtAcasalamento: '2026-09-01',
  dtPartoPrevisto: '2026-09-24',
  dtPartoReal: '2026-09-24',
  nascidoM: 5,
  nascidoF: 5,
  dtSelecao: '2026-09-24',
  eutanasiadoM: 1,
  eutanasiadoF: 1,
  dtDesmamePrevisto: '2026-10-16',
  dtDesmameReal: null,
  desmamadoM: null,
  desmamadoF: null,
  disponivel: { m: 4, f: 4 },
  comprometido: { m: 0, f: 0 },
  entregue: { m: 0, f: 0 },
  falta: null,
  naCaixa: { m: 4, f: 4 },
  noEstoque: [],
  ...parcial,
})

const casal = (id: number, identificacao: string, ativo: boolean): Casal => ({
  id,
  identificacao,
  grupoMacho: identificacao.charAt(0),
  grupoFemea: identificacao.charAt(1),
  linhagem: 'Wistar',
  dtFormacao: '2026-09-01',
  ativo,
  dtEncerramento: ativo ? null : '2026-10-27',
})

const fichaDe = (parcial: Partial<Ficha> = {}): Ficha => ({
  tipo: 'casal',
  virarEstoque: null,
  caixa: {
    id: 7,
    endereco: { numeroVisivel: 'E-01', sala: 'Sala 1', codigo: 'F1A' },
    especie: 'rato',
    linhagem: 'Wistar',
    estado: 'livres',
  },
  casal: casal(1, 'AB', true),
  partos: [parto()],
  anteriores: [],
  eventos: [],
  ...parcial,
})

/** a passagem para o estoque: o que ela manda para a API */
const passar = vi.hoisted(() => vi.fn())

// a estante da caixa F1A: a F1A com o casal, a F1B e a F1D vazias, a F1C uma caixa de estoque de
// 3 machos Wistar
const estanteE01: Estante = {
  id: 1,
  idSala: 1,
  sala: 'Sala 1',
  fabricante: 'ALESCO',
  modelo: 'Modelo 2',
  numeroVisivel: 'E-01',
  faces: 1,
  linhas: 1,
  colunas: 4,
}

const gradeE01: Grade = {
  faces: [
    {
      face: 'frontal',
      posicoes: [
        { linha: 1, coluna: 1, codigo: 'F1A', caixa: { id: 7, estado: 'livres', linhagem: 'Wistar', casal: null, estoque: null } },
        { linha: 1, coluna: 2, codigo: 'F1B', caixa: null },
        {
          linha: 1,
          coluna: 3,
          codigo: 'F1C',
          caixa: { id: 30, estado: 'estoque', linhagem: 'Wistar', casal: null, estoque: { sexo: 'M', total: 3, reservado: 0 } },
        },
        { linha: 1, coluna: 4, codigo: 'F1D', caixa: null },
      ],
    },
  ],
}

const banco = vi.hoisted(() => ({
  ficha: null as unknown,
  /** o que o registro na ficha responde: a falha da API */
  falha: null as Error | null,
}))

vi.mock('@/dominio/consultas', () => ({
  useFicha: () => consulta(banco.ficha),
  useRegistrarNaFicha: () => ({
    isPending: false,
    mutate: (_corpo: unknown, opcoes: { onError: (erro: Error) => void }) => {
      if (banco.falha) opcoes.onError(banco.falha)
    },
  }),
  useCorrigirEvento: mutacao,
  useCatalogo: () => consulta({ especies: [], paresGeneticos: [] }),
  useFormarCasal: mutacao,
  usePassarParaOEstoque: () => ({ mutateAsync: passar, isPending: false }),
  useVirarCaixaDeEstoque: mutacao,
  useEstantes: () => consulta([estanteE01]),
  useGrade: () => consulta(gradeE01),
}))

const erroDaApi = (status: number, codigo: string, mensagem: string, campos?: Record<string, string>) =>
  new ErroDeApi(status, { erro: { codigo, mensagem, ...(campos ? { campos } : {}) } })

async function registrarDesmame() {
  renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Ninhada' }))
  fireEvent.click(await screen.findByRole('button', { name: 'Registrar desmame' }))
}

beforeEach(() => {
  banco.ficha = fichaDe()
  banco.falha = null
})

/** o formulário do antd valida e responde depois de alguns ciclos: no jsdom, passa de 1 s */
const DEMORA = { timeout: 5000 }

// O modal do antd com as abas leva segundos para montar no jsdom, e o envio do formulário mais
// alguns: com a suíte inteira rodando, passa de 20 s
describe('formulários da ficha', { timeout: 40_000 }, () => {
  it('a recusa da API aparece no campo que ela aponta, e não só "confira os campos"', async () => {
    banco.falha = erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
      desmamadoM: 'Nao pode passar do nascido menos a selecao (4 M, 4 F).',
    })

    await registrarDesmame()

    expect(await screen.findByText('Nao pode passar do nascido menos a selecao (4 M, 4 F).', {}, DEMORA)).toBeTruthy()
    expect(screen.queryByText('Confira os campos destacados.')).toBeNull()
  })

  it('a regra recusada sem campo mostra o motivo no formulário', async () => {
    banco.falha = erroDaApi(409, 'SEQUENCIA_INVALIDA', 'O desmame deste parto ja foi registrado.')

    await registrarDesmame()

    expect(await screen.findByText('O desmame deste parto ja foi registrado.', {}, DEMORA)).toBeTruthy()
  })

  it('o campo que o formulário não tem vira o motivo no aviso', async () => {
    banco.falha = erroDaApi(400, 'VALIDACAO', 'Confira os campos destacados.', {
      idCasal: 'Este casal ja esta encerrado.',
    })

    await registrarDesmame()

    expect(await screen.findByText('Este casal ja esta encerrado.', {}, DEMORA)).toBeTruthy()
    expect(screen.queryByText('Confira os campos destacados.')).toBeNull()
  })
})

describe('ninhada com a reserva em falta', { timeout: 20_000 }, () => {
  it('avisa quanto falta e de quais pedidos', async () => {
    banco.ficha = fichaDe({
      partos: [
        parto({
          dtDesmameReal: '2026-10-16',
          desmamadoM: 2,
          desmamadoF: 4,
          falta: { m: 2, f: 0, pedidos: [{ idSolicitacao: 12, m: 4, f: 0 }] },
        }),
      ],
    })

    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Ninhada' }))

    expect(await screen.findByText('Reserva em falta')).toBeTruthy()
    expect(screen.getByText(/faltam 2 M e 0 F\. Reservado para o pedido #12 \(4 M, 0 F\)/)).toBeTruthy()
    // o caminho é desfazer a reserva: o pedido continua aprovado
    expect(screen.getByText(/Em Solicitações, a reserva do pedido em falta pode ser desfeita\./)).toBeTruthy()
  })
})

describe('abas da ficha do casal', { timeout: 20_000 }, () => {
  it('são Reprodução, Ninhada e Eventos: o reservado e o entregue ficam na caixa de estoque', async () => {
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    expect((await screen.findAllByRole('tab')).map((aba) => aba.textContent)).toEqual([
      'Reprodução',
      'Ninhada',
      'Eventos',
    ])
  })
})

describe('aba Reprodução', { timeout: 20_000 }, () => {
  // conta no texto da aba: os repetidos vinham no meio de uma linha, não num elemento só deles
  it('mostra cada dado do casal e do acasalamento uma vez só', async () => {
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    const aba = await screen.findByRole('tabpanel')
    const texto = aba.textContent ?? ''
    // a formação do casal é o acasalamento do 1º parto
    expect(texto.match(/01\/09\/2026/g)).toHaveLength(1)
    // o título da seção é o parto, e "Acasalamento" fica só no campo
    expect(texto.match(/Acasalamento/g)).toHaveLength(1)
    // AB é o macho A e a fêmea B, que já aparecem nos campos
    expect(texto).not.toContain('AB')
    expect(within(aba).getByText('1/5')).toBeTruthy()
  })

  it('mostra o parto e o desmame previstos do parto escolhido', async () => {
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    const aba = await screen.findByRole('tabpanel')
    expect(within(aba).getByText('Parto previsto')).toBeTruthy()
    expect(within(aba).getByText('24/09/2026')).toBeTruthy()
    expect(within(aba).getByText('Desmame previsto')).toBeTruthy()
    expect(within(aba).getByText('16/10/2026')).toBeTruthy()
  })

  it('casal encerrado diz quando encerrou', async () => {
    banco.ficha = fichaDe({ casal: casal(1, 'AB', false) })
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    expect(await screen.findByText('Casal encerrado em 27/10/2026')).toBeTruthy()
  })
})

describe('casal novo na caixa', { timeout: 20_000 }, () => {
  it('a ficha continua mostrando a ninhada do casal encerrado e abre nela, que ainda falta desmamar', async () => {
    banco.ficha = fichaDe({
      casal: casal(2, 'CD', true),
      partos: [parto({ id: 20, dtPartoReal: null, nascidoM: null, nascidoF: null, dtSelecao: null })],
      anteriores: [{ casal: casal(1, 'AB', false), partos: [parto({ id: 15, ordem: 5 })] }],
    })

    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    expect(await screen.findByText('Ninhadas do casal AB (encerrado)')).toBeTruthy()
    expect(screen.getByText(/5º parto do casal AB/)).toBeTruthy()
  })
})

/** O 1º parto já desmamado: 4 M e 4 F, ainda na caixa do casal */
const desmamado = (parcial: Partial<Parto> = {}) =>
  parto({
    dtDesmameReal: '2026-10-16',
    desmamadoM: 4,
    desmamadoF: 4,
    naCaixa: { m: 4, f: 4 },
    ...parcial,
  })

const fichaDeEstoque: FichaDeEstoque = {
  tipo: 'estoque',
  caixa: {
    id: 20,
    endereco: { numeroVisivel: 'E-01', sala: 'Sala 1', codigo: 'F2C' },
    especie: 'rato',
    linhagem: 'Wistar',
    estado: 'estoque',
    sexo: 'M',
  },
  total: 6,
  reservado: 2,
  livre: 4,
  nascimentoDe: '2026-09-24',
  nascimentoAte: '2026-09-24',
  lotes: [
    {
      idParto: 10,
      qtd: 6,
      ordem: 1,
      casal: 'AB',
      linhagem: 'Wistar',
      origem: { codigo: 'F1A', numeroVisivel: 'E-01' },
      dtNascimento: '2026-09-24',
      idadeDias: 44,
    },
  ],
  pedidos: [{ idSolicitacao: 12, qtd: 2 }],
}

describe('caixa de estoque', { timeout: 20_000 }, () => {
  it('abre a ficha dela: quantos tem, de onde vieram e para quem estão reservados', async () => {
    banco.ficha = fichaDeEstoque
    renderizar(<FichaDaCaixa idCaixa={20} aoFechar={() => {}} />)

    expect(await screen.findByText('Caixa de estoque ♂')).toBeTruthy()
    expect(screen.getByText('1º parto do casal AB, caixa F1A (E-01)')).toBeTruthy()
    expect(screen.getByText('Pedido #12')).toBeTruthy()
    // a ficha de estoque não tem casal nem parto
    expect(screen.queryByRole('tab', { name: 'Ninhada' })).toBeNull()
  })
})

describe('desmamados na caixa do casal', { timeout: 40_000 }, () => {
  /** Abre a passagem do 1º parto desmamado, com 4 M e 4 F ainda na caixa do casal */
  async function abrirPassagem() {
    passar.mockReset()
    passar.mockResolvedValue({ caixas: [] })
    banco.ficha = fichaDe({ partos: [desmamado()] })
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Ninhada' }))
    fireEvent.click(await screen.findByRole('button', { name: 'Passar para o estoque' }))

    return {
      machos: await screen.findByRole('group', { name: 'Machos' }),
      femeas: screen.getByRole('group', { name: 'Fêmeas' }),
    }
  }

  it('para cada sexo é só a quantidade e um clique na caixa: a posição vazia vira caixa nova', async () => {
    const { machos, femeas } = await abrirPassagem()

    fireEvent.click(within(machos).getByRole('button', { name: /^F1B: posição vazia/ }))
    fireEvent.click(within(femeas).getByRole('button', { name: /^F1D: posição vazia/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Passar para o estoque' }))

    expect(passar).toHaveBeenCalledWith({
      idParto: 10,
      machos: { qtd: 4, destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 2 } } },
      femeas: { qtd: 4, destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 4 } } },
    })
  })

  it('a caixa de estoque do mesmo sexo e linhagem recebe; para o outro sexo ela fica apagada', async () => {
    const { machos, femeas } = await abrirPassagem()

    expect(within(femeas).getByRole('button', { name: 'F1C: ocupada' })).toHaveProperty('disabled', true)

    fireEvent.click(within(machos).getByRole('button', { name: /^F1C: caixa de estoque com 3 machos/ }))
    fireEvent.change(within(femeas).getByLabelText('Quantos fêmeas'), { target: { value: '0' } })
    fireEvent.click(screen.getByRole('button', { name: 'Passar para o estoque' }))

    expect(passar).toHaveBeenCalledWith({ idParto: 10, machos: { qtd: 4, destino: { idCaixa: 30 } } })
  })

  it('sem a caixa escolhida não passa, e a posição que um sexo pegou não serve para o outro', async () => {
    const { machos, femeas } = await abrirPassagem()

    expect(screen.getByRole('button', { name: 'Passar para o estoque' })).toHaveProperty('disabled', true)

    fireEvent.click(within(machos).getByRole('button', { name: /^F1B: posição vazia/ }))

    expect(within(femeas).getByRole('button', { name: /^F1B: já escolhida para os machos/ })).toHaveProperty(
      'disabled',
      true,
    )
    expect(screen.getByRole('button', { name: 'Passar para o estoque' })).toHaveProperty('disabled', true)
  })

  it('com todos já no estoque, mostra onde estão e não oferece passar de novo', async () => {
    banco.ficha = fichaDe({
      partos: [
        desmamado({
          naCaixa: { m: 0, f: 0 },
          noEstoque: [
            { idCaixa: 20, codigo: 'F2C', numeroVisivel: 'E-01', sexo: 'M', qtd: 4 },
            { idCaixa: 21, codigo: 'F2D', numeroVisivel: 'E-01', sexo: 'F', qtd: 4 },
          ],
        }),
      ],
    })
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)
    fireEvent.click(screen.getByRole('tab', { name: 'Ninhada' }))

    expect(await screen.findByText('♂ 4 em F2C (E-01) · ♀ 4 em F2D (E-01)')).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Passar para o estoque' })).toBeNull()
  })

  it('casal encerrado com desmamados na caixa: casal novo só depois que eles forem para o estoque', async () => {
    banco.ficha = fichaDe({ casal: casal(1, 'AB', false), partos: [desmamado()] })
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    expect(await screen.findByText(/A caixa ainda tem desmamados/)).toBeTruthy()
    expect(screen.queryByRole('button', { name: 'Formar casal' })).toBeNull()
  })

  it('a caixa do casal encerrado que ficou com um sexo só pode virar caixa de estoque', async () => {
    banco.ficha = fichaDe({
      casal: casal(1, 'AB', false),
      virarEstoque: 'F',
      partos: [desmamado({ naCaixa: { m: 0, f: 4 } })],
    })
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    expect(await screen.findByRole('button', { name: 'Virar caixa de estoque' })).toBeTruthy()
    expect(screen.getByText('Sobraram na caixa só desmamados de um sexo: 4 fêmeas')).toBeTruthy()
  })
})
