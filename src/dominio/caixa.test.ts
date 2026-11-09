import { describe, expect, it } from 'vitest'
import { descreverEstoque, descreverFalta, pintaNaGrade } from './caixa'

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
