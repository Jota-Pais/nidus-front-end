import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  })

  const estiloOriginal = window.getComputedStyle.bind(window)
  window.getComputedStyle = (elemento: Element) => estiloOriginal(elemento)
}

afterEach(() => cleanup())
