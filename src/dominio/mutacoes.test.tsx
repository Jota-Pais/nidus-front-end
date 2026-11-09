import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chaves } from '@/app/chaves'
import {
  useAlocar,
  useAnularBaixa,
  useAprovarPedido,
  useBaixa,
  useCorrigirAcasalamento,
  useCorrigirEvento,
  useCriarPedido,
  useDesfazerReserva,
  useFormarCasal,
  useMudanca,
  useRecusarPedido,
  useRegistrarEntrega,
  useRegistrarNaFicha,
  useSemNinhada,
  useVirarCaixaDeEstoque,
} from './consultas'

const chamadas = vi.hoisted(() => [] as { caminho: string; opcoes: unknown }[])

vi.mock('@/lib/api', () => ({
  api: async (caminho: string, opcoes: unknown) => {
    chamadas.push({ caminho, opcoes })
    return {}
  },
}))

beforeEach(() => {
  chamadas.length = 0
})

/** Tudo o que mostra animais, como estaria no cache com as telas abertas */
const QUE_MOSTRAM_ANIMAIS = [
  chaves.quadro('rato'),
  chaves.grade(1),
  chaves.caixa(3),
  chaves.caixa(4),
  chaves.estoque('rato'),
  chaves.atendimento(7),
  chaves.pedidos,
  chaves.retirada(7),
]

function montar<T>(usar: () => T) {
  const cliente = new QueryClient()
  for (const chave of QUE_MOSTRAM_ANIMAIS) cliente.setQueryData(chave, {})

  const envolver = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(usar, { wrapper: envolver })
  return { cliente, mutacao: result.current }
}

const invalidadas = (cliente: QueryClient) =>
  QUE_MOSTRAM_ANIMAIS.filter((chave) => cliente.getQueryState(chave)?.isInvalidated)

/** Cada ação que mexe nos animais, com um corpo válido */
const ACOES_DA_COLONIA: [string, () => { mutateAsync: (v: never) => Promise<unknown> }, unknown][] =
  [
    [
      'formar casal',
      useFormarCasal,
      { idLinhagem: 1, grupoMacho: 'A', grupoFemea: 'B', dtFormacao: '2026-11-01', idCaixa: 3 },
    ],
    ['registrar na ficha', useRegistrarNaFicha, { caminho: '/api/partos/9/desmame', corpo: {} }],
    ['sem ninhada', useSemNinhada, { idParto: 9, dtSemNinhada: '2026-11-01', motivo: 'não pegou' }],
    [
      'corrigir nascimento',
      useCorrigirEvento,
      {
        idParto: 9,
        evento: 'nascimento',
        corpo: { dtPartoReal: '2026-11-01', nascidoM: 3, nascidoF: 4, motivo: 'contagem' },
      },
    ],
    [
      'corrigir acasalamento',
      useCorrigirAcasalamento,
      { idParto: 9, dtAcasalamento: '2026-10-01', motivo: 'digitação' },
    ],
    ['baixa', useBaixa, { idCaixa: 3, dtFato: '2026-11-01', itens: [{ sexo: 'M', qtd: 1 }] }],
    [
      'mudança',
      useMudanca,
      { idCaixa: 3, dtFato: '2026-11-01', machos: { qtd: 2, destino: { idCaixa: 4 } } },
    ],
    ['anular baixa', useAnularBaixa, { idOcorrencia: 12, motivo: 'engano' }],
    ['virar estoque', useVirarCaixaDeEstoque, 3],
    [
      'reservar',
      useAlocar,
      { idPedido: 7, itens: [{ idCaixa: 3, dtNascimento: '2026-10-01', machos: 1, femeas: 0 }] },
    ],
    ['desfazer reserva', useDesfazerReserva, 7],
    ['recusar', useRecusarPedido, { idPedido: 7, motivo: 'sem animais' }],
    ['entregar', useRegistrarEntrega, { idPedido: 7, dtEntrega: '2026-11-06' }],
  ]

describe('as ações da colônia recarregam tudo o que mostra animais', () => {
  it.each(ACOES_DA_COLONIA)('%s', async (_nome, usar, variaveis) => {
    const { cliente, mutacao } = montar(usar)

    await mutacao.mutateAsync(variaveis as never)

    expect(invalidadas(cliente)).toEqual(QUE_MOSTRAM_ANIMAIS)
  })
})

describe('as ações do pedido que não mexem nos animais', () => {
  it('criar e aprovar recarregam só a lista de pedidos', async () => {
    for (const [usar, variaveis] of [
      [useAprovarPedido, 7],
      [
        useCriarPedido,
        {
          nomePesquisador: 'Ana',
          protocoloCeua: '1',
          idLinhagem: 1,
          machos: 1,
          femeas: 0,
          qualquer: 0,
          idadeMin: 21,
          idadeMax: 30,
          dataEntrega: '2026-12-01',
        },
      ],
    ] as const) {
      const { cliente, mutacao } = montar(
        usar as () => { mutateAsync: (v: never) => Promise<unknown> },
      )

      await mutacao.mutateAsync(variaveis as never)

      expect(invalidadas(cliente)).toEqual([chaves.pedidos])
    }
  })
})

describe('os caminhos da API do pedido', () => {
  it('falam "pedido", e a reserva vai por lugar: a caixa e a data de nascimento', async () => {
    const { mutacao } = montar(useAlocar)

    await mutacao.mutateAsync({
      idPedido: 7,
      itens: [{ idCaixa: 3, dtNascimento: '2026-10-01', machos: 2, femeas: 1 }],
    })

    expect(chamadas).toEqual([
      {
        caminho: '/api/pedidos/7/alocacao',
        opcoes: {
          metodo: 'POST',
          corpo: { itens: [{ idCaixa: 3, dtNascimento: '2026-10-01', machos: 2, femeas: 1 }] },
        },
      },
    ])
  })

  it('a anulação manda a caixa de cada sexo só quando tem, e o número fica na URL', async () => {
    const { mutacao } = montar(useAnularBaixa)

    await mutacao.mutateAsync({ idOcorrencia: 12, motivo: 'engano', idCaixaFemeas: 4 })

    expect(chamadas).toEqual([
      {
        caminho: '/api/ocorrencias/12/anulacao',
        opcoes: { metodo: 'POST', corpo: { motivo: 'engano', idCaixaFemeas: 4 } },
      },
    ])
  })

  it('a mudança sai da caixa de origem, com a data do fato', async () => {
    const { mutacao } = montar(useMudanca)

    await mutacao.mutateAsync({
      idCaixa: 3,
      dtFato: '2026-11-01',
      femeas: {
        qtd: 2,
        destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 2 } },
      },
    })

    expect(chamadas[0]?.caminho).toBe('/api/caixas/3/mudanca')
    expect(chamadas[0]?.opcoes).toEqual({
      metodo: 'POST',
      corpo: {
        dtFato: '2026-11-01',
        femeas: {
          qtd: 2,
          destino: { posicao: { idEstante: 1, face: 'frontal', linha: 1, coluna: 2 } },
        },
      },
    })
  })
})
