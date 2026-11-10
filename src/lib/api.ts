// único ponto de saída HTTP do front
import { config } from '@/app/config'
import { camposDeErro, mensagemDeErro } from './erros'
import type { CodigoDeErro } from './erros'

/** Erro de qualquer chamada à API. */
export class ErroDeApi extends Error {
  readonly status: number
  readonly codigo: CodigoDeErro | null
  readonly campos: Record<string, string>

  constructor(status: number, corpo: unknown) {
    super(mensagemDeErro(status, corpo))
    this.name = 'ErroDeApi'
    this.status = status
    this.campos = camposDeErro(corpo)

    const erro =
      typeof corpo === 'object' && corpo !== null && 'erro' in corpo
        ? (corpo as { erro: { codigo?: CodigoDeErro } }).erro
        : null

    this.codigo = erro?.codigo ?? null
  }

  /**
   * 409 é sempre regra de negócio: a tela mostra a mensagem. Nas ações do pedido, quase sempre quer
   * dizer que o pedido ou os animais mudaram depois que a tela leu, e a consulta recarrega para
   * mostrar como ficou (recarregarSeMudou, em @/dominio/consultas)
   */
  get ehRegraDeNegocio(): boolean {
    return this.status === 409
  }

  /** Sessão ausente ou expirada: a tela deve mandar para o login. */
  get ehNaoAutenticado(): boolean {
    return this.status === 401
  }
}

/** Falha antes de chegar resposta: API dormindo na Render, sem rede, DNS */
export class ErroDeRede extends Error {
  constructor(causa: unknown) {
    super(
      'Não foi possível falar com o servidor. Verifique a conexão — se for o primeiro ' +
        'acesso do dia, o servidor pode levar até um minuto para acordar.',
    )
    this.name = 'ErroDeRede'
    this.cause = causa
  }
}

type Metodo = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

interface Opcoes {
  metodo?: Metodo
  corpo?: unknown
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
    // gateway devolvendo HTML, proxy fora do ar: o corpo não é do contrato
    // 'mensagemDeErro' trata isso e cai na mensagem genérica
    return texto
  }
}

export async function api<T>(caminho: string, opcoes: Opcoes = {}): Promise<T> {
  const { metodo = 'GET', corpo } = opcoes

  let resposta: Response
  try {
    resposta = await fetch(montarUrl(config.apiUrl, caminho), {
      method: metodo,
      credentials: 'include',
      headers: corpo === undefined ? {} : { 'Content-Type': 'application/json' },
      ...(corpo === undefined ? {} : { body: JSON.stringify(corpo) }),
    })
  } catch (causa) {
    throw new ErroDeRede(causa)
  }

  const conteudo = await lerCorpo(resposta)

  if (!resposta.ok) throw new ErroDeApi(resposta.status, conteudo)

  return conteudo as T
}
