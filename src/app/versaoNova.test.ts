import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ehVersaoAntiga, recarregarParaVersaoNova } from './versaoNova'

describe('ehVersaoAntiga', () => {
  it('reconhece a falha de buscar o arquivo da tela no Chrome, no Firefox e no Safari', () => {
    expect(
      ehVersaoAntiga(
        new TypeError(
          'Failed to fetch dynamically imported module: https://thenidus.vercel.app/assets/Cadastros-HhNFWU0_.js',
        ),
      ),
    ).toBe(true)
    expect(ehVersaoAntiga(new TypeError('error loading dynamically imported module'))).toBe(true)
    expect(ehVersaoAntiga(new TypeError('Importing a module script failed.'))).toBe(true)
  })

  it('não confunde com outro erro', () => {
    expect(ehVersaoAntiga(new Error('Cannot read properties of undefined'))).toBe(false)
    expect(ehVersaoAntiga(undefined)).toBe(false)
  })
})

describe('recarregarParaVersaoNova', () => {
  beforeEach(() => sessionStorage.clear())

  it('recarrega uma vez, e não de novo logo em seguida', () => {
    const recarregar = vi.fn()

    expect(recarregarParaVersaoNova(recarregar, 1_000_000)).toBe(true)
    expect(recarregarParaVersaoNova(recarregar, 1_005_000)).toBe(false)
    expect(recarregar).toHaveBeenCalledTimes(1)
  })

  it('passado o intervalo, recarrega de novo na próxima publicação', () => {
    const recarregar = vi.fn()

    recarregarParaVersaoNova(recarregar, 1_000_000)
    expect(recarregarParaVersaoNova(recarregar, 1_020_000)).toBe(true)
    expect(recarregar).toHaveBeenCalledTimes(2)
  })
})
