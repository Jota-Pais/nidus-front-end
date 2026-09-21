// / <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_AMBIENTE: 'local' | 'homologacao' | 'producao'
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
