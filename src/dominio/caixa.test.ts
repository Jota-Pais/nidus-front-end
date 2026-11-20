import { describe, expect, it } from 'vitest'
import {
  aMaisNaCorrecao,
  descreverEstoque,
  descreverFalta,
  descreverLiberacao,
  destinoDoLugar,
  foraDaRegraDeCruzamento,
  motivoDoAtraso,
  partoQueAbreAFicha,
  reservadosDoSexo,
} from './caixa'
import type { CasalNoCard, Parto } from './tipos'

describe('descreverEstoque', () => {
  it('diz quantos animais e quantos reservados', () => {
    expect(descreverEstoque({ sexo: 'M', total: 6, reservado: 2 })).toBe('6 machos, 2 reservados')
    expect(descreverEstoque({ sexo: 'F', total: 4, reservado: 0 })).toBe('4 fêmeas')
  })

  it('o reservado concorda com o sexo e com quantos são', () => {
    expect(descreverEstoque({ sexo: 'F', total: 5, reservado: 1 })).toBe('5 fêmeas, 1 reservada')
    expect(descreverEstoque({ sexo: 'F', total: 3, reservado: 3 })).toBe(
      '3 fêmeas, todas reservadas',
    )
    expect(descreverEstoque({ sexo: 'M', total: 2, reservado: 2 })).toBe(
      '2 machos, todos reservados',
    )
    expect(descreverEstoque({ sexo: 'F', total: 1, reservado: 1 })).toBe('1 fêmea, reservada')
    expect(descreverEstoque({ sexo: 'M', total: 3, reservado: 1 })).toBe('3 machos, 1 reservado')
  })
})

describe('reservadosDoSexo', () => {
  it('conta os reservados de uma caixa de um sexo só, no gênero dele', () => {
    expect(reservadosDoSexo(0, 'F')).toBe('0 reservadas')
    expect(reservadosDoSexo(1, 'F')).toBe('1 reservada')
    expect(reservadosDoSexo(1, 'M')).toBe('1 reservado')
    expect(reservadosDoSexo(4, 'M')).toBe('4 reservados')
  })
})

describe('motivoDoAtraso', () => {
  const hojeEm = '2026-11-10'
  const casal = (parcial: Partial<CasalNoCard>): CasalNoCard => ({
    identificacao: 'AB',
    partoAtual: 2,
    partoDaFase: 2,
    partoPrevisto: null,
    encerrado: false,
    aguardandoDesmame: false,
    ninhadas: [],
    reservado: 0,
    ...parcial,
  })
  const mamando = (idadeDias: number) => ({
    casal: 'AB',
    parto: 1,
    m: 3,
    f: 2,
    idadeDias,
    mamando: true,
  })

  it('sem atraso, nada a dizer', () => {
    expect(motivoDoAtraso({ atrasado: false, casal: casal({}) }, hojeEm)).toBeNull()
  })

  it('diz o parto que passou da data e os filhotes que passaram da idade de desmamar', () => {
    expect(
      motivoDoAtraso({ atrasado: true, casal: casal({ partoPrevisto: '2026-11-08' }) }, hojeEm),
    ).toBe('Atrasado: o parto previsto para 08/11 não foi registrado')
    expect(
      motivoDoAtraso({ atrasado: true, casal: casal({ ninhadas: [mamando(23)] }) }, hojeEm),
    ).toBe('Atrasado: filhotes com mais de 22 dias sem desmame')
    expect(
      motivoDoAtraso(
        { atrasado: true, casal: casal({ partoPrevisto: '2026-11-01', ninhadas: [mamando(30)] }) },
        hojeEm,
      ),
    ).toBe(
      'Atrasado: o parto previsto para 01/11 não foi registrado e filhotes com mais de 22 dias sem desmame',
    )
  })
})

describe('descreverFalta', () => {
  it('sem pedido em falta, não há o que avisar', () => {
    expect(descreverFalta([])).toBeNull()
  })

  it('diz o que falta em cada pedido, com o de qualquer sexo, e o que a equipe pode fazer', () => {
    expect(descreverFalta([{ idPedido: 3, m: 1, f: 0, qualquer: 1 }])).toBe(
      'O pedido ficou com animais a menos que a reserva (reserva em falta): #3, 1 macho e 1 de qualquer sexo. ' +
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

describe('descreverLiberacao', () => {
  it('diz quando e por que a caixa foi liberada', () => {
    expect(descreverLiberacao('2026-11-08', 'entrega')).toBe(
      'Caixa liberada em 08/11/2026: a entrega levou os últimos animais. A posição recebe caixa nova.',
    )
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

describe('foraDaRegraDeCruzamento', () => {
  const wistar = { nome: 'Wistar', cruzamento: 'rodizio' as const }
  const c57 = { nome: 'C57BL/6J', cruzamento: 'mesma_letra' as const }

  it('no rodízio, o macho vai com a fêmea do grupo seguinte, e o E volta ao A', () => {
    expect(foraDaRegraDeCruzamento(wistar, 'A', 'B')).toBeNull()
    expect(foraDaRegraDeCruzamento(wistar, 'E', 'A')).toBeNull()
    expect(foraDaRegraDeCruzamento(wistar, 'A', 'A')).toBe(
      'A Wistar é heterogênica: no rodízio, o macho A vai com a fêmea B.',
    )
    // o rodízio tem sentido: fêmea A com macho B não é o par AB
    expect(foraDaRegraDeCruzamento(wistar, 'B', 'A')).toBe(
      'A Wistar é heterogênica: no rodízio, o macho B vai com a fêmea C.',
    )
  })

  it('na mesma letra, macho e fêmea do mesmo grupo', () => {
    expect(foraDaRegraDeCruzamento(c57, 'C', 'C')).toBeNull()
    expect(foraDaRegraDeCruzamento(c57, 'A', 'B')).toBe(
      'A C57BL/6J é isogênica: o macho A vai com a fêmea A.',
    )
  })

  it('não avisa sem regra na linhagem, sem linhagem ou com um grupo em branco', () => {
    expect(foraDaRegraDeCruzamento({ nome: 'Lewis', cruzamento: null }, 'A', 'D')).toBeNull()
    expect(foraDaRegraDeCruzamento(undefined, 'A', 'D')).toBeNull()
    expect(foraDaRegraDeCruzamento(c57, 'A', undefined)).toBeNull()
  })
})

describe('partoQueAbreAFicha', () => {
  const doCasal = (ordem: number, parcial: Partial<Parto> = {}) =>
    ({
      id: ordem * 10,
      ordem,
      dtAcasalamento: '2026-09-01',
      dtPartoReal: '2026-09-24',
      dtSemNinhada: null,
      ...parcial,
    }) as Parto
  const pendente = (ordem: number) => doCasal(ordem, { dtPartoReal: null })
  const semNinhada = (ordem: number) =>
    doCasal(ordem, { dtPartoReal: null, dtSemNinhada: '2026-11-01' })

  it('abre no parto pendente, o acasalado que ainda não nasceu', () => {
    expect(partoQueAbreAFicha([doCasal(1), doCasal(2), pendente(3)])?.ordem).toBe(3)
  })

  it('sem pendente, abre no último que nasceu, mesmo com o sem ninhada depois dele', () => {
    expect(partoQueAbreAFicha([doCasal(1), doCasal(2), semNinhada(3)])?.ordem).toBe(2)
  })

  it('o sem ninhada só abre quando o casal não tem outro parto', () => {
    expect(partoQueAbreAFicha([semNinhada(1)])?.ordem).toBe(1)
  })

  it('sem parto nenhum, não há o que abrir', () => {
    expect(partoQueAbreAFicha([])).toBeUndefined()
  })
})
