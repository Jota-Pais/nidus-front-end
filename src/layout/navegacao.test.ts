import { describe, expect, it } from 'vitest'
import { menuDoPerfil, rotaInicial } from './navegacao'

describe('menu por perfil', () => {
  it('o pesquisador só solicita animais: não vê a colônia nem a busca', () => {
    const caminhos = menuDoPerfil('pesquisador').map((item) => item.caminho)
    expect(caminhos).toEqual(['/solicitar'])
  })

  it('técnico e gestor veem as quatro telas do sistema do cliente', () => {
    for (const perfil of ['tecnico', 'gestor'] as const) {
      const caminhos = menuDoPerfil(perfil).map((item) => item.caminho)
      expect(caminhos).toEqual(['/kanban', '/estantes', '/solicitar', '/busca'])
    }
  })
})

describe('rotaInicial', () => {
  it('o kanban é a tela inicial de quem opera a colônia', () => {
    expect(rotaInicial('tecnico')).toBe('/kanban')
    expect(rotaInicial('gestor')).toBe('/kanban')
  })

  it('o pesquisador começa pela solicitação de animais', () => {
    expect(rotaInicial('pesquisador')).toBe('/solicitar')
  })
})
