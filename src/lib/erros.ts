/**
 * Tradução de erro da API para mensagem de tela.
 *
 * O `contrato-api.md` §2 fixa uma forma única para toda resposta de erro. Este
 * arquivo é o único lugar que a conhece: nenhuma tela lê `erro.codigo` na mão.
 *
 * ```json
 * { "erro": { "codigo": "...", "mensagem": "...", "requisito": "...", "campos": {} } }
 * ```
 */

export interface ErroApi {
  codigo: string
  /** Já vem em português, pronta para exibir. */
  mensagem: string
  /** ID do requisito violado, quando houver. */
  requisito?: string
  /** Só em erro de validação, ou quando o erro aponta para campo específico. */
  campos?: Record<string, string>
}

export interface RespostaDeErro {
  erro: ErroApi
}

/** Descarta corpo que não segue a forma do contrato — resposta de proxy, HTML de gateway. */
export function ehRespostaDeErro(corpo: unknown): corpo is RespostaDeErro {
  if (typeof corpo !== 'object' || corpo === null || !('erro' in corpo)) return false
  const erro = (corpo as { erro: unknown }).erro
  return (
    typeof erro === 'object' &&
    erro !== null &&
    typeof (erro as ErroApi).codigo === 'string' &&
    typeof (erro as ErroApi).mensagem === 'string'
  )
}

const MENSAGEM_GENERICA = 'Não foi possível concluir. Tente de novo em alguns instantes.'

/**
 * ⚠️ **Credencial inválida tem mensagem única, por segurança.**
 *
 * O `contrato-api.md` §3 é explícito: "mesma mensagem para e-mail inexistente e
 * senha errada, sem distinguir os dois". Distinguir entrega ao atacante a lista
 * de e-mails válidos da instituição — e, com o `RNF-07` (proteção de dados
 * pessoais dos pesquisadores), isso é vazamento.
 *
 * Por isso o front **não repassa** a `mensagem` do servidor no 401 de login:
 * usa a sua. Se o back um dia ficar específico por engano, a tela não propaga.
 */
export const CREDENCIAL_INVALIDA = 'E-mail ou senha incorretos.'

/** Mensagem a exibir para o usuário, dado o status HTTP e o corpo da resposta. */
export function mensagemDeErro(status: number, corpo: unknown): string {
  if (status === 401) return CREDENCIAL_INVALIDA
  if (!ehRespostaDeErro(corpo)) return MENSAGEM_GENERICA
  if (status >= 500) return MENSAGEM_GENERICA
  return corpo.erro.mensagem
}

/** Erros por campo, para o formulário marcar o campo certo. Vazio quando não houver. */
export function camposDeErro(corpo: unknown): Record<string, string> {
  return ehRespostaDeErro(corpo) ? (corpo.erro.campos ?? {}) : {}
}

/**
 * `contrato-api.md` §2.1: "409 é sempre regra de negócio. O front pode tratar
 * todo 409 como mostrar a mensagem ao usuário e não recarregar, sem conhecer
 * cada código."
 */
export function ehRegraDeNegocio(status: number): boolean {
  return status === 409
}
