import { describe, expect, it } from 'vitest'
import type { Solicitacao } from './tipos'
import {
  entraNoFiltro,
  descreverAnimais,
  descreverIdade,
  faixaDeIdade,
  ordenarSolicitacoes,
  porDataDeEntrega,
  totalDeAnimais,
} from './solicitacao'

describe('faixaDeIdade', () => {
  it('na faixa, vai o que foi digitado', () => {
    expect(faixaDeIdade({ modoIdade: 'faixa', idadeMin: 20, idadeMax: 40 })).toEqual({
      idadeMin: 20,
      idadeMax: 40,
    })
  })

  it('na exata, o máximo é o mínimo, mesmo que tenha sobrado um valor da faixa', () => {
    expect(faixaDeIdade({ modoIdade: 'exata', idadeMin: 28, idadeMax: 40 })).toEqual({
      idadeMin: 28,
      idadeMax: 28,
    })
  })
})

describe('descreverAnimais', () => {
  it('mostra só as partes que existem', () => {
    expect(descreverAnimais({ machos: 5, femeas: 0, qualquer: 10 })).toBe('5 M · 10 qualquer sexo')
    expect(descreverAnimais({ machos: 0, femeas: 8, qualquer: 0 })).toBe('8 F')
  })

  it('junta as três quando o pedido mistura', () => {
    expect(descreverAnimais({ machos: 4, femeas: 4, qualquer: 2 })).toBe(
      '4 M · 4 F · 2 qualquer sexo',
    )
  })

  it('mostra travessão quando não há animal, e não uma frase vazia', () => {
    expect(descreverAnimais({ machos: 0, femeas: 0, qualquer: 0 })).toBe('—')
    expect(descreverAnimais({})).toBe('—')
  })
})

describe('totalDeAnimais', () => {
  it('soma os três, com campo vazio valendo zero', () => {
    expect(totalDeAnimais({ machos: 5, femeas: null, qualquer: 10 })).toBe(15)
    expect(totalDeAnimais({})).toBe(0)
  })
})

describe('descreverIdade', () => {
  it('faixa vira "de a"', () => {
    expect(descreverIdade({ idadeMin: 20, idadeMax: 40 })).toBe('20 a 40 dias')
  })

  it('idade exata é um número só', () => {
    expect(descreverIdade({ idadeMin: 28, idadeMax: 28 })).toBe('28 dias')
  })
})

describe('porDataDeEntrega', () => {
  it('a entrega mais cedo vem primeiro e, no mesmo dia, o pedido mais antigo', () => {
    const pedidos = [
      { id: 3, dataEntrega: '2026-12-10' },
      { id: 1, dataEntrega: '2027-01-05' },
      { id: 4, dataEntrega: '2026-11-20' },
      { id: 2, dataEntrega: '2026-12-10' },
    ]

    expect(porDataDeEntrega(pedidos).map((p) => p.id)).toEqual([4, 2, 3, 1])
  })

  it('não mexe na lista que recebeu', () => {
    const pedidos = [
      { id: 1, dataEntrega: '2027-01-05' },
      { id: 2, dataEntrega: '2026-11-20' },
    ]

    porDataDeEntrega(pedidos)
    expect(pedidos.map((p) => p.id)).toEqual([1, 2])
  })
})

describe('entraNoFiltro', () => {
  const com = (status: Solicitacao['status'], dataAceite: string | null = null) =>
    ({ status, dataAceite }) as Solicitacao

  it('pendente é a que espera resposta; aceita é a que ainda falta entregar', () => {
    expect(entraNoFiltro('pendentes', com('enviada'))).toBe(true)
    expect(entraNoFiltro('pendentes', com('aprovada', '2026-11-03'))).toBe(false)
    expect(entraNoFiltro('aceitas', com('aprovada', '2026-11-03'))).toBe(true)
    expect(entraNoFiltro('aceitas', com('concluida', '2026-11-03'))).toBe(false)
    expect(entraNoFiltro('aceitas', com('enviada'))).toBe(false)
  })

  it('recusadas só as recusadas; todas mostra tudo', () => {
    expect(entraNoFiltro('recusadas', com('recusada'))).toBe(true)
    expect(entraNoFiltro('todas', com('cancelada'))).toBe(true)
  })
})

describe('ordenarSolicitacoes', () => {
  const pedidos = [
    { id: 1, dataSolicitacao: '2026-11-01', dataEntrega: '2026-12-20' },
    { id: 2, dataSolicitacao: '2026-11-03', dataEntrega: '2026-12-05' },
    { id: 3, dataSolicitacao: '2026-11-03', dataEntrega: '2026-12-10' },
  ]

  it('pela data do pedido, o mais novo primeiro', () => {
    expect(ordenarSolicitacoes('pedido', pedidos).map((p) => p.id)).toEqual([3, 2, 1])
  })

  it('pela data de entrega, a mais próxima primeiro', () => {
    expect(ordenarSolicitacoes('entrega', pedidos).map((p) => p.id)).toEqual([2, 3, 1])
  })
})
