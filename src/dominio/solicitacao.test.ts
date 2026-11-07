import { describe, expect, it } from 'vitest'
import type { Solicitacao } from './tipos'
import {
  AVISO_DE_ENTREGA_SEM_RESERVA_EM_DIAS,
  avisoDeEntregaSemReserva,
  compararDataDeEntrega,
  compararDataDoPedido,
  conferirReserva,
  entraNoFiltro,
  descreverAnimais,
  descreverIdade,
  descreverQuantidadeEEspecie,
  descreverSexos,
  faixaDeIdade,
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

describe('descreverQuantidadeEEspecie', () => {
  it('conta o total com a espécie no plural, e a linhagem', () => {
    expect(
      descreverQuantidadeEEspecie({
        machos: 4,
        femeas: 2,
        qualquer: 0,
        especie: 'rato',
        linhagem: 'Wistar',
      }),
    ).toBe('6 ratos Wistar')
    expect(
      descreverQuantidadeEEspecie({ qualquer: 12, especie: 'camundongo', linhagem: 'C57BL/6' }),
    ).toBe('12 camundongos C57BL/6')
  })

  it('um animal só fica no singular', () => {
    expect(descreverQuantidadeEEspecie({ femeas: 1, especie: 'rato', linhagem: 'Wistar' })).toBe(
      '1 rato Wistar',
    )
  })
})

describe('descreverSexos', () => {
  it('diz quantos de cada sexo, no singular e no plural', () => {
    expect(descreverSexos({ machos: 4, femeas: 2, qualquer: 0 })).toBe('4 machos · 2 fêmeas')
    expect(descreverSexos({ machos: 1, femeas: 1 })).toBe('1 macho · 1 fêmea')
    expect(descreverSexos({ femeas: 8 })).toBe('8 fêmeas')
  })

  it('sem sexo definido, só "qualquer sexo"; misturado, conta o de qualquer sexo junto', () => {
    expect(descreverSexos({ machos: 0, femeas: 0, qualquer: 12 })).toBe('qualquer sexo')
    expect(descreverSexos({ machos: 4, femeas: 0, qualquer: 2 })).toBe(
      '4 machos · 2 de qualquer sexo',
    )
  })

  it('mostra travessão quando não há animal', () => {
    expect(descreverSexos({})).toBe('—')
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

describe('compararDataDeEntrega', () => {
  it('a entrega mais cedo vem primeiro e, no mesmo dia, o pedido mais antigo', () => {
    const pedidos = [
      { id: 3, dataEntrega: '2026-12-10' },
      { id: 1, dataEntrega: '2027-01-05' },
      { id: 4, dataEntrega: '2026-11-20' },
      { id: 2, dataEntrega: '2026-12-10' },
    ]

    expect(pedidos.sort(compararDataDeEntrega).map((p) => p.id)).toEqual([4, 2, 3, 1])
  })
})

describe('compararDataDoPedido', () => {
  it('o pedido mais antigo vem primeiro e, no mesmo dia, o de número menor', () => {
    const pedidos = [
      { id: 1, dataSolicitacao: '2026-11-01' },
      { id: 3, dataSolicitacao: '2026-11-03' },
      { id: 2, dataSolicitacao: '2026-11-03' },
    ]

    expect(pedidos.sort(compararDataDoPedido).map((p) => p.id)).toEqual([1, 2, 3])
  })
})

describe('entraNoFiltro', () => {
  const com = (status: Solicitacao['status'], dataAceite: string | null = null) =>
    ({ status, dataAceite }) as Solicitacao

  it('pendente é a que espera resposta; aceita é a que ainda falta entregar', () => {
    expect(entraNoFiltro('pendentes', com('enviada'))).toBe(true)
    expect(entraNoFiltro('pendentes', com('aprovada', '2026-11-03'))).toBe(false)
    expect(entraNoFiltro('aceitas', com('aprovada', '2026-11-03'))).toBe(true)
    // aprovada e ainda sem os animais reservados também já foi aceita
    expect(entraNoFiltro('aceitas', com('em_atendimento', '2026-11-03'))).toBe(true)
    expect(entraNoFiltro('pendentes', com('em_atendimento', '2026-11-03'))).toBe(false)
    expect(entraNoFiltro('aceitas', com('concluida', '2026-11-03'))).toBe(false)
    expect(entraNoFiltro('aceitas', com('enviada'))).toBe(false)
  })

  it('recusadas só as recusadas; todas mostra tudo', () => {
    expect(entraNoFiltro('recusadas', com('recusada'))).toBe(true)
    expect(entraNoFiltro('todas', com('cancelada'))).toBe(true)
  })
})

describe('conferirReserva', () => {
  const pedido = { machos: 2, femeas: 2, qualquer: 2 }

  it('cobre com os sexos pedidos e o "qualquer" de um sexo ou de outro', () => {
    expect(conferirReserva(pedido, { m: 4, f: 2 }).cobre).toBe(true)
    expect(conferirReserva(pedido, { m: 3, f: 3 }).cobre).toBe(true)
  })

  it('diz quanto falta de cada sexo e de qualquer sexo', () => {
    const conferencia = conferirReserva(pedido, { m: 1, f: 2 })

    expect(conferencia.cobre).toBe(false)
    expect(conferencia.falta).toEqual({ machos: 1, femeas: 0, qualquer: 2 })
  })

  it('o que passa do pedido não cobre, nem com o total certo', () => {
    // 6 machos fecham a soma, mas faltam as 2 fêmeas pedidas e sobram 2 machos
    const conferencia = conferirReserva(pedido, { m: 6, f: 0 })

    expect(conferencia.cobre).toBe(false)
    expect(conferencia.falta.femeas).toBe(2)
    expect(conferencia.aMais).toEqual({ machos: 2, femeas: 0, total: 0 })
    expect(conferirReserva(pedido, { m: 4, f: 4 }).aMais.total).toBe(2)
  })
})

describe('avisoDeEntregaSemReserva', () => {
  const aprovada = (dataEntrega: string) => ({ status: 'em_atendimento' as const, dataEntrega })
  const hoje = '2026-11-07'

  it('avisa a equipe do pedido aprovado sem reserva com a entrega a até 7 dias', () => {
    expect(AVISO_DE_ENTREGA_SEM_RESERVA_EM_DIAS).toBe(7)
    expect(avisoDeEntregaSemReserva(aprovada('2026-11-14'), hoje)).toBe(
      'Entrega em 7 dias, sem reserva',
    )
    expect(avisoDeEntregaSemReserva(aprovada('2026-11-10'), hoje)).toBe(
      'Entrega em 3 dias, sem reserva',
    )
    expect(avisoDeEntregaSemReserva(aprovada('2026-11-08'), hoje)).toBe(
      'Entrega em 1 dia, sem reserva',
    )
  })

  it('a entrega de hoje e a que já passou também avisam', () => {
    expect(avisoDeEntregaSemReserva(aprovada('2026-11-07'), hoje)).toBe('Entrega hoje, sem reserva')
    expect(avisoDeEntregaSemReserva(aprovada('2026-11-02'), hoje)).toBe(
      'Entrega vencida, sem reserva',
    )
  })

  it('sem aviso com a entrega mais longe, ou com os animais já reservados', () => {
    expect(avisoDeEntregaSemReserva(aprovada('2026-11-15'), hoje)).toBeNull()
    expect(
      avisoDeEntregaSemReserva({ status: 'aprovada', dataEntrega: '2026-11-08' }, hoje),
    ).toBeNull()
    expect(
      avisoDeEntregaSemReserva({ status: 'enviada', dataEntrega: '2026-11-08' }, hoje),
    ).toBeNull()
  })
})
