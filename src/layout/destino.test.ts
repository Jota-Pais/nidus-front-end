import { describe, expect, it } from 'vitest'
import { destinoAposLogin, ehDestinoInterno } from './destino'

describe('ehDestinoInterno — não virar trampolim para fora', () => {
  it('aceita caminho interno', () => {
    expect(ehDestinoInterno('/estantes')).toBe(true)
    expect(ehDestinoInterno('/estantes/3')).toBe(true)
  })

  it('recusa URL absoluta e protocolo', () => {
    expect(ehDestinoInterno('https://exemplo.com')).toBe(false)
    expect(ehDestinoInterno('javascript:alert(1)')).toBe(false)
  })

  it('recusa //host, que o navegador trata como URL absoluta', () => {
    expect(ehDestinoInterno('//exemplo.com/phishing')).toBe(false)
  })

  it('recusa /\\host, a variante com barra invertida que o navegador também segue', () => {
    expect(ehDestinoInterno('/\\exemplo.com')).toBe(false)
    expect(ehDestinoInterno(String.raw`/\exemplo.com`)).toBe(false)
  })

  it('recusa o próprio login, que faria laço', () => {
    expect(ehDestinoInterno('/login')).toBe(false)
  })

  it('recusa o que não é string', () => {
    expect(ehDestinoInterno(undefined)).toBe(false)
    expect(ehDestinoInterno(null)).toBe(false)
    expect(ehDestinoInterno(42)).toBe(false)
    expect(ehDestinoInterno({ de: '/estantes' })).toBe(false)
  })
})

describe('destinoAposLogin', () => {
  it('volta para o destino guardado pela rota protegida', () => {
    expect(destinoAposLogin({ de: '/estantes/3' }, 'tecnico')).toBe('/estantes/3')
  })

  it('sem destino guardado, cai na home do perfil', () => {
    expect(destinoAposLogin(null, 'tecnico')).toBe('/alertas')
    expect(destinoAposLogin(undefined, 'pesquisador')).toBe('/solicitacoes')
    expect(destinoAposLogin({}, 'gestor')).toBe('/alertas')
  })

  it('destino externo é descartado em favor da home do perfil', () => {
    expect(destinoAposLogin({ de: 'https://exemplo.com' }, 'tecnico')).toBe('/alertas')
    expect(destinoAposLogin({ de: '//exemplo.com' }, 'pesquisador')).toBe('/solicitacoes')
  })
})
