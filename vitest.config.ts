import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

/**
 * Configuração dos testes, separada do `vite.config.ts`.
 *
 * `jsdom` porque parte do que precisa ser verificado só existe renderizado: o
 * `RNF-10` fala de `aria-label`, marcador e sigla no card, e o card "Legenda e
 * segundo canal visual" pede que os cinco estados continuem distinguíveis sem
 * cor. Isso não se testa em função pura.
 */
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/teste/preparo.ts'],
    css: false,
  },
})
