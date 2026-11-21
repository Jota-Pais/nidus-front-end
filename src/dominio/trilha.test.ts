import { describe, expect, it } from 'vitest'
import type { OrigemDaPassagem, PassagemDoEstoque } from './tipos'
import {
  descreverAnimais,
  descreverOrigemDaPassagem,
  descreverPassagem,
  separarATrilha,
} from './trilha'

const passagem = (parcial: Partial<PassagemDoEstoque> = {}): PassagemDoEstoque => ({
  idOcorrencia: 1,
  dtFato: '2026-10-16',
  sentido: 'chegada',
  tipo: 'entrada',
  m: 6,
  f: 0,
  outraCaixa: null,
  idPedido: null,
  causa: null,
  motivo: null,
  origens: [],
  ...parcial,
})

const caixaF1A = { id: 7, codigo: 'F1A', numeroVisivel: 'E-01' }

describe('descreverAnimais', () => {
  it('conta por sexo no singular e no plural', () => {
    expect(descreverAnimais({ m: 2, f: 1 })).toBe('2 machos e 1 fêmea')
    expect(descreverAnimais({ m: 1, f: 0 })).toBe('1 macho')
    expect(descreverAnimais({ m: 0, f: 3 })).toBe('3 fêmeas')
  })
})

describe('descreverPassagem', () => {
  it('a entrada é o cadastro inicial', () => {
    expect(descreverPassagem(passagem())).toBe('Cadastro inicial: 6 machos')
  })

  it('o nascimento concorda com quantos nasceram', () => {
    expect(descreverPassagem(passagem({ tipo: 'nascimento', m: 3, f: 2 }))).toBe(
      'Nasceram nesta caixa: 3 machos e 2 fêmeas',
    )
    expect(descreverPassagem(passagem({ tipo: 'nascimento', m: 0, f: 1 }))).toBe(
      'Nasceu nesta caixa: 1 fêmea',
    )
  })

  it('a correção diz os animais a mais e o motivo', () => {
    expect(descreverPassagem(passagem({ tipo: 'correcao', m: 1, motivo: 'contagem errada' }))).toBe(
      'Correção do nascimento: 1 macho a mais (contagem errada)',
    )
    expect(descreverPassagem(passagem({ tipo: 'correcao', m: 1 }))).toBe(
      'Correção do nascimento: 1 macho a mais',
    )
  })

  it('a mudança diz de onde veio ou para onde foi, com a estante', () => {
    expect(descreverPassagem(passagem({ tipo: 'mudanca', outraCaixa: caixaF1A }))).toBe(
      'Da caixa F1A (E-01): 6 machos',
    )
    expect(
      descreverPassagem(
        passagem({ tipo: 'mudanca', sentido: 'saida', m: 3, outraCaixa: caixaF1A }),
      ),
    ).toBe('Para a caixa F1A (E-01): 3 machos')
  })

  it('a mudança sem a outra caixa diz "outra caixa"', () => {
    expect(descreverPassagem(passagem({ tipo: 'mudanca', sentido: 'saida' }))).toBe(
      'Para a caixa outra caixa: 6 machos',
    )
  })

  it('a baixa anulada diz para que caixa os animais voltaram, no singular e no plural', () => {
    expect(descreverPassagem(passagem({ tipo: 'anulacao', outraCaixa: caixaF1A, m: 1 }))).toBe(
      'Baixa anulada na caixa F1A (E-01): 1 macho voltou para esta',
    )
    expect(
      descreverPassagem(
        passagem({ tipo: 'anulacao', sentido: 'saida', outraCaixa: caixaF1A, m: 2 }),
      ),
    ).toBe('Baixa anulada: 2 machos voltaram para a caixa F1A (E-01)')
  })

  it('a entrega diz o pedido', () => {
    expect(
      descreverPassagem(passagem({ tipo: 'entrega', sentido: 'saida', m: 2, idPedido: 12 })),
    ).toBe('Entregues ao pedido #12: 2 machos')
    expect(
      descreverPassagem(passagem({ tipo: 'entrega', sentido: 'saida', m: 1, idPedido: 12 })),
    ).toBe('Entregue ao pedido #12: 1 macho')
  })

  it('a baixa diz a causa e o motivo', () => {
    const baixa = passagem({
      tipo: 'baixa',
      sentido: 'saida',
      m: 1,
      causa: 'morte',
      motivo: 'doente',
    })
    expect(descreverPassagem(baixa)).toBe('Morte: 1 macho (doente)')
    expect(descreverPassagem({ ...baixa, causa: 'eutanasia', motivo: null })).toBe(
      'Eutanásia: 1 macho',
    )
  })
})

describe('descreverOrigemDaPassagem', () => {
  const origem = (parcial: Partial<OrigemDaPassagem> = {}): OrigemDaPassagem => ({
    idParto: 10,
    ordem: 1,
    casal: 'AB',
    dtNascimento: '2026-09-24',
    m: 6,
    f: 0,
    ...parcial,
  })

  it('diz o parto, o casal e o nascimento', () => {
    expect(descreverOrigemDaPassagem(origem())).toBe(
      '6 machos do 1º parto do casal AB, nascidos em 24/09/2026',
    )
  })

  it('"nascida" só quando são só fêmeas, e o singular não leva s', () => {
    expect(descreverOrigemDaPassagem(origem({ m: 0, f: 1 }))).toBe(
      '1 fêmea do 1º parto do casal AB, nascida em 24/09/2026',
    )
    expect(descreverOrigemDaPassagem(origem({ m: 0, f: 2 }))).toContain('nascidas em')
    expect(descreverOrigemDaPassagem(origem({ m: 1, f: 2 }))).toContain('nascidos em')
  })

  it('o cadastro inicial não tem parto nem casal', () => {
    expect(descreverOrigemDaPassagem(origem({ ordem: null, casal: null }))).toBe(
      '6 machos do cadastro inicial, nascidos em 24/09/2026',
    )
  })

  it('sem data de nascimento, não diz quando nasceram', () => {
    expect(descreverOrigemDaPassagem(origem({ dtNascimento: null }))).toBe(
      '6 machos do 1º parto do casal AB',
    )
  })
})

describe('separarATrilha', () => {
  it('separa chegadas e saídas na ordem da API, com o total de cada lado', () => {
    const trilha = [
      passagem({ idOcorrencia: 1, m: 6, f: 1 }),
      passagem({ idOcorrencia: 2, tipo: 'entrega', sentido: 'saida', m: 2, f: 0 }),
      passagem({ idOcorrencia: 3, tipo: 'mudanca', m: 1, f: 2 }),
      passagem({ idOcorrencia: 4, tipo: 'baixa', sentido: 'saida', m: 1, f: 1 }),
    ]

    const separada = separarATrilha(trilha)

    expect(separada.chegadas.map((p) => p.idOcorrencia)).toEqual([1, 3])
    expect(separada.saidas.map((p) => p.idOcorrencia)).toEqual([2, 4])
    expect(separada.chegaram).toEqual({ m: 7, f: 3 })
    expect(separada.sairam).toEqual({ m: 3, f: 1 })
  })

  it('a trilha vazia tem totais zerados', () => {
    expect(separarATrilha([])).toEqual({
      chegadas: [],
      saidas: [],
      chegaram: { m: 0, f: 0 },
      sairam: { m: 0, f: 0 },
    })
  })
})
