import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { renderHook, waitFor } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { chaves } from '@/app/chaves'
import { ErroDeApi } from '@/lib/api'
import {
  useAlocar,
  useAnularBaixa,
  useAprovarPedido,
  useAtendimento,
  useBaixa,
  useCorrigirAcasalamento,
  useCorrigirEvento,
  useCriarPedido,
  useDesfazerReserva,
  useEditarCasal,
  useFormarCasal,
  useMudanca,
  useRecusarPedido,
  useRegistrarEntrega,
  useRegistrarNaFicha,
  useSalvarEstante,
  useSalvarFormato,
  useSemNinhada,
  useVirarCaixaDeEstoque,
} from './consultas'
import type { Pedido } from './tipos'

const chamadas = vi.hoisted(() => [] as { caminho: string; opcoes: unknown }[])

/** a recusa que a próxima chamada leva, quando o teste quer uma */
const recusa = vi.hoisted(() => ({ erro: null as Error | null }))

vi.mock('@/lib/api', async (original) => ({
  ...(await original<typeof import('@/lib/api')>()),
  api: async (caminho: string, opcoes: unknown) => {
    chamadas.push({ caminho, opcoes })
    if (recusa.erro) throw recusa.erro
    return {}
  },
}))

beforeEach(() => {
  chamadas.length = 0
  recusa.erro = null
})

/** O histórico aberto, com o filtro vazio */
const HISTORICO = [...chaves.historico, { entidade: null, idEntidade: null, busca: '' }]

/** Tudo o que mostra animais, como estaria no cache com as telas abertas */
const QUE_MOSTRAM_ANIMAIS = [
  chaves.visaoGeral,
  chaves.grade(1),
  chaves.caixa(3),
  chaves.caixa(4),
  chaves.atendimento(7),
  chaves.pedidos,
  chaves.retirada(7),
  HISTORICO,
]

/** As salas, as estantes e os formatos: o que a tela das estantes e os Cadastros leem */
const DA_ESTRUTURA = [chaves.salas, chaves.estantes, chaves.formatos]

function montar<T>(usar: () => T) {
  const cliente = new QueryClient()
  for (const chave of [...QUE_MOSTRAM_ANIMAIS, ...DA_ESTRUTURA]) cliente.setQueryData(chave, {})

  const envolver = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
  )
  const { result } = renderHook(usar, { wrapper: envolver })
  return { cliente, mutacao: result.current }
}

/**
 * As consultas derrubadas: invalidadas ou, sem ninguém na tela olhando para elas (o caso daqui),
 * tiradas do cache
 */
const invalidadas = (cliente: QueryClient) =>
  QUE_MOSTRAM_ANIMAIS.filter((chave) => {
    const estado = cliente.getQueryState(chave)
    return estado === undefined || estado.isInvalidated
  })

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
      { idParto: 9, dtAcasalamento: '2026-10-01' },
    ],
    ['editar casal', useEditarCasal, { idCasal: 4, grupoFemea: 'A', idLinhagem: 2 }],
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

describe('as estantes e os formatos', () => {
  const estruturaDerrubada = (cliente: QueryClient) =>
    DA_ESTRUTURA.filter((chave) => cliente.getQueryState(chave)?.isInvalidated)

  it('salvar formato recarrega os formatos, as estantes e tudo o que mostra caixa: o código pode mudar', async () => {
    const { cliente, mutacao } = montar(useSalvarFormato)

    await mutacao.mutateAsync({ tipo: 'alterar', id: 3, dados: { colunas: 9 } })

    expect(estruturaDerrubada(cliente)).toEqual([chaves.estantes, chaves.formatos])
    expect(invalidadas(cliente)).toEqual(QUE_MOSTRAM_ANIMAIS)
    expect(chamadas).toEqual([
      { caminho: '/api/formatos/3', opcoes: { metodo: 'PATCH', corpo: { colunas: 9 } } },
    ])
  })

  it('criar e remover formato vão pelos caminhos dos formatos', async () => {
    const { mutacao } = montar(useSalvarFormato)

    await mutacao.mutateAsync({
      tipo: 'criar',
      dados: { nome: 'Rack', faces: 2, linhas: 4, colunas: 4 },
    })
    await mutacao.mutateAsync({ tipo: 'remover', id: 3 })

    expect(chamadas).toEqual([
      {
        caminho: '/api/formatos',
        opcoes: { metodo: 'POST', corpo: { nome: 'Rack', faces: 2, linhas: 4, colunas: 4 } },
      },
      { caminho: '/api/formatos/3', opcoes: { metodo: 'DELETE' } },
    ])
  })

  it('salvar estante recarrega as salas, as estantes, os formatos (quem usa cada um) e a grade', async () => {
    const { cliente, mutacao } = montar(useSalvarEstante)

    await mutacao.mutateAsync({
      tipo: 'criar',
      dados: { idSala: 1, idFormato: 3, numeroVisivel: 'E-07' },
    })

    expect(estruturaDerrubada(cliente)).toEqual(DA_ESTRUTURA)
    expect(invalidadas(cliente)).toContainEqual(chaves.grade(1))
    expect(chamadas).toEqual([
      {
        caminho: '/api/estantes',
        opcoes: { metodo: 'POST', corpo: { idSala: 1, idFormato: 3, numeroVisivel: 'E-07' } },
      },
    ])
  })
})

describe('a edição do casal', () => {
  it('é um PATCH no casal, com só os campos que mudaram no corpo', async () => {
    const { mutacao } = montar(useEditarCasal)

    await mutacao.mutateAsync({ idCasal: 4, grupoFemea: 'A', partoInicial: 2 })

    expect(chamadas).toEqual([
      {
        caminho: '/api/casais/4',
        opcoes: { metodo: 'PATCH', corpo: { grupoFemea: 'A', partoInicial: 2 } },
      },
    ])
  })
})

describe('as ações do pedido que não mexem nos animais', () => {
  it('criar e aprovar recarregam só a lista de pedidos e o histórico, onde a API grava os dois', async () => {
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

      expect(invalidadas(cliente)).toEqual([chaves.pedidos, HISTORICO])
    }
  })
})

describe('a ação do pedido recusada por regra', () => {
  const regra = () => new ErroDeApi(409, { erro: { codigo: 'PEDIDO_JA_RESERVADO', mensagem: 'x' } })

  it('recarrega o que mostra animais: outra pessoa mexeu no pedido antes', async () => {
    for (const [, usar, variaveis] of ACOES_DA_COLONIA.filter(([nome]) =>
      ['reservar', 'desfazer reserva', 'recusar', 'entregar'].includes(nome),
    )) {
      recusa.erro = regra()
      const { cliente, mutacao } = montar(usar)

      await expect(mutacao.mutateAsync(variaveis as never)).rejects.toBe(recusa.erro)

      expect(invalidadas(cliente)).toEqual(QUE_MOSTRAM_ANIMAIS)
    }
  })

  it('a aprovação recarrega a lista de pedidos e o histórico', async () => {
    recusa.erro = regra()
    const { cliente, mutacao } = montar(useAprovarPedido)

    await expect(mutacao.mutateAsync(7)).rejects.toBe(recusa.erro)

    expect(invalidadas(cliente)).toEqual([chaves.pedidos, HISTORICO])
  })

  it('sem resposta da API (rede, servidor), não recarrega nada', async () => {
    recusa.erro = new ErroDeApi(500, { erro: { codigo: 'ERRO_INTERNO', mensagem: 'x' } })
    const { cliente, mutacao } = montar(useAlocar)

    await expect(
      mutacao.mutateAsync({
        idPedido: 7,
        itens: [{ idCaixa: 3, dtNascimento: '2026-10-01', machos: 1, femeas: 0 }],
      }),
    ).rejects.toBe(recusa.erro)

    expect(invalidadas(cliente)).toEqual([])
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

describe('a busca do atendimento', () => {
  const pedido: Pedido = {
    id: 7,
    dataPedido: '2026-11-01',
    prazoResposta: null,
    dataAceite: '2026-11-02',
    dataRecusa: null,
    protocoloCeua: '1234567890',
    pesquisador: 'Ana',
    email: 'ana@ufsc.br',
    especie: 'rato',
    idLinhagem: 2,
    linhagem: 'Wistar',
    machos: 4,
    femeas: 3,
    qualquer: 2,
    idadeMin: 21,
    idadeMax: 30,
    dataEntrega: '2026-12-01',
    dataEntregue: null,
    observacoes: null,
    status: 'aprovado',
    motivoRecusa: null,
    reservaEmFalta: null,
  }

  async function buscar(doPedido: Pedido): Promise<URLSearchParams> {
    const cliente = new QueryClient()
    const envolver = ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={cliente}>{children}</QueryClientProvider>
    )
    renderHook(() => useAtendimento(doPedido), { wrapper: envolver })
    await waitFor(() => expect(chamadas).toHaveLength(1))

    const [caminho, consulta] = (chamadas[0]?.caminho ?? '').split('?')
    expect(caminho).toBe('/api/busca')
    return new URLSearchParams(consulta)
  }

  it('no aprovado, pede o pedido inteiro', async () => {
    const parametros = await buscar(pedido)

    expect([
      parametros.get('machos'),
      parametros.get('femeas'),
      parametros.get('qualquer'),
    ]).toEqual(['4', '3', '2'])
  })

  it('no reservado em falta, pede só o que falta, para completar sem passar do pedido', async () => {
    const parametros = await buscar({
      ...pedido,
      status: 'reservado',
      reservaEmFalta: { m: 1, f: 0, qualquer: 1 },
    })

    expect([
      parametros.get('machos'),
      parametros.get('femeas'),
      parametros.get('qualquer'),
    ]).toEqual(['1', '0', '1'])
    expect(parametros.get('idadeMin')).toBe('21')
    expect(parametros.get('dataEntrega')).toBe('2026-12-01')
  })
})
