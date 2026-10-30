import { describe, expect, it } from 'vitest'
import { hoje } from '@/lib/data'
import { mascararProtocolo, montarPedido, solicitacao, temAnimal } from './solicitacao.schema'
import type { CamposDoPedido } from './solicitacao.schema'

const { protocoloCeua, quantidade, idade, dataEntrega, nomePesquisador } = solicitacao.shape

describe('mascararProtocolo', () => {
  it('põe a pontuação enquanto se digita', () => {
    expect(mascararProtocolo('23080012345202611')).toBe('23080.012345/2026-11')
  })

  it('aceita colar com a pontuação, ou com outra qualquer', () => {
    expect(mascararProtocolo('23080.012345/2026-11')).toBe('23080.012345/2026-11')
    expect(mascararProtocolo('23080 012345 2026 11')).toBe('23080.012345/2026-11')
  })

  it('só põe o separador quando chega o dígito seguinte, para o Backspace não travar', () => {
    expect(mascararProtocolo('23080')).toBe('23080')
    expect(mascararProtocolo('230800')).toBe('23080.0')
    // Backspace logo depois do ponto: some o ponto, e não o número antes dele
    expect(mascararProtocolo('23080.')).toBe('23080')
  })

  it('para no tamanho do protocolo', () => {
    expect(mascararProtocolo('230800123452026119999')).toBe('23080.012345/2026-11')
  })
})

describe('regras dos campos', () => {
  it('o protocolo precisa estar completo', () => {
    expect(protocoloCeua.safeParse('23080.012345/2026-11').success).toBe(true)
    expect(protocoloCeua.safeParse('23080.012345/2026').success).toBe(false)
  })

  it('quantidade em branco vale zero, e negativa não passa', () => {
    expect(quantidade.parse('')).toBe(0)
    expect(quantidade.parse(null)).toBe(0)
    expect(quantidade.safeParse(-1).success).toBe(false)
  })

  it('idade de 21 a 300 dias, com mensagem em português quando está em branco', () => {
    expect(idade.safeParse(21).success).toBe(true)
    expect(idade.safeParse(20).success).toBe(false)
    expect(idade.safeParse(301).success).toBe(false)
    const vazia = idade.safeParse('')
    expect(vazia.success).toBe(false)
    if (!vazia.success) expect(vazia.error.issues[0]?.message).toBe('Informe a idade')
  })

  it('a entrega não pode ser no passado', () => {
    expect(dataEntrega.safeParse(hoje()).success).toBe(true)
    expect(dataEntrega.safeParse('2020-01-01').success).toBe(false)
  })

  it('o nome é obrigatório', () => {
    expect(nomePesquisador.safeParse('   ').success).toBe(false)
  })
})

describe('temAnimal', () => {
  it('basta um número acima de zero em qualquer um dos três', () => {
    expect(temAnimal({ machos: null, femeas: null, qualquer: 10 })).toBe(true)
    expect(temAnimal({ machos: 0, femeas: 0, qualquer: 0 })).toBe(false)
    expect(temAnimal({})).toBe(false)
  })
})

describe('montarPedido', () => {
  const campos: CamposDoPedido = {
    nomePesquisador: '  Ana Souza ',
    protocoloCeua: '23080.012345/2026-11',
    especie: 'rato',
    idLinhagem: 3,
    modoIdade: 'faixa',
    idadeMin: 20,
    idadeMax: 40,
    machos: 5,
    femeas: null,
    qualquer: 10,
    dataEntrega: '2026-12-10',
    cronograma: 'unica',
    observacoes: '  Lab. 12, bloco B  ',
  }

  it('monta o corpo do POST, com campo em branco valendo zero', () => {
    expect(montarPedido(campos)).toEqual({
      nomePesquisador: 'Ana Souza',
      protocoloCeua: '23080.012345/2026-11',
      idLinhagem: 3,
      machos: 5,
      femeas: 0,
      qualquer: 10,
      idadeMin: 20,
      idadeMax: 40,
      dataEntrega: '2026-12-10',
      cronograma: 'unica',
      observacoes: 'Lab. 12, bloco B',
    })
  })

  it('na idade exata, o máximo é o próprio mínimo, mesmo que sobre um valor da faixa', () => {
    const pedido = montarPedido({ ...campos, modoIdade: 'exata', idadeMin: 28, idadeMax: 40 })
    expect([pedido.idadeMin, pedido.idadeMax]).toEqual([28, 28])
  })

  it('observação em branco não vai no corpo', () => {
    expect(montarPedido({ ...campos, observacoes: '   ' })).not.toHaveProperty('observacoes')
  })

  it('não manda espécie nem o modo da idade, que a API não recebe', () => {
    const pedido = montarPedido(campos)
    expect(pedido).not.toHaveProperty('especie')
    expect(pedido).not.toHaveProperty('modoIdade')
  })
})
