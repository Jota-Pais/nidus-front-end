import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    env: { VITE_API_URL: 'http://localhost:3333' },
    environment: 'jsdom',
    setupFiles: ['src/testes/preparar.ts'],
  },
})
