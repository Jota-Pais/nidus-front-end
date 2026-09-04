/**
 * Único ponto de saída HTTP do front.
 *
 * Nenhuma tela chama `fetch` direto. O que este arquivo garante, e que se perde
 * se alguém chamar `fetch` na mão:
 *
 * - **`credentials: 'include'` em toda requisição** (`contrato-api.md` §1.2).
 *   A sessão é cookie `httpOnly`; sem isso o cookie não vai e a API responde
 *   401. Front (Vercel) e API (Render) ficam em domínios diferentes, então não
 *   há como o navegador mandar sozinho.
 * - **Erro sempre na forma do contrato** (§2), traduzido por `@/lib/erros` —
 *   inclusive a regra de não distinguir e-mail de senha no 401.
 * - **Nenhum dado fabricado no cliente** (`RNF-01`): o que volta, volta como a
 *   API mandou.
 */
import { config } from '@/app/config'
import { camposDeErro, mensagemDeErro } from './erros'

/**
 * Erro de qualquer chamada à API.
 *
 * `mensagem` já está pronta para exibir; `codigo` é estável e serve para a tela
 * decidir comportamento — o contrato manda nunca decidir por texto.
 */
export class ErroDeApi extends Error {
  readonly status: number
  readonly codigo: string | null
  readonly campos: Record<string, string>
  readonly requisito: string | null

  constructor(status: number, corpo: unknown) {
    super(mensagemDeErro(status, corpo))
    this.name = 'ErroDeApi'
    this.status = status
    this.campos = camposDeErro(corpo)

    const erro =
      typeof corpo === 'object' && corpo !== null && 'erro' in corpo
        ? (corpo as { erro: { codigo?: string; requisito?: string } }).erro
        : null

    this.codigo = erro?.codigo ?? null
    this.requisito = erro?.requisito ?? null
  }

  /** `contrato-api.md` §2.1: 409 é sempre regra de negócio — mostrar e não recarregar. */
  get ehRegraDeNegocio(): boolean {
    return this.status === 409
  }

  /** Sessão ausente ou expirada: a tela deve mandar para o login. */
  get ehNaoAutenticado(): boolean {
    return this.status === 401
  }
}

/** Falha antes de chegar resposta: API dormindo na Render, sem rede, DNS. */
export class ErroDeRede extends Error {
  constructor(causa: unknown) {
    super(
      'Não foi possível falar com o servidor. Verifique a conexão — se for a primeira ' +
        'requisição do dia, a API pode levar até um minuto para acordar.',
    )
    this.name = 'ErroDeRede'
    this.cause = causa
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface Opcoes {
  metodo?: Metodo
  corpo?: unknown
  sinal?: AbortSignal
}

/** Monta a URL sem barra dupla nem barra faltando, seja qual for o formato do .env. */
export function montarUrl(base: string, caminho: string): string {
  return `${base.replace(/\/+$/, '')}/${caminho.replace(/^\/+/, '')}`
}

async function lerCorpo(resposta: Response): Promise<unknown> {
  if (resposta.status === 204) return undefined
  const texto = await resposta.text()
  if (!texto) return undefined
  try {
    return JSON.parse(texto) as unknown
  } catch {
    // Gateway devolvendo HTML, proxy fora do ar: o corpo não é do contrato.
    // `mensagemDeErro` trata isso e cai na mensagem genérica.
    return texto
  }
}

export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = 'GET', corpo, sinal } = opcoes

  let resposta: Response
  try {
    resposta = await fetch(montarUrl(config.apiUrl, caminho), {
      method: metodo,
      credentials: 'include',
      headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
      ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
      ...(sinal ? { signal: sinal } : {}),
    })
  } catch (causa) {
    if (causa instanceof DOMException && causa.name === 'AbortError') throw causa
    throw new ErroDeRede(causa)
  }

  const conteudo = await lerCorpo(resposta)

  if (!resposta.ok) throw new ErroDeApi(resposta.status, conteudo)

  return conteudo as T
}
