import { describe, expect, it } from 'vitest'
import { ErroDeApi } from '@/lib/api'
import { caminhoDoCampo, motivoDaFalha } from './useFalhaDoFormulario'

const falhaNosCampos = (campos: Record<string, string>) =>
  new ErroDeApi(400, {
    erro: { codigo: 'VALIDACAO', mensagem: 'Confira os campos destacados.', campos },
  })

describe('caminhoDoCampo', () => {
  it('o campo simples continua um nome só', () => {
    expect(caminhoDoCampo('dtFato')).toEqual(['dtFato'])
  })

  it('o campo de dentro de um grupo vira a lista do antd, com o índice como número', () => {
    expect(caminhoDoCampo('machos.destino')).toEqual(['machos', 'destino'])
    expect(caminhoDoCampo('itens.0.idPedido')).toEqual(['itens', 0, 'idPedido'])
  })
})

describe('motivoDaFalha', () => {
  it('o que a API apontou num campo do formulário fica no campo, e o aviso diz o resto', () => {
    const falha = falhaNosCampos({
      'machos.destino': 'A caixa e de outro sexo.',
      '(corpo)': 'Os animais mudaram durante o registro.',
    })

    expect(motivoDaFalha(falha, ['machos.destino'])).toBe('Os animais mudaram durante o registro.')
  })

  it('sem campo de fora, o aviso é a mensagem da API', () => {
    expect(motivoDaFalha(falhaNosCampos({ dtFato: 'Data no futuro.' }), ['dtFato'])).toBe(
      'Confira os campos destacados.',
    )
  })

  it('o campo que a API chama de outro jeito conta como do formulário pelo nome que tem nele', () => {
    const falha = falhaNosCampos({ 'itens.1.idPedido': 'Escolha um dos pedidos: #7, #9.' })
    const nome = (chave: string) => chave.replace('itens.1', 'femeas')

    expect(motivoDaFalha(falha, ['femeas.idPedido'], nome)).toBe('Confira os campos destacados.')
    expect(motivoDaFalha(falha, ['femeas.idPedido'])).toBe('Escolha um dos pedidos: #7, #9.')
  })
})
