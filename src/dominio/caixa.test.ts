import { describe, expect, it } from 'vitest'
import {
  aMaisNaCorrecao,
  descreverEstoque,
  descreverFalta,
  descreverLiberacao,
  destinoDoLugar,
  idDaLinhagem,
  pintaNaGrade,
  reservasNoGrupo,
} from './caixa'
import type { Catalogo } from './tipos'

describe('descreverEstoque', () => {
  it('diz quantos animais e quantos reservados', () => {
    expect(descreverEstoque({ sexo: 'M', total: 6, reservado: 2 })).toBe('6 machos, 2 reservados')
    expect(descreverEstoque({ sexo: 'F', total: 1, reservado: 1 })).toBe(
      '1 fêmea, todos reservados',
    )
    expect(descreverEstoque({ sexo: 'F', total: 4, reservado: 0 })).toBe('4 fêmeas')
  })
})

describe('pintaNaGrade', () => {
  it('pinta a caixa com casal e a de estoque; a de casal sem casal fica neutra', () => {
    expect(pintaNaGrade('livres', true)).toBe(true)
    expect(pintaNaGrade('livres', false)).toBe(false)
    expect(pintaNaGrade('reserva', false)).toBe(true)
  })

  it('a caixa que não aparece no kanban não ganha cor de coluna', () => {
    expect(pintaNaGrade(null, true)).toBe(false)
  })
})

describe('descreverFalta', () => {
  it('sem pedido em falta, não há o que avisar', () => {
    expect(descreverFalta([])).toBeNull()
  })

  it('diz o que falta em cada pedido, com o de qualquer sexo, e o que a equipe pode fazer', () => {
    expect(descreverFalta([{ idPedido: 3, m: 1, f: 0, qualquer: 1 }])).toBe(
      'O pedido ficou com menos animais do que o reservado: #3, 1 macho e 1 de qualquer sexo. ' +
        'Em Pedidos, a reserva em falta pode ser completada com outros animais ou desfeita.',
    )
  })

  it('cada pedido tem a sua falta, sem somar os de outros', () => {
    const texto = descreverFalta([
      { idPedido: 3, m: 1, f: 0, qualquer: 0 },
      { idPedido: 5, m: 0, f: 2, qualquer: 0 },
    ])

    expect(texto).toContain('Os pedidos ficaram')
    expect(texto).toContain('#3, 1 macho; #5, 2 fêmeas.')
  })
})

describe('destinoDoLugar', () => {
  const lugar = { idEstante: 2, codigo: 'F1B', face: 'frontal' as const, linha: 1, coluna: 2 }

  it('a caixa clicada vai pelo id', () => {
    expect(destinoDoLugar({ ...lugar, idCaixa: 30 })).toEqual({ idCaixa: 30 })
  })

  it('a posição vazia vai pela posição, e a caixa nova nasce nela', () => {
    expect(destinoDoLugar({ ...lugar, idCaixa: null })).toEqual({
      posicao: { idEstante: 2, face: 'frontal', linha: 1, coluna: 2 },
    })
  })
})

describe('idDaLinhagem', () => {
  const catalogo: Catalogo = {
    especies: [
      { id: 1, codigo: 'rato', nome: 'Rato', linhagens: [{ id: 4, nome: 'Wistar', ativa: true }] },
      {
        id: 2,
        codigo: 'camundongo',
        nome: 'Camundongo',
        linhagens: [{ id: 9, nome: 'Wistar', ativa: true }],
      },
    ],
    paresGeneticos: [],
  }

  it('acha o id pelo nome dentro da espécie, que é onde o nome não se repete', () => {
    expect(idDaLinhagem(catalogo, 'rato', 'Wistar')).toBe(4)
    expect(idDaLinhagem(catalogo, 'camundongo', 'Wistar')).toBe(9)
  })

  it('sem o catálogo ou sem a linhagem, não há id', () => {
    expect(idDaLinhagem(undefined, 'rato', 'Wistar')).toBeNull()
    expect(idDaLinhagem(catalogo, 'rato', null)).toBeNull()
  })
})

describe('descreverLiberacao', () => {
  it('diz quando e por que a caixa foi liberada', () => {
    expect(descreverLiberacao('2026-11-08', 'entrega')).toBe(
      'Caixa liberada em 08/11/2026: a entrega levou os últimos animais. A posição recebe caixa nova.',
    )
  })
})

describe('reservasNoGrupo', () => {
  // o parto tem 2 machos reservados para o #12 e 2 fêmeas para o #13
  const doParto = [
    { idPedido: 12, m: 2, f: 0 },
    { idPedido: 13, m: 0, f: 2 },
  ]

  it('sem reservado no grupo, nenhum pedido: os do parto estão em outra caixa', () => {
    expect(reservasNoGrupo(doParto, { m: 4, f: 0, reservados: 0 })).toEqual([])
  })

  it('com todos os reservados no grupo, cada pedido fica com o que tem', () => {
    expect(reservasNoGrupo(doParto, { m: 4, f: 4, reservados: 4 })).toEqual(doParto)
  })

  it('com os reservados repartidos, nenhum pedido passa dos reservados nem dos vivos do grupo', () => {
    expect(reservasNoGrupo(doParto, { m: 4, f: 0, reservados: 1 })).toEqual([
      { idPedido: 12, m: 1, f: 0 },
    ])
  })
})

describe('aMaisNaCorrecao', () => {
  it('o sexo que sobe sozinho cria animais', () => {
    expect(aMaisNaCorrecao({ m: 5, f: 5 }, { m: 7, f: 5 })).toEqual({ m: 2, f: 0 })
    expect(aMaisNaCorrecao({ m: 5, f: 5 }, { m: 6, f: 6 })).toEqual({ m: 1, f: 1 })
  })

  it('um sexo que sobe enquanto o outro desce é troca de sexo, e só a sobra é animal novo', () => {
    expect(aMaisNaCorrecao({ m: 5, f: 5 }, { m: 6, f: 4 })).toEqual({ m: 0, f: 0 })
    expect(aMaisNaCorrecao({ m: 5, f: 5 }, { m: 7, f: 4 })).toEqual({ m: 1, f: 0 })
    expect(aMaisNaCorrecao({ m: 5, f: 5 }, { m: 3, f: 6 })).toEqual({ m: 0, f: 0 })
  })

  it('contagem menor não cria animal', () => {
    expect(aMaisNaCorrecao({ m: 5, f: 5 }, { m: 4, f: 5 })).toEqual({ m: 0, f: 0 })
  })
})
