// preparo do ambiente de teste.
import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

if (!window.matchMedia) {
  window.matchMedia = vi.fn().mockImplementation((consulta: string) => ({
    matches: false,
    media: consulta,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }))
}

// O Ant Design v5 avisa sobre isto no console em ambiente de teste; não é problema real e polui
// a saída.
if (!window.getComputedStyle) {
  throw new Error('jsdom sem getComputedStyle: ambiente de teste mal configurado')
}

afterEach(() => {
  cleanup()
})
