import { describe, expect, it } from 'vitest'
import { configuracoesDoPerfil, menuDoPerfil, mostraBarraLateral, rotaInicial } from './navegacao'

describe('menu por perfil', () => {
  it('o pesquisador só solicita animais: não vê a colônia nem a busca', () => {
    const caminhos = menuDoPerfil('pesquisador').map((item) => item.caminho)
    expect(caminhos).toEqual(['/solicitar'])
  })

  it('o técnico vê as telas da colônia e o estoque', () => {
    const caminhos = menuDoPerfil('tecnico').map((item) => item.caminho)
    expect(caminhos).toEqual(['/kanban', '/estantes', '/solicitar', '/busca', '/estoque'])
  })

  it('só o gestor vê o histórico', () => {
    const caminhos = menuDoPerfil('gestor').map((item) => item.caminho)
    expect(caminhos).toEqual(['/kanban', '/estantes', '/solicitar', '/busca', '/estoque', '/historico'])
  })
})

describe('solicitações', () => {
  it('só o pesquisador pede animais: técnico e gestor veem a lista de solicitações', () => {
    const rotulo = (perfil: 'pesquisador' | 'tecnico' | 'gestor') =>
      menuDoPerfil(perfil).find((item) => item.caminho === '/solicitar')?.rotulo
    expect(rotulo('pesquisador')).toBe('Solicitar animais')
    expect(rotulo('tecnico')).toBe('Solicitações')
    expect(rotulo('gestor')).toBe('Solicitações')
  })
})

describe('configurações', () => {
  it('cadastros e usuários ficam em Configurações, só para o gestor', () => {
    expect(configuracoesDoPerfil('gestor').map((item) => item.caminho)).toEqual([
      '/cadastros',
      '/usuarios',
    ])
    expect(configuracoesDoPerfil('tecnico')).toEqual([])
    expect(configuracoesDoPerfil('pesquisador')).toEqual([])
  })
})

describe('mostraBarraLateral', () => {
  it('o pesquisador tem uma tela só e fica sem barra lateral', () => {
    expect(mostraBarraLateral('pesquisador')).toBe(false)
  })

  it('técnico e gestor navegam entre as telas pela barra lateral', () => {
    expect(mostraBarraLateral('tecnico')).toBe(true)
    expect(mostraBarraLateral('gestor')).toBe(true)
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
