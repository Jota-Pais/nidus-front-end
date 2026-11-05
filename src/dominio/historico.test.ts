import { describe, expect, it } from 'vitest'
import { caminhoDoHistorico } from './consultas'

describe('filtro do histórico vai para a API', () => {
  it('manda tipo, número e texto, para o servidor filtrar antes do limite', () => {
    expect(caminhoDoHistorico({ entidade: 'caixa', idEntidade: 7, busca: ' Ana ' })).toBe(
      '/api/historico?limite=300&entidade=caixa&idEntidade=7&busca=Ana',
    )
  })

  it('sem filtro pede só as 300 mais recentes', () => {
    expect(caminhoDoHistorico({ entidade: null, idEntidade: null, busca: '' })).toBe(
      '/api/historico?limite=300',
    )
  })
})
