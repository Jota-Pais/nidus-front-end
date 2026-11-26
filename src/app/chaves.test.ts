import { QueryClient, QueryObserver } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import { chaves, invalidarColonia, invalidarPedidos } from './chaves'

/** O histórico aberto, com o filtro vazio */
const HISTORICO = [...chaves.historico, { entidade: null, idEntidade: null, busca: '' }]

/** Uma consulta de cada tela, como estariam no cache com a colônia aberta */
const DA_COLONIA = [
  chaves.visaoGeral,
  chaves.grade(1),
  chaves.grade(2),
  chaves.caixa(812),
  chaves.caixa(813),
  chaves.pedidos,
  chaves.atendimento(7),
  chaves.retirada(7),
  [...chaves.liberadas, { idEspecie: 1, idLinhagem: null, busca: '', limite: 50 }],
  HISTORICO,
]

const FORA_DA_COLONIA = [
  chaves.sessao,
  chaves.catalogo,
  chaves.salas,
  chaves.estantes,
  chaves.formatos,
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

/** As consultas na tela: cada uma com quem a observa, como um componente montado, e a API responde */
function naTela(cliente: QueryClient, consultas: readonly (readonly unknown[])[]): () => void {
  const saidas = consultas.map((chave) =>
    new QueryObserver(cliente, {
      queryKey: chave,
      queryFn: () => Promise.resolve({ recarregada: true }),
      staleTime: Infinity,
    }).subscribe(() => {}),
  )
  return () => saidas.forEach((sair) => sair())
}

describe('invalidarColonia', () => {
  it('recarrega de uma vez visão geral, grades, fichas, busca, pedidos, retirada e histórico', async () => {
    const cliente = cacheCheio()
    const sair = naTela(cliente, DA_COLONIA)

    await invalidarColonia(cliente)

    for (const chave of DA_COLONIA) {
      expect(cliente.getQueryData(chave), JSON.stringify(chave)).toEqual({ recarregada: true })
    }
    sair()
  })

  it('tira do cache o que não está na tela: aberto depois, não mostra as caixas de antes', async () => {
    const cliente = cacheCheio()
    // a ficha aberta na estante; a retirada, a janela de reservar e a visão geral, fechadas
    const sair = naTela(cliente, [chaves.grade(1), chaves.caixa(812)])

    await invalidarColonia(cliente)

    expect(cliente.getQueryData(chaves.retirada(7))).toBeUndefined()
    expect(cliente.getQueryData(chaves.atendimento(7))).toBeUndefined()
    expect(cliente.getQueryData(chaves.visaoGeral)).toBeUndefined()
    expect(cliente.getQueryData(chaves.grade(1))).toEqual({ recarregada: true })
    expect(cliente.getQueryData(chaves.caixa(812))).toEqual({ recarregada: true })
    sair()
  })

  it('não mexe no que não depende dos animais: sessão, catálogo, salas, estantes, formatos, contas', async () => {
    const cliente = cacheCheio()

    await invalidarColonia(cliente)

    for (const chave of FORA_DA_COLONIA) {
      expect(cliente.getQueryData(chave), JSON.stringify(chave)).toEqual({})
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
