import { QueryClient } from '@tanstack/react-query'
import { describe, expect, it, vi } from 'vitest'
import { chaves, invalidarColonia } from './chaves'

describe('chaves', () => {
  it('usa os nomes que o card do backlog fixou, porque o back escreveu contra eles', () => {
    expect(chaves.sessao).toEqual(['sessao'])
    expect(chaves.catalogo).toEqual(['catalogo'])
    expect(chaves.estantes).toEqual(['estantes'])
    expect(chaves.grade(3)).toEqual(['grade', 3])
    expect(chaves.caixa(812)).toEqual(['caixa', 812])
    expect(chaves.quadro('rato')).toEqual(['quadro', 'rato'])
  })

  it('grade e caixa são planas, para invalidar por prefixo', () => {
    // ['grade'] tem que casar com ['grade', qualquerEstante]. Se a chave fosse
    // ['estantes','grade',3], invalidar ['grade'] não pegaria nada.
    expect(chaves.grade(3)[0]).toBe('grade')
    expect(chaves.caixa(1)[0]).toBe('caixa')
  })
})

describe('invalidarColonia — RF-CIC-02', () => {
  it('derruba estantes, grade e quadro de uma vez', async () => {
    const cliente = new QueryClient()
    const espia = vi.spyOn(cliente, 'invalidateQueries').mockResolvedValue()

    await invalidarColonia(cliente)

    const alvos = espia.mock.calls.map((c) => c[0]?.queryKey)
    expect(alvos).toEqual([['estantes'], ['grade'], ['quadro']])
  })

  it('inclui a ficha quando a alteração foi numa caixa específica', async () => {
    const cliente = new QueryClient()
    const espia = vi.spyOn(cliente, 'invalidateQueries').mockResolvedValue()

    await invalidarColonia(cliente, 812)

    expect(espia.mock.calls.map((c) => c[0]?.queryKey)).toEqual([
      ['estantes'],
      ['grade'],
      ['quadro'],
      ['caixa', 812],
    ])
  })

  it('invalida a grade de todas as estantes em cache, não só a que está na tela', async () => {
    const cliente = new QueryClient()
    cliente.setQueryData(chaves.grade(1), { marcador: 1 })
    cliente.setQueryData(chaves.grade(2), { marcador: 2 })

    await invalidarColonia(cliente)

    for (const id of [1, 2]) {
      expect(cliente.getQueryState(chaves.grade(id))?.isInvalidated).toBe(true)
    }
  })
})
