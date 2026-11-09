import { describe, expect, it } from 'vitest'
import type { StatusDoPedido } from './tipos'
import {
  AVISO_DE_ENTREGA_SEM_RESERVA_EM_DIAS,
  alvoDaReserva,
  avisoDeEntregaSemReserva,
  compararDataDeEntrega,
  compararDataDoPedido,
  conferirReserva,
  descreverCaixasLiberadas,
  descreverIdade,
  descreverQuantidadeEEspecie,
  descreverQuantos,
  descreverSexos,
  entraNoFiltro,
  faixaDeIdade,
  FILTROS_DE_PEDIDO,
  podeRecusar,
  recebeReserva,
  reservaPodeIr,
  SITUACAO_DO_PEDIDO,
  totalDeAnimais,
  voltaramAFicarLivres,
} from './pedido'

const STATUS: StatusDoPedido[] = ['enviado', 'aprovado', 'reservado', 'entregue', 'recusado']

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

describe('descreverQuantos', () => {
  it('conta o que falta, com o de qualquer sexo, na ordem macho, fêmea, qualquer', () => {
    expect(descreverQuantos({ m: 1, f: 2, qualquer: 3 })).toBe(
      '1 macho, 2 fêmeas e 3 de qualquer sexo',
    )
    expect(descreverQuantos({ m: 0, f: 1, qualquer: 1 })).toBe('1 fêmea e 1 de qualquer sexo')
    expect(descreverQuantos({ m: 0, f: 0, qualquer: 4 })).toBe('4 de qualquer sexo')
  })

  it('sem nada, diz que não há animal', () => {
    expect(descreverQuantos({ m: 0, f: 0, qualquer: 0 })).toBe('nenhum animal')
  })
})

describe('voltaramAFicarLivres', () => {
  it('conta os que a reserva soltou, com o verbo no número deles', () => {
    expect(voltaramAFicarLivres({ m: 2, f: 1 })).toBe('2 machos e 1 fêmea voltaram a ficar livres.')
    expect(voltaramAFicarLivres({ m: 0, f: 1 })).toBe('1 fêmea voltou a ficar livre.')
  })

  it('sem vivo reservado para soltar, não diz nada', () => {
    expect(voltaramAFicarLivres({ m: 0, f: 0 })).toBeNull()
  })
})

describe('descreverCaixasLiberadas', () => {
  it('diz as caixas que a entrega esvaziou, uma ou várias', () => {
    expect(descreverCaixasLiberadas(['F2A'])).toBe('A caixa F2A ficou vazia e foi liberada.')
    expect(descreverCaixasLiberadas(['F2A', 'F3B', 'T1A'])).toBe(
      'As caixas F2A, F3B e T1A ficaram vazias e foram liberadas.',
    )
  })

  it('sem caixa liberada, não diz nada', () => {
    expect(descreverCaixasLiberadas([])).toBeNull()
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
      { id: 1, dataPedido: '2026-11-01' },
      { id: 3, dataPedido: '2026-11-03' },
      { id: 2, dataPedido: '2026-11-03' },
    ]

    expect(pedidos.sort(compararDataDoPedido).map((p) => p.id)).toEqual([1, 2, 3])
  })
})

describe('entraNoFiltro', () => {
  const filtrados = (status: StatusDoPedido) =>
    FILTROS_DE_PEDIDO.filter(({ valor }) => entraNoFiltro(valor, { status })).map((f) => f.valor)

  it('pendente é o que espera resposta', () => {
    expect(filtrados('enviado')).toEqual(['todos', 'pendentes'])
  })

  it('aceito é o aprovado, com reserva ou ainda sem: o que falta entregar', () => {
    expect(filtrados('aprovado')).toEqual(['todos', 'aceitos'])
    expect(filtrados('reservado')).toEqual(['todos', 'aceitos'])
  })

  it('entregue e recusado ficam cada um no seu filtro', () => {
    expect(filtrados('entregue')).toEqual(['todos', 'entregues'])
    expect(filtrados('recusado')).toEqual(['todos', 'recusados'])
  })
})

describe('situação do pedido', () => {
  it('toda situação tem rótulo; aprovado e reservado, para quem pediu, são o mesmo aceito', () => {
    for (const status of STATUS) expect(SITUACAO_DO_PEDIDO[status].rotulo).not.toBe('')
    expect(SITUACAO_DO_PEDIDO.aprovado.paraQuemPediu).toBe('Aceito, em andamento')
    expect(SITUACAO_DO_PEDIDO.reservado.paraQuemPediu).toBe('Aceito, em andamento')
  })

  it('o aprovado está sem os animais e o reservado, com eles: as duas palavras não se confundem', () => {
    expect(SITUACAO_DO_PEDIDO.aprovado.rotulo).toBe('Aguardando animais')
    expect(SITUACAO_DO_PEDIDO.reservado.rotulo).toBe('Animais reservados')
  })
})

describe('podeRecusar', () => {
  it('recusa até o reservado, que solta os animais; entregue e recusado são finais', () => {
    expect(STATUS.filter(podeRecusar)).toEqual(['enviado', 'aprovado', 'reservado'])
  })
})

describe('recebeReserva e alvoDaReserva', () => {
  const pedido = { machos: 2, femeas: 2, qualquer: 2 }

  it('o aprovado recebe a reserva do pedido inteiro', () => {
    const aprovado = { ...pedido, status: 'aprovado' as const, reservaEmFalta: null }

    expect(recebeReserva(aprovado)).toBe(true)
    expect(alvoDaReserva(aprovado)).toEqual(pedido)
  })

  it('o reservado só recebe se está em falta, e só o que falta', () => {
    const emFalta = { m: 1, f: 0, qualquer: 1 }

    expect(recebeReserva({ status: 'reservado', reservaEmFalta: emFalta })).toBe(true)
    expect(recebeReserva({ status: 'reservado', reservaEmFalta: null })).toBe(false)
    expect(alvoDaReserva({ ...pedido, reservaEmFalta: emFalta })).toEqual({
      machos: 1,
      femeas: 0,
      qualquer: 1,
    })
  })

  it('enviado, entregue e recusado não recebem reserva', () => {
    for (const status of ['enviado', 'entregue', 'recusado'] as const) {
      expect(recebeReserva({ status, reservaEmFalta: null })).toBe(false)
    }
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

  it('na falta, confere só o que falta completar', () => {
    const falta = alvoDaReserva({ ...pedido, reservaEmFalta: { m: 1, f: 0, qualquer: 0 } })

    expect(conferirReserva(falta, { m: 1, f: 0 }).cobre).toBe(true)
    expect(conferirReserva(falta, { m: 1, f: 1 }).aMais.total).toBe(1)
  })
})

describe('reservaPodeIr', () => {
  const pedido = { machos: 2, femeas: 2, qualquer: 0 }
  const pode = (reservado: { m: number; f: number }, inteira: boolean) =>
    reservaPodeIr(conferirReserva(pedido, reservado), reservado, inteira)

  it('o pedido aprovado só vai inteiro', () => {
    expect(pode({ m: 2, f: 2 }, true)).toBe(true)
    expect(pode({ m: 1, f: 2 }, true)).toBe(false)
  })

  it('a falta do reservado se completa aos poucos, sem passar do que falta', () => {
    expect(pode({ m: 1, f: 0 }, false)).toBe(true)
    expect(pode({ m: 2, f: 2 }, false)).toBe(true)
    expect(pode({ m: 3, f: 0 }, false)).toBe(false)
    expect(pode({ m: 0, f: 0 }, false)).toBe(false)
  })
})

describe('avisoDeEntregaSemReserva', () => {
  const aprovado = (dataEntrega: string) => ({ status: 'aprovado' as const, dataEntrega })
  const hoje = '2026-11-07'

  it('avisa a equipe do pedido aprovado sem reserva com a entrega a até 7 dias', () => {
    expect(AVISO_DE_ENTREGA_SEM_RESERVA_EM_DIAS).toBe(7)
    expect(avisoDeEntregaSemReserva(aprovado('2026-11-14'), hoje)).toBe(
      'Entrega em 7 dias, sem reserva',
    )
    expect(avisoDeEntregaSemReserva(aprovado('2026-11-10'), hoje)).toBe(
      'Entrega em 3 dias, sem reserva',
    )
    expect(avisoDeEntregaSemReserva(aprovado('2026-11-08'), hoje)).toBe(
      'Entrega em 1 dia, sem reserva',
    )
  })

  it('a entrega de hoje e a que já passou também avisam', () => {
    expect(avisoDeEntregaSemReserva(aprovado('2026-11-07'), hoje)).toBe('Entrega hoje, sem reserva')
    expect(avisoDeEntregaSemReserva(aprovado('2026-11-02'), hoje)).toBe(
      'Entrega vencida, sem reserva',
    )
  })

  it('sem aviso com a entrega mais longe, ou com os animais já reservados', () => {
    expect(avisoDeEntregaSemReserva(aprovado('2026-11-15'), hoje)).toBeNull()
    expect(
      avisoDeEntregaSemReserva({ status: 'reservado', dataEntrega: '2026-11-08' }, hoje),
    ).toBeNull()
    expect(
      avisoDeEntregaSemReserva({ status: 'enviado', dataEntrega: '2026-11-08' }, hoje),
    ).toBeNull()
  })
})
