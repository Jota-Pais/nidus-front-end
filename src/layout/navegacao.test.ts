import { describe, expect, it } from 'vitest'
import { ITENS_DE_MENU, menuDoPerfil, rotaInicial } from './navegacao'

describe('menuDoPerfil — RF-ACS-02, conveniência e não permissão', () => {
  it('o pesquisador não vê nada da colônia', () => {
    const caminhos = menuDoPerfil('pesquisador').map((i) => i.caminho)
    expect(caminhos).toEqual(['/solicitacoes'])
  })

  it('o técnico opera a colônia mas não parametriza', () => {
    const chaves = menuDoPerfil('tecnico').map((i) => i.chave)
    expect(chaves).toContain('grade')
    expect(chaves).toContain('registros')
    expect(chaves).not.toContain('infraestrutura')
    expect(chaves).not.toContain('projetos')
  })

  it('o gestor vê tudo do técnico e mais', () => {
    const gestor = menuDoPerfil('gestor').map((i) => i.chave)
    for (const chave of menuDoPerfil('tecnico').map((i) => i.chave)) {
      expect(gestor).toContain(chave)
    }
    expect(gestor.length).toBeGreaterThan(menuDoPerfil('tecnico').length)
  })

  it('todo item de menu serve a pelo menos um perfil', () => {
    for (const item of ITENS_DE_MENU) {
      expect(item.perfis.length).toBeGreaterThan(0)
    }
  })
})

describe('rotaInicial', () => {
  it('leva o técnico para os alertas do ciclo (RF-REP-07)', () => {
    expect(rotaInicial('tecnico')).toBe('/alertas')
    expect(rotaInicial('gestor')).toBe('/alertas')
  })

  it('leva o pesquisador para as próprias solicitações', () => {
    expect(rotaInicial('pesquisador')).toBe('/solicitacoes')
  })

  it('a rota inicial de cada perfil está no menu dele', () => {
    for (const perfil of ['pesquisador', 'tecnico', 'gestor'] as const) {
      const caminhos = menuDoPerfil(perfil).map((i) => i.caminho)
      expect(caminhos).toContain(rotaInicial(perfil))
    }
  })
})
