import { fireEvent, screen, within } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Casal, Ficha, Parto } from '@/dominio/tipos'
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
  })
})

describe('aba Reprodução', { timeout: 20_000 }, () => {
  it('mostra a data do acasalamento uma vez só: a formação do casal é o acasalamento do 1º parto', async () => {
    renderizar(<FichaDaCaixa idCaixa={7} aoFechar={() => {}} />)

    const aba = await screen.findByRole('tabpanel')
    // conta no texto da aba: a data do casal vinha no meio da linha, não num elemento só dela
    expect(aba.textContent?.match(/01\/09\/2026/g)).toHaveLength(1)
    expect(within(aba).getByText(/1\/5 partos/)).toBeTruthy()
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
