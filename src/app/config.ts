/**
 * Ambiente validado por Zod no boot.
 *
 * Decisão de stack da equipe: Zod cobre corpo de requisição, query params,
 * **variáveis de ambiente no boot** e os formulários do front. Falhar aqui, com
 * mensagem clara, é melhor que descobrir a variável faltando na terceira tela —
 * e melhor ainda que descobrir na hora de apresentar para a banca.
 */
import { z } from 'zod'

/**
 * `z.url()` sozinho não basta: `new URL('localhost:3000')` é válido — trata
 * `localhost:` como esquema. Passaria na validação e só falharia no primeiro
 * fetch, com erro que não aponta para a causa. Daí a checagem de protocolo.
 */
const urlHttp = z
  .string()
  .url('VITE_API_URL precisa ser uma URL completa, com http:// ou https://')
  .refine(
    (valor) => {
      try {
        return ['http:', 'https:'].includes(new URL(valor).protocol)
      } catch {
        return false
      }
    },
    { message: 'VITE_API_URL precisa começar com http:// ou https://' },
  )

const esquema = z.object({
  VITE_API_URL: urlHttp,
  VITE_AMBIENTE: z.enum(['local', 'homologacao', 'producao']).default('local'),
})

export interface Ambiente {
  apiUrl: string
  ambiente: 'local' | 'homologacao' | 'producao'
}

/**
 * Separado de `config` para ser testável: `import.meta.env` só existe dentro do
 * Vite, então o teste chama esta função com um objeto qualquer.
 */
export function validarAmbiente(bruto: unknown): Ambiente {
  const resultado = esquema.safeParse(bruto)

  if (!resultado.success) {
    const problemas = resultado.error.issues
      .map((i) => `  ${i.path.join('.') || '(raiz)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Ambiente inválido. Confira o .env (modelo em .env.example):\n${problemas}`)
  }

  return { apiUrl: resultado.data.VITE_API_URL, ambiente: resultado.data.VITE_AMBIENTE }
}

export const config: Ambiente = validarAmbiente(import.meta.env)

/** Só produção esconde o rótulo de ambiente no cabeçalho. */
export const mostrarRotuloDeAmbiente = config.ambiente !== 'producao'
