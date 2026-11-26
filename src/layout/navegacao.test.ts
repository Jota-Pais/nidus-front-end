import { describe, expect, it } from 'vitest'
import { configuracoesDoPerfil, menuDoPerfil, mostraBarraLateral, rotaInicial } from './navegacao'

describe('menu por perfil', () => {
  it('o pesquisador só solicita animais: não vê a colônia', () => {
    const caminhos = menuDoPerfil('pesquisador').map((item) => item.caminho)
    expect(caminhos).toEqual(['/pedidos'])
  })

  it('o técnico vê a visão geral, as estantes e os pedidos', () => {
    const caminhos = menuDoPerfil('tecnico').map((item) => item.caminho)
    expect(caminhos).toEqual(['/visao-geral', '/estantes', '/pedidos'])
  })

  it('o gestor vê as mesmas telas do dia a dia que o técnico', () => {
    const caminhos = menuDoPerfil('gestor').map((item) => item.caminho)
    expect(caminhos).toEqual(['/visao-geral', '/estantes', '/pedidos'])
  })
})

describe('pedidos', () => {
  it('só o pesquisador pede animais: técnico e gestor veem a lista de pedidos', () => {
    const rotulo = (perfil: 'pesquisador' | 'tecnico' | 'gestor') =>
      menuDoPerfil(perfil).find((item) => item.caminho === '/pedidos')?.rotulo
    expect(rotulo('pesquisador')).toBe('Pedir animais')
    expect(rotulo('tecnico')).toBe('Pedidos')
    expect(rotulo('gestor')).toBe('Pedidos')
  })
})

describe('configurações', () => {
  it('cadastros, histórico e usuários ficam em Configurações do gestor', () => {
    expect(configuracoesDoPerfil('gestor').map((item) => item.caminho)).toEqual([
      '/cadastros',
      '/historico',
      '/usuarios',
    ])
  })

  it('o técnico tem só os Cadastros, onde cuida das salas', () => {
    expect(configuracoesDoPerfil('tecnico').map((item) => item.caminho)).toEqual(['/cadastros'])
  })

  it('o pesquisador não tem nada a configurar', () => {
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
  it('a visão geral é a tela inicial de quem opera a colônia', () => {
    expect(rotaInicial('tecnico')).toBe('/visao-geral')
    expect(rotaInicial('gestor')).toBe('/visao-geral')
  })

  it('o pesquisador começa pelo pedido de animais', () => {
    expect(rotaInicial('pesquisador')).toBe('/pedidos')
  })
})
