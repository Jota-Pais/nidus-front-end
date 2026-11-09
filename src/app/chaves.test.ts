import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { chaves, invalidarColonia, invalidarPedidos } from './chaves'

/** O histórico aberto, com o filtro vazio */
const HISTORICO = [...chaves.historico, { entidade: null, idEntidade: null, busca: '' }]

/** Uma consulta de cada tela, como estariam no cache com a colônia aberta */
const DA_COLONIA = [
  chaves.quadro('rato'),
  chaves.grade(1),
  chaves.grade(2),
  chaves.caixa(812),
  chaves.caixa(813),
  chaves.estoque('camundongo'),
  chaves.pedidos,
  chaves.atendimento(7),
  chaves.retirada(7),
  HISTORICO,
]

const FORA_DA_COLONIA = [
  chaves.sessao,
  chaves.catalogo,
  chaves.salas,
  chaves.estantes,
  chaves.projetos,
  chaves.usuarios,
]

function cacheCheio(): QueryClient {
  const cliente = new QueryClient()
  for (const chave of [...DA_COLONIA, ...FORA_DA_COLONIA]) cliente.setQueryData(chave, {})
  return cliente
}

describe('chaves', () => {
  it('tudo o que mostra animais começa pelo prefixo da colônia', () => {
    for (const chave of DA_COLONIA) expect(chave[0]).toBe(chaves.colonia[0])
  })

  it('a ficha, a grade e a retirada levam o número no fim, para o prefixo casar com todas', () => {
    expect(chaves.caixa(812)).toEqual(['colonia', 'caixa', 812])
    expect(chaves.grade(3)).toEqual(['colonia', 'grade', 3])
    expect(chaves.retirada(9)).toEqual(['colonia', 'retirada', 9])
  })
})

describe('invalidarColonia', () => {
  it('derruba de uma vez kanban, grades, fichas, estoque, busca, pedidos, retirada e histórico', async () => {
    const cliente = cacheCheio()

    await invalidarColonia(cliente)

    for (const chave of DA_COLONIA) {
      expect(cliente.getQueryState(chave)?.isInvalidated, JSON.stringify(chave)).toBe(true)
    }
  })

  it('não mexe no que não depende dos animais: sessão, catálogo, salas, estantes, contas', async () => {
    const cliente = cacheCheio()

    await invalidarColonia(cliente)

    for (const chave of FORA_DA_COLONIA) {
      expect(cliente.getQueryState(chave)?.isInvalidated, JSON.stringify(chave)).toBe(false)
    }
  })
})

describe('invalidarPedidos', () => {
  it('recarrega só a lista de pedidos e o histórico', async () => {
    const cliente = cacheCheio()

    await invalidarPedidos(cliente)

    const invalidadas = [...DA_COLONIA, ...FORA_DA_COLONIA].filter(
      (chave) => cliente.getQueryState(chave)?.isInvalidated,
    )
    expect(invalidadas).toEqual([chaves.pedidos, HISTORICO])
  })
})
