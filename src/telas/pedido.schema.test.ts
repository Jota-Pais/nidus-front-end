import { describe, expect, it } from 'vitest'
import { hoje } from '@/lib/data'
import {
  conferirIdadeMaxima,
  montarPedido,
  regrasDoPedido,
  temAnimal,
  validadorDeIdade,
} from './pedido.schema'
import type { CamposDoPedido } from './pedido.schema'

const { quantidade, idade, dataEntrega, nomePesquisador } = regrasDoPedido.shape

describe('regras dos campos', () => {
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

describe('conferirIdadeMaxima', () => {
  it('com as duas idades em branco, não repete o aviso que já está no mínimo', () => {
    expect(conferirIdadeMaxima(null, null)).toBeNull()
  })

  it('com o mínimo preenchido, pede o máximo', () => {
    expect(conferirIdadeMaxima(20, null)).toBe('Informe a idade máxima')
  })

  it('recusa o máximo menor que o mínimo e acima do teto', () => {
    expect(conferirIdadeMaxima(40, 20)).toBe('Menor que a idade mínima')
    expect(conferirIdadeMaxima(21, 301)).toBe('Máximo de 300 dias')
  })

  it('aceita a faixa certa', () => {
    expect(conferirIdadeMaxima(21, 40)).toBeNull()
  })

  it('segue o mínimo de quem usa o campo: a busca do técnico aceita menos de 21 dias', () => {
    expect(conferirIdadeMaxima(5, 10)).toBe('Mínimo de 21 dias')
    expect(conferirIdadeMaxima(5, 10, 1)).toBeNull()
  })
})

describe('validadorDeIdade', () => {
  it('no pedido, o mínimo é 21; na busca, o que ela passar', async () => {
    await expect(validadorDeIdade()(null, 10)).rejects.toThrow('Mínimo de 21 dias')
    await expect(validadorDeIdade(1)(null, 10)).resolves.toBeUndefined()
  })

  it('com o mínimo de 1, a mensagem fala em dia, no singular', async () => {
    await expect(validadorDeIdade(1)(null, 0)).rejects.toThrow(/^Mínimo de 1 dia$/)
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
    protocoloCeua: '23080.012345/2026-14',
    especie: 'rato',
    idLinhagem: 3,
    modoIdade: 'faixa',
    idadeMin: 20,
    idadeMax: 40,
    machos: 5,
    femeas: null,
    qualquer: 10,
    dataEntrega: '2026-12-10',
    observacoes: '  Lab. 12, bloco B  ',
  }

  it('monta o corpo do POST, com campo em branco valendo zero', () => {
    expect(montarPedido(campos)).toEqual({
      nomePesquisador: 'Ana Souza',
      protocoloCeua: '23080.012345/2026-14',
      idLinhagem: 3,
      machos: 5,
      femeas: 0,
      qualquer: 10,
      idadeMin: 20,
      idadeMax: 40,
      dataEntrega: '2026-12-10',
      observacoes: 'Lab. 12, bloco B',
    })
  })

  it('na idade exata, o máximo é o próprio mínimo, mesmo que sobre um valor da faixa', () => {
    const pedido = montarPedido({ ...campos, modoIdade: 'exata', idadeMin: 28, idadeMax: 40 })
    expect([pedido.idadeMin, pedido.idadeMax]).toEqual([28, 28])
  })

  it('manda o protocolo na forma da API, mesmo enviado com o Enter antes de sair do campo', () => {
    expect(montarPedido({ ...campos, protocoloCeua: '23080012345202614' }).protocoloCeua).toBe(
      '23080.012345/2026-14',
    )
    expect(montarPedido({ ...campos, protocoloCeua: '23080.50920' }).protocoloCeua).toBe(
      '2308050920',
    )
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
