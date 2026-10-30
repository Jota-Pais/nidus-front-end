import { describe, expect, it } from 'vitest'
import { hoje } from '@/lib/data'
import {
  conferirIdadeMaxima,
  formatarProtocolo,
  montarPedido,
  solicitacao,
  temAnimal,
  validadorDeIdade,
} from './solicitacao.schema'
import type { CamposDoPedido } from './solicitacao.schema'

const { protocoloCeua, quantidade, idade, dataEntrega, nomePesquisador } = solicitacao.shape

describe('formatarProtocolo', () => {
  it('põe a pontuação nos 17 dígitos digitados de uma vez', () => {
    expect(formatarProtocolo('23080012345202611')).toBe('23080.012345/2026-11')
  })

  it('aceita colar com a pontuação, ou com outra qualquer', () => {
    expect(formatarProtocolo('23080.012345/2026-11')).toBe('23080.012345/2026-11')
    expect(formatarProtocolo(' 23080 012345 2026 11 ')).toBe('23080.012345/2026-11')
  })

  it('com dígito faltando ou sobrando devolve como veio, e não corta nada calado', () => {
    expect(formatarProtocolo('2308001234520261')).toBe('2308001234520261')
    expect(formatarProtocolo('230800123452026119')).toBe('230800123452026119')
  })
})

describe('regras dos campos', () => {
  it('o protocolo vale com ou sem a pontuação, mas precisa estar completo', () => {
    expect(protocoloCeua.safeParse('23080.012345/2026-11').success).toBe(true)
    expect(protocoloCeua.safeParse('23080012345202611').success).toBe(true)
    expect(protocoloCeua.safeParse('23080.012345/2026').success).toBe(false)
    expect(protocoloCeua.safeParse('230800123452026119').success).toBe(false)
  })

  it('protocolo em branco pede o protocolo, e não que se confira o número', () => {
    const r = protocoloCeua.safeParse('')
    expect(r.success).toBe(false)
    if (!r.success) expect(r.error.issues[0]?.message).toBe('Informe o protocolo')
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

describe('conferirIdadeMaxima', () => {
  it('com as duas idades em branco, não repete o aviso que já está no mínimo', () => {
    expect(conferirIdadeMaxima(null, null)).toBeNull()
  })

  it('com o mínimo preenchido, pede o máximo', () => {
    expect(conferirIdadeMaxima(20, null)).toBe('Informe até que idade')
  })

  it('recusa o máximo menor que o mínimo e acima do teto', () => {
    expect(conferirIdadeMaxima(40, 20)).toBe('Menor que a idade inicial')
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

  it('manda o protocolo com a pontuação, mesmo digitado sem ela', () => {
    expect(montarPedido({ ...campos, protocoloCeua: '23080012345202611' }).protocoloCeua).toBe(
      '23080.012345/2026-11',
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
